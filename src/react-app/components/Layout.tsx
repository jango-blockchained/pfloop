import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { openCookiePreferences } from "../lib/cookie-consent";
import { CookieConsent } from "./CookieConsent";
import { InstallPrompt } from "./InstallPrompt";
import { OfflineBanner } from "./OfflineBanner";

export function Layout() {
	const { user, loading } = useAuth();

	const accountLabel = user?.display_name || "Konto";

	return (
		<div className="app-shell">
			<a href="#main-content" className="skip-link">
				Zum Inhalt springen
			</a>
			<OfflineBanner />
			<header className="topbar">
				<Link to="/" className="brand" aria-label="Pfloop Startseite">
					<img
						className="brand-mark"
						src="/logo-mark.svg"
						width={32}
						height={32}
						alt=""
						decoding="async"
					/>
					<span className="brand-text">
						<span className="brand-name">Pfloop</span>
					</span>
				</Link>
				<nav className="nav" aria-label="Hauptnavigation">
					<NavLink to="/" end className="nav-link">
						Karte
					</NavLink>
					<NavLink to="/neu" className="nav-link">
						Angebot
					</NavLink>
					<NavLink to="/route" className="nav-link">
						Route
					</NavLink>
					{!loading && user ? (
						<NavLink
							to="/profil"
							className="nav-link nav-link-user user-chip"
							title={user.email}
							aria-label={`Konto: ${user.display_name || user.email}`}
						>
							<span className="user-chip-label">{accountLabel}</span>
						</NavLink>
					) : (
						<NavLink to="/login" className="nav-link">
							Login
						</NavLink>
					)}
				</nav>
			</header>
			<main id="main-content" className="main" tabIndex={-1}>
				<Outlet />
			</main>
			<footer className="site-footer">
				<div className="site-footer-inner">
					<nav className="site-footer-nav" aria-label="Rechtliches">
						<NavLink to="/impressum">Impressum</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<NavLink to="/datenschutz">Datenschutz</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<NavLink to="/cookies">Cookies</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<NavLink to="/agb">AGB</NavLink>
						<span className="site-footer-sep" aria-hidden>
							·
						</span>
						<button
							type="button"
							className="site-footer-cookie-btn"
							onClick={() => openCookiePreferences()}
						>
							Cookie-Einstellungen
						</button>
					</nav>
					<p className="site-footer-meta">
						© {new Date().getFullYear()} Pfloop · kostenloser Pfand-Dienst
					</p>
				</div>
			</footer>
			<CookieConsent />
			<InstallPrompt />
		</div>
	);
}
