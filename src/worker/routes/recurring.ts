// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Hono } from "hono";
import { assertMinRecurringPfand, recurringFloorCents } from "../lib/money";
import { nowIso } from "../lib/time";
import {
	MAX_MAP_OFFERS,
	MAX_MINE_OFFERS,
	MAX_RECURRING_OFFERS_PER_USER,
	MIN_RECURRING_PFAND_CENTS,
	RECURRING_VALUE_THRESHOLD,
	WEEKDAYS,
	type Weekday,
} from "../lib/constants";
import {
	computePfandFromItems,
	formatPfandSummary,
} from "../../shared/pfand";
import {
	insertRecurringItemStatements,
	loadRecurringOfferItems,
	loadRecurringOfferItemsForMany,
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

export const recurringRoutes = new Hono<{
	Bindings: Env;
	Variables: Variables;
}>();

type RecurringRow = {
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
	weekday: number;
	time_hint: string;
	assigned_collector_id: string | null;
	assigned_at: string | null;
	created_at: string;
	updated_at: string;
};

function parseWeekday(raw: unknown): Weekday | null {
	const n = typeof raw === "number" ? raw : Number(raw);
	if (!Number.isInteger(n)) return null;
	if (!(WEEKDAYS as readonly number[]).includes(n)) return null;
	return n as Weekday;
}

function sanitizeTimeHint(raw: unknown): string {
	if (typeof raw !== "string") return "";
	return raw.trim().slice(0, 80);
}

function sanitizeMessage(raw: unknown): string {
	if (typeof raw !== "string") return "";
	return raw.trim().slice(0, 400);
}

/** Public map pins: open recurring offers only. */
recurringRoutes.get("/", async (c) => {
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
		        lat, lng, address_hint, weekday, time_hint, created_at
		 FROM recurring_offers
		 WHERE status = 'open'
		   AND lat BETWEEN ? AND ?
		   AND lng BETWEEN ? AND ?
		 ORDER BY created_at DESC
		 LIMIT ?`,
	)
		.bind(bbox.south, bbox.north, bbox.west, bbox.east, MAX_MAP_OFFERS)
		.all<{
			id: string;
			title: string;
			description: string;
			pfand_value_cents: number;
			status: string;
			lat: number;
			lng: number;
			address_hint: string;
			weekday: number;
			time_hint: string;
			created_at: string;
		}>();

	const offers = results ?? [];
	const itemsByOffer = await loadRecurringOfferItemsForMany(
		c.env.DB,
		offers.map((o) => o.id),
	);

	return c.json({
		offers: offers.map((o) => ({
			...o,
			kind: "recurring" as const,
			items: itemsByOffer.get(o.id) ?? [],
			pfand_floor_cents: recurringFloorCents(o.pfand_value_cents),
		})),
		min_pfand_cents: MIN_RECURRING_PFAND_CENTS,
		value_threshold: RECURRING_VALUE_THRESHOLD,
		max_per_user: MAX_RECURRING_OFFERS_PER_USER,
	});
});

/** Poster’s own recurring offers. */
recurringRoutes.get("/mine", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT id, title, description, pfand_value_cents, status,
		        lat, lng, address_hint, address_text, weekday, time_hint,
		        assigned_collector_id, assigned_at, created_at, updated_at
		 FROM recurring_offers
		 WHERE poster_id = ?
		 ORDER BY created_at DESC
		 LIMIT ?`,
	)
		.bind(userId, MAX_MINE_OFFERS)
		.all<RecurringRow>();

	const offers = results ?? [];
	const itemsByOffer = await loadRecurringOfferItemsForMany(
		c.env.DB,
		offers.map((o) => o.id),
	);

	const enriched = [];
	for (const o of offers) {
		const pending = await c.env.DB.prepare(
			`SELECT COUNT(*) AS n FROM recurring_applications
			 WHERE recurring_offer_id = ? AND status = 'pending'`,
		)
			.bind(o.id)
			.first<{ n: number }>();

		let assigned_display_name: string | null = null;
		if (o.assigned_collector_id) {
			const u = await c.env.DB.prepare(
				`SELECT display_name, email FROM users WHERE id = ?`,
			)
				.bind(o.assigned_collector_id)
				.first<{ display_name: string; email: string }>();
			assigned_display_name =
				u?.display_name?.trim() || u?.email || o.assigned_collector_id;
		}

		enriched.push({
			...o,
			kind: "recurring" as const,
			items: itemsByOffer.get(o.id) ?? [],
			pending_applications: pending?.n ?? 0,
			assigned_display_name,
		});
	}

	return c.json({
		offers: enriched,
		max_per_user: MAX_RECURRING_OFFERS_PER_USER,
	});
});

