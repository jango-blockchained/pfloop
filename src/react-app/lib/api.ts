// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { t } from "../i18n/translate";

export type OfferItem = {
	item_type: string;
	quantity: number;
	unit_cents: number;
	line_cents: number;
};

export type PublicOffer = {
	id: string;
	title: string;
	description: string;
	pfand_value_cents: number;
	status: string;
	lat: number;
	lng: number;
	address_hint: string;
	created_at: string;
	items?: OfferItem[];
};

export type OwnOffer = PublicOffer & {
	address_text: string;
	updated_at: string;
};

/** ISO weekday 1=Mon … 7=Sun */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PublicRecurringOffer = {
	id: string;
	kind: "recurring";
	title: string;
	description: string;
	/** Estimated weekly pfand (poster’s quantity guess). */
	pfand_value_cents: number;
	/** Estimate × threshold (−50 %), when provided by API. */
	pfand_floor_cents?: number;
	value_threshold?: number;
	status: string;
	lat: number;
	lng: number;
	address_hint: string;
	weekday: number;
	time_hint: string;
	created_at: string;
	items?: OfferItem[];
};

export type OwnRecurringOffer = PublicRecurringOffer & {
	address_text: string;
	updated_at: string;
	assigned_collector_id: string | null;
	assigned_at: string | null;
	pending_applications: number;
	assigned_display_name: string | null;
};

export type RecurringApplication = {
	id: string;
	applicant_id: string;
	display_name: string;
	email: string;
	message: string;
	status: string;
	created_at: string;
};

export type RecurringDetail = PublicRecurringOffer & {
	updated_at?: string;
	is_own: boolean;
	is_assigned_collector?: boolean;
	assigned_collector_id?: string | null;
	address_text: string | null;
	items: OfferItem[];
	my_application: {
		id: string;
		status: string;
		message: string;
		created_at: string;
	} | null;
	applications?: RecurringApplication[];
};

export type MyRecurringApplication = {
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
	is_assigned: boolean;
	address_text: string | null;
};

export type OfferDetail = PublicOffer & {
	updated_at?: string;
	is_own: boolean;
	is_active_collector?: boolean;
	deadline_at?: string | null;
	address_text: string | null;
	items: OfferItem[];
};

export type ReservationRow = {
	reservation_id: string;
	reservation_status: string;
	accepted_at: string;
	deadline_at: string;
	completed_at: string | null;
	collected_at?: string | null;
	offer_id: string;
	title: string;
	description: string;
	pfand_value_cents: number;
	lat: number;
	lng: number;
	address_hint: string;
	address_text: string;
	offer_status: string;
};

/** Progressive daily accept quota for collectors. */
export type CollectorQuota = {
	daily_limit: number;
	day: string;
	accepted_today: number;
	confirmed_today: number;
	remaining_today: number;
	max_unfinished: number;
	unfinished: number;
	max_unfinished_effective?: number;
	max_unfinished_ceiling?: number;
	limit_min: number;
	limit_max: number;
	confirm_hours: number;
};

export type AuthUser = {
	id: string;
	email: string;
	display_name: string;
};

const jsonHeaders = { "Content-Type": "application/json" };

type ApiErrorBody = {
	error?: string;
	message?: string;
	detail?: string;
	details?: string | string[];
};

/** Prefer backend `error` / `message`; fall back to status text. */
async function errorFromResponse(res: Response): Promise<string> {
	const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
	const details = Array.isArray(body.details)
		? body.details.filter(Boolean).join("; ")
		: typeof body.details === "string"
			? body.details
			: "";
	const msg =
		body.error?.trim() ||
		body.message?.trim() ||
		body.detail?.trim() ||
		details ||
		"";
	if (msg) return msg;

	if (res.status === 401) return "Bitte melde dich an.";
	if (res.status === 403) return t("api.forbidden");
	if (res.status === 404) return "Nicht gefunden.";
	if (res.status === 409) return "Hat sich gerade geändert – bitte Seite neu laden.";
	if (res.status === 422) return "Die Angaben passen so nicht.";
	if (res.status === 429) return "Zu viele Anfragen – warte kurz und versuch’s nochmal.";
	if (res.status >= 500) return "Server-Problem – versuch’s gleich nochmal.";
	return `Das hat nicht geklappt (Fehler ${res.status})`;
}

