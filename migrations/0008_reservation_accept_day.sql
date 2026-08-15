-- SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Attribute completions to the Berlin accept day for progressive limits.
ALTER TABLE reservations ADD COLUMN accept_day TEXT NOT NULL DEFAULT '';

-- Backfill from accepted_at (UTC date is approximate for historical rows).
UPDATE reservations
SET accept_day = substr(accepted_at, 1, 10)
WHERE accept_day = '' AND accepted_at IS NOT NULL AND length(accepted_at) >= 10;

CREATE INDEX IF NOT EXISTS reservations_collector_accept_day
	ON reservations (collector_id, accept_day, status);
