// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import type { LatLngPoint } from "./route-optimize";

export type OsrmRoute = {
	/** Leaflet-friendly [lat, lng] vertices along the driving route. */
	coordinates: [number, number][];
	distanceM: number;
	durationS: number;
};

type OsrmResponse = {
	code?: string;
	routes?: Array<{
		distance: number;
		duration: number;
		geometry?: {
			coordinates?: [number, number][];
		};
	}>;
};

/**
 * Driving route via public OSRM demo server (no API key).
 * Returns null on network/HTTP/routing failure.
 */
export async function fetchDrivingRoute(
	points: LatLngPoint[],
	opts?: { signal?: AbortSignal },
): Promise<OsrmRoute | null> {
	if (points.length < 2) return null;

	const path = points.map((p) => `${p.lng},${p.lat}`).join(";");
	const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;

	try {
		const res = await fetch(url, {
			signal: opts?.signal,
			headers: { Accept: "application/json" },
		});
		if (!res.ok) return null;

		const data = (await res.json()) as OsrmResponse;
		if (data.code !== "Ok" || !data.routes?.[0]) return null;

		const route = data.routes[0];
		const raw = route.geometry?.coordinates;
		if (!raw?.length) return null;

		// GeoJSON is [lng, lat] → Leaflet [lat, lng]
		const coordinates: [number, number][] = raw.map(([lng, lat]) => [lat, lng]);
		return {
			coordinates,
			distanceM: route.distance,
			durationS: route.duration,
		};
	} catch {
		return null;
	}
}
