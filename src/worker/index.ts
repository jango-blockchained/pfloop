import { Hono } from "hono";
import { cors } from "hono/cors";
import { offersRoutes } from "./routes/offers";
import { reservationsRoutes } from "./routes/reservations";
import { authRoutes } from "./routes/auth";
import { releaseExpiredReservations } from "./cron";
import { resolveSessionUser } from "./lib/auth";
import {
	MIN_PFAND_CENTS,
	RESERVATION_HOURS,
	MAX_UNFINISHED_RESERVATIONS_PER_USER,
	MAX_MAP_OFFERS,
	MAX_BBOX_SPAN_DEG,
} from "./lib/constants";
import { jsonInternalError } from "./lib/http";

type Variables = {
	userId: string | null;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
	"/api/*",
	cors({
		origin: (origin) => origin ?? "*",
		credentials: true,
	}),
);

/** Resolve session cookie → userId for all /api routes. */
app.use("/api/*", async (c, next) => {
	const user = await resolveSessionUser(c);
	c.set("userId", user?.id ?? null);
	await next();
});

/** Never leak stack traces / internal errors to clients. */
app.onError((err, c) => {
	return jsonInternalError(c, err, "hono_on_error");
});

app.notFound((c) => c.json({ error: "Nicht gefunden" }, 404));

app.get("/api/health", (c) =>
	c.json({
		ok: true,
		service: "grabme",
		free: true,
		// Additive meta — safe, no secrets.
		time: new Date().toISOString(),
		rules: {
			min_pfand_cents: MIN_PFAND_CENTS,
			reservation_hours: RESERVATION_HOURS,
			max_unfinished_reservations: MAX_UNFINISHED_RESERVATIONS_PER_USER,
			max_map_offers: MAX_MAP_OFFERS,
			max_bbox_span_deg: MAX_BBOX_SPAN_DEG,
			address_privacy: "full_address_after_accept_only",
			on_deadline_miss: "reopen_offer",
			handover:
				"collector_marks_collected_then_poster_confirms; unfinished blocks new accept",
		},
	}),
);

app.route("/api/auth", authRoutes);
app.route("/api/offers", offersRoutes);
app.route("/api/reservations", reservationsRoutes);

export default {
	fetch: app.fetch,

	async scheduled(
		_controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		ctx.waitUntil(
			releaseExpiredReservations(env.DB)
				.then((result) => {
					console.log(
						JSON.stringify({
							event: "cron_release_expired",
							scanned: result.scanned,
							released: result.released,
							reopened: result.reopened,
							auth: result.auth,
						}),
					);
				})
				.catch((err: unknown) => {
					console.error(
						JSON.stringify({
							event: "cron_release_expired_failed",
							message: err instanceof Error ? err.message : String(err),
						}),
					);
				}),
		);
	},
};
