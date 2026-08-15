-- SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

-- Collector progressive daily quota + index for 24h unconfirmed collected cleanup.

ALTER TABLE users ADD COLUMN collector_daily_limit INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN collector_limit_day TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN collector_accepted_today INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN collector_confirmed_today INTEGER NOT NULL DEFAULT 0;

-- Cron: collected awaiting confirm past collected_at + 24h
CREATE INDEX IF NOT EXISTS reservations_collected_at
	ON reservations (status, collected_at);
