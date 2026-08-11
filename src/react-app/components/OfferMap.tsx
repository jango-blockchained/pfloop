import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	useMap,
	useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import {
	memo,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type FormEvent,
	type KeyboardEvent,
} from "react";
import {
	centsToEuro,
	type PublicOffer,
	type PublicRecurringOffer,
} from "../lib/api";
import { formatItemsShort } from "../lib/pfand-ui";
import { weekdayLabel } from "../lib/labels";
import { searchAddress, type GeocodeResult } from "../lib/geocode";
import { DEFAULT_MAP_CENTER } from "../hooks/useGeolocation";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet default icon paths break under Vite bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

export type MapFlyTarget = {
	lat: number;
	lng: number;
	zoom?: number;
	/** Increment / change identity to re-trigger fly even to same coords */
	key: number;
};

type Props = {
	offers: PublicOffer[];
	/** Optional weekly recurring pins (open only). */
	recurringOffers?: PublicRecurringOffer[];
	center?: [number, number];
	/** Fly once when initial center is ready (e.g. first geolocation). */
	followCenterOnce?: boolean;
	/** Programmatic fly (search / relocate). */
	flyTo?: MapFlyTarget | null;
	onBoundsChange?: (bbox: {
		south: number;
		west: number;
		north: number;
		east: number;
	}) => void;
	pickMode?: boolean;
	pickPosition?: [number, number] | null;
	onPick?: (lat: number, lng: number) => void;
	/** Address search + relocate controls on the map */
	showControls?: boolean;
	/** After geocode select or relocate (lat/lng + optional address label) */
	onLocationResolved?: (loc: {
		lat: number;
		lng: number;
		label?: string;
	}) => void;
	className?: string;
};

const recurringIcon = L.divIcon({
	className: "map-marker-recurring",
	html: `<span class="map-marker-recurring-inner" title="Wöchentlich">↻</span>`,
	iconSize: [28, 28],
	iconAnchor: [14, 28],
	popupAnchor: [0, -24],
});

function BoundsWatcher({
	onBoundsChange,
}: {
	onBoundsChange: Props["onBoundsChange"];
}) {
	const map = useMapEvents({
		moveend: () => {
			const b = map.getBounds();
			onBoundsChange?.({
				south: b.getSouth(),
				west: b.getWest(),
				north: b.getNorth(),
				east: b.getEast(),
			});
		},
	});

	useEffect(() => {
		const b = map.getBounds();
		onBoundsChange?.({
			south: b.getSouth(),
			west: b.getWest(),
			north: b.getNorth(),
			east: b.getEast(),
		});
	}, [map, onBoundsChange]);

	return null;
}

function FlyToTarget({ target }: { target: MapFlyTarget | null | undefined }) {
	const map = useMap();
	useEffect(() => {
		if (!target) return;
		map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 14), {
			duration: 0.8,
		});
	}, [map, target?.key, target?.lat, target?.lng, target?.zoom]);
	return null;
}

function InitialCenterOnce({
	center,
	enabled,
}: {
	center: [number, number];
	enabled: boolean;
}) {
	const map = useMap();
	const done = useRef(false);
	useEffect(() => {
		if (!enabled || done.current) return;
		done.current = true;
		map.setView(center, map.getZoom(), { animate: false });
	}, [map, center, enabled]);
	return null;
}

function ClickPicker({
	enabled,
	onPick,
}: {
	enabled: boolean;
	onPick?: (lat: number, lng: number) => void;
}) {
	useMapEvents({
		click(e) {
			if (enabled && onPick) {
				onPick(e.latlng.lat, e.latlng.lng);
			}
		},
	});
	return null;
}

const OfferMarker = memo(function OfferMarker({ offer }: { offer: PublicOffer }) {
	const items = formatItemsShort(offer.items);
	const title = offer.title?.trim() || items || "Pfand-Angebot";
	const pfand = centsToEuro(offer.pfand_value_cents);

	return (
		<Marker position={[offer.lat, offer.lng]}>
			<Popup>
				<div className="map-popup">
					<div className="map-popup-head">
						<div className="map-popup-value">{pfand} €</div>
						<span className="map-popup-kind muted small">Pfand</span>
					</div>
					<strong className="map-popup-title">{title}</strong>
					{items && offer.title?.trim() ? (
						<div className="map-popup-items muted small">{items}</div>
					) : null}
					<div className="map-popup-hint muted small">
						{offer.address_hint || "Ungefähre Lage"}
					</div>
					<Link className="map-popup-link btn btn-sm btn-primary" to={`/angebot/${offer.id}`}>
						Details ansehen
					</Link>
				</div>
			</Popup>
		</Marker>
	);
});

