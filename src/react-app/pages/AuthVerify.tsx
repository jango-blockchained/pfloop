import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage, verifyMagicLink } from "../lib/api";
import { useAuth } from "../lib/auth-context";

type Phase = "loading" | "success" | "error";

function friendlyVerifyError(raw: string): string {
	const lower = raw.toLowerCase();
	if (
		lower.includes("expir") ||
		lower.includes("abgelaufen") ||
		lower.includes("gültig") ||
		lower.includes("invalid") ||
		lower.includes("ungültig") ||
		lower.includes("used") ||
		lower.includes("bereits")
	) {
		return "Der Link ist abgelaufen oder schon benutzt. Hol dir einfach einen neuen.";
	}
	if (lower.includes("token") || lower.includes("missing") || lower.includes("fehlt")) {
		return "Im Link fehlt etwas. Öffne den kompletten Link aus der Mail oder forder einen neuen an.";
	}
	return raw;
}

export function AuthVerify() {
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const { refresh } = useAuth();
	const [phase, setPhase] = useState<Phase>("loading");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const token = params.get("token");
		if (!token) {
			setPhase("error");
			setError(
				"Im Link fehlt der Code. Bitte den kompletten Link aus der E-Mail öffnen.",
			);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				await verifyMagicLink(token);
				await refresh();
				if (cancelled) return;
				setPhase("success");
				window.setTimeout(() => {
					if (!cancelled) navigate("/", { replace: true });
				}, 600);
			} catch (e) {
				if (cancelled) return;
				const raw = getErrorMessage(e, "Anmeldung hat nicht geklappt");
				setError(friendlyVerifyError(raw));
				setPhase("error");
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [params, navigate, refresh]);

	return (
		<div className="page auth-page auth-verify-page">
			<header className="page-header">
				<h1>
					{phase === "error"
						? "Anmeldung hat nicht geklappt"
						: phase === "success"
							? "Schön, du bist drin"
							: "Einen Moment…"}
				</h1>
			</header>

			{phase === "loading" && (
				<div className="auth-verify-status" role="status" aria-live="polite">
					<p className="muted">Wir prüfen deinen Login-Link…</p>
					<p className="muted small">Das dauert normalerweise nur kurz.</p>
				</div>
			)}

			{phase === "success" && (
				<div className="banner info auth-feedback">
					<strong>Alles klar – du bist angemeldet.</strong>
					<br />
					Gleich geht’s zur Karte…
				</div>
			)}

			{phase === "error" && error && (
				<div className="auth-verify-error">
					<p className="banner error auth-feedback">{error}</p>
					<div className="actions sticky-actions action-stack">
						<Link className="btn btn-primary" to="/login">
							Neuen Link holen
						</Link>
						<Link className="btn" to="/">
							Zur Karte
						</Link>
					</div>
					<p className="muted small auth-footnote">
						Tipp: Links gelten nur einmal und nicht lange. Spam-Ordner checken
						und denselben Link nicht mehrmals hintereinander öffnen.
					</p>
				</div>
			)}
		</div>
	);
}
