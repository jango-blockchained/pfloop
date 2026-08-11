/** OpenStreetMap Nominatim — free geocoding (respect usage policy). */

export type GeocodeResult = {
	lat: number;
	lng: number;
	display_name: string;
	/** Short label for UI */
	label: string;
};

type NominatimItem = {
	lat: string;
	lon: string;
	display_name: string;
	address?: {
		road?: string;
		house_number?: string;
		postcode?: string;
		city?: string;
		town?: string;
		village?: string;
		suburb?: string;
		state?: string;
	};
};

const DEFAULT_TIMEOUT_MS = 8_000;

function shortLabel(item: NominatimItem): string {
	const a = item.address;
	if (!a) return item.display_name.split(",").slice(0, 3).join(",").trim();
	const street = [a.road, a.house_number].filter(Boolean).join(" ");
	const place = a.city || a.town || a.village || a.suburb || "";
	const bits = [street, a.postcode, place].filter(Boolean);
	return bits.length ? bits.join(", ") : item.display_name;
}

function mergeSignals(
	external: AbortSignal | undefined,
	timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void; didTimeout: () => boolean } {
	const ctrl = new AbortController();
	let timedOut = false;
	const onExternalAbort = () => ctrl.abort();
	if (external) {
		if (external.aborted) {
			ctrl.abort();
		} else {
			external.addEventListener("abort", onExternalAbort, { once: true });
		}
	}
	const timer = window.setTimeout(() => {
		timedOut = true;
		ctrl.abort();
	}, timeoutMs);

	return {
		signal: ctrl.signal,
		didTimeout: () => timedOut,
		cleanup: () => {
			window.clearTimeout(timer);
			external?.removeEventListener("abort", onExternalAbort);
		},
	};
}

/**
 * Search addresses (biased to Germany).
 * Nominatim requires a valid User-Agent; browser send is limited so we use a query param app name.
 */
export async function searchAddress(
	query: string,
	opts?: { limit?: number; signal?: AbortSignal; timeoutMs?: number },
): Promise<GeocodeResult[]> {
	const q = query.trim();
	if (q.length < 3) return [];

	const params = new URLSearchParams({
		q,
		format: "json",
		addressdetails: "1",
		limit: String(opts?.limit ?? 5),
		countrycodes: "de",
	});

	const { signal, cleanup, didTimeout } = mergeSignals(
		opts?.signal,
		opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
	);

	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?${params}`,
			{
				signal,
				headers: {
					Accept: "application/json",
				},
			},
		);

		if (!res.ok) {
			if (res.status === 429) {
				throw new Error("Zu viele Suchen – warte kurz und versuch’s nochmal");
			}
			throw new Error("Adresssuche gerade nicht erreichbar");
		}

		const data = (await res.json()) as NominatimItem[];
		return data.map((item) => ({
			lat: Number(item.lat),
			lng: Number(item.lon),
			display_name: item.display_name,
			label: shortLabel(item),
		}));
	} catch (e) {
		const name = e instanceof Error ? e.name : "";
		if (name === "AbortError" || name === "TimeoutError") {
			if (didTimeout() || name === "TimeoutError") {
				throw new Error("Die Suche dauert zu lange – nochmal versuchen?");
			}
			throw e;
		}
		if (e instanceof Error) {
			// Network failures often surface as TypeError in browsers
			if (e.name === "TypeError" || /failed to fetch|network/i.test(e.message)) {
				throw new Error("Keine Verbindung zur Adresssuche");
			}
			throw e;
		}
		throw new Error("Suche hat nicht geklappt");
	} finally {
		cleanup();
	}
}
