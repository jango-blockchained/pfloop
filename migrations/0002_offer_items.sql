-- SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Structured German Pfand line items (quantities × catalog unit prices)

CREATE TABLE offer_items (
	id TEXT PRIMARY KEY NOT NULL,
	offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
	-- Catalog key: einweg_025 | mehrweg_015 | mehrweg_008 | kasten_150 | kasten_300
	item_type TEXT NOT NULL,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	-- Snapshot of catalog unit price at create time (cents)
	unit_cents INTEGER NOT NULL CHECK (unit_cents > 0),
	line_cents INTEGER NOT NULL CHECK (line_cents > 0),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX offer_items_offer ON offer_items (offer_id);
