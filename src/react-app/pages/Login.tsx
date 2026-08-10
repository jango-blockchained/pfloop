import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, requestMagicLink } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { isValidEmail } from "../lib/format";

export function Login() {
	const { user, logout, loading } = useAuth();
	const [email, setEmail] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [devLink, setDevLink] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [sending, setSending] = useState(false);
	const [emailTouched, setEmailTouched] = useState(false);

	const emailTrimmed = email.trim();
	const emailOk = isValidEmail(emailTrimmed);
	const emailHint =
		emailTouched && emailTrimmed.length > 0 && !emailOk
			? "Bitte eine gültige E-Mail-Adresse eingeben."
			: null;

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setEmailTouched(true);
		setError(null);
		setMessage(null);
		setDevLink(null);

		if (!emailOk) {
			setError("Bitte eine gültige E-Mail-Adresse eingeben.");
			return;
		}
		if (sending) return;

		setSending(true);
		try {
			const res = await requestMagicLink(
				emailTrimmed,
				displayName.trim() || undefined,
			);
			setMessage(
				res.message ||
					"Wenn die Adresse gültig ist, senden wir dir einen Login-Link.",
			);
			if (res.magic_link) setDevLink(res.magic_link);
		} catch (err) {
			setError(getErrorMessage(err, "Senden fehlgeschlagen"));
		} finally {
			setSending(false);
		}
	}

	if (loading) {
		return (
			<div className="page">
				<p className="muted">Lade Sitzung…</p>
			</div>
		);
	}

	if (user) {
		return (
			<div className="page">
				<h1>Angemeldet</h1>
				<div className="banner info">
					<span>
						{user.display_name || user.email}
						<br />
						<small>{user.email}</small>
					</span>
					<button
						type="button"
						className="btn btn-sm"
						onClick={() => void logout()}
					>
						Abmelden
					</button>
				</div>
				<p>
					<Link to="/">Zur Karte</Link> ·{" "}
					<Link to="/neu">Angebot erstellen</Link>
				</p>
			</div>
		);
	}

	return (
		<div className="page">
			<h1>Anmelden</h1>
			<p className="muted">
				Passwortlos per Magic-Link. Wir senden dir einen einmaligen Link an
				deine E-Mail (ca. 15 Minuten gültig). Kein Passwort nötig.
			</p>

			<form className="form" onSubmit={onSubmit} noValidate>
				<label>
					E-Mail
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						onBlur={() => setEmailTouched(true)}
						required
						placeholder="du@example.de"
						autoComplete="email"
						inputMode="email"
						aria-invalid={Boolean(emailHint)}
					/>
					{emailHint && <span className="field-error">{emailHint}</span>}
				</label>
				<label>
					Anzeigename (optional, beim ersten Login)
					<input
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						placeholder="Alex"
						autoComplete="nickname"
						maxLength={80}
					/>
				</label>
				<button
					className="btn btn-primary"
					type="submit"
					disabled={sending || (emailTouched && !emailOk)}
				>
					{sending ? "Sende Login-Link…" : "Login-Link senden"}
				</button>
			</form>

			{message && (
				<div className="banner info">
					<strong>Prüfe dein Postfach.</strong>
					<br />
					{message}
					<br />
					<small className="muted">
						Nicht gefunden? Spam-Ordner prüfen oder Link erneut anfordern.
						Der Link ist nur einmal und kurz gültig.
					</small>
				</div>
			)}
			{error && <p className="banner error">{error}</p>}
			{devLink && (
				<div className="banner info dev-link">
					<strong>Entwickler-Modus</strong>
					<p className="muted small" style={{ margin: "0.35rem 0" }}>
						Keine E-Mail konfiguriert — öffne den Link direkt:
					</p>
					<p style={{ wordBreak: "break-all", margin: 0 }}>
						<a href={devLink}>{devLink}</a>
					</p>
					<p style={{ marginTop: "0.5rem" }}>
						<a className="btn btn-sm btn-primary" href={devLink}>
							Jetzt anmelden
						</a>
					</p>
				</div>
			)}

			<p className="muted small" style={{ marginTop: "1.25rem" }}>
				Mit der Anmeldung kannst du Angebote erstellen, annehmen und die
				Zwei-Schritt-Übergabe abschließen.
			</p>
		</div>
	);
}
