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

	if (res.status === 401) return "Bitte anmelden.";
	if (res.status === 403) return "Keine Berechtigung.";
	if (res.status === 404) return "Nicht gefunden.";
	if (res.status === 409) return "Konflikt — bitte Seite aktualisieren.";
	if (res.status === 422) return "Angaben ungültig.";
	if (res.status === 429) return "Zu viele Anfragen — bitte kurz warten.";
	if (res.status >= 500) return "Serverfehler — bitte später erneut versuchen.";
	return `Anfrage fehlgeschlagen (HTTP ${res.status})`;
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

export async function requestMagicLink(email: string, display_name?: string) {
	return json<{
		ok: boolean;
		message: string;
		magic_link?: string;
		dev?: boolean;
	}>(
		await apiFetch("/api/auth/magic-link", {
			method: "POST",
			body: JSON.stringify({ email, display_name }),
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
