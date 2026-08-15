// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

export type { Locale, MessageParams, Messages } from "./types";
export { LocaleProvider, useLocale, useT } from "./LocaleContext";
export { t, getLocale, setActiveLocale } from "./translate";
export { resolveInitialLocale, LOCALE_STORAGE_KEY } from "./storage";
