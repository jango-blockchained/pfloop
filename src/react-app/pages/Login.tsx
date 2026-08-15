// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLocale, useT } from "../i18n";
import { getErrorMessage, requestMagicLink } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { isValidEmail } from "../lib/format";

export function Login() {
	const { user, logout, loading } = useAuth();
	const t = useT();
	const { locale } = useLocale();
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
			? t("login.emailInvalidHint")
			: null;

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setEmailTouched(true);
		setError(null);
		setMessage(null);
		setDevLink(null);

		if (!emailOk) {
			setError(t("login.emailInvalidError"));
			return;
		}
		if (sending) return;

		setSending(true);
		try {
			const res = await requestMagicLink(
				emailTrimmed,
				displayName.trim() || undefined,
				locale,
			);
			setMessage(res.message || t("login.sentFallback"));
			if (res.magic_link) setDevLink(res.magic_link);
		} catch (err) {
			setError(getErrorMessage(err, t("login.sendFailed")));
		} finally {
			setSending(false);
		}
	}

	if (loading) {
		return (
			<div className="page auth-page">
				<p className="muted" role="status">
					{t("common.loadingMoment")}
				</p>
			</div>
		);
	}

	if (user) {
		return (
			<div className="page auth-page">
				<header className="page-header">
					<h1>{t("login.alreadyTitle")}</h1>
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
						{t("auth.logout")}
					</button>
				</div>
				<nav className="auth-footer-links">
					<Link to="/profil">{t("login.link.profile")}</Link>
					<span aria-hidden> · </span>
					<Link to="/neu">{t("login.link.create")}</Link>
					<span aria-hidden> · </span>
					<Link to="/">{t("common.toMap")}</Link>
					<span aria-hidden> · </span>
					<Link to="/datenschutz">{t("legal.privacy")}</Link>
				</nav>
			</div>
		);
	}

	return (
		<div className="page auth-page">
			<header className="page-header">
				<h1>{t("login.title")}</h1>
				<p className="page-lede muted">{t("login.lede")}</p>
			</header>

			<form className="form auth-form" onSubmit={onSubmit} noValidate>
				<section className="form-section">
					<label>
						{t("login.emailLabel")}
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onBlur={() => setEmailTouched(true)}
							required
							placeholder={t("login.emailPlaceholder")}
							autoComplete="email"
							inputMode="email"
							aria-invalid={Boolean(emailHint)}
						/>
						{emailHint && <span className="field-error">{emailHint}</span>}
					</label>
					<label>
						{t("login.displayNameLabel")}
						<input
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder={t("login.displayNamePlaceholder")}
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
						{sending ? t("login.sending") : t("login.submit")}
					</button>
				</div>
			</form>

			{message && (
				<div className="banner info auth-feedback">
					<strong>{t("login.checkInbox")}</strong>
					<br />
					{message}
					<br />
					<small className="muted">{t("login.spamHint")}</small>
				</div>
			)}
			{error && <p className="banner error auth-feedback">{error}</p>}
			{devLink && (
				<div className="banner info dev-link auth-feedback">
					<strong>{t("login.devMode")}</strong>
					<p className="muted small dev-link-hint">{t("login.devHint")}</p>
					<p className="dev-link-url">
						<a href={devLink}>{devLink}</a>
					</p>
					<p className="dev-link-action">
						<a className="btn btn-sm btn-primary" href={devLink}>
							{t("login.devLogin")}
						</a>
					</p>
				</div>
			)}

			<p className="muted small auth-footnote">{t("login.footnote")}</p>
			<nav className="auth-footer-links muted small">
				<Link to="/impressum">{t("legal.imprint")}</Link>
				<span aria-hidden> · </span>
				<Link to="/datenschutz">{t("legal.privacy")}</Link>
				<span aria-hidden> · </span>
				<Link to="/agb">{t("legal.terms")}</Link>
			</nav>
		</div>
	);
}
