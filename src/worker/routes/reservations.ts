// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Hono } from "hono";
import { ensureCollectorQuota } from "../lib/collector-quota";
import {
	COLLECTOR_DAILY_LIMIT_MAX,
	COLLECTOR_DAILY_LIMIT_MIN,
	CONFIRM_HOURS,
	MAX_MINE_RESERVATIONS,
} from "../lib/constants";
import { jsonError } from "../lib/http";

type Variables = {
	userId: string | null;
};

export const reservationsRoutes = new Hono<{
	Bindings: Env;
	Variables: Variables;
}>();

/** Progressive daily accept quota for the current collector. */
reservationsRoutes.get("/quota", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const unfinished = await c.env.DB.prepare(
		`SELECT COUNT(*) AS n FROM reservations
		 WHERE collector_id = ? AND status IN ('active', 'collected')`,
	)
		.bind(userId)
		.first<{ n: number }>();

	const quota = await ensureCollectorQuota(c.env.DB, userId);

	return c.json({
		...quota,
		unfinished: unfinished?.n ?? 0,
		/** Your concurrent open-handover cap today (= daily_limit). */
		max_unfinished_effective: quota.max_unfinished,
		/** Absolute system ceiling (not today's personal limit). */
		max_unfinished_ceiling: COLLECTOR_DAILY_LIMIT_MAX,
		limit_min: COLLECTOR_DAILY_LIMIT_MIN,
		limit_max: COLLECTOR_DAILY_LIMIT_MAX,
		confirm_hours: CONFIRM_HOURS,
	});
});

/** Collector’s reservations (active / collected first), with offer summary + full address. */
reservationsRoutes.get("/mine", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT r.id AS reservation_id, r.status AS reservation_status,
		        r.accepted_at, r.deadline_at, r.completed_at, r.collected_at,
		        o.id AS offer_id, o.title, o.description, o.pfand_value_cents,
		        o.lat, o.lng, o.address_hint, o.address_text, o.status AS offer_status
		 FROM reservations r
		 JOIN offers o ON o.id = r.offer_id
		 WHERE r.collector_id = ?
		 ORDER BY
		   CASE r.status
		     WHEN 'active' THEN 0
		     WHEN 'collected' THEN 1
		     ELSE 2
		   END,
		   r.accepted_at DESC
		 LIMIT ?`,
	)
		.bind(userId, MAX_MINE_RESERVATIONS)
		.all();

	return c.json({ reservations: results ?? [] });
});
