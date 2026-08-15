// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

/**
 * Progressive daily accept limits for collectors (Europe/Berlin calendar day).
 *
 * - New collectors: 1 accept/day
 * - Next-day limit from completed accepts on the previous day (by accept day)
 * - Slot claim is atomic (accepted_today < daily_limit)
 * - Day rollover is CAS on collector_limit_day
 */

import {
	COLLECTOR_DAILY_LIMIT_MAX,
	COLLECTOR_DAILY_LIMIT_MIN,
} from "./constants";
import { berlinDayKey } from "./time";

export type CollectorQuota = {
	daily_limit: number;
	day: string;
	accepted_today: number;
	confirmed_today: number;
	remaining_today: number;
	/** Concurrent unfinished cap (= daily_limit). */
	max_unfinished: number;
};

type UserQuotaRow = {
	collector_daily_limit: number;
	collector_limit_day: string;
	collector_accepted_today: number;
	collector_confirmed_today: number;
};

function clampLimit(n: number): number {
	if (!Number.isFinite(n)) return COLLECTOR_DAILY_LIMIT_MIN;
	return Math.min(
		COLLECTOR_DAILY_LIMIT_MAX,
		Math.max(COLLECTOR_DAILY_LIMIT_MIN, Math.floor(n)),
	);
}

/** Next day's limit from previous day's performance. */
export function nextDailyLimit(
	previousLimit: number,
	confirmedOnDay: number,
): number {
	const prev = clampLimit(previousLimit);
	const confirmed = Math.max(0, Math.floor(confirmedOnDay));
	if (confirmed >= prev) {
		return clampLimit(prev + 1);
	}
	return clampLimit(Math.max(COLLECTOR_DAILY_LIMIT_MIN, confirmed));
}

function toQuota(row: UserQuotaRow, day: string): CollectorQuota {
	const daily_limit = clampLimit(
		row.collector_daily_limit || COLLECTOR_DAILY_LIMIT_MIN,
	);
	const accepted_today = Math.max(0, row.collector_accepted_today | 0);
	const confirmed_today = Math.max(0, row.collector_confirmed_today | 0);
	return {
		daily_limit,
		day,
		accepted_today,
		confirmed_today,
		remaining_today: Math.max(0, daily_limit - accepted_today),
		// Concurrent open handovers cannot exceed the daily limit (or absolute max).
		max_unfinished: daily_limit,
	};
}

async function loadRow(
	db: D1Database,
	userId: string,
): Promise<UserQuotaRow | null> {
	return (
		(await db
			.prepare(
				`SELECT collector_daily_limit, collector_limit_day,
				        collector_accepted_today, collector_confirmed_today
				 FROM users WHERE id = ?`,
			)
			.bind(userId)
			.first<UserQuotaRow>()) ?? null
	);
}

/** Completions attributed to the Berlin day the collector accepted (not confirm day). */
async function countCompletedByAcceptDay(
	db: D1Database,
	userId: string,
	acceptDay: string,
): Promise<number> {
	const row = await db
		.prepare(
			`SELECT COUNT(*) AS n FROM reservations
			 WHERE collector_id = ?
			   AND status = 'completed'
			   AND accept_day = ?`,
		)
		.bind(userId, acceptDay)
		.first<{ n: number }>();
	return row?.n ?? 0;
}

/**
 * Ensure quota is on today's Berlin day (CAS rollover).
 * Performance uses completed reservations by accept_day for the previous limit day.
 */
