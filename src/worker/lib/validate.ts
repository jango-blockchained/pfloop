/**
 * Input validation helpers for the GrabMe Worker API.
 * All client-facing messages are German.
 */

import type { Context } from "hono";
import {
	LAT_MAX,
	LAT_MIN,
	LNG_MAX,
	LNG_MIN,
	MAX_ADDRESS_HINT_LEN,
	MAX_ADDRESS_TEXT_LEN,
	MAX_BBOX_SPAN_DEG,
	MAX_DISPLAY_NAME_LEN,
	MAX_EMAIL_LEN,
	MAX_JSON_BODY_BYTES,
	MAX_NOTE_LEN,
	MAX_TITLE_LEN,
	MAX_TOKEN_LEN,
} from "./constants";

/** UUID v4-ish (accept any hex UUID shape used by crypto.randomUUID). */
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Practical email check (not full RFC). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUuid(id: string): boolean {
	return UUID_RE.test(id);
}

export function isValidEmail(email: string): boolean {
	if (!email || email.length > MAX_EMAIL_LEN) return false;
	if (email.includes("..")) return false;
	return EMAIL_RE.test(email);
}

export function clampDisplayName(raw: string | undefined): string | undefined {
	if (raw === undefined) return undefined;
	const t = raw.trim();
	if (!t) return undefined;
	return t.length > MAX_DISPLAY_NAME_LEN
		? t.slice(0, MAX_DISPLAY_NAME_LEN)
		: t;
}

export function isValidToken(token: string): boolean {
	// hex tokens from randomToken are 64 chars for 32 bytes; allow some slack
	if (!token || token.length > MAX_TOKEN_LEN) return false;
	return /^[0-9a-fA-F]+$/.test(token);
}

export type LatLngOk = { ok: true; lat: number; lng: number };
export type LatLngErr = { ok: false; error: string };

export function validateLatLng(
	lat: unknown,
	lng: unknown,
): LatLngOk | LatLngErr {
	if (
		typeof lat !== "number" ||
		typeof lng !== "number" ||
		!Number.isFinite(lat) ||
		!Number.isFinite(lng)
	) {
		return { ok: false, error: "Koordinaten (lat/lng) erforderlich" };
	}
	if (lat < LAT_MIN || lat > LAT_MAX) {
		return { ok: false, error: "Breitengrad (lat) muss zwischen -90 und 90 liegen" };
	}
	if (lng < LNG_MIN || lng > LNG_MAX) {
		return {
			ok: false,
			error: "Längengrad (lng) muss zwischen -180 und 180 liegen",
		};
	}
	return { ok: true, lat, lng };
}

export type BboxOk = {
	ok: true;
	south: number;
	west: number;
	north: number;
	east: number;
};
export type BboxErr = { ok: false; error: string };

export function validateBbox(
	southRaw: unknown,
	westRaw: unknown,
	northRaw: unknown,
	eastRaw: unknown,
): BboxOk | BboxErr {
	const south = Number(southRaw);
	const west = Number(westRaw);
	const north = Number(northRaw);
	const east = Number(eastRaw);

	if (![south, west, north, east].every(Number.isFinite)) {
		return {
			ok: false,
			error: "bbox erforderlich: south, west, north, east",
		};
	}
	if (south < LAT_MIN || south > LAT_MAX || north < LAT_MIN || north > LAT_MAX) {
		return { ok: false, error: "bbox: lat außerhalb von -90…90" };
	}
	if (west < LNG_MIN || west > LNG_MAX || east < LNG_MIN || east > LNG_MAX) {
		return { ok: false, error: "bbox: lng außerhalb von -180…180" };
	}
	if (south > north) {
		return { ok: false, error: "bbox: south muss ≤ north sein" };
	}
	if (west > east) {
		return { ok: false, error: "bbox: west muss ≤ east sein" };
	}
	if (north - south > MAX_BBOX_SPAN_DEG || east - west > MAX_BBOX_SPAN_DEG) {
		return {
			ok: false,
			error: `bbox zu groß (max. ${MAX_BBOX_SPAN_DEG}° pro Achse)`,
		};
	}
	return { ok: true, south, west, north, east };
}

export type OfferStringsOk = {
	ok: true;
	title: string | undefined;
	note: string;
	addressText: string;
	addressHint: string;
};
export type OfferStringsErr = { ok: false; error: string };

/** Validate and trim free-text fields for offer creation. */
export function validateOfferStrings(body: {
	title?: unknown;
	note?: unknown;
	description?: unknown;
	address_text?: unknown;
	address_hint?: unknown;
}): OfferStringsOk | OfferStringsErr {
	const titleRaw =
		typeof body.title === "string" ? body.title.trim() : undefined;
	if (titleRaw !== undefined && titleRaw.length > MAX_TITLE_LEN) {
		return {
			ok: false,
			error: `Titel zu lang (max. ${MAX_TITLE_LEN} Zeichen)`,
		};
	}

	const noteSource =
		typeof body.note === "string"
			? body.note
			: typeof body.description === "string"
				? body.description
				: "";
	const note = noteSource.trim();
	if (note.length > MAX_NOTE_LEN) {
		return {
			ok: false,
			error: `Notiz zu lang (max. ${MAX_NOTE_LEN} Zeichen)`,
		};
	}

	const addressText =
		typeof body.address_text === "string" ? body.address_text.trim() : "";
	if (!addressText) {
		return { ok: false, error: "Adresse erforderlich" };
	}
	if (addressText.length > MAX_ADDRESS_TEXT_LEN) {
		return {
			ok: false,
			error: `Adresse zu lang (max. ${MAX_ADDRESS_TEXT_LEN} Zeichen)`,
		};
	}

	const addressHint =
		typeof body.address_hint === "string" ? body.address_hint.trim() : "";
	if (addressHint.length > MAX_ADDRESS_HINT_LEN) {
		return {
			ok: false,
			error: `Ortshinweis zu lang (max. ${MAX_ADDRESS_HINT_LEN} Zeichen)`,
		};
	}

	return {
		ok: true,
		title: titleRaw || undefined,
		note,
		addressText,
		addressHint,
	};
}

type JsonResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string; status: 400 | 413 };

/**
 * Read and parse a JSON body with size and syntax guards.
 * Empty body → error (use only on endpoints that require a body).
 */
export async function readJsonBody<T>(
	c: Context,
): Promise<JsonResult<T>> {
	let text: string;
	try {
		text = await c.req.text();
	} catch {
		return { ok: false, error: "Request-Body konnte nicht gelesen werden", status: 400 };
	}

	if (!text || !text.trim()) {
		return { ok: false, error: "Leerer Request-Body", status: 400 };
	}
	if (text.length > MAX_JSON_BODY_BYTES) {
		return { ok: false, error: "Request zu groß", status: 413 };
	}

	try {
		return { ok: true, data: JSON.parse(text) as T };
	} catch {
		return { ok: false, error: "Ungültiges JSON", status: 400 };
	}
}

/** Safe string field from unknown JSON value. */
export function asOptionalString(v: unknown): string | undefined {
	return typeof v === "string" ? v : undefined;
}
