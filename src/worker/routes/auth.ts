// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
	SESSION_COOKIE,
	appBaseUrl,
	clearSessionCookie,
	consumeMagicLink,
	createMagicLink,
	createSession,
	destroySession,
	resolveSessionUser,
	sendMagicLinkEmail,
	setSessionCookie,
	upsertUserByEmail,
} from "../lib/auth";
import { jsonError, jsonInternalError } from "../lib/http";
import {
	asOptionalString,
	isValidEmail,
	isValidToken,
	readJsonBody,
	clampDisplayName,
} from "../lib/validate";

type Variables = {
	userId: string | null;
};

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** Request magic link to email. */
authRoutes.post("/magic-link", async (c) => {
	const parsed = await readJsonBody<{
		email?: unknown;
		display_name?: unknown;
		locale?: unknown;
	}>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}

	const localeRaw = (asOptionalString(parsed.data.locale) ?? "de")
		.trim()
		.toLowerCase();
	const locale = localeRaw.startsWith("en") ? "en" : "de";

	const email = (asOptionalString(parsed.data.email) ?? "")
		.trim()
		.toLowerCase();
	if (!isValidEmail(email)) {
		return jsonError(
			c,
			locale === "en"
				? "Please enter a valid email address"
				: "Bitte eine gültige E-Mail angeben",
			400,
		);
	}

	const displayName = clampDisplayName(
		asOptionalString(parsed.data.display_name),
	);

	// Ensure user exists (or will be updated with optional display name)
	await upsertUserByEmail(c.env.DB, email, displayName);

	const { token } = await createMagicLink(c.env.DB, email);
	const base = appBaseUrl(c, c.env);
	const link = `${base}/auth/verify?token=${encodeURIComponent(token)}`;

	try {
		const mode = await sendMagicLinkEmail(c.env, email, link, { locale });
		return c.json({
			ok: true,
			// In local/dev without RESEND_API_KEY, return link so UI can show it.
			...(mode === "dev_log" ? { magic_link: link, dev: true } : {}),
			message:
				mode === "sent"
					? locale === "en"
						? "Login link is on its way – check your inbox."
						: "Login-Link ist unterwegs – schau in dein Postfach."
					: locale === "en"
						? "Dev mode: no email sent – link shown below."
						: "Dev-Modus: Kein E-Mail-Versand – Link siehst du unten.",
		});
	} catch (e) {
		// Provider message is already sanitized in sendMagicLinkEmail.
		const msg =
			e instanceof Error
				? e.message
				: locale === "en"
					? "Email could not be sent"
					: "E-Mail konnte nicht gesendet werden";
		console.error(
			JSON.stringify({ event: "magic_link_route_error", message: msg }),
		);
		return jsonError(c, msg, 502);
	}
});

/** Exchange magic-link token for session cookie (JSON API for SPA). */
authRoutes.post("/verify", async (c) => {
	const parsed = await readJsonBody<{ token?: unknown }>(c);
	if (!parsed.ok) {
		return jsonError(c, parsed.error, parsed.status);
	}

	const token = (asOptionalString(parsed.data.token) ?? "").trim();
	if (!token) {
		return jsonError(c, "Im Link fehlt etwas – öffne den kompletten Link aus der Mail", 400);
	}
	if (!isValidToken(token)) {
		return jsonError(
			c,
			"Der Link ist ungültig oder abgelaufen. Hol dir einfach einen neuen.",
			400,
		);
	}

	const email = await consumeMagicLink(c.env.DB, token);
	if (!email) {
		return jsonError(
			c,
			"Der Link ist ungültig oder abgelaufen. Hol dir einfach einen neuen.",
			400,
		);
	}

	try {
		const user = await upsertUserByEmail(c.env.DB, email);
		const sessionToken = await createSession(c.env.DB, user.id);
		setSessionCookie(c, sessionToken);
		return c.json({ ok: true, user });
	} catch (e) {
		return jsonInternalError(c, e, "auth_verify_session");
	}
});

/** Current session user. */
authRoutes.get("/me", async (c) => {
	const user = await resolveSessionUser(c);
	if (!user) {
		return c.json({ user: null });
	}
	return c.json({ user });
});

/** Logout — drop session. */
authRoutes.post("/logout", async (c) => {
	const token = getCookie(c, SESSION_COOKIE);
	await destroySession(c.env.DB, token);
	clearSessionCookie(c);
	return c.json({ ok: true });
});
