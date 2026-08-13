/**
 * EU ePrivacy / GDPR / TTDSG cookie & local-storage consent for Pfloop.
 *
 * Categories:
 * - necessary   — always on (session, consent record, security)
 * - preferences — optional UI (e.g. install banner dismiss)
 * - analytics   — optional usage metrics (e.g. Cloudflare Web Analytics)
 *
 * Marketing trackers are not used.
 */

export const COOKIE_CONSENT_KEY = "pfloop-cookie-consent";
export const COOKIE_CONSENT_VERSION = 1 as const;
export const COOKIE_CONSENT_EVENT = "pfloop:cookie-consent";
export const COOKIE_OPEN_PREFERENCES_EVENT = "pfloop:cookie-open-preferences";

/** Preference key: PWA install banner dismissed (only with preferences consent). */
export const PREF_INSTALL_DISMISS_KEY = "pfloop_install_dismissed";

export type CookieCategoryId = "necessary" | "preferences" | "analytics";

export type CookieConsentState = {
	version: typeof COOKIE_CONSENT_VERSION;
	/** ISO-8601 timestamp of last choice */
	updatedAt: string;
	necessary: true;
	preferences: boolean;
	analytics: boolean;
};

export type CookieCategoryMeta = {
	id: CookieCategoryId;
	label: string;
	description: string;
	required: boolean;
	examples: string[];
};

export const COOKIE_CATEGORIES: readonly CookieCategoryMeta[] = [
	{
		id: "necessary",
		label: "Notwendig",
		description:
			"Erforderlich für den sicheren Betrieb: Login-Sitzung, Speichern deiner Cookie-Wahl, Grundfunktionen der App.",
		required: true,
		examples: [
			"Sitzungs-Cookie (Login, httpOnly)",
			"Cookie-Einwilligung (localStorage)",
			"Service-Worker / Offline-Cache der PWA",
		],
	},
	{
		id: "preferences",
		label: "Präferenzen",
		description:
			"Speichert optionale Einstellungen auf deinem Gerät, z. B. ob der Installations-Hinweis ausgeblendet wurde.",
		required: false,
		examples: ["Installations-Hinweis ausblenden"],
	},
	{
		id: "analytics",
		label: "Statistik",
		description:
			"Hilft uns, aggregierte Nutzung zu verstehen (datenschutzfreundliche Messung, z. B. Cloudflare Web Analytics). Keine Werbung, kein Verkauf von Profilen.",
		required: false,
		examples: ["Cloudflare Web Analytics (falls aktiv)"],
	},
] as const;

export function defaultConsent(
	partial?: Partial<Pick<CookieConsentState, "preferences" | "analytics">>,
): CookieConsentState {
	return {
		version: COOKIE_CONSENT_VERSION,
		updatedAt: new Date().toISOString(),
		necessary: true,
		preferences: partial?.preferences ?? false,
		analytics: partial?.analytics ?? false,
	};
}

export function acceptAllConsent(): CookieConsentState {
	return defaultConsent({ preferences: true, analytics: true });
}

export function rejectOptionalConsent(): CookieConsentState {
	return defaultConsent({ preferences: false, analytics: false });
}

export function isValidConsent(value: unknown): value is CookieConsentState {
	if (!value || typeof value !== "object") return false;
	const v = value as Record<string, unknown>;
	return (
		v.version === COOKIE_CONSENT_VERSION &&
		typeof v.updatedAt === "string" &&
		v.necessary === true &&
		typeof v.preferences === "boolean" &&
		typeof v.analytics === "boolean"
	);
}

export function readConsent(): CookieConsentState | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isValidConsent(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function writeConsent(state: CookieConsentState): void {
	if (typeof window === "undefined") return;
	const next: CookieConsentState = {
		...state,
		version: COOKIE_CONSENT_VERSION,
		necessary: true,
		updatedAt: new Date().toISOString(),
	};
	try {
		window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
	} catch {
		// Private mode / quota — still broadcast so UI can settle this session
	}
	// Drop preference keys if preferences revoked
	if (!next.preferences) {
		try {
			window.localStorage.removeItem(PREF_INSTALL_DISMISS_KEY);
		} catch {
			/* ignore */
		}
	}
	window.dispatchEvent(
		new CustomEvent<CookieConsentState>(COOKIE_CONSENT_EVENT, { detail: next }),
	);
}

export function hasCategoryConsent(
	category: Exclude<CookieCategoryId, "necessary">,
	state?: CookieConsentState | null,
): boolean {
	const s = state === undefined ? readConsent() : state;
	if (!s) return false;
	return Boolean(s[category]);
}

/** Open the preferences UI from footer / legal links. */
export function openCookiePreferences(): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(COOKIE_OPEN_PREFERENCES_EVENT));
}

/**
 * Persist optional preference keys only when Preferences is allowed.
 */
export function persistPreference(key: string, value: string): void {
	if (typeof window === "undefined") return;
	if (!hasCategoryConsent("preferences")) return;
	try {
		window.localStorage.setItem(key, value);
	} catch {
		/* private mode / quota */
	}
}

export function readPreference(key: string): string | null {
	if (typeof window === "undefined") return null;
	if (!hasCategoryConsent("preferences")) return null;
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}
