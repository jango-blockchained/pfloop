import { Hono } from "hono";
import { isPublicArea } from "../../shared/areas";
import { nowIso } from "../lib/time";
import {
	MAX_ADDRESS_HINT_LEN,
	MAX_ADDRESS_LABEL_LEN,
	MAX_ADDRESS_TEXT_LEN,
	MAX_USER_ADDRESSES,
} from "../lib/constants";
import { jsonError } from "../lib/http";
import {
	isUuid,
	readJsonBody,
	validateLatLng,
} from "../lib/validate";

type Variables = {
	userId: string | null;
};

export const addressesRoutes = new Hono<{
	Bindings: Env;
	Variables: Variables;
}>();

type AddressRow = {
	id: string;
	user_id: string;
	label: string;
	address_text: string;
	address_hint: string;
	lat: number;
	lng: number;
	is_default: number;
	created_at: string;
	updated_at: string;
};

function sanitizeLabel(raw: unknown): string {
	if (typeof raw !== "string") return "";
	return raw.trim().slice(0, MAX_ADDRESS_LABEL_LEN);
}

function sanitizeText(raw: unknown, max: number): string {
	if (typeof raw !== "string") return "";
	return raw.trim().slice(0, max);
}

function toDto(row: AddressRow) {
	return {
		id: row.id,
		label: row.label,
		address_text: row.address_text,
		address_hint: row.address_hint,
		lat: row.lat,
		lng: row.lng,
		is_default: row.is_default === 1,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

/** List own saved addresses (default first). */
addressesRoutes.get("/", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const { results } = await c.env.DB.prepare(
		`SELECT id, user_id, label, address_text, address_hint, lat, lng,
		        is_default, created_at, updated_at
		 FROM user_addresses
		 WHERE user_id = ?
		 ORDER BY is_default DESC, updated_at DESC
		 LIMIT ?`,
	)
		.bind(userId, MAX_USER_ADDRESSES)
		.all<AddressRow>();

	return c.json({
		addresses: (results ?? []).map(toDto),
		max: MAX_USER_ADDRESSES,
	});
});

/** Create saved address. */
addressesRoutes.post("/", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const count = await c.env.DB.prepare(
		`SELECT COUNT(*) AS n FROM user_addresses WHERE user_id = ?`,
	)
		.bind(userId)
		.first<{ n: number }>();

	if ((count?.n ?? 0) >= MAX_USER_ADDRESSES) {
		return jsonError(
			c,
			`Maximal ${MAX_USER_ADDRESSES} Adressen. Lösche zuerst eine.`,
			400,
		);
	}

	const parsed = await readJsonBody<{
		label?: unknown;
		address_text?: unknown;
		address_hint?: unknown;
		lat?: unknown;
		lng?: unknown;
		is_default?: unknown;
	}>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}

	const addressText = sanitizeText(parsed.data.address_text, MAX_ADDRESS_TEXT_LEN);
	if (!addressText) {
		return jsonError(c, "Bitte die Adresse angeben", 400);
	}

	const coords = validateLatLng(parsed.data.lat, parsed.data.lng);
	if (!coords.ok) {
		return jsonError(c, coords.error, 400);
	}

	const label =
		sanitizeLabel(parsed.data.label) ||
		addressText.split(",")[0]?.trim().slice(0, MAX_ADDRESS_LABEL_LEN) ||
		"Adresse";
	const addressHint = sanitizeText(parsed.data.address_hint, MAX_ADDRESS_HINT_LEN);
	if (!addressHint || !isPublicArea(addressHint)) {
		return jsonError(
			c,
			"Bitte Stadtteil / Gegend aus der Liste wählen",
			400,
		);
	}
	const wantDefault =
		parsed.data.is_default === true ||
		parsed.data.is_default === 1 ||
		(count?.n ?? 0) === 0;

	const id = crypto.randomUUID();
	const now = nowIso();

	const stmts: D1PreparedStatement[] = [];
	if (wantDefault) {
		stmts.push(
			c.env.DB.prepare(
				`UPDATE user_addresses SET is_default = 0, updated_at = ?
				 WHERE user_id = ? AND is_default = 1`,
			).bind(now, userId),
		);
	}

	stmts.push(
		c.env.DB.prepare(
			`INSERT INTO user_addresses (
				id, user_id, label, address_text, address_hint, lat, lng,
				is_default, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).bind(
			id,
			userId,
			label,
			addressText,
			addressHint,
			coords.lat,
			coords.lng,
			wantDefault ? 1 : 0,
			now,
			now,
		),
	);

	await c.env.DB.batch(stmts);

	const row = await c.env.DB.prepare(
		`SELECT * FROM user_addresses WHERE id = ?`,
	)
		.bind(id)
		.first<AddressRow>();

	return c.json({ address: row ? toDto(row) : null }, 201);
});

/** Update saved address. */
addressesRoutes.patch("/:id", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const id = c.req.param("id");
	if (!isUuid(id)) {
		return jsonError(c, "Adresse nicht gefunden", 404);
	}

	const existing = await c.env.DB.prepare(
		`SELECT * FROM user_addresses WHERE id = ? AND user_id = ?`,
	)
		.bind(id, userId)
		.first<AddressRow>();

	if (!existing) {
		return jsonError(c, "Adresse nicht gefunden", 404);
	}

	const parsed = await readJsonBody<{
		label?: unknown;
		address_text?: unknown;
		address_hint?: unknown;
		lat?: unknown;
		lng?: unknown;
		is_default?: unknown;
	}>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}

	const body = parsed.data;
	const label =
		body.label !== undefined
			? sanitizeLabel(body.label) || existing.label
			: existing.label;
	const addressText =
		body.address_text !== undefined
			? sanitizeText(body.address_text, MAX_ADDRESS_TEXT_LEN)
			: existing.address_text;
	if (!addressText) {
		return jsonError(c, "Bitte die Adresse angeben", 400);
	}
	const addressHint =
		body.address_hint !== undefined
			? sanitizeText(body.address_hint, MAX_ADDRESS_HINT_LEN)
			: existing.address_hint;
	if (!addressHint || !isPublicArea(addressHint)) {
		return jsonError(
			c,
			"Bitte Stadtteil / Gegend aus der Liste wählen",
			400,
		);
	}

	let lat = existing.lat;
	let lng = existing.lng;
	if (body.lat !== undefined || body.lng !== undefined) {
		const coords = validateLatLng(
			body.lat !== undefined ? body.lat : existing.lat,
			body.lng !== undefined ? body.lng : existing.lng,
		);
		if (!coords.ok) {
			return jsonError(c, coords.error, 400);
		}
		lat = coords.lat;
		lng = coords.lng;
	}

	const setDefault =
		body.is_default === true || body.is_default === 1
			? true
			: body.is_default === false || body.is_default === 0
				? false
				: null;

	const now = nowIso();
	const stmts: D1PreparedStatement[] = [];

	if (setDefault === true) {
		stmts.push(
			c.env.DB.prepare(
				`UPDATE user_addresses SET is_default = 0, updated_at = ?
				 WHERE user_id = ? AND is_default = 1 AND id != ?`,
			).bind(now, userId, id),
		);
	}

	const isDefault =
		setDefault === true
			? 1
			: setDefault === false
				? 0
				: existing.is_default;

	stmts.push(
		c.env.DB.prepare(
			`UPDATE user_addresses
			 SET label = ?, address_text = ?, address_hint = ?, lat = ?, lng = ?,
			     is_default = ?, updated_at = ?
			 WHERE id = ? AND user_id = ?`,
		).bind(
			label,
			addressText,
			addressHint,
			lat,
			lng,
			isDefault,
			now,
			id,
			userId,
		),
	);

	await c.env.DB.batch(stmts);

	// If we cleared default and nothing else is default, promote newest
	if (setDefault === false) {
		const still = await c.env.DB.prepare(
			`SELECT id FROM user_addresses WHERE user_id = ? AND is_default = 1 LIMIT 1`,
		)
			.bind(userId)
			.first<{ id: string }>();
		if (!still) {
			const next = await c.env.DB.prepare(
				`SELECT id FROM user_addresses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
			)
				.bind(userId)
				.first<{ id: string }>();
			if (next) {
				await c.env.DB.prepare(
					`UPDATE user_addresses SET is_default = 1, updated_at = ? WHERE id = ?`,
				)
					.bind(now, next.id)
					.run();
			}
		}
	}

	const row = await c.env.DB.prepare(
		`SELECT * FROM user_addresses WHERE id = ?`,
	)
		.bind(id)
		.first<AddressRow>();

	return c.json({ address: row ? toDto(row) : null });
});

