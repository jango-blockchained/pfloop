// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import type { Locale } from "./types";

export const LOCALE_STORAGE_KEY = "pfloop-locale";

export function detectBrowserLocale(): Locale {
	if (typeof navigator === "undefined") return "de";
	const list =
		navigator.languages?.length ? navigator.languages : [navigator.language];
	for (const raw of list) {
		const code = (raw || "").toLowerCase();
		if (code.startsWith("en")) return "en";
		if (code.startsWith("de")) return "de";
	}
	return "de";
}

export function readStoredLocale(): Locale | null {
	try {
		const v = localStorage.getItem(LOCALE_STORAGE_KEY);
		if (v === "de" || v === "en") return v;
	} catch {
		/* private mode */
	}
	return null;
}

export function writeStoredLocale(locale: Locale): void {
	try {
		localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	} catch {
		/* ignore */
	}
}

export function resolveInitialLocale(): Locale {
	if (typeof window !== "undefined") {
		try {
			const q = new URLSearchParams(window.location.search).get("lang");
			if (q === "de" || q === "en") {
				writeStoredLocale(q);
				return q;
			}
		} catch {
			/* ignore */
		}
	}
	return readStoredLocale() ?? detectBrowserLocale();
}
