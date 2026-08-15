// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Hono } from "hono";
import { assertMinPfand } from "../lib/money";
import {
	berlinDayKey,
	isPast,
	nowIso,
	reservationDeadlineIso,
} from "../lib/time";
import {
	claimAcceptSlot,
	ensureCollectorQuota,
	recordCollectorConfirm,
	refundAcceptSlot,
} from "../lib/collector-quota";
import {
	MAX_MAP_OFFERS,
	MAX_MINE_OFFERS,
	MIN_PFAND_CENTS,
} from "../lib/constants";
import {
	computePfandFromItems,
	formatPfandSummary,
	PFAND_CATALOG,
} from "../../shared/pfand";
import {
	insertItemStatements,
	loadOfferItems,
	loadOfferItemsForMany,
} from "../lib/offer-items";
import { jsonError } from "../lib/http";
import {
	isUuid,
	readJsonBody,
	validateBbox,
	validateLatLng,
	validateOfferStrings,
} from "../lib/validate";

type Variables = {
	userId: string | null;
};

export const offersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** Public catalog of German Pfand types (for clients / docs). */
offersRoutes.get("/catalog", (c) => {
	return c.json({
		items: PFAND_CATALOG.map((e) => ({
			type: e.type,
			label: e.label,
			hint: e.hint,
			category: e.category,
			unit_cents: e.unit_cents,
		})),
		min_pfand_cents: MIN_PFAND_CENTS,
	});
});

/** Public map pins: open offers in bounding box. No full address. */
offersRoutes.get("/", async (c) => {
	const bbox = validateBbox(
		c.req.query("south"),
		c.req.query("west"),
		c.req.query("north"),
		c.req.query("east"),
	);
	if (!bbox.ok) {
		return jsonError(c, bbox.error, 400);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT id, title, description, pfand_value_cents, status,
		        lat, lng, address_hint, created_at
		 FROM offers
		 WHERE status = 'open'
		   AND lat BETWEEN ? AND ?
		   AND lng BETWEEN ? AND ?
		 ORDER BY created_at DESC
		 LIMIT ?`,
	)
		.bind(bbox.south, bbox.north, bbox.west, bbox.east, MAX_MAP_OFFERS)
		.all<{ id: string }>();

	const offers = results ?? [];
	const itemsByOffer = await loadOfferItemsForMany(
		c.env.DB,
		offers.map((o) => o.id),
	);

	return c.json({
		offers: offers.map((o) => ({
			...o,
			items: itemsByOffer.get(o.id) ?? [],
		})),
	});
});

/** Poster’s own offers (all statuses). Full address included. */
offersRoutes.get("/mine", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT id, title, description, pfand_value_cents, status,
		        lat, lng, address_hint, address_text, created_at, updated_at
		 FROM offers
		 WHERE poster_id = ?
		 ORDER BY created_at DESC
		 LIMIT ?`,
	)
		.bind(userId, MAX_MINE_OFFERS)
		.all<{ id: string }>();

	const offers = results ?? [];
	const itemsByOffer = await loadOfferItemsForMany(
		c.env.DB,
		offers.map((o) => o.id),
	);

	return c.json({
		offers: offers.map((o) => ({
			...o,
			items: itemsByOffer.get(o.id) ?? [],
		})),
	});
});

/** Offer detail — address only if poster or active/collected collector. */
offersRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	if (!isUuid(id)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const userId = c.get("userId");

	const offer = await c.env.DB.prepare(
		`SELECT id, poster_id, title, description, pfand_value_cents, status,
		        lat, lng, address_hint, address_text, created_at, updated_at
		 FROM offers WHERE id = ?`,
	)
		.bind(id)
		.first<{
			id: string;
			poster_id: string;
			title: string;
			description: string;
			pfand_value_cents: number;
			status: string;
			lat: number;
			lng: number;
			address_hint: string;
			address_text: string;
			created_at: string;
			updated_at: string;
		}>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	let canSeeAddress = userId !== null && userId === offer.poster_id;
	let deadlineAt: string | null = null;
	let isActiveCollector = false;

	if (userId && userId !== offer.poster_id) {
		// Address for unfinished handover only (active en-route or awaiting poster confirm).
		const res = await c.env.DB.prepare(
			`SELECT id, deadline_at, status FROM reservations
			 WHERE offer_id = ? AND collector_id = ?
			   AND status IN ('active', 'collected')`,
		)
			.bind(id, userId)
			.first<{ id: string; deadline_at: string; status: string }>();
		if (res) {
			canSeeAddress = true;
			isActiveCollector = true;
			deadlineAt = res.status === "active" ? res.deadline_at : null;
		}
	}

	const items = await loadOfferItems(c.env.DB, id);
	const { address_text, poster_id, ...publicFields } = offer;
	return c.json({
		offer: {
			...publicFields,
			items,
			is_own: userId === poster_id,
			is_active_collector: isActiveCollector,
			deadline_at: deadlineAt,
			address_text: canSeeAddress ? address_text : null,
		},
	});
});

