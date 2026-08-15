-- SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Recurring weekly offers + lower minimum Pfand to €3 (300 cents).
-- Rebuild offers by dropping dependents first (D1 enforces FKs).

-- ── Snapshot dependents ─────────────────────────────────────────────
CREATE TABLE offer_items_bak AS SELECT * FROM offer_items;
CREATE TABLE reservations_bak AS SELECT * FROM reservations;
CREATE TABLE offers_bak AS SELECT * FROM offers;

DROP TABLE offer_items;
DROP TABLE reservations;
DROP TABLE offers;

-- ── offers with min 300 ─────────────────────────────────────────────
CREATE TABLE offers (
	id TEXT PRIMARY KEY NOT NULL,
	poster_id TEXT NOT NULL,
	title TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	pfand_value_cents INTEGER NOT NULL CHECK (pfand_value_cents >= 300),
	status TEXT NOT NULL DEFAULT 'open'
		CHECK (status IN ('open', 'reserved', 'collected', 'completed', 'cancelled')),
	lat REAL NOT NULL,
	lng REAL NOT NULL,
	address_hint TEXT NOT NULL DEFAULT '',
	address_text TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO offers
SELECT id, poster_id, title, description, pfand_value_cents, status,
       lat, lng, address_hint, address_text, created_at, updated_at
FROM offers_bak;

CREATE INDEX offers_status_geo ON offers (status, lat, lng);
CREATE INDEX offers_poster ON offers (poster_id);

-- ── offer_items ─────────────────────────────────────────────────────
CREATE TABLE offer_items (
	id TEXT PRIMARY KEY NOT NULL,
	offer_id TEXT NOT NULL,
	item_type TEXT NOT NULL,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	unit_cents INTEGER NOT NULL CHECK (unit_cents > 0),
	line_cents INTEGER NOT NULL CHECK (line_cents > 0),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO offer_items
SELECT id, offer_id, item_type, quantity, unit_cents, line_cents, created_at
FROM offer_items_bak;

CREATE INDEX offer_items_offer ON offer_items (offer_id);

-- ── reservations ────────────────────────────────────────────────────
CREATE TABLE reservations (
	id TEXT PRIMARY KEY NOT NULL,
	offer_id TEXT NOT NULL,
	collector_id TEXT NOT NULL,
	accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
	deadline_at TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active'
		CHECK (status IN ('active', 'collected', 'completed', 'released')),
	completed_at TEXT,
	collected_at TEXT,
	UNIQUE (offer_id, collector_id, accepted_at)
);

INSERT INTO reservations
SELECT id, offer_id, collector_id, accepted_at, deadline_at, status,
       completed_at, collected_at
FROM reservations_bak;

CREATE UNIQUE INDEX reservations_one_open_per_offer
	ON reservations (offer_id)
	WHERE status IN ('active', 'collected');

CREATE INDEX reservations_deadline ON reservations (status, deadline_at);
CREATE INDEX reservations_collector ON reservations (collector_id);

DROP TABLE offer_items_bak;
DROP TABLE reservations_bak;
DROP TABLE offers_bak;

-- ── recurring weekly offers ─────────────────────────────────────────
CREATE TABLE recurring_offers (
	id TEXT PRIMARY KEY NOT NULL,
	poster_id TEXT NOT NULL,
	title TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	pfand_value_cents INTEGER NOT NULL CHECK (pfand_value_cents >= 300),
	status TEXT NOT NULL DEFAULT 'open'
		CHECK (status IN ('open', 'assigned', 'cancelled')),
	lat REAL NOT NULL,
	lng REAL NOT NULL,
	address_hint TEXT NOT NULL DEFAULT '',
	address_text TEXT NOT NULL DEFAULT '',
	weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
	time_hint TEXT NOT NULL DEFAULT '',
	assigned_collector_id TEXT,
	assigned_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX recurring_offers_status_geo ON recurring_offers (status, lat, lng);
CREATE INDEX recurring_offers_poster ON recurring_offers (poster_id);
CREATE INDEX recurring_offers_collector ON recurring_offers (assigned_collector_id);

CREATE TABLE recurring_offer_items (
	id TEXT PRIMARY KEY NOT NULL,
	recurring_offer_id TEXT NOT NULL,
	item_type TEXT NOT NULL,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	unit_cents INTEGER NOT NULL CHECK (unit_cents > 0),
	line_cents INTEGER NOT NULL CHECK (line_cents > 0),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX recurring_offer_items_offer ON recurring_offer_items (recurring_offer_id);

CREATE TABLE recurring_applications (
	id TEXT PRIMARY KEY NOT NULL,
	recurring_offer_id TEXT NOT NULL,
	applicant_id TEXT NOT NULL,
	message TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'pending'
		CHECK (status IN ('pending', 'selected', 'rejected', 'withdrawn')),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE (recurring_offer_id, applicant_id)
);

CREATE INDEX recurring_applications_offer ON recurring_applications (recurring_offer_id, status);
CREATE INDEX recurring_applications_applicant ON recurring_applications (applicant_id);
