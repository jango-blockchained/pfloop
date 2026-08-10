import { RESERVATION_HOURS } from "./constants";

export function nowIso(): string {
	return new Date().toISOString();
}

/** Deadline = accept time + RESERVATION_HOURS. */
export function reservationDeadlineIso(acceptedAt: Date = new Date()): string {
	const d = new Date(acceptedAt.getTime());
	d.setHours(d.getHours() + RESERVATION_HOURS);
	return d.toISOString();
}

export function isPast(iso: string, now: Date = new Date()): boolean {
	return new Date(iso).getTime() <= now.getTime();
}
