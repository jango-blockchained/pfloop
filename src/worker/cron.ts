// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

/**
 * Cron: release expired active reservations (6h miss → reopen offer)
 * and cancel unconfirmed collected handovers (24h after collected_at).
 *
 * Also cleans expired auth sessions / magic links (privacy + table hygiene).
 */

import { cleanupExpiredAuth } from "./lib/auth";
import { CONFIRM_HOURS } from "./lib/constants";
import { hoursAgoIso, nowIso } from "./lib/time";

const BATCH_CHUNK = 40; // statements per D1 batch (2 stmts × 20 rows)

export type ReleaseExpiredResult = {
	/** Rows selected as expired active reservations. */
	scanned: number;
	/** Reservations moved to `released` (active miss). */
	released: number;
	/** Offers moved back to `open` after active miss. */
	reopened: number;
	/** Collected-unconfirmed rows scanned. */
	unconfirmed_scanned: number;
	/** Collected reservations released after 24h without poster confirm. */
	unconfirmed_released: number;
	/** Offers cancelled after 24h unconfirmed collect. */
	unconfirmed_cancelled: number;
	/** Auth cleanup counters. */
	auth: {
		sessions_deleted: number;
		magic_links_deleted: number;
	};
};

export async function releaseExpiredReservations(
	db: D1Database,
): Promise<ReleaseExpiredResult> {
	const now = nowIso();

	const expired = await db
		.prepare(
			`SELECT id, offer_id FROM reservations
			 WHERE status = 'active' AND deadline_at <= ?`,
		)
		.bind(now)
		.all<{ id: string; offer_id: string }>();

	const rows = expired.results ?? [];
	let released = 0;
	let reopened = 0;

	if (rows.length > 0) {
		for (let i = 0; i < rows.length; i += BATCH_CHUNK / 2) {
			const slice = rows.slice(i, i + BATCH_CHUNK / 2);
			const statements: D1PreparedStatement[] = [];
			for (const row of slice) {
				statements.push(
					db
						.prepare(
							`UPDATE reservations SET status = 'released'
							 WHERE id = ? AND status = 'active'`,
						)
						.bind(row.id),
					db
						.prepare(
							`UPDATE offers SET status = 'open', updated_at = ?
							 WHERE id = ? AND status = 'reserved'`,
						)
						.bind(now, row.offer_id),
				);
			}

			const results = await db.batch(statements);
			for (let j = 0; j < results.length; j++) {
				const changes = results[j]?.meta?.changes ?? 0;
				if (j % 2 === 0) released += changes;
				else reopened += changes;
			}
		}
	}

	// Collected but poster never confirmed within CONFIRM_HOURS → cancel offer.
	// collected_at + CONFIRM_HOURS <= now  ⇔  collected_at <= now - CONFIRM_HOURS
	const confirmCutoff = hoursAgoIso(CONFIRM_HOURS);
	const staleCollected = await db
		.prepare(
			`SELECT id, offer_id FROM reservations
			 WHERE status = 'collected'
			   AND collected_at IS NOT NULL
			   AND collected_at <= ?`,
		)
		.bind(confirmCutoff)
		.all<{ id: string; offer_id: string }>();

	const staleRows = staleCollected.results ?? [];
	let unconfirmed_released = 0;
	let unconfirmed_cancelled = 0;

	if (staleRows.length > 0) {
		for (let i = 0; i < staleRows.length; i += BATCH_CHUNK / 2) {
			const slice = staleRows.slice(i, i + BATCH_CHUNK / 2);
			const statements: D1PreparedStatement[] = [];
			for (const row of slice) {
				statements.push(
					db
						.prepare(
							`UPDATE reservations SET status = 'released'
							 WHERE id = ? AND status = 'collected'`,
						)
						.bind(row.id),
					db
						.prepare(
							`UPDATE offers SET status = 'cancelled', updated_at = ?
							 WHERE id = ? AND status = 'collected'`,
						)
						.bind(now, row.offer_id),
				);
			}

			const results = await db.batch(statements);
			for (let j = 0; j < results.length; j++) {
				const changes = results[j]?.meta?.changes ?? 0;
				if (j % 2 === 0) unconfirmed_released += changes;
				else unconfirmed_cancelled += changes;
			}
		}
	}

	let auth = { sessions_deleted: 0, magic_links_deleted: 0 };
	try {
		auth = await cleanupExpiredAuth(db);
	} catch (e) {
		console.error(
			JSON.stringify({
				event: "cron_auth_cleanup_failed",
				message: e instanceof Error ? e.message : String(e),
			}),
		);
	}

	return {
		scanned: rows.length,
		released,
		reopened,
		unconfirmed_scanned: staleRows.length,
		unconfirmed_released,
		unconfirmed_cancelled,
		auth,
	};
}