const RecurringMarker = memo(function RecurringMarker({
	offer,
}: {
	offer: PublicRecurringOffer;
}) {
	const items = formatItemsShort(offer.items);
	const title = offer.title?.trim() || items || "Wöchentliches Pfand";
	const pfand = centsToEuro(offer.pfand_value_cents);
	const day = weekdayLabel(offer.weekday);

	return (
		<Marker position={[offer.lat, offer.lng]} icon={recurringIcon}>
			<Popup>
				<div className="map-popup map-popup-recurring">
					<div className="map-popup-head">
						<div className="map-popup-value">{pfand} €</div>
						<span className="map-popup-kind badge">Wöchentlich</span>
					</div>
					<strong className="map-popup-title">{title}</strong>
					<div className="map-popup-items muted small">
						{day}
						{offer.time_hint ? ` · ${offer.time_hint}` : ""}
					</div>
					{offer.address_hint ? (
						<div className="map-popup-hint muted small">{offer.address_hint}</div>
					) : null}
					<Link className="map-popup-link btn btn-sm btn-primary" to={`/woche/${offer.id}`}>
						Details & bewerben
					</Link>
				</div>
			</Popup>
		</Marker>
	);
});

function MapToolbar({
	onFly,
	onLocationResolved,
}: {
	onFly: (t: MapFlyTarget) => void;
	onLocationResolved?: Props["onLocationResolved"];
}) {
	const listId = useId();
	const inputId = useId();
	const statusId = useId();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<GeocodeResult[]>([]);
	const [open, setOpen] = useState(false);
	const [searching, setSearching] = useState(false);
	const [locating, setLocating] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);
	const [msgTone, setMsgTone] = useState<"info" | "error">("info");
	const [activeIdx, setActiveIdx] = useState(-1);
	const abortRef = useRef<AbortController | null>(null);
	const wrapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (!wrapRef.current?.contains(e.target as Node)) {
				setOpen(false);
				setActiveIdx(-1);
			}
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	const runSearch = useCallback(async (q: string) => {
		abortRef.current?.abort();
		if (q.trim().length < 3) {
			setResults([]);
			setOpen(false);
			setSearching(false);
			setActiveIdx(-1);
			setMsg(null);
			return;
		}
		const ac = new AbortController();
		abortRef.current = ac;
		setSearching(true);
		setMsg(null);
		try {
			const hits = await searchAddress(q, { signal: ac.signal, limit: 6 });
			if (ac.signal.aborted) return;
			setResults(hits);
			setOpen(true);
			setActiveIdx(hits.length > 0 ? 0 : -1);
			if (hits.length === 0) {
				setMsg("Nichts gefunden – versuch einen anderen Suchbegriff");
				setMsgTone("info");
			}
		} catch (e) {
			if ((e as Error).name === "AbortError") return;
			setMsg(e instanceof Error ? e.message : "Suche hat nicht geklappt");
			setMsgTone("error");
			setResults([]);
			setOpen(false);
			setActiveIdx(-1);
		} finally {
			if (!ac.signal.aborted) setSearching(false);
		}
	}, []);

	useEffect(() => {
		const t = window.setTimeout(() => {
			void runSearch(query);
		}, 400);
		return () => {
			window.clearTimeout(t);
			// cancel in-flight when query changes / unmount
			abortRef.current?.abort();
		};
	}, [query, runSearch]);

	function selectResult(r: GeocodeResult) {
		setQuery(r.label);
		setOpen(false);
		setResults([]);
		setMsg(null);
		setActiveIdx(-1);
		onFly({ lat: r.lat, lng: r.lng, zoom: 16, key: Date.now() });
		onLocationResolved?.({ lat: r.lat, lng: r.lng, label: r.label });
	}

	function onSubmit(e: FormEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (activeIdx >= 0 && results[activeIdx]) {
			selectResult(results[activeIdx]);
		} else if (results[0]) {
			selectResult(results[0]);
		} else {
			void runSearch(query);
		}
	}

	function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && results.length) {
			setOpen(true);
		}
		if (!results.length) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setOpen(true);
			setActiveIdx((i) => (i + 1) % results.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setOpen(true);
			setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
		} else if (e.key === "Escape") {
			setOpen(false);
			setActiveIdx(-1);
		} else if (e.key === "Enter" && open && activeIdx >= 0 && results[activeIdx]) {
			e.preventDefault();
			selectResult(results[activeIdx]);
		}
	}

	function relocate() {
		if (!navigator.geolocation) {
			setMsg("Standort geht auf diesem Gerät nicht");
			setMsgTone("error");
			return;
		}
		setLocating(true);
		setMsg("Standort wird ermittelt…");
		setMsgTone("info");
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				onFly({ lat, lng, zoom: 15, key: Date.now() });
				onLocationResolved?.({ lat, lng, label: "Mein Standort" });
				setLocating(false);
				setMsg(null);
			},
			(err) => {
				let text = "Standort konnte nicht ermittelt werden";
				if (err.code === err.PERMISSION_DENIED) {
					text =
						"Standort blockiert – in den Browser-Einstellungen freigeben";
				} else if (err.code === err.TIMEOUT) {
					text = "Standort dauert zu lange – nochmal versuchen";
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					text = "Standort gerade nicht verfügbar";
				}
				setMsg(text);
				setMsgTone("error");
				setLocating(false);
			},
			{ enableHighAccuracy: true, timeout: 12_000, maximumAge: 10_000 },
		);
	}

	const activeOptionId =
		activeIdx >= 0 && results[activeIdx]
			? `${listId}-opt-${activeIdx}`
			: undefined;

	const showResultsPanel = open && results.length > 0;

	return (
		<div className="map-toolbar leaflet-bar" ref={wrapRef}>
			<div className="map-toolbar-row">
				<form
					className="map-search"
					onSubmit={onSubmit}
					autoComplete="off"
					role="search"
					aria-label="Adresse suchen"
				>
					<input
						id={inputId}
						type="search"
						className="map-search-input"
						placeholder="Adresse oder Ort suchen…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onFocus={() => {
							if (results.length > 0 || msg) setOpen(true);
						}}
						onKeyDown={onKeyDown}
						aria-label="Adresse suchen"
						aria-autocomplete="list"
						aria-controls={listId}
						aria-expanded={showResultsPanel}
						aria-activedescendant={activeOptionId}
						aria-describedby={msg ? statusId : undefined}
						aria-busy={searching}
					/>
					{searching && (
						<span className="map-search-status" aria-live="polite">
							Suche…
						</span>
					)}
					{showResultsPanel && results.length > 0 && (
						<ul
							id={listId}
							className="map-search-results"
							role="listbox"
							aria-label="Suchergebnisse"
						>
							{results.map((r, idx) => (
								<li
									key={`${r.lat}-${r.lng}-${r.label}`}
									role="presentation"
								>
									<button
										type="button"
										id={`${listId}-opt-${idx}`}
										role="option"
										aria-selected={idx === activeIdx}
										className={
											idx === activeIdx
												? "map-search-hit map-search-hit-active"
												: "map-search-hit"
										}
										onMouseEnter={() => setActiveIdx(idx)}
										onClick={() => selectResult(r)}
									>
										{r.label}
									</button>
								</li>
							))}
						</ul>
					)}
				</form>
				<button
					type="button"
					className="map-locate-btn"
					onClick={relocate}
					disabled={locating}
					title="Zu meinem Standort"
					aria-label={
						locating ? "Standort wird ermittelt" : "Zu meinem Standort"
					}
					aria-busy={locating}
				>
					<span className="map-locate-icon" aria-hidden>
						{locating ? "…" : "◎"}
					</span>
				</button>
			</div>
			{msg && (
				<p
					id={statusId}
					className={
						msgTone === "error"
							? "map-toolbar-msg map-toolbar-msg-error"
							: "map-toolbar-msg"
					}
					role={msgTone === "error" ? "alert" : "status"}
					aria-live="polite"
				>
					{msg}
				</p>
			)}
		</div>
	);
}

