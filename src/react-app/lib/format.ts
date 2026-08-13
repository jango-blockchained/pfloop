/**
 * Remaining time until a deadline (German, compact).
 * Handles overdue, sub-minute, and multi-hour windows.
 */
export function formatCountdown(deadlineIso: string, now = Date.now()): string {
	const end = new Date(deadlineIso).getTime();
	if (Number.isNaN(end)) return "—";

	const ms = end - now;
	if (ms <= 0) return "Zeit um";

	const totalSec = Math.floor(ms / 1000);
	if (totalSec < 60) return "unter 1 Min.";

	const totalMin = Math.floor(totalSec / 60);
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;

	if (h > 0) {
		return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
	}
	if (totalMin === 1) return "1 Min.";
	return `${totalMin} Min.`;
}

/** True when the deadline has passed (or is invalid → treat as not overdue). */
export function isDeadlineOverdue(deadlineIso: string, now = Date.now()): boolean {
	const end = new Date(deadlineIso).getTime();
	if (Number.isNaN(end)) return false;
	return end <= now;
}

/** Build map deep-links for an address or coordinates. */
export function mapsLinks(
	lat: number,
	lng: number,
	address?: string | null,
): { geo: string; google: string; apple: string; label: string } {
	const label = (address?.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`).trim();
	const q = encodeURIComponent(label);
	const coordQ = encodeURIComponent(`${lat},${lng}`);
	return {
		label,
		geo: `geo:${lat},${lng}?q=${q}`,
		google: `https://www.google.com/maps/search/?api=1&query=${address?.trim() ? q : coordQ}`,
		apple: `https://maps.apple.com/?ll=${lat},${lng}&q=${q}`,
	};
}

export type MapsDirPoint = { lat: number; lng: number; label?: string };

/**
 * Multi-stop driving directions deep-links (Google + Apple).
 * `waypoints` are intermediate stops between origin and destination.
 */
export function mapsDirLinks(
	origin: MapsDirPoint,
	destination: MapsDirPoint,
	waypoints: MapsDirPoint[] = [],
): { google: string; apple: string; label: string } {
	const fmt = (p: MapsDirPoint) => `${p.lat},${p.lng}`;
	const o = fmt(origin);
	const d = fmt(destination);
	const wps = waypoints.filter(Boolean);

	const googleParams = new URLSearchParams({
		api: "1",
		origin: o,
		destination: d,
		travelmode: "driving",
	});
	if (wps.length > 0) {
		googleParams.set("waypoints", wps.map(fmt).join("|"));
	}

	// Apple: saddr + daddr chain (multi-leg via " to:" where supported)
	const appleParts = [`saddr=${encodeURIComponent(o)}`];
	if (wps.length > 0) {
		const chain = [...wps.map(fmt), d].join(" to:");
		appleParts.push(`daddr=${encodeURIComponent(chain)}`);
	} else {
		appleParts.push(`daddr=${encodeURIComponent(d)}`);
	}
	appleParts.push("dirflg=d");

	const label = [
		origin.label,
		...wps.map((w) => w.label),
		destination.label,
	]
		.filter(Boolean)
		.join(" → ");

	return {
		google: `https://www.google.com/maps/dir/?${googleParams.toString()}`,
		apple: `https://maps.apple.com/?${appleParts.join("&")}`,
		label: label || "Route",
	};
}

/** Lightweight e-mail shape check (client-side only). */
export function isValidEmail(email: string): boolean {
	const t = email.trim();
	if (t.length < 5 || t.length > 254) return false;
	// pragmatic RFC-ish check; backend remains source of truth
	return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
}
