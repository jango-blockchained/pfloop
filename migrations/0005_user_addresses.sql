-- Saved addresses for users (select / prefill on offer create)

CREATE TABLE user_addresses (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL,
	-- Short name, e.g. "Zuhause", "Keller"
	label TEXT NOT NULL DEFAULT '',
	address_text TEXT NOT NULL,
	address_hint TEXT NOT NULL DEFAULT '',
	lat REAL NOT NULL,
	lng REAL NOT NULL,
	-- 1 = default for offer form prefills
	is_default INTEGER NOT NULL DEFAULT 0
		CHECK (is_default IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX user_addresses_user ON user_addresses (user_id);
CREATE INDEX user_addresses_user_default ON user_addresses (user_id, is_default);
