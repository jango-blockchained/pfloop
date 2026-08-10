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
		return "Dieser Login-Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.";
	}
	if (lower.includes("token") || lower.includes("missing")) {
		return "Im Link fehlt ein gültiges Token. Öffne den vollständigen Link aus der E-Mail oder fordere einen neuen an.";
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
				"Kein Token im Link. Bitte den vollständigen Magic-Link aus der E-Mail öffnen.",
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
				// Brief success state, then home
				window.setTimeout(() => {
					if (!cancelled) navigate("/", { replace: true });
				}, 600);
			} catch (e) {
				if (cancelled) return;
				const raw = getErrorMessage(e, "Login fehlgeschlagen");
				setError(friendlyVerifyError(raw));
				setPhase("error");
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [params, navigate, refresh]);

	return (
		<div className="page">
			<h1>
				{phase === "error"
					? "Anmeldung fehlgeschlagen"
					: phase === "success"
						? "Angemeldet"
						: "Anmeldung…"}
			</h1>

			{phase === "loading" && (
				<>
					<p className="muted">Bitte warten, der Magic-Link wird geprüft…</p>
					<p className="muted small">
						Das dauert in der Regel nur einen Moment.
					</p>
				</>
			)}

			{phase === "success" && (
				<div className="banner info">
					<strong>Erfolgreich angemeldet.</strong>
					<br />
					Du wirst zur Karte weitergeleitet…
				</div>
			)}

			{phase === "error" && error && (
				<>
					<p className="banner error">{error}</p>
					<div className="actions">
						<Link className="btn btn-primary" to="/login">
							Neuen Login-Link anfordern
						</Link>
						<Link className="btn" to="/">
							Zur Karte
						</Link>
					</div>
					<p className="muted small">
						Tipp: Links sind nur einmal und kurze Zeit gültig. Bei Problemen
						Spam-Ordner prüfen oder denselben Link nicht mehrfach öffnen.
					</p>
				</>
			)}
		</div>
	);
}