/** Set as default. */
addressesRoutes.post("/:id/default", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const id = c.req.param("id");
	if (!isUuid(id)) {
		return jsonError(c, "Adresse nicht gefunden", 404);
	}

	const existing = await c.env.DB.prepare(
		`SELECT id FROM user_addresses WHERE id = ? AND user_id = ?`,
	)
		.bind(id, userId)
		.first<{ id: string }>();

	if (!existing) {
		return jsonError(c, "Adresse nicht gefunden", 404);
	}

	const now = nowIso();
	await c.env.DB.batch([
		c.env.DB.prepare(
			`UPDATE user_addresses SET is_default = 0, updated_at = ?
			 WHERE user_id = ?`,
		).bind(now, userId),
		c.env.DB.prepare(
			`UPDATE user_addresses SET is_default = 1, updated_at = ?
			 WHERE id = ? AND user_id = ?`,
		).bind(now, id, userId),
	]);

	return c.json({ ok: true });
});

/** Delete saved address. */
addressesRoutes.delete("/:id", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return jsonError(c, "Bitte melde dich an", 401);
	}

	const id = c.req.param("id");
	if (!isUuid(id)) {
		return jsonError(c, "Adresse nicht gefunden", 404);
	}

	const existing = await c.env.DB.prepare(
		`SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ?`,
	)
		.bind(id, userId)
		.first<{ id: string; is_default: number }>();

	if (!existing) {
		return jsonError(c, "Adresse nicht gefunden", 404);
	}

	const now = nowIso();
	await c.env.DB.prepare(
		`DELETE FROM user_addresses WHERE id = ? AND user_id = ?`,
	)
		.bind(id, userId)
		.run();

	if (existing.is_default === 1) {
		const next = await c.env.DB.prepare(
			`SELECT id FROM user_addresses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
		)
			.bind(userId)
			.first<{ id: string }>();
		if (next) {
			await c.env.DB.prepare(
				`UPDATE user_addresses SET is_default = 1, updated_at = ? WHERE id = ?`,
			)
				.bind(now, next.id)
				.run();
		}
	}

	return c.json({ ok: true });
});
