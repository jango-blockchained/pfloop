// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

/** UI labels for offer / reservation status — locale-aware via t(). */

import { t } from "../i18n/translate";

export function weekdayLabel(weekday: number): string {
	const key = `weekday.${weekday}`;
	const label = t(key);
	if (label !== key) return label;
	return t("weekday.fallback", { n: weekday });
}

export function recurringAppStatusLabel(status: string): string {
	const key = `status.recurringApp.${status}`;
	const label = t(key);
	return label !== key ? label : status;
}

export function recurringStatusLabel(status: string): string {
	if (status === "open") return t("status.recurring.open");
	if (status === "assigned") return t("status.recurring.assigned");
	if (status === "cancelled") return t("status.recurring.cancelled");
	return offerStatusLabel(status);
}

export function offerStatusLabel(status: string): string {
	const key = `status.offer.${status}`;
	const label = t(key);
	return label !== key ? label : status;
}

export function reservationStatusLabel(status: string): string {
	const key = `status.reservation.${status}`;
	const label = t(key);
	return label !== key ? label : status;
}

export function offerStatusHint(status: string): string {
	const key = `status.hint.${status}`;
	const label = t(key);
	return label !== key ? label : "";
}

export function offerStatusClass(status: string): string {
	if (status === "reserved") return "badge badge-warn";
	if (status === "collected") return "badge badge-warn";
	if (status === "assigned") return "badge badge-warn";
	if (status === "completed") return "badge badge-ok";
	if (status === "cancelled") return "badge badge-muted";
	return "badge";
}

export type OfferRole = "own" | "collector" | "public";

/**
 * Role-aware one-liner explaining what happens next.
 */
export function offerNextStep(
	status: string,
	role: OfferRole,
): string | null {
	if (status === "open") {
		if (role === "own") return t("status.next.open.own");
		if (role === "public") return t("status.next.open.public");
		return null;
	}
	if (status === "reserved") {
		if (role === "collector") return t("status.next.reserved.collector");
		if (role === "own") return t("status.next.reserved.own");
		return t("status.next.reserved.other");
	}
	if (status === "collected") {
		if (role === "own") return t("status.next.collected.own");
		if (role === "collector") return t("status.next.collected.collector");
		return t("status.next.collected.other");
	}
	if (status === "completed") return t("status.next.completed");
	if (status === "cancelled") return t("status.next.cancelled");
	return null;
}
