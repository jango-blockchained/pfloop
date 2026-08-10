import {
	centsToEuroDe,
	computePfandFromItems,
	getPfandEntry,
	isPfandItemType,
	type PfandItemType,
	type PfandLineComputed,
} from "../../shared/pfand";

/** Keep in sync with worker MIN_PFAND_CENTS (€3.00). */
export const MIN_PFAND_CENTS = 300;

export type QtyMap = Record<PfandItemType, number>;

export function quantitiesToItems(
	q: QtyMap,
): Array<{ type: PfandItemType; quantity: number }> {
	return (Object.entries(q) as [PfandItemType, number][])
		.filter(([, quantity]) => quantity > 0)
		.map(([type, quantity]) => ({ type, quantity }));
}

export function totalFromQuantities(q: QtyMap): {
	totalCents: number;
	lines: PfandLineComputed[];
	error: string | null;
} {
	const result = computePfandFromItems(quantitiesToItems(q));
	if (!result.ok) {
		return { totalCents: 0, lines: [], error: result.error };
	}
	return {
		totalCents: result.total_cents,
		lines: result.lines,
		error: null,
	};
}

export type OfferItemDto = {
	item_type: string;
	quantity: number;
	unit_cents: number;
	line_cents: number;
};

export function labelForItemType(type: string): string {
	if (isPfandItemType(type)) return getPfandEntry(type).label;
	return type;
}

export function formatItemsShort(items: OfferItemDto[] | undefined): string {
	if (!items?.length) return "";
	return items
		.map((i) => `${i.quantity}× ${labelForItemType(i.item_type)}`)
		.join(", ");
}

/** Cents still needed to reach the minimum offer value (0 if already met). */
export function centsUntilMinimum(totalCents: number): number {
	return Math.max(0, MIN_PFAND_CENTS - totalCents);
}

/** 0–1 progress toward the minimum Pfand value. */
export function minProgress(totalCents: number): number {
	if (MIN_PFAND_CENTS <= 0) return 1;
	return Math.min(1, Math.max(0, totalCents / MIN_PFAND_CENTS));
}

/** Human hint under the total, e.g. near-minimum feedback. */
export function minValueHint(totalCents: number): string {
	if (totalCents <= 0) {
		return `Mindest-Pfandwert: ${centsToEuroDe(MIN_PFAND_CENTS)} €`;
	}
	const rest = centsUntilMinimum(totalCents);
	if (rest === 0) {
		return `Mindestwert von ${centsToEuroDe(MIN_PFAND_CENTS)} € erreicht`;
	}
	return `Noch ${centsToEuroDe(rest)} € bis zum Mindestwert (${centsToEuroDe(MIN_PFAND_CENTS)} €)`;
}
