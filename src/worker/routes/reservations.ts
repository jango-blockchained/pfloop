import { Hono } from "hono";
import { MAX_MINE_RESERVATIONS } from "../lib/constants";
import { jsonError } from "../lib/http";

type Variables = {
	userId: string | null;
};

export const reservationsRoutes = new Hono<{
	Bindings: Env;
	Variables: Variables;
}>();

/** Collector’s reservations (active / collected first), with offer summary + full address. */
reservationsRoutes.get("/mine", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Anmeldung erforderlich", 401);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT r.id AS reservation_id, r.status AS reservation_status,
		        r.accepted_at, r.deadline_at, r.completed_at,
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
