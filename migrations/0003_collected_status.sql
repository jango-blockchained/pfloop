-- SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Two-step handover:
--   reserved  = accepted by collector (must pick up within 6h)
--   collected = collector marked pickup done; waiting for poster confirm
--   completed = poster confirmed handover
--
-- SQLite cannot ALTER CHECK constraints; rebuild tables with expanded status enums.

PRAGMA foreign_keys = OFF;

-- ── offers ──────────────────────────────────────────────────────────
CREATE TABLE offers_new (
	id TEXT PRIMARY KEY NOT NULL,
	poster_id TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	pfand_value_cents INTEGER NOT NULL CHECK (pfand_value_cents >= 500),
	status TEXT NOT NULL DEFAULT 'open'
		CHECK (status IN ('open', 'reserved', 'collected', 'completed', 'cancelled')),
	lat REAL NOT NULL,
	lng REAL NOT NULL,
	address_hint TEXT NOT NULL DEFAULT '',
	address_text TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO offers_new
SELECT id, poster_id, title, description, pfand_value_cents, status,
       lat, lng, address_hint, address_text, created_at, updated_at
FROM offers;

DROP TABLE offers;
ALTER TABLE offers_new RENAME TO offers;

CREATE INDEX offers_status_geo ON offers (status, lat, lng);
CREATE INDEX offers_poster ON offers (poster_id);

-- ── reservations ────────────────────────────────────────────────────
CREATE TABLE reservations_new (
	id TEXT PRIMARY KEY NOT NULL,
	offer_id TEXT NOT NULL REFERENCES offers(id),
	collector_id TEXT NOT NULL REFERENCES users(id),
	accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
	deadline_at TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active'
		CHECK (status IN ('active', 'collected', 'completed', 'released')),
	completed_at TEXT,
	collected_at TEXT,
	UNIQUE (offer_id, collector_id, accepted_at)
);

INSERT INTO reservations_new
	(id, offer_id, collector_id, accepted_at, deadline_at, status, completed_at, collected_at)
SELECT id, offer_id, collector_id, accepted_at, deadline_at, status, completed_at, NULL
FROM reservations;

DROP TABLE reservations;
ALTER TABLE reservations_new RENAME TO reservations;

-- One unfinished reservation per offer (active = en route, collected = waiting confirm)
CREATE UNIQUE INDEX reservations_one_open_per_offer
	ON reservations (offer_id)
	WHERE status IN ('active', 'collected');

CREATE INDEX reservations_deadline ON reservations (status, deadline_at);
CREATE INDEX reservations_collector ON reservations (collector_id);

PRAGMA foreign_keys = ON;
