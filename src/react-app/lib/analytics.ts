// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

/**
 * Optional analytics — only loads when the visitor granted analytics consent.
 * Set VITE_CF_WEB_ANALYTICS_TOKEN in env to enable Cloudflare Web Analytics.
 */

import {
	COOKIE_CONSENT_EVENT,
	hasCategoryConsent,
	readConsent,
	type CookieConsentState,
} from "./cookie-consent";

const BEACON_ID = "pfloop-cf-web-analytics";

function beaconToken(): string | undefined {
	const t = import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN as string | undefined;
	return t?.trim() || undefined;
}

function removeBeacon(): void {
	const el = document.getElementById(BEACON_ID);
	if (el) el.remove();
}

function injectBeacon(token: string): void {
	if (document.getElementById(BEACON_ID)) return;
	const s = document.createElement("script");
	s.id = BEACON_ID;
	s.defer = true;
	s.src = "https://static.cloudflareinsights.com/beacon.min.js";
	s.setAttribute("data-cf-beacon", JSON.stringify({ token }));
	document.head.appendChild(s);
}

function applyAnalyticsConsent(state: CookieConsentState | null): void {
	const token = beaconToken();
	if (!token) {
		removeBeacon();
		return;
	}
	if (hasCategoryConsent("analytics", state)) {
		injectBeacon(token);
	} else {
		removeBeacon();
	}
}

/** Call once from app shell; re-runs on consent changes. */
export function initAnalyticsConsentGate(): () => void {
	if (typeof window === "undefined") return () => {};

	applyAnalyticsConsent(readConsent());

	const onConsent = (e: Event) => {
		const detail = (e as CustomEvent<CookieConsentState>).detail;
		applyAnalyticsConsent(detail ?? readConsent());
	};
	window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
	return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
}
