import {
	centsToEuroDe,
	computePfandFromItems,
	getPfandEntry,
	isPfandItemType,
	type PfandItemType,
	type PfandLineComputed,
} from "../../shared/pfand";

/** Keep in sync with worker MIN_PFAND_CENTS (€3.00, one-shot). */
export const MIN_PFAND_CENTS = 300;

/** Keep in sync with worker MIN_RECURRING_PFAND_CENTS (€2.50, weekly estimate). */
export const MIN_RECURRING_PFAND_CENTS = 250;

/**
 * Keep in sync with worker RECURRING_VALUE_THRESHOLD.
 * Weekly listed amount is an estimate; actual can be down to this share (−50 %).
 */
export const RECURRING_VALUE_THRESHOLD = 0.5;

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

/** Floor after −50 % threshold on a weekly estimate (5,00 € → 2,50 €). */
export function recurringFloorCents(estimateCents: number): number {
	if (!Number.isFinite(estimateCents) || estimateCents <= 0) return 0;
	return Math.floor(estimateCents * RECURRING_VALUE_THRESHOLD);
}

/** Cents still needed to reach the minimum offer value (0 if already met). */
export function centsUntilMinimum(
	totalCents: number,
	minCents: number = MIN_PFAND_CENTS,
): number {
	return Math.max(0, minCents - totalCents);
}

/** 0–1 progress toward the minimum Pfand value. */
export function minProgress(
	totalCents: number,
	minCents: number = MIN_PFAND_CENTS,
): number {
	if (minCents <= 0) return 1;
	return Math.min(1, Math.max(0, totalCents / minCents));
}

/** Human hint under the total, e.g. near-minimum feedback. */
export function minValueHint(
	totalCents: number,
	minCents: number = MIN_PFAND_CENTS,
	opts?: { recurring?: boolean },
): string {
	if (totalCents <= 0) {
		return opts?.recurring
			? `Mindestens ${centsToEuroDe(minCents)} € Schätzung nötig (wöchentliches Pfand schwankt)`
			: `Mindestens ${centsToEuroDe(minCents)} € Pfand nötig`;
	}
	const rest = centsUntilMinimum(totalCents, minCents);
	if (rest === 0) {
		if (opts?.recurring) {
			const floor = recurringFloorCents(totalCents);
			return `Passt – Schätzung ab ${centsToEuroDe(minCents)} € · realistisch ab ca. ${centsToEuroDe(floor)} € (−50 %)`;
		}
		return `Passt – Mindestwert von ${centsToEuroDe(minCents)} € ist drin`;
	}
	return `Noch ${centsToEuroDe(rest)} € bis zu den ${centsToEuroDe(minCents)} € Minimum`;
}

/** Short display for map/list: estimate + optional floor. */
export function formatRecurringPfandLabel(estimateCents: number): string {
	const floor = recurringFloorCents(estimateCents);
	if (floor <= 0 || floor >= estimateCents) {
		return `ca. ${centsToEuroDe(estimateCents)} €`;
	}
	return `ca. ${centsToEuroDe(estimateCents)} € · ab ~${centsToEuroDe(floor)} €`;
}