/**
 * Create offer from structured Pfand quantities.
 * Body: { items: [{ type, quantity }], note?, lat, lng, address_text, address_hint? }
 * Total = sum(catalog unit × qty); client total is ignored.
 */
offersRoutes.post("/", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const parsed = await readJsonBody<{
		title?: unknown;
		note?: unknown;
		description?: unknown;
		items?: unknown;
		lat?: unknown;
		lng?: unknown;
		address_hint?: unknown;
		address_text?: unknown;
	}>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}
	const body = parsed.data;

	const itemsRaw = Array.isArray(body.items)
		? (body.items as Array<{ type?: string; quantity?: number }>)
		: [];
	// Cap item array length early (catalog has 5 types; merged later).
	if (itemsRaw.length > 20) {
		return jsonError(c, "Zu viele Einträge in der Stückliste", 400);
	}

	const computed = computePfandFromItems(itemsRaw);
	if (!computed.ok) {
		return jsonError(c, computed.error, 400);
	}

	const minErr = assertMinPfand(computed.total_cents);
	if (minErr) {
		return jsonError(c, minErr, 400);
	}

	const coords = validateLatLng(body.lat, body.lng);
	if (!coords.ok) {
		return jsonError(c, coords.error, 400);
	}

	const strings = validateOfferStrings(body);
	if (!strings.ok) {
		return jsonError(c, strings.error, 400);
	}

	const summary = formatPfandSummary(computed.lines);
	const title =
		strings.title ||
		(summary.length > 60 ? `${summary.slice(0, 57)}…` : summary) ||
		"Pfand-Angebot";
	const description = strings.note
		? `${summary}\n${strings.note}`
		: summary;

	const id = crypto.randomUUID();
	const now = nowIso();

	const stmts: D1PreparedStatement[] = [
		c.env.DB.prepare(
			`INSERT INTO offers (
				id, poster_id, title, description, pfand_value_cents, status,
				lat, lng, address_hint, address_text, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)`,
		).bind(
			id,
			userId,
			title,
			description,
			computed.total_cents,
			coords.lat,
			coords.lng,
			strings.addressHint,
			strings.addressText,
			now,
			now,
		),
		...insertItemStatements(c.env.DB, id, computed.lines),
	];

	await c.env.DB.batch(stmts);

	return c.json(
		{
			id,
			pfand_value_cents: computed.total_cents,
			items: computed.lines,
		},
		201,
	);
});

