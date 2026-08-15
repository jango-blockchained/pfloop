// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { CONFIRM_HOURS, RESERVATION_HOURS } from "./constants";

export function nowIso(): string {
	return new Date().toISOString();
}

/** Deadline = accept time + RESERVATION_HOURS. */
export function reservationDeadlineIso(acceptedAt: Date = new Date()): string {
	const d = new Date(acceptedAt.getTime());
	d.setHours(d.getHours() + RESERVATION_HOURS);
	return d.toISOString();
}

/** Confirm deadline = collected time + CONFIRM_HOURS. */
export function confirmDeadlineIso(collectedAt: Date = new Date()): string {
	const d = new Date(collectedAt.getTime());
	d.setHours(d.getHours() + CONFIRM_HOURS);
	return d.toISOString();
}

/** Calendar day key in Europe/Berlin as YYYY-MM-DD. */
export function berlinDayKey(date: Date = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Berlin",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function isPast(iso: string, now: Date = new Date()): boolean {
	return new Date(iso).getTime() <= now.getTime();
}

/** ISO timestamp that is `hours` before `now` (for SQL comparisons). */
export function hoursAgoIso(hours: number, now: Date = new Date()): string {
	return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}
