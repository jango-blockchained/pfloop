/**
 * Cron: release expired active reservations and reopen offers.
 * Policy (confirmed): auto-reopen on 6h miss — poster does not re-list.
 *
 * Also cleans expired auth sessions / magic links (privacy + table hygiene).
 */

import { cleanupExpiredAuth } from "./lib/auth";

const BATCH_CHUNK = 40; // statements per D1 batch (2 stmts × 20 rows)

export type ReleaseExpiredResult = {
	/** Rows selected as expired active reservations. */
	scanned: number;
	/** Reservations moved to `released` (meta.changes). */
	released: number;
	/** Offers moved back to `open` (meta.changes). */
	reopened: number;
	/** Auth cleanup counters. */
	auth: {
		sessions_deleted: number;
		magic_links_deleted: number;
	};
};

export async function releaseExpiredReservations(
	db: D1Database,
): Promise<ReleaseExpiredResult> {
	const now = new Date().toISOString();

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
		// Chunk to stay under D1 batch size limits on large backlogs.
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
				// Even indices = reservation updates; odd = offer reopen.
				if (j % 2 === 0) released += changes;
				else reopened += changes;
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
		auth,
	};
}