/** Accept offer → reserved + 6h deadline; address becomes visible. */
offersRoutes.post("/:id/accept", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const offer = await c.env.DB.prepare(
		`SELECT id, poster_id, status, address_text FROM offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{
			id: string;
			poster_id: string;
			status: string;
			address_text: string;
		}>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id === userId) {
		return jsonError(
			c,
			"Dein eigenes Angebot kannst du nicht annehmen",
			400,
		);
	}
	if (offer.status !== "open") {
		return jsonError(c, "Das Angebot ist leider schon weg", 409);
	}

	// Atomic daily slot first — serializes concurrent accepts on accepted_today.
	const claimed = await claimAcceptSlot(c.env.DB, userId);
	if (!claimed) {
		const q = await ensureCollectorQuota(c.env.DB, userId);
		return jsonError(
			c,
			`Tageslimit erreicht (${q.daily_limit} Abholungen heute). Morgen kann sich dein Limit ändern – je nachdem, wie viele Annahmen heute bestätigt wurden.`,
			400,
		);
	}

	const unfinished = await c.env.DB.prepare(
		`SELECT COUNT(*) AS n FROM reservations
		 WHERE collector_id = ? AND status IN ('active', 'collected')`,
	)
		.bind(userId)
		.first<{ n: number }>();

	if ((unfinished?.n ?? 0) >= claimed.max_unfinished) {
		await refundAcceptSlot(c.env.DB, userId);
		return jsonError(
			c,
			`Du hast schon ${claimed.max_unfinished} offene Abholung(en). Schließ welche ab (abholen + bestätigen lassen), bevor du mehr annimmst.`,
			400,
		);
	}

	const reservationId = crypto.randomUUID();
	const acceptedAt = nowIso();
	const acceptDay = berlinDayKey(new Date(acceptedAt));
	const deadlineAt = reservationDeadlineIso(new Date(acceptedAt));

	try {
		const batchResults = await c.env.DB.batch([
			c.env.DB.prepare(
				`UPDATE offers SET status = 'reserved', updated_at = ?
				 WHERE id = ? AND status = 'open'`,
			).bind(acceptedAt, offerId),
			c.env.DB.prepare(
				`INSERT INTO reservations (
					id, offer_id, collector_id, accepted_at, deadline_at, status, accept_day
				) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
			).bind(
				reservationId,
				offerId,
				userId,
				acceptedAt,
				deadlineAt,
				acceptDay,
			),
		]);

		const offerChanges = batchResults[0]?.meta?.changes ?? 0;
		if (offerChanges === 0) {
			await c.env.DB.prepare(
				`DELETE FROM reservations WHERE id = ? AND status = 'active'`,
			)
				.bind(reservationId)
				.run();
			await refundAcceptSlot(c.env.DB, userId);
			return jsonError(
				c,
				"Pech – gerade hat’s jemand anderes angenommen",
				409,
			);
		}
	} catch {
		await c.env.DB.prepare(
			`DELETE FROM reservations WHERE id = ? AND status = 'active'`,
		)
			.bind(reservationId)
			.run()
			.catch(() => {});
		await refundAcceptSlot(c.env.DB, userId);
		return jsonError(
			c,
			"Pech – gerade hat’s jemand anderes angenommen",
			409,
		);
	}

	// Keep earliest unfinished up to max; release this accept if over concurrent cap.
	const unfinishedRows = await c.env.DB.prepare(
		`SELECT id FROM reservations
		 WHERE collector_id = ? AND status IN ('active', 'collected')
		 ORDER BY accepted_at ASC
		 LIMIT ?`,
	)
		.bind(userId, claimed.max_unfinished + 8)
		.all<{ id: string }>();

	const unfinishedList = unfinishedRows.results ?? [];
	if (unfinishedList.length > claimed.max_unfinished) {
		const keep = new Set(
			unfinishedList.slice(0, claimed.max_unfinished).map((r) => r.id),
		);
		if (!keep.has(reservationId)) {
			await c.env.DB.batch([
				c.env.DB.prepare(
					`UPDATE reservations SET status = 'released'
					 WHERE id = ? AND status = 'active'`,
				).bind(reservationId),
				c.env.DB.prepare(
					`UPDATE offers SET status = 'open', updated_at = ?
					 WHERE id = ? AND status = 'reserved'`,
				).bind(nowIso(), offerId),
			]);
			await refundAcceptSlot(c.env.DB, userId);
			return jsonError(
				c,
				`Du hast schon ${claimed.max_unfinished} offene Abholung(en). Schließ welche ab, bevor du mehr annimmst.`,
				400,
			);
		}
	}

	const ours = await c.env.DB.prepare(
		`SELECT id FROM reservations WHERE id = ? AND collector_id = ? AND status = 'active'`,
	)
		.bind(reservationId, userId)
		.first<{ id: string }>();

	if (!ours) {
		await refundAcceptSlot(c.env.DB, userId);
		return jsonError(
			c,
			"Pech – gerade hat’s jemand anderes angenommen",
			409,
		);
	}

	const quotaAfter = await ensureCollectorQuota(c.env.DB, userId);

	return c.json({
		reservation_id: reservationId,
		deadline_at: deadlineAt,
		address_text: offer.address_text,
		quota: {
			daily_limit: quotaAfter.daily_limit,
			accepted_today: quotaAfter.accepted_today,
			remaining_today: quotaAfter.remaining_today,
		},
	});
});

/**
 * Step 1 — Collector marks Pfand as collected (pickup done).
 * Offer stays unfinished until the poster confirms (blocks new accepts).
 */
