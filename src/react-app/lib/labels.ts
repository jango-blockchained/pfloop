/** German UI labels for offer / reservation status. */

const OFFER: Record<string, string> = {
	open: "Frei",
	reserved: "Reserviert",
	collected: "Abgeholt – wartet auf dich",
	completed: "Fertig",
	cancelled: "Storniert",
	assigned: "Abholer fest",
};

const WEEKDAY_LABELS: Record<number, string> = {
	1: "Montag",
	2: "Dienstag",
	3: "Mittwoch",
	4: "Donnerstag",
	5: "Freitag",
	6: "Samstag",
	7: "Sonntag",
};

const RECURRING_APP: Record<string, string> = {
	pending: "Offen",
	selected: "Ausgewählt",
	rejected: "Nicht genommen",
	withdrawn: "Zurückgezogen",
};

export function weekdayLabel(weekday: number): string {
	return WEEKDAY_LABELS[weekday] ?? `Tag ${weekday}`;
}

export function recurringAppStatusLabel(status: string): string {
	return RECURRING_APP[status] ?? status;
}

export function recurringStatusLabel(status: string): string {
	if (status === "open") return "Sucht Abholer";
	if (status === "assigned") return "Abholer fest";
	if (status === "cancelled") return "Storniert";
	return OFFER[status] ?? status;
}

const RESERVATION: Record<string, string> = {
	active: "Unterwegs (noch 6 Std.)",
	collected: "Abgeholt – wartet auf Bestätigung",
	completed: "Fertig",
	released: "Freigegeben",
};

/** Short helper texts for status badges / lists. */
const OFFER_HINT: Record<string, string> = {
	open: "Kann angenommen werden. Die Adresse siehst du erst danach.",
	reserved: "Jemand holt ab – innerhalb von 6 Stunden.",
	collected: "Der Abholer war da. Du musst die Übergabe nur noch bestätigen.",
	completed: "Alles erledigt.",
	cancelled: "Wurde storniert.",
};

export function offerStatusLabel(status: string): string {
	return OFFER[status] ?? status;
}

export function reservationStatusLabel(status: string): string {
	return RESERVATION[status] ?? status;
}

export function offerStatusHint(status: string): string {
	return OFFER_HINT[status] ?? "";
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
		if (role === "own") {
			return "Dein Angebot ist online. Warte einfach, bis sich jemand meldet.";
		}
		if (role === "public") {
			return "Nimm es an – dann siehst du die Adresse und hast 6 Stunden zum Abholen.";
		}
		return null;
	}
	if (status === "reserved") {
		if (role === "collector") {
			return "Hol das Pfand ab und tipp danach auf „Abgeholt“.";
		}
		if (role === "own") {
			return "Jemand ist unterwegs. Warte, bis er oder sie „Abgeholt“ tippt.";
		}
		return "Gerade reserviert.";
	}
	if (status === "collected") {
		if (role === "own") {
			return "Bitte bestätige die Übergabe – dann ist alles erledigt.";
		}
		if (role === "collector") {
			return "Fast geschafft. Der Inserent muss nur noch bestätigen. Bis dahin kein neues Angebot.";
		}
		return "Wartet noch auf die Bestätigung.";
	}
	if (status === "completed") {
		return "Passt – Abholung erledigt.";
	}
	if (status === "cancelled") {
		return "Das Angebot wurde storniert.";
	}
	return null;
}
