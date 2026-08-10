import { MIN_PFAND_CENTS } from "./constants";

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

export function assertMinPfand(cents: number): string | null {
	if (cents < MIN_PFAND_CENTS) {
		return `Mindest-Pfandwert ist ${centsToEuroString(MIN_PFAND_CENTS)} €`;
	}
	return null;
}