offersRoutes.post("/:id/collect", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const now = nowIso();

	const offer = await c.env.DB.prepare(
		`SELECT poster_id, status FROM offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{ poster_id: string; status: string }>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id === userId) {
		return jsonError(
			c,
			"Als Inserent bestätigst du erst, wenn der Abholer „Abgeholt“ getippt hat.",
			400,
		);
	}
	if (offer.status !== "reserved") {
		return jsonError(
			c,
			offer.status === "collected"
				? "Schon als abgeholt gemeldet – warte noch auf die Bestätigung"
				: "Nur angenommene Angebote kannst du als abgeholt melden",
			400,
		);
	}

	const reservation = await c.env.DB.prepare(
		`SELECT id, deadline_at FROM reservations
		 WHERE offer_id = ? AND collector_id = ? AND status = 'active'`,
	)
		.bind(offerId, userId)
		.first<{ id: string; deadline_at: string }>();

	if (!reservation) {
		return jsonError(c, "Du hast hier keine laufende Abholung", 404);
	}

	// Expired before cron: release and reject collect.
	if (isPast(reservation.deadline_at)) {
		await c.env.DB.batch([
			c.env.DB.prepare(
				`UPDATE reservations SET status = 'released'
				 WHERE id = ? AND status = 'active'`,
			).bind(reservation.id),
			c.env.DB.prepare(
				`UPDATE offers SET status = 'open', updated_at = ?
				 WHERE id = ? AND status = 'reserved'`,
			).bind(now, offerId),
		]);
		return jsonError(
			c,
			"Die Zeit ist um – das Angebot ist wieder frei",
			409,
		);
	}

	const results = await c.env.DB.batch([
		c.env.DB.prepare(
			`UPDATE reservations
			 SET status = 'collected', collected_at = ?
			 WHERE id = ? AND status = 'active'`,
		).bind(now, reservation.id),
		c.env.DB.prepare(
			`UPDATE offers SET status = 'collected', updated_at = ?
			 WHERE id = ? AND status = 'reserved'`,
		).bind(now, offerId),
	]);

	if ((results[0]?.meta?.changes ?? 0) === 0) {
		return jsonError(
			c,
			"Hat nicht geklappt – bitte Seite neu laden",
			409,
		);
	}

	return c.json({
		ok: true,
		status: "collected",
		message:
			"Super, gemeldet. Der Inserent muss innerhalb von 24 Stunden bestätigen – sonst wird das Angebot storniert.",
	});
});

/**
 * Step 2 — Poster confirms the collector’s “collected” report → fully completed.
 * Only then is the collector free to accept a new offer.
 */
offersRoutes.post("/:id/confirm", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const now = nowIso();

	const offer = await c.env.DB.prepare(
		`SELECT poster_id, status FROM offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{ poster_id: string; status: string }>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id !== userId) {
		return jsonError(
			c,
			"Nur der Inserent kann bestätigen. Als Abholer: tipp auf „Abgeholt“ und sag dem Inserenten Bescheid.",
			403,
		);
	}
	if (offer.status !== "collected") {
		return jsonError(
			c,
			offer.status === "reserved"
				? "Warte noch, bis der Abholer „Abgeholt“ tippt"
				: offer.status === "completed"
					? "Das ist schon erledigt"
					: "Bestätigen geht erst, wenn der Abholer abgeholt hat",
			400,
		);
	}

	const reservation = await c.env.DB.prepare(
		`SELECT id, collector_id, accept_day, accepted_at FROM reservations
		 WHERE offer_id = ? AND status = 'collected'`,
	)
		.bind(offerId)
		.first<{
			id: string;
			collector_id: string;
			accept_day: string | null;
			accepted_at: string;
		}>();

	if (!reservation) {
		return jsonError(
			c,
			"Es gibt keine offene Abhol-Meldung zum Bestätigen",
			409,
		);
	}

	const results = await c.env.DB.batch([
		c.env.DB.prepare(
			`UPDATE reservations
			 SET status = 'completed', completed_at = ?
			 WHERE id = ? AND status = 'collected'`,
		).bind(now, reservation.id),
		c.env.DB.prepare(
			`UPDATE offers SET status = 'completed', updated_at = ?
			 WHERE id = ? AND status = 'collected' AND poster_id = ?`,
		).bind(now, offerId, userId),
	]);

	if ((results[0]?.meta?.changes ?? 0) === 0) {
		return jsonError(
			c,
			"Bestätigung hat nicht geklappt – bitte neu laden",
			409,
		);
	}

	const acceptDay =
		reservation.accept_day?.trim() ||
		berlinDayKey(new Date(reservation.accepted_at));
	await recordCollectorConfirm(c.env.DB, reservation.collector_id, acceptDay);

	return c.json({ ok: true, status: "completed" });
});

/**
 * Poster cancels an open / reserved / collected offer (releases collector).
 * Completed / cancelled cannot be cancelled again.
 */
offersRoutes.post("/:id/cancel", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const now = nowIso();

	const offer = await c.env.DB.prepare(
		`SELECT poster_id, status FROM offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{ poster_id: string; status: string }>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id !== userId) {
		return jsonError(c, "Nur du als Inserent kannst stornieren", 403);
	}
	if (offer.status === "completed" || offer.status === "cancelled") {
		return jsonError(c, "Das lässt sich nicht mehr stornieren", 400);
	}

	const stmts: D1PreparedStatement[] = [
		c.env.DB.prepare(
			`UPDATE offers SET status = 'cancelled', updated_at = ?
			 WHERE id = ? AND poster_id = ? AND status NOT IN ('completed', 'cancelled')`,
		).bind(now, offerId, userId),
	];

	// Free collector on reserved (en route) or collected (awaiting confirm).
	if (offer.status === "reserved" || offer.status === "collected") {
		stmts.push(
			c.env.DB.prepare(
				`UPDATE reservations SET status = 'released'
				 WHERE offer_id = ? AND status IN ('active', 'collected')`,
			).bind(offerId),
		);
	}

	const results = await c.env.DB.batch(stmts);
	if ((results[0]?.meta?.changes ?? 0) === 0) {
		return jsonError(c, "Das lässt sich nicht mehr stornieren", 400);
	}

	return c.json({ ok: true });
});
