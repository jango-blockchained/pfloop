import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OfferMap } from "../components/OfferMap";
import {
	centsToEuro,
	collectOffer,
	confirmOffer,
	fetchMyOffers,
	fetchMyReservations,
	fetchOffersInBbox,
	type OwnOffer,
	type PublicOffer,
	type ReservationRow,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { formatCountdown } from "../lib/format";
import { offerStatusClass, offerStatusLabel } from "../lib/labels";
import { formatItemsShort } from "../lib/pfand-ui";
import { useGeolocation } from "../hooks/useGeolocation";

type BBox = {
	south: number;
	west: number;
	north: number;
	east: number;
};

const BBOX_DEBOUNCE_MS = 280;

function roughlyEqualBbox(a: BBox, b: BBox, eps = 1e-5): boolean {
	return (
		Math.abs(a.south - b.south) < eps &&
		Math.abs(a.west - b.west) < eps &&
		Math.abs(a.north - b.north) < eps &&
		Math.abs(a.east - b.east) < eps
	);
}

export function MapHome() {
	const { user, loading: authLoading } = useAuth();
	const { center, ready: geoReady, error: geoError } = useGeolocation();
	const [offers, setOffers] = useState<PublicOffer[]>([]);
	const [mine, setMine] = useState<OwnOffer[]>([]);
	const [reservations, setReservations] = useState<ReservationRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [mapLoading, setMapLoading] = useState(false);
	const [mapLoadedOnce, setMapLoadedOnce] = useState(false);
	const [sideLoading, setSideLoading] = useState(false);
	const [now, setNow] = useState(Date.now());
	const [busyId, setBusyId] = useState<string | null>(null);
	const [sheetExpanded, setSheetExpanded] = useState(false);

	/** Current map viewport (updated on every bounds event). */
	const viewportBboxRef = useRef<BBox | null>(null);
	/** Last bbox successfully (or intentionally) requested. */
	const lastFetchedBboxRef = useRef<BBox | null>(null);
	const debounceTimerRef = useRef<number | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const fetchGenRef = useRef(0);

	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 15_000);
		return () => clearInterval(t);
	}, []);

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current != null) {
				window.clearTimeout(debounceTimerRef.current);
			}
			abortRef.current?.abort();
		};
	}, []);

	const loadSide = useCallback(async () => {
		if (!user) {
			setMine([]);
			setReservations([]);
			setSideLoading(false);
			return;
		}
		setSideLoading(true);
		try {
			const [m, r] = await Promise.all([
				fetchMyOffers(),
				fetchMyReservations(),
			]);
			setMine(m.offers);
			setReservations(r.reservations);
		} catch (e) {
			console.warn(e);
		} finally {
			setSideLoading(false);
		}
	}, [user]);

	useEffect(() => {
		void loadSide();
	}, [loadSide]);

	const loadOffersForBbox = useCallback(async (bbox: BBox) => {
		abortRef.current?.abort();
		const ac = new AbortController();
		abortRef.current = ac;
		const gen = ++fetchGenRef.current;
		lastFetchedBboxRef.current = bbox;
		setMapLoading(true);
		try {
			// fetchOffersInBbox has no signal; guard with generation counter
			const data = await fetchOffersInBbox(bbox);
			if (ac.signal.aborted || gen !== fetchGenRef.current) return;
			setOffers(data.offers);
			setError(null);
			setMapLoadedOnce(true);
		} catch (e) {
			if (ac.signal.aborted || gen !== fetchGenRef.current) return;
			setError(e instanceof Error ? e.message : "Karte laden fehlgeschlagen");
		} finally {
			if (gen === fetchGenRef.current) setMapLoading(false);
		}
	}, []);

	const refreshMapPins = useCallback(() => {
		const bbox = viewportBboxRef.current ?? lastFetchedBboxRef.current;
		if (bbox) void loadOffersForBbox(bbox);
	}, [loadOffersForBbox]);

	const onBoundsChange = useCallback(
		(bbox: BBox) => {
			viewportBboxRef.current = bbox;
			const prev = lastFetchedBboxRef.current;
			// Skip identical thrash from BoundsWatcher remounts / no real move
			if (prev && roughlyEqualBbox(prev, bbox)) {
				return;
			}
			if (debounceTimerRef.current != null) {
				window.clearTimeout(debounceTimerRef.current);
			}
			debounceTimerRef.current = window.setTimeout(() => {
				debounceTimerRef.current = null;
				void loadOffersForBbox(bbox);
			}, BBOX_DEBOUNCE_MS);
		},
		[loadOffersForBbox],
	);

	async function onMarkCollected(offerId: string) {
		if (
			!confirm(
				"Hast du das Pfand abgeholt? Der Inserent muss danach noch bestätigen.",
			)
		) {
			return;
		}
		setBusyId(offerId);
		try {
			await collectOffer(offerId);
			await loadSide();
			refreshMapPins();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Melden fehlgeschlagen");
		} finally {
			setBusyId(null);
		}
	}

	async function onConfirmHandover(offerId: string) {
		if (
			!confirm(
				"Bestätigst du, dass der Abholer das Pfand erhalten hat?",
			)
		) {
			return;
		}
		setBusyId(offerId);
		try {
			await confirmOffer(offerId);
			await loadSide();
			refreshMapPins();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Bestätigung fehlgeschlagen");
		} finally {
			setBusyId(null);
		}
	}

	const unfinishedReservations = reservations.filter(
		(r) =>
			r.reservation_status === "active" ||
			r.reservation_status === "collected",
	);

	const openCount = offers.length;
	const summaryBits = [
		mapLoading && !mapLoadedOnce
			? "Lade Angebote…"
			: `${openCount} offen in Sicht`,
		user ? `${mine.length} eigene` : null,
		unfinishedReservations.length
			? `${unfinishedReservations.length} Abholung offen`
			: null,
	].filter(Boolean);

	const bannerError = error;
	const bannerInfo = !error && geoError ? geoError : null;

	return (
		<div className={`home ${sheetExpanded ? "home-sheet-expanded" : ""}`}>
			<section className="map-panel">
				{geoReady && (
					<OfferMap
						offers={offers}
						center={center}
						followCenterOnce
						showControls
						onBoundsChange={onBoundsChange}
					/>
				)}
				{!geoReady && (
					<div className="map map-loading" role="status" aria-live="polite">
						Standort wird ermittelt…
					</div>
				)}
				{geoReady && mapLoading && (
					<p className="map-fetch-status" role="status" aria-live="polite">
						Angebote werden geladen…
					</p>
				)}
				{bannerError && (
					<p className="banner error" role="alert">
						{bannerError}{" "}
						{(viewportBboxRef.current || lastFetchedBboxRef.current) && (
							<button
								type="button"
								className="btn btn-sm"
								onClick={() => refreshMapPins()}
							>
								Erneut laden
							</button>
						)}
					</p>
				)}
				{bannerInfo && <p className="banner info">{bannerInfo}</p>}
			</section>

			<aside className="side-panel">
				<button
					type="button"
					className="sheet-handle"
					aria-expanded={sheetExpanded}
					aria-controls="side-panel-body"
					onClick={() => setSheetExpanded((v) => !v)}
				>
					<span className="sheet-grip" aria-hidden />
					<span className="sheet-summary">{summaryBits.join(" · ")}</span>
					<span className="sheet-expand-hint muted small" aria-hidden>
						{sheetExpanded ? "Einklappen" : "Mehr anzeigen"}
					</span>
				</button>

				<div id="side-panel-body" className="side-panel-body">
					{/* Nearby open offers */}
					<div className="panel-block">
						<div className="panel-head">
							<h2>In der Nähe</h2>
							{mapLoadedOnce && (
								<span className="muted small">{openCount} offen</span>
							)}
						</div>
						{!mapLoadedOnce && mapLoading && (
							<p className="muted" role="status">
								Lade offene Angebote auf der Karte…
							</p>
						)}
						{mapLoadedOnce && openCount === 0 && !mapLoading && (
							<div className="empty-state">
								<p className="muted">
									Keine offenen Angebote im sichtbaren Kartenbereich.
								</p>
								<p className="muted small">
									Karte verschieben oder zoomen — oder selbst etwas anbieten.
								</p>
								{user ? (
									<Link className="btn btn-primary btn-sm" to="/neu">
										Angebot erstellen
									</Link>
								) : (
									<Link className="btn btn-primary btn-sm" to="/login">
										Anmelden zum Inserieren
									</Link>
								)}
							</div>
						)}
						{openCount > 0 && (
							<ul className="list">
								{offers.slice(0, 8).map((o) => {
									const items = formatItemsShort(o.items);
									return (
										<li key={o.id} className="list-item">
											<div>
												<Link to={`/angebot/${o.id}`}>
													<strong>
														{o.title?.trim() || items || "Pfand-Angebot"}
													</strong>
												</Link>
												<span className="list-pfand">
													{centsToEuro(o.pfand_value_cents)} €
												</span>
											</div>
											<div className="meta">
												{items ? `${items} · ` : null}
												{o.address_hint || "Ungefähre Lage"}
											</div>
										</li>
									);
								})}
							</ul>
						)}
						{openCount > 8 && (
							<p className="muted small">
								+{openCount - 8} weitere auf der Karte — zoomen für Details
							</p>
						)}
					</div>

					<div className="panel-block">
						<div className="panel-head">
							<h2>Meine Angebote</h2>
							<Link className="btn btn-primary btn-sm" to="/neu">
								+ Neu
							</Link>
						</div>
						{!authLoading && !user && (
							<div className="empty-state">
								<p className="muted">
									Zum Inserieren bitte <Link to="/login">anmelden</Link>.
								</p>
							</div>
						)}
						{user && sideLoading && mine.length === 0 && (
							<p className="muted" role="status">
								Lade deine Angebote…
							</p>
						)}
						{user && !sideLoading && mine.length === 0 && (
							<div className="empty-state">
								<p className="muted">Noch keine eigenen Angebote.</p>
								<Link className="btn btn-primary btn-sm" to="/neu">
									Erstes Angebot erstellen
								</Link>
							</div>
						)}
						<ul className="list">
							{mine.map((o) => {
								const items = formatItemsShort(o.items);
								return (
									<li key={o.id} className="list-item">
										<div>
											<Link to={`/angebot/${o.id}`}>
												<strong>
													{o.title?.trim() || items || "Pfand-Angebot"}
												</strong>
											</Link>
											<span className={offerStatusClass(o.status)}>
												{offerStatusLabel(o.status)}
											</span>
										</div>
										<div className="meta">
											<span className="list-pfand-inline">
												{centsToEuro(o.pfand_value_cents)} €
											</span>
											{" · "}
											{items ? `${items} · ` : null}
											{o.address_hint || o.address_text}
										</div>
										{o.status === "collected" && (
											<button
												type="button"
												className="btn btn-sm btn-primary"
												disabled={busyId === o.id}
												onClick={() => void onConfirmHandover(o.id)}
											>
												{busyId === o.id ? "…" : "Übergabe bestätigen"}
											</button>
										)}
										{o.status === "reserved" && (
											<p className="muted small" style={{ marginTop: "0.35rem" }}>
												Warte auf „Abgeholt“-Meldung des Abholers.
											</p>
										)}
									</li>
								);
							})}
						</ul>
					</div>

					<div className="panel-block">
						<div className="panel-head">
							<h2>Meine Abholungen</h2>
						</div>
						{user && sideLoading && unfinishedReservations.length === 0 && (
							<p className="muted" role="status">
								Lade Abholungen…
							</p>
						)}
						{!user && !authLoading && (
							<div className="empty-state">
								<p className="muted">
									Zum Abholen bitte <Link to="/login">anmelden</Link>.
								</p>
							</div>
						)}
						{user && !sideLoading && unfinishedReservations.length === 0 && (
							<div className="empty-state">
								<p className="muted">
									Keine offenen Abholungen. Du kannst nur ein Angebot gleichzeitig
									bearbeiten — erst erledigt, dann das nächste.
								</p>
								{openCount > 0 && (
									<p className="muted small">
										Tippe auf einen Pin oder ein Angebot unter „In der Nähe“.
									</p>
								)}
							</div>
						)}
						<ul className="list">
							{unfinishedReservations.map((r) => (
								<li key={r.reservation_id} className="list-item">
									<div>
										<Link to={`/angebot/${r.offer_id}`}>
											<strong>{r.title}</strong>
										</Link>
										{r.reservation_status === "active" ? (
											<span className="badge badge-warn">
												{formatCountdown(r.deadline_at, now)}
											</span>
										) : (
											<span className="badge badge-warn">wartet Bestätigung</span>
										)}
									</div>
									<div className="meta">
										<span className="list-pfand-inline">
											{centsToEuro(r.pfand_value_cents)} €
										</span>
										{" · "}
										{r.address_text}
									</div>
									{r.reservation_status === "active" && (
										<button
											type="button"
											className="btn btn-sm btn-primary"
											disabled={busyId === r.offer_id}
											onClick={() => void onMarkCollected(r.offer_id)}
										>
											{busyId === r.offer_id ? "…" : "Abgeholt melden"}
										</button>
									)}
									{r.reservation_status === "collected" && (
										<p className="muted small" style={{ marginTop: "0.35rem" }}>
											Inserenten bitten zu bestätigen — danach neues Angebot
											möglich.
										</p>
									)}
								</li>
							))}
						</ul>
					</div>

					<p className="footnote">
						Kostenlos · 1 offene Abholung · Abholer meldet, Inserent bestätigt
					</p>
				</div>
			</aside>
		</div>
	);
}
