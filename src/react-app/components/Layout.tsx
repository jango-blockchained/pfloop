import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { InstallPrompt } from "./InstallPrompt";
import { OfflineBanner } from "./OfflineBanner";

export function Layout() {
	const { user, loading } = useAuth();

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
					<span className="brand-name">GrabMe</span>
				</Link>
				<nav className="nav" aria-label="Hauptnavigation">
					<NavLink to="/" end>
						Karte
					</NavLink>
					<NavLink to="/neu">Angebot</NavLink>
					{!loading && user ? (
						<NavLink
							to="/login"
							title={user.email}
							aria-label={`Konto: ${user.display_name || user.email}`}
						>
							{user.display_name || "Konto"}
						</NavLink>
					) : (
						<NavLink to="/login">Login</NavLink>
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
