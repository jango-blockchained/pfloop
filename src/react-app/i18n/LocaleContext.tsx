// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	resolveInitialLocale,
	writeStoredLocale,
} from "./storage";
import { setActiveLocale, t as translate } from "./translate";
import type { Locale, MessageParams } from "./types";

type TFunction = (key: string, params?: MessageParams) => string;

type LocaleContextValue = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: TFunction;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(() => {
		const initial = resolveInitialLocale();
		setActiveLocale(initial);
		return initial;
	});

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
		setActiveLocale(next);
		writeStoredLocale(next);
	}, []);

	useEffect(() => {
		setActiveLocale(locale);
		if (typeof document !== "undefined") {
			document.documentElement.lang = locale;
		}
	}, [locale]);

	const t = useCallback<TFunction>(
		(key, params) => translate(key, params, locale),
		[locale],
	);

	const value = useMemo(
		() => ({ locale, setLocale, t }),
		[locale, setLocale, t],
	);

	return (
		<LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
	);
}

export function useLocale(): LocaleContextValue {
	const ctx = useContext(LocaleContext);
	if (!ctx) {
		throw new Error("useLocale must be used within LocaleProvider");
	}
	return ctx;
}

export function useT(): TFunction {
	return useLocale().t;
}
