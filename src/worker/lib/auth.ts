import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import { randomToken, sha256Hex } from "./crypto";
import { nowIso } from "./time";
import { MAX_DISPLAY_NAME_LEN } from "./constants";

export const SESSION_COOKIE = "grabme_session";
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;

export type AuthUser = {
	id: string;
	email: string;
	display_name: string;
};

type AppEnv = { Bindings: Env; Variables: { userId: string | null } };

export function sessionExpiresAt(from = new Date()): string {
	const d = new Date(from);
	d.setDate(d.getDate() + SESSION_DAYS);
	return d.toISOString();
}

export function magicLinkExpiresAt(from = new Date()): string {
	const d = new Date(from);
	d.setMinutes(d.getMinutes() + MAGIC_LINK_MINUTES);
	return d.toISOString();
}

export async function resolveSessionUser(
	c: Context<AppEnv>,
): Promise<AuthUser | null> {
	const token = getCookie(c, SESSION_COOKIE);
	if (!token || token.length > 128) return null;

	const tokenHash = await sha256Hex(token);
	const row = await c.env.DB.prepare(
		`SELECT u.id, u.email, u.display_name, s.expires_at
		 FROM auth_sessions s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.token_hash = ?`,
	)
		.bind(tokenHash)
		.first<{
			id: string;
			email: string;
			display_name: string;
			expires_at: string;
		}>();

	if (!row) return null;
	if (new Date(row.expires_at).getTime() <= Date.now()) {
		await c.env.DB.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`)
			.bind(tokenHash)
			.run();
		return null;
	}

	return {
		id: row.id,
		email: row.email,
		display_name: row.display_name,
	};
}

function cookieSecure(c: Context<AppEnv>): boolean {
	return new URL(c.req.url).protocol === "https:";
}

export function setSessionCookie(c: Context<AppEnv>, token: string): void {
	setCookie(c, SESSION_COOKIE, token, {
		httpOnly: true,
		secure: cookieSecure(c),
		sameSite: "Lax",
		path: "/",
		maxAge: SESSION_DAYS * 24 * 60 * 60,
	});
}

export function clearSessionCookie(c: Context<AppEnv>): void {
	// Match attributes used when setting so browsers drop the cookie reliably.
	deleteCookie(c, SESSION_COOKIE, {
		path: "/",
		secure: cookieSecure(c),
		sameSite: "Lax",
	});
}

export async function createSession(
	db: D1Database,
	userId: string,
): Promise<string> {
	const token = randomToken(32);
	const tokenHash = await sha256Hex(token);
	const id = crypto.randomUUID();
	// Drop expired sessions for this user (keeps table small; no external deps).
	await db.batch([
		db
			.prepare(`DELETE FROM auth_sessions WHERE user_id = ? AND expires_at <= ?`)
			.bind(userId, nowIso()),
		db
			.prepare(
				`INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at)
				 VALUES (?, ?, ?, ?, ?)`,
			)
			.bind(id, userId, tokenHash, sessionExpiresAt(), nowIso()),
	]);
	return token;
}

export async function destroySession(
	db: D1Database,
	token: string | undefined,
): Promise<void> {
	if (!token) return;
	const tokenHash = await sha256Hex(token);
	await db
		.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`)
		.bind(tokenHash)
		.run();
}

/**
 * Delete expired sessions and old magic links (consumed or past expiry).
 * Intended for cron; safe to call opportunistically.
 */
export async function cleanupExpiredAuth(db: D1Database): Promise<{
	sessions_deleted: number;
	magic_links_deleted: number;
}> {
	const now = nowIso();
	const sessions = await db
		.prepare(`DELETE FROM auth_sessions WHERE expires_at <= ?`)
		.bind(now)
		.run();
	// Keep recently consumed links briefly is unnecessary — consumed or expired → drop.
	const links = await db
		.prepare(
			`DELETE FROM auth_magic_links
			 WHERE expires_at <= ? OR consumed_at IS NOT NULL`,
		)
		.bind(now)
		.run();

	return {
		sessions_deleted: sessions.meta.changes ?? 0,
		magic_links_deleted: links.meta.changes ?? 0,
	};
}

