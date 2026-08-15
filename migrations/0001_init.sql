-- SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Pfloop domain schema
-- Rules:
--   * pfand_value_cents >= 500 (€5 minimum)
--   * reservation deadline = accepted_at + 6 hours
--   * full address only after accept (enforced in API)
--   * service is free (no fee columns)

CREATE TABLE users (
	id TEXT PRIMARY KEY NOT NULL,
	email TEXT NOT NULL UNIQUE,
	display_name TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE offers (
	id TEXT PRIMARY KEY NOT NULL,
	poster_id TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	-- Integer cents; application enforces >= 500
	pfand_value_cents INTEGER NOT NULL CHECK (pfand_value_cents >= 500),
	-- open | reserved | completed | cancelled
	status TEXT NOT NULL DEFAULT 'open'
		CHECK (status IN ('open', 'reserved', 'completed', 'cancelled')),
	lat REAL NOT NULL,
	lng REAL NOT NULL,
	-- Public approximate area, e.g. "Berlin-Kreuzberg"
	address_hint TEXT NOT NULL DEFAULT '',
	-- Full street address — only returned after accept / to poster
	address_text TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX offers_status_geo ON offers (status, lat, lng);
CREATE INDEX offers_poster ON offers (poster_id);

CREATE TABLE reservations (
	id TEXT PRIMARY KEY NOT NULL,
	offer_id TEXT NOT NULL REFERENCES offers(id),
	collector_id TEXT NOT NULL REFERENCES users(id),
	accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
	-- accepted_at + 6 hours (set by API)
	deadline_at TEXT NOT NULL,
	-- active | completed | released
	status TEXT NOT NULL DEFAULT 'active'
		CHECK (status IN ('active', 'completed', 'released')),
	completed_at TEXT,
	UNIQUE (offer_id, collector_id, accepted_at)
);

-- At most one active reservation per offer (partial unique index)
CREATE UNIQUE INDEX reservations_one_active_per_offer
	ON reservations (offer_id)
	WHERE status = 'active';

CREATE INDEX reservations_deadline ON reservations (status, deadline_at);
CREATE INDEX reservations_collector ON reservations (collector_id);

-- Auth tables (magic-link sessions) — filled in Phase 1 with Better Auth or custom
CREATE TABLE auth_sessions (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES users(id),
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE auth_magic_links (
	id TEXT PRIMARY KEY NOT NULL,
	email TEXT NOT NULL,
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TEXT NOT NULL,
	consumed_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
