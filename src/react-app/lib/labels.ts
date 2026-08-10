/** German UI labels for offer / reservation status. */

const OFFER: Record<string, string> = {
	open: "Offen",
	reserved: "Reserviert",
	collected: "Abgeholt — wartet auf Bestätigung",
	completed: "Erledigt",
	cancelled: "Storniert",
};

const RESERVATION: Record<string, string> = {
	active: "Unterwegs (6h-Fenster)",
	collected: "Abgeholt — wartet auf Bestätigung",
	completed: "Erledigt",
	released: "Freigegeben",
};

/** Short helper texts for status badges / lists. */
const OFFER_HINT: Record<string, string> = {
	open: "Frei zur Annahme — Adresse erst danach sichtbar.",
	reserved: "Reserviert — Abholung innerhalb von 6 Stunden.",
	collected: "Abholer hat gemeldet — Inserent muss bestätigen.",
	completed: "Zwei-Schritt-Übergabe abgeschlossen.",
	cancelled: "Angebot wurde storniert.",
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
			return "Dein Angebot ist sichtbar. Warte auf einen Abholer.";
		}
		if (role === "public") {
			return "Annehmen, um die Adresse zu sehen und innerhalb von 6 Stunden abzuholen.";
		}
		return null;
	}
	if (status === "reserved") {
		if (role === "collector") {
			return "Schritt 1/2: Hole das Pfand ab und melde es hier als „Abgeholt“.";
		}
		if (role === "own") {
			return "Ein Abholer ist unterwegs. Warte auf die Meldung „Abgeholt“.";
		}
		return "Derzeit reserviert.";
	}
	if (status === "collected") {
		if (role === "own") {
			return "Schritt 2/2: Bitte bestätige die Übergabe — erst dann ist alles erledigt.";
		}
		if (role === "collector") {
			return "Warte auf die Bestätigung des Inserenten. Bis dahin kein neues Angebot.";
		}
		return "Übergabe wartet auf Bestätigung.";
	}
	if (status === "completed") {
		return "Übergabe bestätigt — Abholung erledigt.";
	}
	if (status === "cancelled") {
		return "Dieses Angebot wurde storniert.";
	}
	return null;
}
