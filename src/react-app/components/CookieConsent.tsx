// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n";
import {
	COOKIE_OPEN_PREFERENCES_EVENT,
	acceptAllConsent,
	defaultConsent,
	getCookieCategories,
	readConsent,
	rejectOptionalConsent,
	writeConsent,
	type CookieConsentState,
} from "../lib/cookie-consent";
import { initAnalyticsConsentGate } from "../lib/analytics";

type Draft = Pick<CookieConsentState, "preferences" | "analytics">;

function Toggle({
	id,
	checked,
	disabled,
	onChange,
	label,
}: {
	id: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (next: boolean) => void;
	label: string;
}) {
	return (
		<button
			type="button"
			id={id}
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			className={`cookie-toggle${checked ? " on" : ""}${disabled ? " disabled" : ""}`}
			onClick={() => {
				if (!disabled) onChange(!checked);
			}}
		>
			<span className="cookie-toggle-knob" aria-hidden />
		</button>
	);
}

/**
 * EU cookie / local-storage consent banner + preferences panel.
 * Shown until the visitor records a choice; re-open via footer or openCookiePreferences().
 */
export function CookieConsent() {
	const t = useT();
	const baseId = useId();
	const [hydrated, setHydrated] = useState(false);
	const [visible, setVisible] = useState(false);
	const [panelOpen, setPanelOpen] = useState(false);
	const [hasPriorChoice, setHasPriorChoice] = useState(false);
	const [draft, setDraft] = useState<Draft>({
		preferences: false,
		analytics: false,
	});

	// Locale-dependent category copy — recompute each render
	const categories = getCookieCategories();

	useEffect(() => {
		return initAnalyticsConsentGate();
	}, []);

	useEffect(() => {
		const existing = readConsent();
		if (existing) {
			setDraft({
				preferences: existing.preferences,
				analytics: existing.analytics,
			});
			setHasPriorChoice(true);
			setVisible(false);
			setHydrated(true);
			return;
		}

		setHasPriorChoice(false);
		setHydrated(true);

		let cancelled = false;
		let delayId: number | undefined;
		let fallbackId: number | undefined;
		let scheduled = false;

		const reveal = () => {
			if (cancelled) return;
			setVisible(true);
		};

		const scheduleReveal = () => {
			if (cancelled || scheduled) return;
			scheduled = true;
			if (fallbackId != null) {
				window.clearTimeout(fallbackId);
				fallbackId = undefined;
			}
			delayId = window.setTimeout(reveal, 900);
		};

		if (document.readyState === "complete") {
			scheduleReveal();
		} else {
			window.addEventListener("load", scheduleReveal, { once: true });
			fallbackId = window.setTimeout(scheduleReveal, 2200);
		}

		return () => {
			cancelled = true;
			window.removeEventListener("load", scheduleReveal);
			if (delayId != null) window.clearTimeout(delayId);
			if (fallbackId != null) window.clearTimeout(fallbackId);
		};
	}, []);

	useEffect(() => {
		const onOpen = () => {
			const existing = readConsent();
			if (existing) {
				setDraft({
					preferences: existing.preferences,
					analytics: existing.analytics,
				});
				setHasPriorChoice(true);
			}
			setPanelOpen(true);
			setVisible(true);
		};
		window.addEventListener(COOKIE_OPEN_PREFERENCES_EVENT, onOpen);
		return () =>
			window.removeEventListener(COOKIE_OPEN_PREFERENCES_EVENT, onOpen);
	}, []);

	const persist = useCallback((state: CookieConsentState) => {
		writeConsent(state);
		setDraft({
			preferences: state.preferences,
			analytics: state.analytics,
		});
		setHasPriorChoice(true);
		setPanelOpen(false);
		setVisible(false);
	}, []);

	const onDismiss = useCallback(() => {
		if (!hasPriorChoice) return;
		setPanelOpen(false);
		setVisible(false);
	}, [hasPriorChoice]);

	const onAcceptAll = useCallback(() => {
		persist(acceptAllConsent());
	}, [persist]);

	const onRejectOptional = useCallback(() => {
		persist(rejectOptionalConsent());
	}, [persist]);

	const onSavePreferences = useCallback(() => {
		persist(
			defaultConsent({
				preferences: draft.preferences,
				analytics: draft.analytics,
			}),
		);
	}, [draft, persist]);

	if (!hydrated || !visible) return null;

	return (
		<div
			className="cookie-banner"
			role="dialog"
			aria-modal="false"
			aria-labelledby={`${baseId}-title`}
			aria-describedby={`${baseId}-desc`}
		>
			<div className="cookie-banner-card">
				<div className="cookie-banner-head">
					<p id={`${baseId}-title`} className="cookie-banner-kicker">
						{t("cookies.banner.title")}
					</p>
					<Link to="/cookies" className="cookie-banner-policy-link">
						{t("cookies.banner.policyLink")}
					</Link>
				</div>

				<div className="cookie-banner-body">
					<p id={`${baseId}-desc`} className="cookie-banner-text">
						{t("cookies.banner.body")}{" "}
						<Link to="/datenschutz">{t("cookies.banner.linkPrivacy")}</Link>
						{" · "}
						<Link to="/cookies">{t("cookies.banner.linkCookies")}</Link>
					</p>

					{panelOpen && (
						<div className="cookie-categories">
							{categories.map((cat) => {
								const toggleId = `${baseId}-${cat.id}`;
								const checked =
									cat.id === "necessary"
										? true
										: cat.id === "preferences"
											? draft.preferences
											: draft.analytics;
								return (
									<div key={cat.id} className="cookie-category">
										<div className="cookie-category-main">
											<div className="cookie-category-title-row">
												<span className="cookie-category-label">
													{cat.label}
												</span>
												{cat.required && (
													<span className="cookie-category-badge">
														{t("cookies.badge.alwaysOn")}
													</span>
												)}
											</div>
											<p className="cookie-category-desc muted small">
												{cat.description}
											</p>
											<ul className="cookie-category-examples">
												{cat.examples.map((ex) => (
													<li key={ex}>{ex}</li>
												))}
											</ul>
										</div>
										<div className="cookie-category-toggle">
											<Toggle
												id={toggleId}
												label={t("cookies.toggleAria", { label: cat.label })}
												checked={checked}
												disabled={cat.required}
												onChange={(next) => {
													if (cat.id === "preferences") {
														setDraft((d) => ({ ...d, preferences: next }));
													} else if (cat.id === "analytics") {
														setDraft((d) => ({ ...d, analytics: next }));
													}
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}

					<div className="cookie-banner-actions">
						{hasPriorChoice && (
							<button
								type="button"
								className="btn btn-sm cookie-btn-ghost"
								onClick={onDismiss}
							>
								{t("cookies.close")}
							</button>
						)}
						<button
							type="button"
							className="btn btn-sm"
							onClick={() => setPanelOpen((o) => !o)}
						>
							{panelOpen ? t("cookies.hideDetails") : t("cookies.settings")}
						</button>
						{panelOpen && (
							<button
								type="button"
								className="btn btn-sm"
								onClick={onSavePreferences}
							>
								{t("cookies.save")}
							</button>
						)}
						<button
							type="button"
							className="btn btn-sm"
							onClick={onRejectOptional}
						>
							{t("cookies.rejectOptional")}
						</button>
						<button
							type="button"
							className="btn btn-sm btn-primary"
							onClick={onAcceptAll}
						>
							{t("cookies.acceptAll")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