/** Collector: applications I submitted. */
recurringRoutes.get("/applications/mine", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT a.id AS application_id, a.status AS application_status,
		        a.message, a.created_at AS applied_at,
		        r.id AS offer_id, r.title, r.pfand_value_cents, r.status AS offer_status,
		        r.weekday, r.time_hint, r.address_hint, r.lat, r.lng,
		        r.address_text,
		        CASE WHEN r.assigned_collector_id = ? THEN 1 ELSE 0 END AS is_assigned
		 FROM recurring_applications a
		 JOIN recurring_offers r ON r.id = a.recurring_offer_id
		 WHERE a.applicant_id = ?
		 ORDER BY a.created_at DESC
		 LIMIT ?`,
	)
		.bind(userId, userId, MAX_MINE_OFFERS)
		.all<{
			application_id: string;
			application_status: string;
			message: string;
			applied_at: string;
			offer_id: string;
			title: string;
			pfand_value_cents: number;
			offer_status: string;
			weekday: number;
			time_hint: string;
			address_hint: string;
			lat: number;
			lng: number;
			address_text: string;
			is_assigned: number;
		}>();

	return c.json({
		applications: (results ?? []).map((row) => ({
			application_id: row.application_id,
			application_status: row.application_status,
			message: row.message,
			applied_at: row.applied_at,
			offer_id: row.offer_id,
			title: row.title,
			pfand_value_cents: row.pfand_value_cents,
			offer_status: row.offer_status,
			weekday: row.weekday,
			time_hint: row.time_hint,
			address_hint: row.address_hint,
			lat: row.lat,
			lng: row.lng,
			is_assigned: row.is_assigned === 1,
			address_text:
				row.is_assigned === 1 && row.offer_status === "assigned"
					? row.address_text
					: null,
		})),
	});
});

/** Detail. */
recurringRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	if (!isUuid(id)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const userId = c.get("userId");
	const offer = await c.env.DB.prepare(
		`SELECT * FROM recurring_offers WHERE id = ?`,
	)
		.bind(id)
		.first<RecurringRow>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const isOwn = userId === offer.poster_id;
	const isAssignedCollector =
		userId != null &&
		offer.status === "assigned" &&
		offer.assigned_collector_id === userId;

	if (offer.status === "assigned" && !isOwn && !isAssignedCollector) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.status === "cancelled" && !isOwn) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const items = await loadRecurringOfferItems(c.env.DB, id);

	let myApplication: {
		id: string;
		status: string;
		message: string;
		created_at: string;
	} | null = null;

	if (userId && !isOwn) {
		myApplication =
			(await c.env.DB.prepare(
				`SELECT id, status, message, created_at FROM recurring_applications
				 WHERE recurring_offer_id = ? AND applicant_id = ?`,
			)
				.bind(id, userId)
				.first()) ?? null;
	}

	let applications:
		| Array<{
				id: string;
				applicant_id: string;
				display_name: string;
				email: string;
				message: string;
				status: string;
				created_at: string;
		  }>
		| undefined;

	if (isOwn) {
		const { results } = await c.env.DB.prepare(
			`SELECT a.id, a.applicant_id, a.message, a.status, a.created_at,
			        u.display_name, u.email
			 FROM recurring_applications a
			 JOIN users u ON u.id = a.applicant_id
			 WHERE a.recurring_offer_id = ?
			 ORDER BY
			   CASE a.status
			     WHEN 'selected' THEN 0
			     WHEN 'pending' THEN 1
			     ELSE 2
			   END,
			   a.created_at ASC`,
		)
			.bind(id)
			.all<{
				id: string;
				applicant_id: string;
				message: string;
				status: string;
				created_at: string;
				display_name: string;
				email: string;
			}>();

		applications = (results ?? []).map((r) => ({
			id: r.id,
			applicant_id: r.applicant_id,
			display_name: r.display_name?.trim() || r.email,
			email: r.email,
			message: r.message,
			status: r.status,
			created_at: r.created_at,
		}));
	}

	const { address_text, poster_id: _p, assigned_collector_id, ...rest } = offer;
	const canSeeAddress = isOwn || isAssignedCollector;

	return c.json({
		offer: {
			...rest,
			kind: "recurring" as const,
			items,
			pfand_floor_cents: recurringFloorCents(offer.pfand_value_cents),
			value_threshold: RECURRING_VALUE_THRESHOLD,
			is_own: isOwn,
			is_assigned_collector: isAssignedCollector,
			assigned_collector_id: isOwn ? assigned_collector_id : null,
			address_text: canSeeAddress ? address_text : null,
			my_application: myApplication,
			applications,
		},
	});
});

/** Create (max 2 active). */
recurringRoutes.post("/", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const activeCount = await c.env.DB.prepare(
		`SELECT COUNT(*) AS n FROM recurring_offers
		 WHERE poster_id = ? AND status IN ('open', 'assigned')`,
	)
		.bind(userId)
		.first<{ n: number }>();

	if ((activeCount?.n ?? 0) >= MAX_RECURRING_OFFERS_PER_USER) {
		return jsonError(
			c,
			`Maximal ${MAX_RECURRING_OFFERS_PER_USER} wöchentliche Angebote gleichzeitig. Storniere oder gib zuerst eines frei.`,
			400,
		);
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
		weekday?: unknown;
		time_hint?: unknown;
	}>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}
	const body = parsed.data;

	const weekday = parseWeekday(body.weekday);
	if (weekday == null) {
		return jsonError(c, "Bitte einen Wochentag wählen", 400);
	}

	const itemsRaw = Array.isArray(body.items)
		? (body.items as Array<{ type?: string; quantity?: number }>)
		: [];
	if (itemsRaw.length > 20) {
		return jsonError(c, "Zu viele Einträge in der Stückliste", 400);
	}

	const computed = computePfandFromItems(itemsRaw);
	if (!computed.ok) {
		return jsonError(c, computed.error, 400);
	}

	const minErr = assertMinRecurringPfand(computed.total_cents);
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

	const timeHint = sanitizeTimeHint(body.time_hint);
	const summary = formatPfandSummary(computed.lines);
	const title =
		strings.title ||
		(summary.length > 60 ? `${summary.slice(0, 57)}…` : summary) ||
		"Wöchentliches Pfand";
	const description = strings.note
		? `${summary}\n${strings.note}`
		: summary;

	const id = crypto.randomUUID();
	const now = nowIso();

	await c.env.DB.batch([
		c.env.DB.prepare(
			`INSERT INTO recurring_offers (
				id, poster_id, title, description, pfand_value_cents, status,
				lat, lng, address_hint, address_text, weekday, time_hint,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?)`,
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
			weekday,
			timeHint,
			now,
			now,
		),
		...insertRecurringItemStatements(c.env.DB, id, computed.lines),
	]);

	return c.json(
		{
			id,
			pfand_value_cents: computed.total_cents,
			pfand_floor_cents: recurringFloorCents(computed.total_cents),
			value_threshold: RECURRING_VALUE_THRESHOLD,
			weekday,
			items: computed.lines,
		},
		201,
	);
});

/** Apply to open recurring offer. */
recurringRoutes.post("/:id/apply", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	let message = "";
	const contentType = c.req.header("content-type") ?? "";
	if (contentType.includes("application/json")) {
		const parsed = await readJsonBody<{ message?: unknown }>(c);
		if (!parsed.ok) {
			return jsonError(c, parsed.error, parsed.status);
		}
		message = sanitizeMessage(parsed.data.message);
	}

	const offer = await c.env.DB.prepare(
		`SELECT id, poster_id, status FROM recurring_offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{ id: string; poster_id: string; status: string }>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id === userId) {
		return jsonError(
			c,
			"Auf dein eigenes Angebot kannst du dich nicht bewerben",
			400,
		);
	}
	if (offer.status !== "open") {
		return jsonError(
			c,
			"Hier kannst du dich gerade nicht bewerben",
			409,
		);
	}

	const existing = await c.env.DB.prepare(
		`SELECT id, status FROM recurring_applications
		 WHERE recurring_offer_id = ? AND applicant_id = ?`,
	)
		.bind(offerId, userId)
		.first<{ id: string; status: string }>();

	const now = nowIso();

	if (existing) {
		if (existing.status === "pending") {
			return jsonError(c, "Du hast dich schon beworben", 409);
		}
		if (existing.status === "selected") {
			return jsonError(c, "Du bist schon als Abholer ausgewählt", 409);
		}
		await c.env.DB.prepare(
			`UPDATE recurring_applications
			 SET status = 'pending', message = ?, updated_at = ?
			 WHERE id = ?`,
		)
			.bind(message, now, existing.id)
			.run();
		return c.json({
			ok: true,
			application_id: existing.id,
			status: "pending",
		});
	}

	const applicationId = crypto.randomUUID();
	try {
		await c.env.DB.prepare(
			`INSERT INTO recurring_applications (
				id, recurring_offer_id, applicant_id, message, status, created_at, updated_at
			) VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
		)
			.bind(applicationId, offerId, userId, message, now, now)
			.run();
	} catch {
		return jsonError(
			c,
			"Bewerbung hat nicht geklappt – versuch’s nochmal",
			409,
		);
	}

	return c.json(
		{ ok: true, application_id: applicationId, status: "pending" },
		201,
	);
});

/** Poster selects an applicant → offer becomes assigned (hidden). */
recurringRoutes.post("/:id/select", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const parsed = await readJsonBody<{
		applicant_id?: unknown;
		application_id?: unknown;
	}>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}

	const applicantId =
		typeof parsed.data.applicant_id === "string"
			? parsed.data.applicant_id
			: null;
	const applicationId =
		typeof parsed.data.application_id === "string"
			? parsed.data.application_id
			: null;

	if (
		(!applicantId || !isUuid(applicantId)) &&
		(!applicationId || !isUuid(applicationId))
	) {
		return jsonError(c, "Es fehlt, wen du auswählen willst", 400);
	}

	const offer = await c.env.DB.prepare(
		`SELECT id, poster_id, status FROM recurring_offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{ id: string; poster_id: string; status: string }>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id !== userId) {
		return jsonError(c, "Nur du als Inserent kannst jemanden auswählen", 403);
	}
	if (offer.status !== "open") {
		return jsonError(
			c,
			offer.status === "assigned"
				? "Da ist schon jemand dran – gib den Abholer erst frei"
				: "Das Angebot ist nicht mehr offen",
			400,
		);
	}

	const app = applicationId
		? await c.env.DB.prepare(
				`SELECT id, applicant_id, status FROM recurring_applications
				 WHERE id = ? AND recurring_offer_id = ?`,
			)
				.bind(applicationId, offerId)
				.first<{ id: string; applicant_id: string; status: string }>()
		: await c.env.DB.prepare(
				`SELECT id, applicant_id, status FROM recurring_applications
				 WHERE recurring_offer_id = ? AND applicant_id = ?`,
			)
				.bind(offerId, applicantId)
				.first<{ id: string; applicant_id: string; status: string }>();

	if (!app || app.status !== "pending") {
		return jsonError(
			c,
			"Zu der Person gibt’s keine offene Bewerbung",
			404,
		);
	}

	const now = nowIso();

	const results = await c.env.DB.batch([
		c.env.DB.prepare(
			`UPDATE recurring_offers
			 SET status = 'assigned',
			     assigned_collector_id = ?,
			     assigned_at = ?,
			     updated_at = ?
			 WHERE id = ? AND status = 'open' AND poster_id = ?`,
		).bind(app.applicant_id, now, now, offerId, userId),
		c.env.DB.prepare(
			`UPDATE recurring_applications
			 SET status = 'selected', updated_at = ?
			 WHERE id = ? AND status = 'pending'`,
		).bind(now, app.id),
		c.env.DB.prepare(
			`UPDATE recurring_applications
			 SET status = 'rejected', updated_at = ?
			 WHERE recurring_offer_id = ? AND status = 'pending' AND id != ?`,
		).bind(now, offerId, app.id),
	]);

	if ((results[0]?.meta?.changes ?? 0) === 0) {
		return jsonError(c, "Auswahl hat nicht geklappt – bitte neu laden", 409);
	}

	return c.json({
		ok: true,
		status: "assigned",
		assigned_collector_id: app.applicant_id,
	});
});

