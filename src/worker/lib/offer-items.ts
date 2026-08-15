// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import type { PfandLineComputed } from "../../shared/pfand";

export type OfferItemRow = {
	item_type: string;
	quantity: number;
	unit_cents: number;
	line_cents: number;
};

export async function loadOfferItems(
	db: D1Database,
	offerId: string,
): Promise<OfferItemRow[]> {
	const { results } = await db
		.prepare(
			`SELECT item_type, quantity, unit_cents, line_cents
			 FROM offer_items WHERE offer_id = ?
			 ORDER BY rowid`,
		)
		.bind(offerId)
		.all<OfferItemRow>();
	return results ?? [];
}

export async function loadOfferItemsForMany(
	db: D1Database,
	offerIds: string[],
): Promise<Map<string, OfferItemRow[]>> {
	const map = new Map<string, OfferItemRow[]>();
	if (offerIds.length === 0) return map;

	// D1 has no great IN binding helper — batch small or one query with OR for MVP
	const placeholders = offerIds.map(() => "?").join(",");
	const { results } = await db
		.prepare(
			`SELECT offer_id, item_type, quantity, unit_cents, line_cents
			 FROM offer_items
			 WHERE offer_id IN (${placeholders})
			 ORDER BY rowid`,
		)
		.bind(...offerIds)
		.all<OfferItemRow & { offer_id: string }>();

	for (const row of results ?? []) {
		const list = map.get(row.offer_id) ?? [];
		list.push({
			item_type: row.item_type,
			quantity: row.quantity,
			unit_cents: row.unit_cents,
			line_cents: row.line_cents,
		});
		map.set(row.offer_id, list);
	}
	return map;
}

export function insertItemStatements(
	db: D1Database,
	offerId: string,
	lines: PfandLineComputed[],
): D1PreparedStatement[] {
	return lines.map((line) =>
		db
			.prepare(
				`INSERT INTO offer_items (
					id, offer_id, item_type, quantity, unit_cents, line_cents
				) VALUES (?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				crypto.randomUUID(),
				offerId,
				line.type,
				line.quantity,
				line.unit_cents,
				line.line_cents,
			),
	);
}

export async function loadRecurringOfferItems(
	db: D1Database,
	recurringOfferId: string,
): Promise<OfferItemRow[]> {
	const { results } = await db
		.prepare(
			`SELECT item_type, quantity, unit_cents, line_cents
			 FROM recurring_offer_items WHERE recurring_offer_id = ?
			 ORDER BY rowid`,
		)
		.bind(recurringOfferId)
		.all<OfferItemRow>();
	return results ?? [];
}

export async function loadRecurringOfferItemsForMany(
	db: D1Database,
	ids: string[],
): Promise<Map<string, OfferItemRow[]>> {
	const map = new Map<string, OfferItemRow[]>();
	if (ids.length === 0) return map;

	const placeholders = ids.map(() => "?").join(",");
	const { results } = await db
		.prepare(
			`SELECT recurring_offer_id, item_type, quantity, unit_cents, line_cents
			 FROM recurring_offer_items
			 WHERE recurring_offer_id IN (${placeholders})
			 ORDER BY rowid`,
		)
		.bind(...ids)
		.all<OfferItemRow & { recurring_offer_id: string }>();

	for (const row of results ?? []) {
		const list = map.get(row.recurring_offer_id) ?? [];
		list.push({
			item_type: row.item_type,
			quantity: row.quantity,
			unit_cents: row.unit_cents,
			line_cents: row.line_cents,
		});
		map.set(row.recurring_offer_id, list);
	}
	return map;
}

export function insertRecurringItemStatements(
	db: D1Database,
	recurringOfferId: string,
	lines: PfandLineComputed[],
): D1PreparedStatement[] {
	return lines.map((line) =>
		db
			.prepare(
				`INSERT INTO recurring_offer_items (
					id, recurring_offer_id, item_type, quantity, unit_cents, line_cents
				) VALUES (?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				crypto.randomUUID(),
				recurringOfferId,
				line.type,
				line.quantity,
				line.unit_cents,
				line.line_cents,
			),
	);
}
