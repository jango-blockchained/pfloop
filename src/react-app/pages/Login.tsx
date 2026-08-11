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
			? "Das sieht noch nicht nach einer gültigen E-Mail aus."
			: null;

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setEmailTouched(true);
		setError(null);
		setMessage(null);
		setDevLink(null);

		if (!emailOk) {
			setError("Bitte gib eine gültige E-Mail ein.");
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
					"Wenn die Adresse stimmt, schicken wir dir einen Login-Link.",
			);
			if (res.magic_link) setDevLink(res.magic_link);
		} catch (err) {
			setError(getErrorMessage(err, "Senden hat nicht geklappt"));
		} finally {
			setSending(false);
		}
	}

	if (loading) {
		return (
			<div className="page auth-page">
				<p className="muted" role="status">
					Einen Moment…
				</p>
			</div>
		);
	}

	if (user) {
		return (
			<div className="page auth-page">
				<header className="page-header">
					<h1>Du bist angemeldet</h1>
				</header>
				<div className="banner info profile-user-card">
					<span className="profile-user-info">
						<strong className="profile-user-name">
							{user.display_name || user.email}
						</strong>
						<br />
						<small className="muted">{user.email}</small>
					</span>
					<button
						type="button"
						className="btn btn-sm"
						onClick={() => void logout()}
					>
						Abmelden
					</button>
				</div>
				<nav className="auth-footer-links">
					<Link to="/profil">Konto & Adressen</Link>
					<span aria-hidden> · </span>
					<Link to="/neu">Angebot erstellen</Link>
					<span aria-hidden> · </span>
					<Link to="/">Zur Karte</Link>
				</nav>
			</div>
		);
	}

	return (
		<div className="page auth-page">
			<header className="page-header">
				<h1>Anmelden</h1>
				<p className="page-lede muted">
					Ganz ohne Passwort: Wir schicken dir einen Link per E-Mail. Der gilt
					einmal und etwa 15 Minuten.
				</p>
			</header>

			<form className="form auth-form" onSubmit={onSubmit} noValidate>
				<section className="form-section">
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
						Anzeigename (optional, beim ersten Mal)
						<input
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder="Alex"
							autoComplete="nickname"
							maxLength={80}
						/>
					</label>
				</section>
				<div className="form-submit sticky-actions">
					<button
						className="btn btn-primary"
						type="submit"
						disabled={sending || (emailTouched && !emailOk)}
					>
						{sending ? "Link wird gesendet…" : "Login-Link senden"}
					</button>
				</div>
			</form>

			{message && (
				<div className="banner info auth-feedback">
					<strong>Schau in dein Postfach.</strong>
					<br />
					{message}
					<br />
					<small className="muted">
						Nichts da? Spam checken oder nochmal anfordern. Der Link geht nur
						einmal und nicht ewig.
					</small>
				</div>
			)}
			{error && <p className="banner error auth-feedback">{error}</p>}
			{devLink && (
				<div className="banner info dev-link auth-feedback">
					<strong>Entwickler-Modus</strong>
					<p className="muted small dev-link-hint">
						Keine E-Mail eingerichtet – hier ist der Link direkt:
					</p>
					<p className="dev-link-url">
						<a href={devLink}>{devLink}</a>
					</p>
					<p className="dev-link-action">
						<a className="btn btn-sm btn-primary" href={devLink}>
							Jetzt anmelden
						</a>
					</p>
				</div>
			)}

			<p className="muted small auth-footnote">
				Wenn du angemeldet bist, kannst du Angebote einstellen, annehmen und die
				Übergabe abschließen.
			</p>
		</div>
	);
}