/**
 * Poster removes the selected collector → offer open again (visible).
 * Pending applications remain; rejected ones stay rejected.
 */
recurringRoutes.post("/:id/unassign", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const offer = await c.env.DB.prepare(
		`SELECT id, poster_id, status, assigned_collector_id FROM recurring_offers
		 WHERE id = ?`,
	)
		.bind(offerId)
		.first<{
			id: string;
			poster_id: string;
			status: string;
			assigned_collector_id: string | null;
		}>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id !== userId) {
		return jsonError(c, "Nur du als Inserent kannst den Abholer freigeben", 403);
	}
	if (offer.status !== "assigned") {
		return jsonError(c, "Es ist gerade niemand als Abholer eingetragen", 400);
	}

	const now = nowIso();
	const results = await c.env.DB.batch([
		c.env.DB.prepare(
			`UPDATE recurring_offers
			 SET status = 'open',
			     assigned_collector_id = NULL,
			     assigned_at = NULL,
			     updated_at = ?
			 WHERE id = ? AND status = 'assigned' AND poster_id = ?`,
		).bind(now, offerId, userId),
		// Selected application → withdrawn so they can re-apply if desired
		c.env.DB.prepare(
			`UPDATE recurring_applications
			 SET status = 'withdrawn', updated_at = ?
			 WHERE recurring_offer_id = ? AND status = 'selected'`,
		).bind(now, offerId),
	]);

	if ((results[0]?.meta?.changes ?? 0) === 0) {
		return jsonError(c, "Freigabe hat nicht geklappt – bitte neu laden", 409);
	}

	return c.json({ ok: true, status: "open" });
});

