// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Link, NavLink, Outlet } from "react-router-dom";
import { useT } from "../i18n";
import { useAuth } from "../lib/auth-context";
import { openCookiePreferences } from "../lib/cookie-consent";
import { CookieConsent } from "./CookieConsent";
import { InstallPrompt } from "./InstallPrompt";
import { LanguagePicker } from "./LanguagePicker";
import { OfflineBanner } from "./OfflineBanner";

export function Layout() {
	const { user, loading } = useAuth();
	const t = useT();

	const accountLabel = user?.display_name || t("nav.account");

	return (
		<div className="app-shell">
			<a href="#main-content" className="skip-link">
				{t("a11y.skipToContent")}
			</a>
			<OfflineBanner />
			<header className="topbar">
				<Link to="/" className="brand" aria-label={t("nav.homeAria")}>
					<img
						className="brand-mark"
						src="/logo-mark.svg"
						width={32}
						height={32}
						alt=""
						decoding="async"
					/>
					<span className="brand-text">
						<span className="brand-name">{t("brand.name")}</span>
					</span>
				</Link>
				<div className="topbar-end">
					<LanguagePicker />
					<nav className="nav" aria-label={t("nav.mainAria")}>
						<NavLink to="/" end className="nav-link">
							{t("nav.map")}
						</NavLink>
						<NavLink to="/neu" className="nav-link">
							{t("nav.offer")}
						</NavLink>
						<NavLink to="/route" className="nav-link">
							{t("nav.route")}
						</NavLink>
						{!loading && user ? (
							<NavLink
								to="/profil"
								className="nav-link nav-link-user user-chip"
								title={user.email}
								aria-label={t("nav.accountAria", {
									name: user.display_name || user.email,
								})}
							>
								<span className="user-chip-label">{accountLabel}</span>
							</NavLink>
						) : (
							<NavLink to="/login" className="nav-link">
								{t("nav.login")}
							</NavLink>
						)}
					</nav>
				</div>
			</header>
			<main id="main-content" className="main" tabIndex={-1}>
				<Outlet />
			</main>
			<footer className="site-footer">
				<div className="site-footer-inner">
					<nav className="site-footer-nav" aria-label={t("footer.legalNavAria")}>
						<NavLink to="/impressum">{t("footer.imprint")}</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<NavLink to="/datenschutz">{t("footer.privacy")}</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<NavLink to="/cookies">{t("footer.cookies")}</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<NavLink to="/agb">{t("footer.terms")}</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<button
							type="button"
							className="site-footer-cookie-btn"
							onClick={() => openCookiePreferences()}
						>
							{t("footer.cookieSettings")}
						</button>
					</nav>
					<p className="site-footer-meta">
						{t("footer.meta", { year: new Date().getFullYear() })}
					</p>
				</div>
			</footer>
			<CookieConsent />
			<InstallPrompt />
		</div>
	);
}
