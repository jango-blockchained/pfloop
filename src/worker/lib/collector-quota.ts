/**
 * Progressive daily accept limits for collectors (Europe/Berlin calendar day).
 *
 * - New collectors: 1 accept/day
 * - If they fill the limit and all are confirmed: next day limit +1 (cap 5)
 * - If fewer confirmed than the limit: next day limit = max(1, confirmed)
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

/** Next day's limit from yesterday's performance. */
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

/**
 * Ensure quota row is rolled over to today's Berlin day.
 * Returns the live quota snapshot.
 */
export async function ensureCollectorQuota(
	db: D1Database,
	userId: string,
	now: Date = new Date(),
): Promise<CollectorQuota> {
	const today = berlinDayKey(now);
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

	let limit = clampLimit(row.collector_daily_limit || COLLECTOR_DAILY_LIMIT_MIN);
	let accepted = Math.max(0, row.collector_accepted_today | 0);
	let confirmed = Math.max(0, row.collector_confirmed_today | 0);
	let day = row.collector_limit_day || "";

	if (day !== today) {
		if (day) {
			limit = nextDailyLimit(limit, confirmed);
		} else {
			limit = COLLECTOR_DAILY_LIMIT_MIN;
		}
		accepted = 0;
		confirmed = 0;
		day = today;
		await db
			.prepare(
				`UPDATE users SET
					collector_daily_limit = ?,
					collector_limit_day = ?,
					collector_accepted_today = 0,
					collector_confirmed_today = 0
				 WHERE id = ?`,
			)
			.bind(limit, day, userId)
			.run();
	}

	return {
		daily_limit: limit,
		day,
		accepted_today: accepted,
		confirmed_today: confirmed,
		remaining_today: Math.max(0, limit - accepted),
		max_unfinished: limit,
	};
}

export async function recordCollectorAccept(
	db: D1Database,
	userId: string,
): Promise<void> {
	const q = await ensureCollectorQuota(db, userId);
	await db
		.prepare(
			`UPDATE users SET collector_accepted_today = collector_accepted_today + 1
			 WHERE id = ? AND collector_limit_day = ?`,
		)
		.bind(userId, q.day)
		.run();
}

export async function recordCollectorConfirm(
	db: D1Database,
	collectorId: string,
): Promise<void> {
	const q = await ensureCollectorQuota(db, collectorId);
	await db
		.prepare(
			`UPDATE users SET collector_confirmed_today = collector_confirmed_today + 1
			 WHERE id = ? AND collector_limit_day = ?`,
		)
		.bind(collectorId, q.day)
		.run();
}
