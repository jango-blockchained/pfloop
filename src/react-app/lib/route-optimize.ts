/** Lat/lng point used for haversine route optimization. */
export type LatLngPoint = {
	lat: number;
	lng: number;
};

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers. */
export function haversineKm(a: LatLngPoint, b: LatLngPoint): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pathKm(start: LatLngPoint, stops: LatLngPoint[], end: LatLngPoint): number {
	let total = 0;
	let prev = start;
	for (const s of stops) {
		total += haversineKm(prev, s);
		prev = s;
	}
	total += haversineKm(prev, end);
	return total;
}

/** Heap's algorithm — all permutations of `arr` (mutates in place via swap). */
function permute<T>(arr: T[], visitor: (perm: T[]) => void): void {
	const n = arr.length;
	const c = new Array<number>(n).fill(0);
	visitor(arr);
	let i = 1;
	while (i < n) {
		if (c[i] < i) {
			const j = i % 2 === 0 ? 0 : c[i];
			const tmp = arr[j]!;
			arr[j] = arr[i]!;
			arr[i] = tmp;
			visitor(arr);
			c[i]!++;
			i = 1;
		} else {
			c[i] = 0;
			i++;
		}
	}
}

/**
 * Fixed start/end; permute intermediate stops (≤5) for minimum total haversine.
 * Returns a new array of ordered stops (same object references) and totalKm.
 */
export function optimizeStopOrder<T extends LatLngPoint>(
	start: LatLngPoint,
	stops: T[],
	end: LatLngPoint,
): { ordered: T[]; totalKm: number } {
	if (stops.length === 0) {
		return { ordered: [], totalKm: haversineKm(start, end) };
	}
	if (stops.length === 1) {
		return {
			ordered: [stops[0]!],
			totalKm: pathKm(start, stops, end),
		};
	}
	if (stops.length > 5) {
		throw new Error("Höchstens 5 Zwischenstopps zum Optimieren");
	}

	let bestOrder = stops.slice();
	let bestKm = pathKm(start, bestOrder, end);
	const work = stops.slice();
	permute(work, (perm) => {
		const km = pathKm(start, perm, end);
		if (km < bestKm) {
			bestKm = km;
			bestOrder = perm.slice();
		}
	});
	return { ordered: bestOrder, totalKm: bestKm };
}