export async function upsertUserByEmail(
	db: D1Database,
	email: string,
	displayName?: string,
): Promise<AuthUser> {
	const normalized = email.trim().toLowerCase();
	const existing = await db
		.prepare(`SELECT id, email, display_name FROM users WHERE email = ?`)
		.bind(normalized)
		.first<AuthUser>();

	const safeName =
		displayName?.trim().slice(0, MAX_DISPLAY_NAME_LEN) || undefined;

	if (existing) {
		if (safeName && safeName !== existing.display_name) {
			await db
				.prepare(`UPDATE users SET display_name = ? WHERE id = ?`)
				.bind(safeName, existing.id)
				.run();
			return { ...existing, display_name: safeName };
		}
		return existing;
	}

	const id = crypto.randomUUID();
	const name = safeName || normalized.split("@")[0] || "User";
	await db
		.prepare(`INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)`)
		.bind(id, normalized, name.slice(0, MAX_DISPLAY_NAME_LEN))
		.run();

	return { id, email: normalized, display_name: name.slice(0, MAX_DISPLAY_NAME_LEN) };
}

export async function createMagicLink(
	db: D1Database,
	email: string,
): Promise<{ token: string; expiresAt: string }> {
	const token = randomToken(32);
	const tokenHash = await sha256Hex(token);
	const expiresAt = magicLinkExpiresAt();
	const id = crypto.randomUUID();
	const normalized = email.trim().toLowerCase();
	const now = nowIso();

	// Invalidate unused prior links for this email (one active request).
	await db.batch([
		db
			.prepare(
				`UPDATE auth_magic_links SET consumed_at = ?
				 WHERE email = ? AND consumed_at IS NULL`,
			)
			.bind(now, normalized),
		db
			.prepare(
				`INSERT INTO auth_magic_links (id, email, token_hash, expires_at, created_at)
				 VALUES (?, ?, ?, ?, ?)`,
			)
			.bind(id, normalized, tokenHash, expiresAt, now),
	]);

	return { token, expiresAt };
}

/**
 * Atomically consume a magic link. Returns email or null if invalid/expired/used.
 * Uses UPDATE … WHERE consumed_at IS NULL so concurrent verifies cannot both succeed.
 */
export async function consumeMagicLink(
	db: D1Database,
	token: string,
): Promise<string | null> {
	const tokenHash = await sha256Hex(token);
	const row = await db
		.prepare(
			`SELECT id, email, expires_at, consumed_at
			 FROM auth_magic_links WHERE token_hash = ?`,
		)
		.bind(tokenHash)
		.first<{
			id: string;
			email: string;
			expires_at: string;
			consumed_at: string | null;
		}>();

	if (!row || row.consumed_at) return null;
	if (new Date(row.expires_at).getTime() <= Date.now()) return null;

	const result = await db
		.prepare(
			`UPDATE auth_magic_links SET consumed_at = ?
			 WHERE id = ? AND consumed_at IS NULL AND expires_at > ?`,
		)
		.bind(nowIso(), row.id, nowIso())
		.run();

	if ((result.meta.changes ?? 0) === 0) return null;

	return row.email;
}

/** Send magic link via Resend if configured; otherwise caller exposes link in JSON. */
export async function sendMagicLinkEmail(
	env: Env,
	to: string,
	link: string,
): Promise<"sent" | "dev_log"> {
	// Optional secret: wrangler secret put RESEND_API_KEY
	const apiKey = (env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY;
	if (!apiKey) {
		console.log(
			JSON.stringify({
				event: "magic_link_dev",
				to,
				link,
			}),
		);
		return "dev_log";
	}

	const from = env.EMAIL_FROM ?? "GrabMe <onboarding@resend.dev>";
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from,
			to: [to],
			subject: "Dein Login-Link für GrabMe",
			text: `Hi!\n\nHier ist dein Login-Link für GrabMe (einmalig, ca. 15 Minuten gültig):\n\n${link}\n\nFalls du das nicht warst, einfach ignorieren.\n`,
			html: `<p>Hi!</p><p><a href="${link}">Jetzt bei GrabMe anmelden</a></p><p>Der Link gilt einmal und etwa 15 Minuten.</p><p>Falls du das nicht angefordert hast, kannst du die Mail ignorieren.</p>`,
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		console.error(
			JSON.stringify({
				event: "magic_link_send_failed",
				status: res.status,
				body: body.slice(0, 500),
			}),
		);
		// Surface Resend hint (domain / recipient limits) without leaking the API key.
		let hint = "E-Mail konnte nicht gesendet werden";
		try {
			const parsed = JSON.parse(body) as {
				message?: string;
				name?: string;
			};
			if (parsed.message) {
				// Cap length so provider text cannot bloat the client response.
				const msg = parsed.message.slice(0, 200);
				hint = `E-Mail konnte nicht raus: ${msg}`;
			}
		} catch {
			/* keep generic */
		}
		throw new Error(hint);
	}

	return "sent";
}

export function appBaseUrl(c: Context<AppEnv>, env: Env): string {
	if (env.APP_URL) return env.APP_URL.replace(/\/$/, "");
	const url = new URL(c.req.url);
	return `${url.protocol}//${url.host}`;
}