async function json<T>(res: Response): Promise<T> {
	if (!res.ok) {
		throw new Error(await errorFromResponse(res));
	}
	return res.json() as Promise<T>;
}

/** Normalize unknown thrown values into a German-friendly message. */
export function getErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof Error && err.message.trim()) return err.message;
	if (typeof err === "string" && err.trim()) return err;
	return fallback;
}

function apiFetch(input: string, init?: RequestInit): Promise<Response> {
	const hasBody = init?.body != null;
	return fetch(input, {
		...init,
		credentials: "include",
		headers: {
			...(hasBody ? jsonHeaders : {}),
			...(init?.headers ?? {}),
		},
	});
}

export function centsToEuro(cents: number): string {
	return (cents / 100).toFixed(2).replace(".", ",");
}

export async function fetchHealth() {
	return json<{
		ok: boolean;
		rules: Record<string, unknown>;
	}>(await fetch("/api/health"));
}

export async function fetchMe() {
	return json<{ user: AuthUser | null }>(await apiFetch("/api/auth/me"));
}

export async function requestMagicLink(
	email: string,
	display_name?: string,
	locale?: string,
) {
	return json<{
		ok: boolean;
		message: string;
		magic_link?: string;
		dev?: boolean;
	}>(
		await apiFetch("/api/auth/magic-link", {
			method: "POST",
			body: JSON.stringify({
				email,
				display_name,
				...(locale ? { locale } : {}),
			}),
		}),
	);
}

export async function verifyMagicLink(token: string) {
	return json<{ ok: boolean; user: AuthUser }>(
		await apiFetch("/api/auth/verify", {
			method: "POST",
			body: JSON.stringify({ token }),
		}),
	);
}

export async function logout() {
	return json<{ ok: boolean }>(
		await apiFetch("/api/auth/logout", { method: "POST" }),
	);
}

export async function fetchOffersInBbox(bbox: {
	south: number;
	west: number;
	north: number;
	east: number;
}) {
	const q = new URLSearchParams({
		south: String(bbox.south),
		west: String(bbox.west),
		north: String(bbox.north),
		east: String(bbox.east),
	});
	return json<{ offers: PublicOffer[] }>(
		await apiFetch(`/api/offers?${q}`, { method: "GET" }),
	);
}

export async function fetchMyOffers() {
	return json<{ offers: OwnOffer[] }>(await apiFetch("/api/offers/mine"));
}

export async function fetchOffer(id: string) {
	return json<{ offer: OfferDetail }>(await apiFetch(`/api/offers/${id}`));
}

export async function fetchMyReservations() {
	return json<{ reservations: ReservationRow[] }>(
		await apiFetch("/api/reservations/mine"),
	);
}

export async function fetchCollectorQuota() {
	return json<CollectorQuota>(await apiFetch("/api/reservations/quota"));
}

export async function createOffer(body: {
	items: Array<{ type: string; quantity: number }>;
	note?: string;
	title?: string;
	lat: number;
	lng: number;
	address_hint: string;
	address_text: string;
}) {
	return json<{
		id: string;
		pfand_value_cents: number;
		items: Array<{
			type: string;
			quantity: number;
			unit_cents: number;
			line_cents: number;
			label: string;
		}>;
	}>(
		await apiFetch("/api/offers", {
			method: "POST",
			body: JSON.stringify(body),
		}),
	);
}

export async function acceptOffer(id: string) {
	return json<{
		reservation_id: string;
		deadline_at: string;
		address_text: string;
	}>(await apiFetch(`/api/offers/${id}/accept`, { method: "POST" }));
}

/** Collector: mark Pfand as picked up (step 1). */
export async function collectOffer(id: string) {
	return json<{ ok: boolean; status: string; message?: string }>(
		await apiFetch(`/api/offers/${id}/collect`, { method: "POST" }),
	);
}

/** Poster: confirm collector’s pickup (step 2 → fully finished). */
export async function confirmOffer(id: string) {
	return json<{ ok: boolean; status: string }>(
		await apiFetch(`/api/offers/${id}/confirm`, { method: "POST" }),
	);
}

export async function cancelOffer(id: string) {
	return json<{ ok: boolean }>(
		await apiFetch(`/api/offers/${id}/cancel`, { method: "POST" }),
	);
}

// ── Recurring weekly offers ─────────────────────────────────────────

