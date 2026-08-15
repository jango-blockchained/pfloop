// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import {
	MIN_PFAND_CENTS,
	MIN_RECURRING_PFAND_CENTS,
	RECURRING_VALUE_THRESHOLD,
} from "./constants";

/** Parse euros like "12,50" or "12.50" to cents. Returns null if invalid. */
export function eurosToCents(input: string | number): number | null {
	if (typeof input === "number") {
		if (!Number.isFinite(input) || input < 0) return null;
		return Math.round(input * 100);
	}
	const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
	if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
	const euros = Number(normalized);
	if (!Number.isFinite(euros)) return null;
	return Math.round(euros * 100);
}

export function centsToEuroString(cents: number): string {
	return (cents / 100).toFixed(2).replace(".", ",");
}

/** Floor of a weekly estimate after the −threshold (e.g. 50 % of 5 € → 2,50 €). */
export function recurringFloorCents(estimateCents: number): number {
	if (!Number.isFinite(estimateCents) || estimateCents <= 0) return 0;
	return Math.floor(estimateCents * RECURRING_VALUE_THRESHOLD);
}

export function assertMinPfand(
	cents: number,
	minCents: number = MIN_PFAND_CENTS,
): string | null {
	if (cents < minCents) {
		return `Mindestens ${centsToEuroString(minCents)} € Pfand nötig`;
	}
	return null;
}

export function assertMinRecurringPfand(cents: number): string | null {
	return assertMinPfand(cents, MIN_RECURRING_PFAND_CENTS);
}
