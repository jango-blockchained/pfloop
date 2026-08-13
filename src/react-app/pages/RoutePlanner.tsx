import {
	MapContainer,
	TileLayer,
	CircleMarker,
	Polyline,
	Tooltip,
	useMap,
} from "react-leaflet";
import L from "leaflet";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type FormEvent,
} from "react";
import { Link, Navigate } from "react-router-dom";
import {
	centsToEuro,
	fetchMyReservations,
	fetchOffersInBbox,
	getErrorMessage,
	type PublicOffer,
	type ReservationRow,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { mapsDirLinks } from "../lib/format";
import { searchAddress, type GeocodeResult } from "../lib/geocode";
import { fetchDrivingRoute } from "../lib/osrm";
import {
	haversineKm,
	optimizeStopOrder,
	type LatLngPoint,
} from "../lib/route-optimize";
import {
	DEFAULT_MAP_CENTER,
	useGeolocation,
} from "../hooks/useGeolocation";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

const MAX_STOPS = 5;

type StartMode = "gps" | "search" | "first_stop";
type EndMode = "start" | "search" | "last_stop";

type RouteStop = {
	id: string;
	lat: number;
	lng: number;
	label: string;
	source: "reservation" | "offer" | "manual";
	offerId?: string;
	pfandCents?: number;
};

function bboxAround(lat: number, lng: number, deltaDeg = 0.06) {
	return {
		south: lat - deltaDeg,
		west: lng - deltaDeg,
		north: lat + deltaDeg,
		east: lng + deltaDeg,
	};
}

function formatDuration(sec: number): string {
	const totalMin = Math.round(sec / 60);
	if (totalMin < 1) return "unter 1 Min.";
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	if (h > 0) return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
	return totalMin === 1 ? "1 Min." : `${totalMin} Min.`;
}

function formatKm(km: number): string {
	if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
	return `${Math.round(km).toLocaleString("de-DE")} km`;
}

function FitBounds({
	points,
	fitKey,
}: {
	points: Array<[number, number]>;
	fitKey: string;
}) {
	const map = useMap();
	useEffect(() => {
		if (points.length === 0) return;
		if (points.length === 1) {
			map.setView(points[0]!, Math.max(map.getZoom(), 14), { animate: true });
			return;
		}
		const b = L.latLngBounds(points);
		map.fitBounds(b.pad(0.18), { animate: true });
		// fitKey intentionally drives re-fit (stops/route change), not `points` identity
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [map, fitKey]);
	return null;
}

export function RoutePlanner() {
	const { user, loading: authLoading } = useAuth();
	const {
		center: geoCenter,
		ready: geoReady,
		fromUser: geoFromUser,
	} = useGeolocation();

	const [startMode, setStartMode] = useState<StartMode>("gps");
	const [endMode, setEndMode] = useState<EndMode>("start");
	const [startSearch, setStartSearch] = useState("");
	const [endSearch, setEndSearch] = useState("");
	const [stopSearch, setStopSearch] = useState("");
	const [startPoint, setStartPoint] = useState<(LatLngPoint & { label: string }) | null>(
		null,
	);
	const [endPoint, setEndPoint] = useState<(LatLngPoint & { label: string }) | null>(
		null,
	);
	const [startHits, setStartHits] = useState<GeocodeResult[]>([]);
	const [endHits, setEndHits] = useState<GeocodeResult[]>([]);
	const [stopHits, setStopHits] = useState<GeocodeResult[]>([]);
	const [searching, setSearching] = useState<string | null>(null);

	const [stops, setStops] = useState<RouteStop[]>([]);
	const [reservations, setReservations] = useState<ReservationRow[]>([]);
	const [nearby, setNearby] = useState<PublicOffer[]>([]);
	const [sideLoading, setSideLoading] = useState(true);
	const [nearbyLoading, setNearbyLoading] = useState(false);

	const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
	const [routeDistanceM, setRouteDistanceM] = useState<number | null>(null);
	const [routeDurationS, setRouteDurationS] = useState<number | null>(null);
	const [straightKm, setStraightKm] = useState<number | null>(null);
	const [busy, setBusy] = useState<"optimize" | "route" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const seedDone = useRef(false);
	const routeAbort = useRef<AbortController | null>(null);

	// Default start from GPS when ready
	useEffect(() => {
		if (!geoReady) return;
		if (startMode !== "gps") return;
		setStartPoint({
			lat: geoCenter[0],
			lng: geoCenter[1],
			label: geoFromUser ? "Mein Standort (GPS)" : "Berlin (Standard)",
		});
	}, [geoReady, geoCenter, geoFromUser, startMode]);

	const loadReservations = useCallback(async () => {
		setSideLoading(true);
		try {
			const data = await fetchMyReservations();
			const open = data.reservations.filter(
				(r) =>
					r.reservation_status === "active" ||
					r.reservation_status === "collected",
			);
			setReservations(open);
			if (!seedDone.current) {
				seedDone.current = true;
				const initial = open.slice(0, MAX_STOPS).map(
					(r): RouteStop => ({
						id: `res-${r.reservation_id}`,
						lat: r.lat,
						lng: r.lng,
						label: r.address_text || r.address_hint || r.title,
						source: "reservation",
						offerId: r.offer_id,
						pfandCents: r.pfand_value_cents,
					}),
				);
				setStops(initial);
			}
			setError(null);
		} catch (e) {
			setError(getErrorMessage(e, "Abholungen laden hat nicht geklappt"));
		} finally {
			setSideLoading(false);
		}
	}, []);

	useEffect(() => {
		if (user) void loadReservations();
	}, [user, loadReservations]);

	const mapCenter = useMemo((): [number, number] => {
		if (startPoint) return [startPoint.lat, startPoint.lng];
		if (stops[0]) return [stops[0].lat, stops[0].lng];
		return geoReady ? geoCenter : DEFAULT_MAP_CENTER;
	}, [startPoint, stops, geoReady, geoCenter]);

	const loadNearby = useCallback(async () => {
		const [lat, lng] = mapCenter;
		setNearbyLoading(true);
		try {
			const data = await fetchOffersInBbox(bboxAround(lat, lng));
			setNearby(data.offers);
		} catch {
			/* optional list */
		} finally {
			setNearbyLoading(false);
		}
	}, [mapCenter]);

	useEffect(() => {
		if (!user) return;
		void loadNearby();
	}, [user, loadNearby]);

	const resolveStart = useCallback((): (LatLngPoint & { label: string }) | null => {
		if (startMode === "first_stop") {
			const s = stops[0];
			if (!s) return null;
			return { lat: s.lat, lng: s.lng, label: s.label };
		}
		return startPoint;
	}, [startMode, stops, startPoint]);

	const resolveEnd = useCallback(
		(
			origin: LatLngPoint,
			orderedStops: RouteStop[],
		): (LatLngPoint & { label: string }) | null => {
			if (endMode === "start") {
				return {
					lat: origin.lat,
					lng: origin.lng,
					label: "Start (Rundfahrt)",
				};
			}
			if (endMode === "last_stop") {
				const last = orderedStops[orderedStops.length - 1];
				if (!last) return null;
				return { lat: last.lat, lng: last.lng, label: last.label };
			}
			return endPoint;
		},
		[endMode, endPoint],
	);

	const clearRoute = useCallback(() => {
		setRouteCoords(null);
		setRouteDistanceM(null);
		setRouteDurationS(null);
		setStraightKm(null);
	}, []);

	function addStop(stop: RouteStop) {
		if (stops.some((s) => s.id === stop.id)) return;
		if (stops.length >= MAX_STOPS) {
			setError(`Maximal ${MAX_STOPS} Abholstopps`);
			return;
		}
		setError(null);
		clearRoute();
		setStops((prev) =>
			prev.some((s) => s.id === stop.id) || prev.length >= MAX_STOPS
				? prev
				: [...prev, stop],
		);
	}

	function removeStop(id: string) {
		setStops((prev) => prev.filter((s) => s.id !== id));
		clearRoute();
	}

	function moveStop(id: string, dir: -1 | 1) {
		setStops((prev) => {
			const i = prev.findIndex((s) => s.id === id);
			if (i < 0) return prev;
			const j = i + dir;
			if (j < 0 || j >= prev.length) return prev;
			const next = prev.slice();
			const a = next[i]!;
			next[i] = next[j]!;
			next[j] = a;
			return next;
		});
		clearRoute();
	}

	async function runGeocode(
		query: string,
		kind: "start" | "end" | "stop",
	) {
		const q = query.trim();
		if (q.length < 3) {
			setError("Mindestens 3 Zeichen für die Adresssuche");
			return;
		}
		setSearching(kind);
		setError(null);
		try {
			const hits = await searchAddress(q, { limit: 5 });
			if (kind === "start") setStartHits(hits);
			else if (kind === "end") setEndHits(hits);
			else setStopHits(hits);
			if (hits.length === 0) setInfo("Keine Treffer – andere Adresse versuchen?");
			else setInfo(null);
		} catch (e) {
			setError(getErrorMessage(e, "Adresssuche hat nicht geklappt"));
		} finally {
			setSearching(null);
		}
	}

	function onOptimize() {
		const origin = resolveStart();
		if (!origin) {
			setError(
				startMode === "first_stop"
					? "Mindestens einen Stopp wählen (Start = erster Stopp)"
					: "Startpunkt fehlt",
			);
			return;
		}
		if (stops.length === 0) {
			setError("Mindestens einen Abholstopp wählen");
			return;
		}

		setBusy("optimize");
		setError(null);
		setInfo(null);
		try {
			let working = stops.slice();
			let startPt: LatLngPoint = origin;
			let prefix: RouteStop[] = [];

			if (startMode === "first_stop") {
				prefix = [working[0]!];
				working = working.slice(1);
				startPt = origin;
			}

			let ordered: RouteStop[];
			let totalKm: number;

			if (endMode === "last_stop") {
				if (working.length === 0) {
					ordered = prefix;
					totalKm = 0;
				} else if (working.length === 1) {
					ordered = [...prefix, working[0]!];
					totalKm = haversineKm(startPt, working[0]!);
				} else {
					// Open path: try each stop as last
					let best: { ordered: RouteStop[]; totalKm: number } | null = null;
					for (let i = 0; i < working.length; i++) {
						const last = working[i]!;
						const middles = working.filter((_, idx) => idx !== i);
						const r = optimizeStopOrder(startPt, middles, last);
						if (!best || r.totalKm < best.totalKm) {
							best = { ordered: [...r.ordered, last], totalKm: r.totalKm };
						}
					}
					ordered = [...prefix, ...(best?.ordered ?? working)];
					totalKm = best?.totalKm ?? 0;
				}
			} else {
				const dest = resolveEnd(startPt, working);
				if (!dest) {
					setError("Zielpunkt fehlt – Adresse suchen oder Modus ändern");
					setBusy(null);
					return;
				}
				if (working.length === 0) {
					ordered = prefix;
					totalKm = haversineKm(startPt, dest);
				} else {
					const r = optimizeStopOrder(startPt, working, dest);
					ordered = [...prefix, ...r.ordered];
					totalKm = r.totalKm;
				}
			}

			setStops(ordered);
			setStraightKm(totalKm);
			clearRoute();
			setInfo(
				`Reihenfolge optimiert · Luftlinie ca. ${formatKm(totalKm)}`,
			);
		} catch (e) {
			setError(getErrorMessage(e, "Optimieren hat nicht geklappt"));
		} finally {
			setBusy(null);
		}
	}

	async function onComputeRoute() {
		const origin = resolveStart();
		if (!origin) {
			setError(
				startMode === "first_stop"
					? "Mindestens einen Stopp wählen (Start = erster Stopp)"
					: "Startpunkt fehlt",
			);
			return;
		}
		if (stops.length === 0) {
			setError("Mindestens einen Abholstopp wählen");
			return;
		}

		let pathStops = stops;
		// When start is first stop, avoid duplicating first point in waypoints
		if (startMode === "first_stop" && pathStops.length > 0) {
			pathStops = pathStops.slice(1);
		}

		const dest = resolveEnd(origin, stops);
		if (!dest) {
			setError("Zielpunkt fehlt – Adresse suchen oder Modus ändern");
			return;
		}

		// Build point list for OSRM (skip consecutive duplicates)
		const raw: LatLngPoint[] = [origin, ...pathStops, dest];
		const points: LatLngPoint[] = [];
		for (const p of raw) {
			const prev = points[points.length - 1];
			if (
				prev &&
				Math.abs(prev.lat - p.lat) < 1e-7 &&
				Math.abs(prev.lng - p.lng) < 1e-7
			) {
				continue;
			}
			points.push(p);
		}
		if (points.length < 2) {
			setError("Start und Ziel sind identisch – keine Route nötig");
			return;
		}

		routeAbort.current?.abort();
		const ac = new AbortController();
		routeAbort.current = ac;
		setBusy("route");
		setError(null);
		setInfo(null);

		try {
			const route = await fetchDrivingRoute(points, { signal: ac.signal });
			if (ac.signal.aborted) return;
			if (!route) {
				setError(
					"Route konnte nicht berechnet werden (OSRM). Später nochmal versuchen.",
				);
				setRouteCoords(null);
				setRouteDistanceM(null);
				setRouteDurationS(null);
				// still show straight-line estimate
				let km = 0;
				for (let i = 1; i < points.length; i++) {
					km += haversineKm(points[i - 1]!, points[i]!);
				}
				setStraightKm(km);
				return;
			}
			setRouteCoords(route.coordinates);
			setRouteDistanceM(route.distanceM);
			setRouteDurationS(route.durationS);
			setStraightKm(route.distanceM / 1000);
			setInfo("Route berechnet (Straßennetz)");
		} catch (e) {
			if (ac.signal.aborted) return;
			setError(getErrorMessage(e, "Route berechnen hat nicht geklappt"));
		} finally {
			if (!ac.signal.aborted) setBusy(null);
		}
	}

	const originForLinks = resolveStart();
	const destForLinks =
		originForLinks && stops.length > 0
			? resolveEnd(originForLinks, stops)
			: null;
	const waypointForLinks = useMemo(() => {
		if (!originForLinks || stops.length === 0) return [];
		let mids = stops;
		if (startMode === "first_stop") mids = mids.slice(1);
		if (endMode === "last_stop" && mids.length > 0) {
			mids = mids.slice(0, -1);
		}
		return mids.map((s) => ({ lat: s.lat, lng: s.lng }));
	}, [originForLinks, stops, startMode, endMode]);

	const dirLinks =
		originForLinks && destForLinks
			? mapsDirLinks(originForLinks, destForLinks, waypointForLinks)
			: null;

	const mapPoints = useMemo(() => {
		const pts: Array<[number, number]> = [];
		const o = resolveStart();
		if (o) pts.push([o.lat, o.lng]);
		for (const s of stops) pts.push([s.lat, s.lng]);
		const d = o ? resolveEnd(o, stops) : null;
		if (d) pts.push([d.lat, d.lng]);
		if (routeCoords) {
			for (const c of routeCoords) pts.push(c);
		}
		return pts;
	}, [resolveStart, resolveEnd, stops, routeCoords]);

	const fitKey = useMemo(() => {
		const o = resolveStart();
		const d = o ? resolveEnd(o, stops) : null;
		const stopKey = stops.map((s) => `${s.id}:${s.lat},${s.lng}`).join("|");
		const routeKey = routeCoords
			? `${routeCoords.length}:${routeCoords[0]?.join(",")}:${routeCoords[routeCoords.length - 1]?.join(",")}`
			: "";
		return `${o?.lat},${o?.lng}|${d?.lat},${d?.lng}|${stopKey}|${routeKey}|${startMode}|${endMode}`;
	}, [resolveStart, resolveEnd, stops, routeCoords, startMode, endMode]);

	const selectedOfferIds = useMemo(() => {
		const set = new Set<string>();
		for (const s of stops) {
			if (s.offerId) set.add(s.offerId);
			if (s.id.startsWith("offer-")) set.add(s.id.slice(6));
		}
		return set;
	}, [stops]);

	const unusedReservations = reservations.filter(
		(r) => !stops.some((s) => s.id === `res-${r.reservation_id}`),
	);
	const unusedNearby = nearby.filter((o) => !selectedOfferIds.has(o.id));

	if (authLoading) {
		return (
			<div className="page">
				<p className="muted" role="status">
					Einen Moment…
				</p>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const endResolvedLabel =
		endMode === "start"
			? "wie Start (Rundfahrt)"
			: endMode === "last_stop"
				? "letzter Stopp"
				: endPoint?.label ?? "Adresse wählen";

	return (
		<div className="page route-planner-page">
			<p className="back">
				<Link to="/">← Karte</Link>
			</p>

			<header className="page-header">
				<h1>Routenplaner</h1>
				<p className="page-lede muted">
					Bis zu {MAX_STOPS} Abholungen in sinnvoller Reihenfolge – Start,
					Stopps und Ziel wählen, optimieren und die Fahrroute öffnen.
				</p>
			</header>

			{error && (
				<p className="banner error" role="alert">
					{error}
				</p>
			)}
			{info && !error && (
				<p className="banner info" role="status">
					{info}
				</p>
			)}

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>Start</h2>
				</div>
				<div
					className="mode-toggle mode-toggle-3"
					role="radiogroup"
					aria-label="Startpunkt"
				>
					<label className={`mode-option ${startMode === "gps" ? "active" : ""}`}>
						<input
							type="radio"
							name="start-mode"
							checked={startMode === "gps"}
							onChange={() => {
								setStartMode("gps");
								clearRoute();
							}}
						/>
						<span>
							<strong>GPS</strong>
						</span>
					</label>
					<label
						className={`mode-option ${startMode === "search" ? "active" : ""}`}
					>
						<input
							type="radio"
							name="start-mode"
							checked={startMode === "search"}
							onChange={() => {
								setStartMode("search");
								clearRoute();
							}}
						/>
						<span>
							<strong>Adresse</strong>
						</span>
					</label>
					<label
						className={`mode-option ${startMode === "first_stop" ? "active" : ""}`}
					>
						<input
							type="radio"
							name="start-mode"
							checked={startMode === "first_stop"}
							onChange={() => {
								setStartMode("first_stop");
								clearRoute();
							}}
						/>
						<span>
							<strong>Erster Stopp</strong>
						</span>
					</label>
				</div>
				{startMode === "gps" && (
					<p className="muted small">
						{startPoint?.label ??
							(geoReady ? "Standort…" : "Standort wird ermittelt…")}
					</p>
				)}
				{startMode === "first_stop" && (
					<p className="muted small">
						{stops[0]
							? `Start an: ${stops[0].label}`
							: "Wähle unten mindestens einen Stopp."}
					</p>
				)}
				{startMode === "search" && (
					<form
						className="form"
						onSubmit={(e: FormEvent) => {
							e.preventDefault();
							void runGeocode(startSearch, "start");
						}}
					>
						<label>
							Startadresse
							<input
								type="search"
								value={startSearch}
								onChange={(e) => setStartSearch(e.target.value)}
								placeholder="Straße, PLZ, Ort…"
								autoComplete="street-address"
							/>
						</label>
						<button
							type="submit"
							className="btn btn-sm"
							disabled={searching === "start"}
						>
							{searching === "start" ? "Suche…" : "Suchen"}
						</button>
						{startHits.length > 0 && (
							<ul className="list">
								{startHits.map((h) => (
									<li key={`${h.lat}-${h.lng}-${h.label}`} className="list-item">
										<button
											type="button"
											className="btn btn-sm"
											onClick={() => {
												setStartPoint({
													lat: h.lat,
													lng: h.lng,
													label: h.label,
												});
												setStartHits([]);
												clearRoute();
												setInfo(`Start: ${h.label}`);
											}}
										>
											Übernehmen
										</button>
										<span className="list-item-meta muted small">{h.label}</span>
									</li>
								))}
							</ul>
						)}
						{startPoint && startMode === "search" && (
							<p className="muted small">Aktuell: {startPoint.label}</p>
						)}
					</form>
				)}
			</section>

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>Ziel</h2>
				</div>
				<div
					className="mode-toggle mode-toggle-3"
					role="radiogroup"
					aria-label="Zielpunkt"
				>
					<label className={`mode-option ${endMode === "start" ? "active" : ""}`}>
						<input
							type="radio"
							name="end-mode"
							checked={endMode === "start"}
							onChange={() => {
								setEndMode("start");
								clearRoute();
							}}
						/>
						<span>
							<strong>Wie Start</strong>
						</span>
					</label>
					<label
						className={`mode-option ${endMode === "search" ? "active" : ""}`}
					>
						<input
							type="radio"
							name="end-mode"
							checked={endMode === "search"}
							onChange={() => {
								setEndMode("search");
								clearRoute();
							}}
						/>
						<span>
							<strong>Adresse</strong>
						</span>
					</label>
					<label
						className={`mode-option ${endMode === "last_stop" ? "active" : ""}`}
					>
						<input
							type="radio"
							name="end-mode"
							checked={endMode === "last_stop"}
							onChange={() => {
								setEndMode("last_stop");
								clearRoute();
							}}
						/>
						<span>
							<strong>Letzter Stopp</strong>
						</span>
					</label>
				</div>
				<p className="muted small">Ziel: {endResolvedLabel}</p>
				{endMode === "search" && (
					<form
						className="form"
						onSubmit={(e: FormEvent) => {
							e.preventDefault();
							void runGeocode(endSearch, "end");
						}}
					>
						<label>
							Zieladresse
							<input
								type="search"
								value={endSearch}
								onChange={(e) => setEndSearch(e.target.value)}
								placeholder="Straße, PLZ, Ort…"
								autoComplete="street-address"
							/>
						</label>
						<button
							type="submit"
							className="btn btn-sm"
							disabled={searching === "end"}
						>
							{searching === "end" ? "Suche…" : "Suchen"}
						</button>
						{endHits.length > 0 && (
							<ul className="list">
								{endHits.map((h) => (
									<li key={`${h.lat}-${h.lng}-${h.label}`} className="list-item">
										<button
											type="button"
											className="btn btn-sm"
											onClick={() => {
												setEndPoint({
													lat: h.lat,
													lng: h.lng,
													label: h.label,
												});
												setEndHits([]);
												clearRoute();
												setInfo(`Ziel: ${h.label}`);
											}}
										>
											Übernehmen
										</button>
										<span className="list-item-meta muted small">{h.label}</span>
									</li>
								))}
							</ul>
						)}
					</form>
				)}
			</section>

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>Abholstopps</h2>
					<span className="muted small panel-head-meta">
						{stops.length}/{MAX_STOPS}
					</span>
				</div>

				{sideLoading && stops.length === 0 && (
					<p className="muted" role="status">
						Lade deine Abholungen…
					</p>
				)}

				{stops.length === 0 && !sideLoading && (
					<p className="muted small">
						Noch keine Stopps – wähle Abholungen, offene Angebote in der Nähe
						oder suche eine Adresse.
					</p>
				)}

				{stops.length > 0 && (
					<ul className="list">
						{stops.map((s, idx) => (
							<li key={s.id} className="list-item">
								<div className="list-item-main">
									<span className="list-item-title">
										<strong>
											{idx + 1}.{" "}
											{s.offerId ? (
												<Link to={`/angebot/${s.offerId}`}>{s.label}</Link>
											) : (
												s.label
											)}
										</strong>
									</span>
									{s.pfandCents != null && (
										<span className="list-pfand">
											{centsToEuro(s.pfandCents)} €
										</span>
									)}
								</div>
								<div className="meta list-item-meta">
									{s.source === "reservation"
										? "Meine Abholung"
										: s.source === "offer"
											? "Offenes Angebot"
											: "Manuell"}
								</div>
								<div className="list-item-actions">
									<button
										type="button"
										className="btn btn-sm"
										disabled={idx === 0}
										onClick={() => moveStop(s.id, -1)}
										aria-label="Nach oben"
									>
										↑
									</button>
									<button
										type="button"
										className="btn btn-sm"
										disabled={idx === stops.length - 1}
										onClick={() => moveStop(s.id, 1)}
										aria-label="Nach unten"
									>
										↓
									</button>
									<button
										type="button"
										className="btn btn-sm"
										onClick={() => removeStop(s.id)}
									>
										Entfernen
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				{unusedReservations.length > 0 && (
					<>
						<h3 className="form-section-title">Aus meinen Abholungen</h3>
						<ul className="list">
							{unusedReservations.map((r) => (
								<li key={r.reservation_id} className="list-item">
									<div className="list-item-main">
										<span className="list-item-title">
											<strong>{r.title}</strong>
										</span>
										<span className="list-pfand">
											{centsToEuro(r.pfand_value_cents)} €
										</span>
									</div>
									<div className="meta list-item-meta">
										{r.address_text || r.address_hint}
									</div>
									<div className="list-item-actions">
										<button
											type="button"
											className="btn btn-sm btn-primary"
											disabled={stops.length >= MAX_STOPS}
											onClick={() =>
												addStop({
													id: `res-${r.reservation_id}`,
													lat: r.lat,
													lng: r.lng,
													label: r.address_text || r.address_hint || r.title,
													source: "reservation",
													offerId: r.offer_id,
													pfandCents: r.pfand_value_cents,
												})
											}
										>
											+ Stopp
										</button>
									</div>
								</li>
							))}
						</ul>
					</>
				)}

				<div className="panel-head" style={{ marginTop: "0.75rem" }}>
					<h3 className="form-section-title" style={{ margin: 0 }}>
						Offene Angebote in der Nähe
					</h3>
					<button
						type="button"
						className="btn btn-sm"
						disabled={nearbyLoading}
						onClick={() => void loadNearby()}
					>
						{nearbyLoading ? "…" : "Aktualisieren"}
					</button>
				</div>
				{nearbyLoading && unusedNearby.length === 0 && (
					<p className="muted small">Lade Angebote…</p>
				)}
				{!nearbyLoading && unusedNearby.length === 0 && (
					<p className="muted small">Keine weiteren offenen Angebote hier.</p>
				)}
				{unusedNearby.length > 0 && (
					<ul className="list">
						{unusedNearby.slice(0, 8).map((o) => (
							<li key={o.id} className="list-item">
								<div className="list-item-main">
									<span className="list-item-title">
										<strong>{o.title?.trim() || "Pfand-Angebot"}</strong>
									</span>
									<span className="list-pfand">
										{centsToEuro(o.pfand_value_cents)} €
									</span>
								</div>
								<div className="meta list-item-meta">
									{o.address_hint || "Ungefähre Lage"}
								</div>
								<div className="list-item-actions">
									<button
										type="button"
										className="btn btn-sm btn-primary"
										disabled={stops.length >= MAX_STOPS}
										onClick={() =>
											addStop({
												id: `offer-${o.id}`,
												lat: o.lat,
												lng: o.lng,
												label: o.address_hint || o.title || "Angebot",
												source: "offer",
												offerId: o.id,
												pfandCents: o.pfand_value_cents,
											})
										}
									>
										+ Stopp
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				<form
					className="form"
					style={{ marginTop: "0.75rem" }}
					onSubmit={(e: FormEvent) => {
						e.preventDefault();
						void runGeocode(stopSearch, "stop");
					}}
				>
					<label>
						Stopp per Adresse
						<input
							type="search"
							value={stopSearch}
							onChange={(e) => setStopSearch(e.target.value)}
							placeholder="Adresse hinzufügen…"
							autoComplete="street-address"
						/>
					</label>
					<button
						type="submit"
						className="btn btn-sm"
						disabled={searching === "stop" || stops.length >= MAX_STOPS}
					>
						{searching === "stop" ? "Suche…" : "Suchen"}
					</button>
					{stopHits.length > 0 && (
						<ul className="list">
							{stopHits.map((h) => (
								<li key={`${h.lat}-${h.lng}-${h.label}`} className="list-item">
									<button
										type="button"
										className="btn btn-sm btn-primary"
										disabled={stops.length >= MAX_STOPS}
										onClick={() => {
											addStop({
												id: `manual-${h.lat}-${h.lng}-${Date.now()}`,
												lat: h.lat,
												lng: h.lng,
												label: h.label,
												source: "manual",
											});
											setStopHits([]);
											setStopSearch("");
										}}
									>
										+ Stopp
									</button>
									<span className="list-item-meta muted small">{h.label}</span>
								</li>
							))}
						</ul>
					)}
				</form>
			</section>

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>Route</h2>
				</div>
				<div className="list-item-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
					<button
						type="button"
						className="btn btn-primary"
						disabled={busy != null || stops.length === 0}
						onClick={() => onOptimize()}
					>
						{busy === "optimize" ? "…" : "Optimieren"}
					</button>
					<button
						type="button"
						className="btn btn-primary"
						disabled={busy != null || stops.length === 0}
						onClick={() => void onComputeRoute()}
					>
						{busy === "route" ? "Berechne…" : "Route berechnen"}
					</button>
					{dirLinks && (
						<a
							className="btn btn-sm"
							href={dirLinks.google}
							target="_blank"
							rel="noopener noreferrer"
						>
							In Google Maps öffnen
						</a>
					)}
					{dirLinks && (
						<a
							className="btn btn-sm"
							href={dirLinks.apple}
							target="_blank"
							rel="noopener noreferrer"
						>
							In Apple Maps öffnen
						</a>
					)}
				</div>
				{(routeDistanceM != null || straightKm != null) && (
					<p className="muted" role="status">
						{routeDistanceM != null && routeDurationS != null ? (
							<>
								Strecke ca.{" "}
								<strong>{formatKm(routeDistanceM / 1000)}</strong>
								{" · "}
								Dauer ca. <strong>{formatDuration(routeDurationS)}</strong>
							</>
						) : straightKm != null ? (
							<>
								Luftlinie ca. <strong>{formatKm(straightKm)}</strong>
							</>
						) : null}
					</p>
				)}
			</section>

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>Karte</h2>
				</div>
				<div className="form-map-inner route-planner-map">
					<div className="map-wrap">
						<MapContainer
							center={mapCenter}
							zoom={13}
							className="map"
							scrollWheelZoom
							zoomControl={false}
						>
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							<FitBounds points={mapPoints} fitKey={fitKey} />
							{(() => {
								const o = resolveStart();
								if (!o) return null;
								return (
									<CircleMarker
										center={[o.lat, o.lng]}
										radius={11}
										pathOptions={{
											color: "#5B4FE9",
											fillColor: "#818CF8",
											fillOpacity: 0.95,
											weight: 2,
										}}
									>
										<Tooltip permanent direction="top" offset={[0, -8]}>
											Start
										</Tooltip>
									</CircleMarker>
								);
							})()}
							{stops.map((s, idx) => (
								<CircleMarker
									key={s.id}
									center={[s.lat, s.lng]}
									radius={12}
									pathOptions={{
										color: "#1d4ed8",
										fillColor: "#3b82f6",
										fillOpacity: 0.95,
										weight: 2,
									}}
								>
									<Tooltip permanent direction="top" offset={[0, -8]}>
										{idx + 1}
									</Tooltip>
								</CircleMarker>
							))}
							{(() => {
								const o = resolveStart();
								const d = o ? resolveEnd(o, stops) : null;
								if (!d || !o) return null;
								// Skip extra end marker if it coincides with last stop / start
								const sameAsStart =
									Math.abs(d.lat - o.lat) < 1e-6 &&
									Math.abs(d.lng - o.lng) < 1e-6;
								const last = stops[stops.length - 1];
								const sameAsLast =
									last &&
									Math.abs(d.lat - last.lat) < 1e-6 &&
									Math.abs(d.lng - last.lng) < 1e-6;
								if (sameAsStart || sameAsLast) return null;
								return (
									<CircleMarker
										center={[d.lat, d.lng]}
										radius={11}
										pathOptions={{
											color: "#9f1239",
											fillColor: "#f43f5e",
											fillOpacity: 0.95,
											weight: 2,
										}}
									>
										<Tooltip permanent direction="top" offset={[0, -8]}>
											Ziel
										</Tooltip>
									</CircleMarker>
								);
							})()}
							{routeCoords && routeCoords.length > 1 && (
								<Polyline
									positions={routeCoords}
									pathOptions={{ color: "#5B4FE9", weight: 5, opacity: 0.85 }}
								/>
							)}
						</MapContainer>
					</div>
				</div>
			</section>
		</div>
	);
}