const DEFAULT_CENTER = DEFAULT_MAP_CENTER;

export function OfferMap({
	offers,
	recurringOffers = [],
	center = DEFAULT_CENTER,
	followCenterOnce = false,
	flyTo = null,
	onBoundsChange,
	pickMode = false,
	pickPosition = null,
	onPick,
	showControls = false,
	onLocationResolved,
	className = "map",
}: Props) {
	const [internalFly, setInternalFly] = useState<MapFlyTarget | null>(null);
	const activeFly = flyTo ?? internalFly;

	const markers = useMemo(
		() => [
			...offers.map((o) => <OfferMarker key={`o-${o.id}`} offer={o} />),
			...recurringOffers.map((o) => (
				<RecurringMarker key={`r-${o.id}`} offer={o} />
			)),
		],
		[offers, recurringOffers],
	);

	const onFly = useCallback((t: MapFlyTarget) => {
		setInternalFly(t);
	}, []);

	return (
		<div className={`map-wrap ${className === "map" ? "" : ""}`}>
			{showControls && (
				<MapToolbar onFly={onFly} onLocationResolved={onLocationResolved} />
			)}
			<MapContainer
				center={center}
				zoom={12}
				className={className}
				scrollWheelZoom
			>
				<TileLayer
					attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{followCenterOnce && (
					<InitialCenterOnce center={center} enabled />
				)}
				<FlyToTarget target={activeFly} />
				{onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}
				{pickMode && <ClickPicker enabled onPick={onPick} />}
				{markers}
				{pickPosition && <Marker position={pickPosition} />}
			</MapContainer>
		</div>
	);
}