export async function ensureCollectorQuota(
	db: D1Database,
	userId: string,
	now: Date = new Date(),
): Promise<CollectorQuota> {
	const today = berlinDayKey(now);

	for (let attempt = 0; attempt < 4; attempt++) {
		const row = await loadRow(db, userId);
		if (!row) {
			return {
				daily_limit: COLLECTOR_DAILY_LIMIT_MIN,
				day: today,
				accepted_today: 0,
				confirmed_today: 0,
				remaining_today: COLLECTOR_DAILY_LIMIT_MIN,
				max_unfinished: COLLECTOR_DAILY_LIMIT_MIN,
			};
		}

		const day = row.collector_limit_day || "";
		if (day === today) {
			return toQuota(row, today);
		}

		const prevLimit = clampLimit(
			row.collector_daily_limit || COLLECTOR_DAILY_LIMIT_MIN,
		);
		let nextLimit = COLLECTOR_DAILY_LIMIT_MIN;
		if (day) {
			const confirmed = await countCompletedByAcceptDay(db, userId, day);
			nextLimit = nextDailyLimit(prevLimit, confirmed);
		}

		// CAS: only one writer wins the day flip
		const result = await db
			.prepare(
				`UPDATE users SET
					collector_daily_limit = ?,
					collector_limit_day = ?,
					collector_accepted_today = 0,
					collector_confirmed_today = 0
				 WHERE id = ?
				   AND collector_limit_day = ?`,
			)
			.bind(nextLimit, today, userId, day)
			.run();

		if ((result.meta?.changes ?? 0) > 0) {
			return {
				daily_limit: nextLimit,
				day: today,
				accepted_today: 0,
				confirmed_today: 0,
				remaining_today: nextLimit,
				max_unfinished: nextLimit,
			};
		}
		// Lost race — re-read
	}

	const fallback = await loadRow(db, userId);
	if (fallback && (fallback.collector_limit_day || "") === today) {
		return toQuota(fallback, today);
	}
	return {
		daily_limit: COLLECTOR_DAILY_LIMIT_MIN,
		day: today,
		accepted_today: 0,
		confirmed_today: 0,
		remaining_today: COLLECTOR_DAILY_LIMIT_MIN,
		max_unfinished: COLLECTOR_DAILY_LIMIT_MIN,
	};
}

/**
 * Atomically claim one accept slot for today.
 * Returns updated quota on success, null if limit reached.
 */
export async function claimAcceptSlot(
	db: D1Database,
	userId: string,
	now: Date = new Date(),
): Promise<CollectorQuota | null> {
	const q = await ensureCollectorQuota(db, userId, now);
	const result = await db
		.prepare(
			`UPDATE users SET collector_accepted_today = collector_accepted_today + 1
			 WHERE id = ?
			   AND collector_limit_day = ?
			   AND collector_accepted_today < collector_daily_limit`,
		)
		.bind(userId, q.day)
		.run();

	if ((result.meta?.changes ?? 0) === 0) {
		return null;
	}
	return ensureCollectorQuota(db, userId, now);
}

/** Refund a previously claimed slot (same Berlin day only). */
export async function refundAcceptSlot(
	db: D1Database,
	userId: string,
	now: Date = new Date(),
): Promise<void> {
	const q = await ensureCollectorQuota(db, userId, now);
	await db
		.prepare(
			`UPDATE users SET collector_accepted_today = collector_accepted_today - 1
			 WHERE id = ?
			   AND collector_limit_day = ?
			   AND collector_accepted_today > 0`,
		)
		.bind(userId, q.day)
		.run();
}

/**
 * Credit a completed handover to the collector's confirm counter for the
 * accept day. Only bumps confirmed_today when accept_day is still the active
 * limit day (rollover uses reservation counts for the closed day).
 */
export async function recordCollectorConfirm(
	db: D1Database,
	collectorId: string,
	acceptDay: string | null | undefined,
	now: Date = new Date(),
): Promise<void> {
	const q = await ensureCollectorQuota(db, collectorId, now);
	const day = (acceptDay ?? "").trim();
	if (!day || day !== q.day) {
		// Past-day completion is counted at next rollover via accept_day query.
		return;
	}
	await db
		.prepare(
			`UPDATE users SET collector_confirmed_today = collector_confirmed_today + 1
			 WHERE id = ? AND collector_limit_day = ?`,
		)
		.bind(collectorId, q.day)
		.run();
}
