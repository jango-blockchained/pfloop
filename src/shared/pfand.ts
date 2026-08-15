// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

/**
 * Deutsches Pfandsystem — feste Stückpreise (Stand typischer Einweg-/Mehrwegpfand).
 * Server berechnet den Gesamtbetrag nur aus diesen Werten × Stückzahl.
 */

export const PFAND_ITEM_TYPES = [
	"einweg_025",
	"mehrweg_015",
	"mehrweg_008",
	"kasten_150",
	"kasten_300",
] as const;

export type PfandItemType = (typeof PFAND_ITEM_TYPES)[number];

export type PfandCatalogEntry = {
	type: PfandItemType;
	/** Kurzer Name in der UI */
	label: string;
	/** Erklärung */
	hint: string;
	/** Kategorie für Gruppierung */
	category: "flasche" | "kasten";
	/** Pfand pro Stück in Cent */
	unit_cents: number;
};

/** Offizieller Katalog — nur diese Typen sind erlaubt. */
export const PFAND_CATALOG: readonly PfandCatalogEntry[] = [
	{
		type: "einweg_025",
		label: "Einweg-Flasche / Dose",
		hint: "PET oder Dose — 0,25 € pro Stück",
		category: "flasche",
		unit_cents: 25,
	},
	{
		type: "mehrweg_015",
		label: "Mehrweg-Flasche",
		hint: "z. B. Bier oder Wasser — 0,15 €",
		category: "flasche",
		unit_cents: 15,
	},
	{
		type: "mehrweg_008",
		label: "Kleine Mehrweg-Flasche",
		hint: "manche Glasflaschen — 0,08 €",
		category: "flasche",
		unit_cents: 8,
	},
	{
		type: "kasten_150",
		label: "Kasten / Kiste",
		hint: "typischer Bierkasten — 1,50 € (nur der Kasten, Flaschen extra)",
		category: "kasten",
		unit_cents: 150,
	},
	{
		type: "kasten_300",
		label: "Großer Kunststoffkasten",
		hint: "manche Kästen — 3,00 € (nur der Kasten)",
		category: "kasten",
		unit_cents: 300,
	}
] as const;

const byType = new Map(PFAND_CATALOG.map((e) => [e.type, e]));

export function isPfandItemType(v: string): v is PfandItemType {
	return byType.has(v as PfandItemType);
}

export function getPfandEntry(type: PfandItemType): PfandCatalogEntry {
	const e = byType.get(type);
	if (!e) throw new Error(`Unbekannter Pfand-Typ: ${type}`);
	return e;
}

export type PfandLineInput = {
	type: PfandItemType;
	quantity: number;
};

export type PfandLineComputed = PfandLineInput & {
	unit_cents: number;
	line_cents: number;
	label: string;
};

export type PfandComputeResult =
	| { ok: true; lines: PfandLineComputed[]; total_cents: number }
	| { ok: false; error: string };

/** Validiert Stückzahlen und summiert Pfand aus dem Katalog. */
export function computePfandFromItems(
	raw: Array<{ type?: string; quantity?: number }>,
): PfandComputeResult {
	if (!Array.isArray(raw) || raw.length === 0) {
		return {
			ok: false,
			error: "Trag bitte an, wie viele Flaschen oder Kästen du hast",
		};
	}

	const merged = new Map<PfandItemType, number>();

	for (const row of raw) {
		const type = row.type;
		if (!type || !isPfandItemType(type)) {
			return { ok: false, error: `Unbekannte Pfand-Art: ${String(type)}` };
		}
		const q = row.quantity;
		if (typeof q !== "number" || !Number.isInteger(q) || q < 0) {
			return {
				ok: false,
				error: `Komische Stückzahl bei ${getPfandEntry(type).label}`,
			};
		}
		if (q === 0) continue;
		if (q > 10_000) {
			return { ok: false, error: "Maximal 10.000 Stück pro Sorte" };
		}
		merged.set(type, (merged.get(type) ?? 0) + q);
	}

	if (merged.size === 0) {
		return {
			ok: false,
			error: "Mindestens eine Flasche oder einen Kasten eintragen",
		};
	}

	const lines: PfandLineComputed[] = [];
	let total = 0;
	for (const [type, quantity] of merged) {
		const entry = getPfandEntry(type);
		const line_cents = entry.unit_cents * quantity;
		total += line_cents;
		lines.push({
			type,
			quantity,
			unit_cents: entry.unit_cents,
			line_cents,
			label: entry.label,
		});
	}

	// Stable order as in catalog
	lines.sort(
		(a, b) =>
			PFAND_ITEM_TYPES.indexOf(a.type) - PFAND_ITEM_TYPES.indexOf(b.type),
	);

	return { ok: true, lines, total_cents: total };
}

/** Kurzer Text für title/description / Karten-Popup. */
export function formatPfandSummary(lines: PfandLineComputed[]): string {
	return lines
		.map((l) => `${l.quantity}× ${l.label}`)
		.join(", ");
}

export function centsToEuroDe(cents: number): string {
	return (cents / 100).toFixed(2).replace(".", ",");
}