/** Applicant withdraws own pending application. */
recurringRoutes.post("/:id/withdraw", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const now = nowIso();
	const result = await c.env.DB.prepare(
		`UPDATE recurring_applications
		 SET status = 'withdrawn', updated_at = ?
		 WHERE recurring_offer_id = ? AND applicant_id = ? AND status = 'pending'`,
	)
		.bind(now, offerId, userId)
		.run();

	if ((result.meta?.changes ?? 0) === 0) {
		return jsonError(c, "Du hast hier keine offene Bewerbung", 404);
	}

	return c.json({ ok: true });
});

/** Poster cancels recurring offer. */
recurringRoutes.post("/:id/cancel", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const offerId = c.req.param("id");
	if (!isUuid(offerId)) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}

	const offer = await c.env.DB.prepare(
		`SELECT poster_id, status FROM recurring_offers WHERE id = ?`,
	)
		.bind(offerId)
		.first<{ poster_id: string; status: string }>();

	if (!offer) {
		return jsonError(c, "Das Angebot gibt’s nicht (mehr)", 404);
	}
	if (offer.poster_id !== userId) {
		return jsonError(c, "Nur du als Inserent kannst stornieren", 403);
	}
	if (offer.status === "cancelled") {
		return jsonError(c, "Schon storniert", 400);
	}

	const now = nowIso();
	const results = await c.env.DB.batch([
		c.env.DB.prepare(
			`UPDATE recurring_offers
			 SET status = 'cancelled',
			     assigned_collector_id = NULL,
			     assigned_at = NULL,
			     updated_at = ?
			 WHERE id = ? AND poster_id = ? AND status != 'cancelled'`,
		).bind(now, offerId, userId),
		c.env.DB.prepare(
			`UPDATE recurring_applications
			 SET status = CASE
			   WHEN status = 'pending' THEN 'rejected'
			   WHEN status = 'selected' THEN 'withdrawn'
			   ELSE status
			 END,
			 updated_at = ?
			 WHERE recurring_offer_id = ? AND status IN ('pending', 'selected')`,
		).bind(now, offerId),
	]);

	if ((results[0]?.meta?.changes ?? 0) === 0) {
		return jsonError(c, "Stornieren hat nicht geklappt", 400);
	}

	return c.json({ ok: true });
});