export async function fetchRecurringInBbox(bbox: {
	south: number;
	west: number;
	north: number;
	east: number;
}) {
	const q = new URLSearchParams({
		south: String(bbox.south),
		west: String(bbox.west),
		north: String(bbox.north),
		east: String(bbox.east),
	});
	return json<{
		offers: PublicRecurringOffer[];
		min_pfand_cents: number;
		max_per_user: number;
	}>(await apiFetch(`/api/recurring?${q}`, { method: "GET" }));
}

export async function fetchMyRecurringOffers() {
	return json<{
		offers: OwnRecurringOffer[];
		max_per_user: number;
	}>(await apiFetch("/api/recurring/mine"));
}

export async function fetchMyRecurringApplications() {
	return json<{ applications: MyRecurringApplication[] }>(
		await apiFetch("/api/recurring/applications/mine"),
	);
}

export async function fetchRecurringOffer(id: string) {
	return json<{ offer: RecurringDetail }>(
		await apiFetch(`/api/recurring/${id}`),
	);
}

export async function createRecurringOffer(body: {
	items: Array<{ type: string; quantity: number }>;
	note?: string;
	title?: string;
	lat: number;
	lng: number;
	address_hint: string;
	address_text: string;
	weekday: Weekday;
	time_hint?: string;
}) {
	return json<{
		id: string;
		pfand_value_cents: number;
		weekday: number;
		items: Array<{
			type: string;
			quantity: number;
			unit_cents: number;
			line_cents: number;
			label: string;
		}>;
	}>(
		await apiFetch("/api/recurring", {
			method: "POST",
			body: JSON.stringify(body),
		}),
	);
}

export async function applyToRecurring(id: string, message?: string) {
	return json<{ ok: boolean; application_id: string; status: string }>(
		await apiFetch(`/api/recurring/${id}/apply`, {
			method: "POST",
			body: JSON.stringify({ message: message ?? "" }),
		}),
	);
}

export async function selectRecurringApplicant(
	id: string,
	opts: { applicant_id?: string; application_id?: string },
) {
	return json<{
		ok: boolean;
		status: string;
		assigned_collector_id: string;
	}>(
		await apiFetch(`/api/recurring/${id}/select`, {
			method: "POST",
			body: JSON.stringify(opts),
		}),
	);
}

export async function unassignRecurringCollector(id: string) {
	return json<{ ok: boolean; status: string }>(
		await apiFetch(`/api/recurring/${id}/unassign`, { method: "POST" }),
	);
}

export async function withdrawRecurringApplication(id: string) {
	return json<{ ok: boolean }>(
		await apiFetch(`/api/recurring/${id}/withdraw`, { method: "POST" }),
	);
}

export async function cancelRecurringOffer(id: string) {
	return json<{ ok: boolean }>(
		await apiFetch(`/api/recurring/${id}/cancel`, { method: "POST" }),
	);
}

// ── Saved addresses (profile) ───────────────────────────────────────

export type SavedAddress = {
	id: string;
	label: string;
	address_text: string;
	address_hint: string;
	lat: number;
	lng: number;
	is_default: boolean;
	created_at: string;
	updated_at: string;
};

export type AddressInput = {
	label?: string;
	address_text: string;
	address_hint?: string;
	lat: number;
	lng: number;
	is_default?: boolean;
};

export async function fetchMyAddresses() {
	return json<{ addresses: SavedAddress[]; max: number }>(
		await apiFetch("/api/addresses"),
	);
}

export async function createAddress(body: AddressInput) {
	return json<{ address: SavedAddress }>(
		await apiFetch("/api/addresses", {
			method: "POST",
			body: JSON.stringify(body),
		}),
	);
}

export async function updateAddress(id: string, body: Partial<AddressInput>) {
	return json<{ address: SavedAddress }>(
		await apiFetch(`/api/addresses/${id}`, {
			method: "PATCH",
			body: JSON.stringify(body),
		}),
	);
}

export async function setDefaultAddress(id: string) {
	return json<{ ok: boolean }>(
		await apiFetch(`/api/addresses/${id}/default`, { method: "POST" }),
	);
}

export async function deleteAddress(id: string) {
	return json<{ ok: boolean }>(
		await apiFetch(`/api/addresses/${id}`, { method: "DELETE" }),
	);
}
