-- SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Lower recurring weekly estimate minimum to €2.50 (250 cents).
-- One-shot offers stay at €3.00 (300 cents).
-- Rebuild recurring_offers only (no FK dependents on pfand check).

CREATE TABLE recurring_offers_bak AS SELECT * FROM recurring_offers;

DROP TABLE recurring_offers;

CREATE TABLE recurring_offers (
	id TEXT PRIMARY KEY NOT NULL,
	poster_id TEXT NOT NULL,
	title TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	pfand_value_cents INTEGER NOT NULL CHECK (pfand_value_cents >= 250),
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

INSERT INTO recurring_offers
SELECT id, poster_id, title, description, pfand_value_cents, status,
       lat, lng, address_hint, address_text, weekday, time_hint,
       assigned_collector_id, assigned_at, created_at, updated_at
FROM recurring_offers_bak;

CREATE INDEX recurring_offers_status_geo ON recurring_offers (status, lat, lng);
CREATE INDEX recurring_offers_poster ON recurring_offers (poster_id);
CREATE INDEX recurring_offers_collector ON recurring_offers (assigned_collector_id);

DROP TABLE recurring_offers_bak;
