import { Hono } from "hono";
import { cors } from "hono/cors";
import { offersRoutes } from "./routes/offers";
import { reservationsRoutes } from "./routes/reservations";
import { recurringRoutes } from "./routes/recurring";
import { authRoutes } from "./routes/auth";
import { releaseExpiredReservations } from "./cron";
import { resolveSessionUser } from "./lib/auth";
import {
	MIN_PFAND_CENTS,
	RESERVATION_HOURS,
	MAX_UNFINISHED_RESERVATIONS_PER_USER,
	MAX_MAP_OFFERS,
	MAX_BBOX_SPAN_DEG,
	MAX_RECURRING_OFFERS_PER_USER,
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
			max_recurring_offers_per_user: MAX_RECURRING_OFFERS_PER_USER,
			address_privacy: "full_address_after_accept_only",
			on_deadline_miss: "reopen_offer",
			handover:
				"collector_marks_collected_then_poster_confirms; unfinished blocks new accept",
			recurring:
				"apply_then_poster_selects; assigned_hidden_until_unassign; min_same_as_one_shot",
		},
	}),
);

app.route("/api/auth", authRoutes);
app.route("/api/offers", offersRoutes);
app.route("/api/reservations", reservationsRoutes);
app.route("/api/recurring", recurringRoutes);

/**
 * Digital Asset Links (Android) + Apple App Site Association (iOS Universal Links).
 * Inline JSON (not ASSETS) so SPA not_found_handling cannot rewrite extensionless
 * AASA to index.html. Keep in sync with public/.well-known/* sources of truth.
 * Replace TEAMID in AASA after you have an Apple Developer Team ID.
 */
const ASSETLINKS_JSON = JSON.stringify(
	[
		{
			relation: ["delegate_permission/common.handle_all_urls"],
			target: {
				namespace: "android_app",
				package_name: "dev.cryptolinx.grabme",
				sha256_cert_fingerprints: [
					"88:5A:C1:BD:3B:D9:89:EB:61:18:DB:95:EB:AC:C7:2D:31:02:09:70:41:1B:05:C3:3F:13:2F:6E:C1:FB:88:0F",
				],
			},
		},
	],
	null,
	2,
);

const APPLE_APP_SITE_ASSOCIATION = JSON.stringify(
	{
		applinks: {
			apps: [],
			details: [
				{
					appIDs: ["TEAMID.dev.cryptolinx.grabme"],
					components: [
						{ "/": "/auth/*", comment: "Magic-link verify" },
						{ "/": "/angebot/*", comment: "Offer detail" },
						{ "/": "/*", comment: "All app paths" },
					],
				},
			],
		},
		webcredentials: {
			apps: ["TEAMID.dev.cryptolinx.grabme"],
		},
	},
	null,
	2,
);

function wellKnownJson(body: string): Response {
	return new Response(body, {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		},
	});
}

app.get("/.well-known/assetlinks.json", () => wellKnownJson(ASSETLINKS_JSON));
app.get("/.well-known/apple-app-site-association", () =>
	wellKnownJson(APPLE_APP_SITE_ASSOCIATION),
);
// Some clients probe the .json suffix
app.get("/.well-known/apple-app-site-association.json", () =>
	wellKnownJson(APPLE_APP_SITE_ASSOCIATION),
);

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
