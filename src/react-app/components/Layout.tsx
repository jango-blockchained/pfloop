import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
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
				<Link to="/" className="brand" aria-label="GrabMe Startseite">
					<span className="brand-mark" aria-hidden="true">
						G
					</span>
					<span className="brand-text">
						<span className="brand-name">GrabMe</span>
					</span>
				</Link>
				<nav className="nav" aria-label="Hauptnavigation">
					<NavLink to="/" end className="nav-link">
						Karte
					</NavLink>
					<NavLink to="/neu" className="nav-link">
						Angebot
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
			<InstallPrompt />
		</div>
	);
}
