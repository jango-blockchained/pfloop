// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import type { Locale, MessageParams, Messages } from "./types";
import { de } from "./messages/de";
import { en } from "./messages/en";

const catalogs: Record<Locale, Messages> = { de, en };

let currentLocale: Locale = "de";

export function getLocale(): Locale {
	return currentLocale;
}

export function setActiveLocale(locale: Locale): void {
	currentLocale = locale;
}

function interpolate(template: string, params?: MessageParams): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const v = params[key];
		return v == null ? `{${key}}` : String(v);
	});
}

/** Translate a key; falls back to German, then the key itself. */
export function t(
	key: string,
	params?: MessageParams,
	locale: Locale = currentLocale,
): string {
	const primary = catalogs[locale]?.[key];
	if (primary != null) return interpolate(primary, params);
	const fallback = catalogs.de[key];
	if (fallback != null) return interpolate(fallback, params);
	return key;
}

export function hasMessage(key: string, locale: Locale = currentLocale): boolean {
	return catalogs[locale]?.[key] != null || catalogs.de[key] != null;
}
