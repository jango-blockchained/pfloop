// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

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
import { useT } from "../i18n";
import { t as translate, getLocale } from "../i18n/translate";
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
	if (totalMin < 1) return translate("time.underOneMin");
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	if (h > 0) {
		return m > 0
			? translate("time.hoursMins", { h, m })
			: translate("time.hoursOnly", { h });
	}
	return totalMin === 1
		? translate("time.oneMin")
		: translate("time.mins", { n: totalMin });
}

function formatKm(km: number): string {
	const loc = getLocale() === "en" ? "en-GB" : "de-DE";
	const value =
		km < 10
			? km.toFixed(1).replace(".", loc.startsWith("de") ? "," : ".")
			: Math.round(km).toLocaleString(loc);
	return translate("route.km", { km: value });
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
	const t = useT();
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
			label: geoFromUser ? t("route.start.gps") : t("route.berlinDefault"),
		});
	}, [geoReady, geoCenter, geoFromUser, startMode, t]);

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
			setError(getErrorMessage(e, t("route.loadPickupsFailed")));
		} finally {
			setSideLoading(false);
		}
	}, [t]);

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
					label: t("route.end.loop"),
				};
			}
			if (endMode === "last_stop") {
				const last = orderedStops[orderedStops.length - 1];
				if (!last) return null;
				return { lat: last.lat, lng: last.lng, label: last.label };
			}
			return endPoint;
		},
		[endMode, endPoint, t],
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
			setError(t("route.maxStops", { n: MAX_STOPS }));
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
			setError(t("route.search.minChars"));
			return;
		}
		setSearching(kind);
		setError(null);
		try {
			const hits = await searchAddress(q, { limit: 5 });
			if (kind === "start") setStartHits(hits);
			else if (kind === "end") setEndHits(hits);
			else setStopHits(hits);
			if (hits.length === 0) setInfo(t("route.search.none"));
			else setInfo(null);
		} catch (e) {
			setError(getErrorMessage(e, t("route.search.failed")));
		} finally {
			setSearching(null);
		}
	}

	function onOptimize() {
		const origin = resolveStart();
		if (!origin) {
			setError(
				startMode === "first_stop"
					? t("route.needStopAsStart")
					: t("route.needStart"),
			);
			return;
		}
		if (stops.length === 0) {
			setError(t("route.needStops"));
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
					setError(t("route.needEnd"));
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
			setInfo(t("route.optimized", { km: formatKm(totalKm) }));
		} catch (e) {
			setError(getErrorMessage(e, t("route.optimizeFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onComputeRoute() {
		const origin = resolveStart();
		if (!origin) {
			setError(
				startMode === "first_stop"
					? t("route.needStopAsStart")
					: t("route.needStart"),
			);
			return;
		}
		if (stops.length === 0) {
			setError(t("route.needStops"));
			return;
		}

		let pathStops = stops;
		// When start is first stop, avoid duplicating first point in waypoints
		if (startMode === "first_stop" && pathStops.length > 0) {
			pathStops = pathStops.slice(1);
		}

		const dest = resolveEnd(origin, stops);
		if (!dest) {
			setError(t("route.needEnd"));
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
			setError(t("route.identical"));
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
				setError(t("route.osrmFailed"));
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
			setInfo(t("route.computed"));
		} catch (e) {
			if (ac.signal.aborted) return;
			setError(getErrorMessage(e, t("route.computeFailed")));
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
					{t("common.loadingMoment")}
				</p>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const endResolvedLabel =
		endMode === "start"
			? t("route.endLabel.loop")
			: endMode === "last_stop"
				? t("route.endLabel.last")
				: endPoint?.label ?? t("route.endLabel.choose");

	return (
		<div className="page route-planner-page">
			<p className="back">
				<Link to="/">{t("common.backMap")}</Link>
			</p>

			<header className="page-header">
				<h1>{t("route.title")}</h1>
				<p className="page-lede muted">
					{t("route.lede", { max: MAX_STOPS })}
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
					<h2>{t("route.section.start")}</h2>
				</div>
				<div
					className="mode-toggle mode-toggle-3"
					role="radiogroup"
					aria-label={t("route.section.start")}
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
							<strong>{t("route.mode.gps")}</strong>
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
							<strong>{t("route.mode.address")}</strong>
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
							<strong>{t("route.mode.firstStop")}</strong>
						</span>
					</label>
				</div>
				{startMode === "gps" && (
					<p className="muted small">
						{startPoint?.label ??
							(geoReady ? t("route.start.gps") : t("route.locating"))}
					</p>
				)}
				{startMode === "first_stop" && (
					<p className="muted small">
						{stops[0]
							? t("route.startAt", { label: stops[0].label })
							: t("route.pickStop")}
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
							{t("route.startAddress")}
							<input
								type="search"
								value={startSearch}
								onChange={(e) => setStartSearch(e.target.value)}
								placeholder={t("route.addressPlaceholder")}
								autoComplete="street-address"
							/>
						</label>
						<button
							type="submit"
							className="btn btn-sm"
							disabled={searching === "start"}
						>
							{searching === "start" ? t("common.searching") : t("common.search")}
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
												setInfo(t("route.info.start", { label: h.label }));
											}}
										>
											{t("route.take")}
										</button>
										<span className="list-item-meta muted small">{h.label}</span>
									</li>
								))}
							</ul>
						)}
						{startPoint && startMode === "search" && (
							<p className="muted small">
								{t("route.info.current", { label: startPoint.label })}
							</p>
						)}
					</form>
				)}
			</section>

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>{t("route.section.end")}</h2>
				</div>
				<div
					className="mode-toggle mode-toggle-3"
					role="radiogroup"
					aria-label={t("route.section.end")}
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
							<strong>{t("route.mode.likeStart")}</strong>
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
							<strong>{t("route.mode.address")}</strong>
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
							<strong>{t("route.mode.lastStop")}</strong>
						</span>
					</label>
				</div>
				<p className="muted small">
					{t("route.info.end", { label: endResolvedLabel })}
				</p>
				{endMode === "search" && (
					<form
						className="form"
						onSubmit={(e: FormEvent) => {
							e.preventDefault();
							void runGeocode(endSearch, "end");
						}}
					>
						<label>
							{t("route.endAddress")}
							<input
								type="search"
								value={endSearch}
								onChange={(e) => setEndSearch(e.target.value)}
								placeholder={t("route.addressPlaceholder")}
								autoComplete="street-address"
							/>
						</label>
						<button
							type="submit"
							className="btn btn-sm"
							disabled={searching === "end"}
						>
							{searching === "end" ? t("common.searching") : t("common.search")}
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
												setInfo(t("route.info.end", { label: h.label }));
											}}
										>
											{t("route.take")}
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
					<h2>{t("route.section.stops")}</h2>
					<span className="muted small panel-head-meta">
						{stops.length}/{MAX_STOPS}
					</span>
				</div>

				{sideLoading && stops.length === 0 && (
					<p className="muted" role="status">
						{t("route.loadingPickups")}
					</p>
				)}

				{stops.length === 0 && !sideLoading && (
					<p className="muted small">{t("route.stopsEmpty")}</p>
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
										? t("route.stopSource.reservation")
										: s.source === "offer"
											? t("route.stopSource.offer")
											: t("route.stopSource.manual")}
								</div>
								<div className="list-item-actions">
									<button
										type="button"
										className="btn btn-sm"
										disabled={idx === 0}
										onClick={() => moveStop(s.id, -1)}
										aria-label={t("route.moveUp")}
									>
										↑
									</button>
									<button
										type="button"
										className="btn btn-sm"
										disabled={idx === stops.length - 1}
										onClick={() => moveStop(s.id, 1)}
										aria-label={t("route.moveDown")}
									>
										↓
									</button>
									<button
										type="button"
										className="btn btn-sm"
										onClick={() => removeStop(s.id)}
									>
										{t("route.remove")}
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				{unusedReservations.length > 0 && (
					<>
						<h3 className="form-section-title">{t("route.fromPickups")}</h3>
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
											{t("route.addStop")}
										</button>
									</div>
								</li>
							))}
						</ul>
					</>
				)}

				<div className="panel-head" style={{ marginTop: "0.75rem" }}>
					<h3 className="form-section-title" style={{ margin: 0 }}>
						{t("route.nearbyOffers")}
					</h3>
					<button
						type="button"
						className="btn btn-sm"
						disabled={nearbyLoading}
						onClick={() => void loadNearby()}
					>
						{nearbyLoading ? "…" : t("route.nearby.refresh")}
					</button>
				</div>
				{nearbyLoading && unusedNearby.length === 0 && (
					<p className="muted small">{t("route.nearby.loading")}</p>
				)}
				{!nearbyLoading && unusedNearby.length === 0 && (
					<p className="muted small">{t("route.nearby.empty")}</p>
				)}
				{unusedNearby.length > 0 && (
					<ul className="list">
						{unusedNearby.slice(0, 8).map((o) => (
							<li key={o.id} className="list-item">
								<div className="list-item-main">
									<span className="list-item-title">
										<strong>
											{o.title?.trim() || t("offer.fallbackTitle")}
										</strong>
									</span>
									<span className="list-pfand">
										{centsToEuro(o.pfand_value_cents)} €
									</span>
								</div>
								<div className="meta list-item-meta">
									{o.address_hint || t("map.approxLocation")}
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
												label:
													o.address_hint || o.title || t("offer.fallbackTitle"),
												source: "offer",
												offerId: o.id,
												pfandCents: o.pfand_value_cents,
											})
										}
									>
										{t("route.addStop")}
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
						{t("route.stopAddress")}
						<input
							type="search"
							value={stopSearch}
							onChange={(e) => setStopSearch(e.target.value)}
							placeholder={t("route.addAddressPlaceholder")}
							autoComplete="street-address"
						/>
					</label>
					<button
						type="submit"
						className="btn btn-sm"
						disabled={searching === "stop" || stops.length >= MAX_STOPS}
					>
						{searching === "stop" ? t("common.searching") : t("common.search")}
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
										{t("route.addStop")}
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
					<h2>{t("route.section.route")}</h2>
				</div>
				<div className="list-item-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
					<button
						type="button"
						className="btn btn-primary"
						disabled={busy != null || stops.length === 0}
						onClick={() => onOptimize()}
					>
						{busy === "optimize"
							? t("route.actions.optimizing")
							: t("route.actions.optimize")}
					</button>
					<button
						type="button"
						className="btn btn-primary"
						disabled={busy != null || stops.length === 0}
						onClick={() => void onComputeRoute()}
					>
						{busy === "route"
							? t("route.actions.computing")
							: t("route.actions.compute")}
					</button>
					{dirLinks && (
						<a
							className="btn btn-sm"
							href={dirLinks.google}
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("route.openGoogle")}
						</a>
					)}
					{dirLinks && (
						<a
							className="btn btn-sm"
							href={dirLinks.apple}
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("route.openApple")}
						</a>
					)}
				</div>
				{(routeDistanceM != null || straightKm != null) && (
					<p className="muted" role="status">
						{routeDistanceM != null && routeDurationS != null
							? t("route.stats.drive", {
									km: formatKm(routeDistanceM / 1000),
									dur: formatDuration(routeDurationS),
								})
							: straightKm != null
								? t("route.stats.straight", { km: formatKm(straightKm) })
								: null}
					</p>
				)}
			</section>

			<section className="panel-block panel-section">
				<div className="panel-head">
					<h2>{t("route.section.map")}</h2>
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
											{t("route.map.start")}
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
											{t("route.map.end")}
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
