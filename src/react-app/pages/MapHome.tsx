// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OfferMap } from "../components/OfferMap";
import { useT } from "../i18n";
import {
	centsToEuro,
	collectOffer,
	confirmOffer,
	fetchMyOffers,
	fetchMyRecurringApplications,
	fetchMyRecurringOffers,
	fetchCollectorQuota,
	fetchMyReservations,
	fetchOffersInBbox,
	fetchRecurringInBbox,
	type CollectorQuota,
	type MyRecurringApplication,
	type OwnOffer,
	type OwnRecurringOffer,
	type PublicOffer,
	type PublicRecurringOffer,
	type ReservationRow,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { formatCountdown } from "../lib/format";
import {
	offerStatusClass,
	offerStatusLabel,
	recurringAppStatusLabel,
	recurringStatusLabel,
	weekdayLabel,
} from "../lib/labels";
import { formatItemsShort, formatRecurringPfandLabel } from "../lib/pfand-ui";
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
	const t = useT();
	const { center, ready: geoReady, error: geoError } = useGeolocation();
	const [offers, setOffers] = useState<PublicOffer[]>([]);
	const [recurring, setRecurring] = useState<PublicRecurringOffer[]>([]);
	const [mine, setMine] = useState<OwnOffer[]>([]);
	const [mineRecurring, setMineRecurring] = useState<OwnRecurringOffer[]>([]);
	const [myRecurringApps, setMyRecurringApps] = useState<
		MyRecurringApplication[]
	>([]);
	const [reservations, setReservations] = useState<ReservationRow[]>([]);
	const [quota, setQuota] = useState<CollectorQuota | null>(null);
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
		const timer = setInterval(() => setNow(Date.now()), 15_000);
		return () => clearInterval(timer);
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
			setMineRecurring([]);
			setMyRecurringApps([]);
			setReservations([]);
			setQuota(null);
			setSideLoading(false);
			return;
		}
		setSideLoading(true);
		try {
			const [m, r, mr, ma, q] = await Promise.all([
				fetchMyOffers(),
				fetchMyReservations(),
				fetchMyRecurringOffers(),
				fetchMyRecurringApplications(),
				fetchCollectorQuota(),
			]);
			setMine(m.offers);
			setReservations(r.reservations);
			setMineRecurring(mr.offers);
			setMyRecurringApps(ma.applications);
			setQuota(q);
		} catch (e) {
			console.warn(e);
		} finally {
			setSideLoading(false);
		}
	}, [user]);

	useEffect(() => {
		void loadSide();
	}, [loadSide]);

	const loadOffersForBbox = useCallback(
		async (bbox: BBox) => {
			abortRef.current?.abort();
			const ac = new AbortController();
			abortRef.current = ac;
			const gen = ++fetchGenRef.current;
			lastFetchedBboxRef.current = bbox;
			setMapLoading(true);
			try {
				const [data, rec] = await Promise.all([
					fetchOffersInBbox(bbox),
					fetchRecurringInBbox(bbox),
				]);
				if (ac.signal.aborted || gen !== fetchGenRef.current) return;
				setOffers(data.offers);
				setRecurring(rec.offers);
				setError(null);
				setMapLoadedOnce(true);
			} catch (e) {
				if (ac.signal.aborted || gen !== fetchGenRef.current) return;
				setError(
					e instanceof Error ? e.message : t("home.mapLoadFailed"),
				);
			} finally {
				if (gen === fetchGenRef.current) setMapLoading(false);
			}
		},
		[t],
	);

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
		if (!confirm(t("home.confirmCollect"))) {
			return;
		}
		setBusyId(offerId);
		try {
			await collectOffer(offerId);
			await loadSide();
			refreshMapPins();
		} catch (e) {
			setError(e instanceof Error ? e.message : t("home.collectFailed"));
		} finally {
			setBusyId(null);
		}
	}

	async function onConfirmHandover(offerId: string) {
		if (!confirm(t("home.confirmHandover"))) {
			return;
		}
		setBusyId(offerId);
		try {
			await confirmOffer(offerId);
			await loadSide();
			refreshMapPins();
		} catch (e) {
			setError(e instanceof Error ? e.message : t("home.confirmFailed"));
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
	const recurringCount = recurring.length;
	const summaryBits = [
		mapLoading && !mapLoadedOnce
			? t("home.loadingOffers")
			: t("home.summary.openNearby", { n: openCount + recurringCount }),
		recurringCount
			? t("home.summary.recurring", { n: recurringCount })
			: null,
		user
			? t("home.summary.own", { n: mine.length + mineRecurring.length })
			: null,
		unfinishedReservations.length
			? t("home.summary.pickupsOpen", {
					n: unfinishedReservations.length,
				})
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
						recurringOffers={recurring}
						center={center}
						followCenterOnce
						showControls
						onBoundsChange={onBoundsChange}
					/>
				)}
				{!geoReady && (
					<div className="map map-loading" role="status" aria-live="polite">
						{t("home.geoLoading")}
					</div>
				)}
				{geoReady && mapLoading && (
					<p className="map-fetch-status" role="status" aria-live="polite">
						{t("home.offersLoading")}
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
								{t("home.reload")}
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
					<span className="sheet-summary">
						<span className="sheet-summary-main">
							{summaryBits[0] ?? t("home.sheetFallback")}
						</span>
						{summaryBits.length > 1 && (
							<span className="sheet-summary-extra muted small">
								{summaryBits.slice(1).join(" · ")}
							</span>
						)}
					</span>
					<span className="sheet-expand-hint muted small" aria-hidden>
						{sheetExpanded ? t("home.sheet.collapse") : t("home.sheet.expand")}
					</span>
				</button>

				<div id="side-panel-body" className="side-panel-body">
					{/* Nearby open offers */}
					<section className="panel-block panel-section">
						<div className="panel-head">
							<h2>{t("home.nearby.title")}</h2>
							{mapLoadedOnce && (
								<span className="muted small panel-head-meta">
									{t("home.nearby.metaOnce", { n: openCount })}
									{recurringCount
										? ` · ${t("home.nearby.metaRecurring", { n: recurringCount })}`
										: ""}
								</span>
							)}
						</div>
						{!mapLoadedOnce && mapLoading && (
							<p className="muted" role="status">
								{t("home.nearby.loading")}
							</p>
						)}
						{mapLoadedOnce &&
							openCount === 0 &&
							recurringCount === 0 &&
							!mapLoading && (
							<div className="empty-state">
								<span className="empty-state-icon" aria-hidden>
									📍
								</span>
								<p className="empty-state-title">
									{t("home.nearby.emptyTitle")}
								</p>
								<p className="empty-state-text">
									{t("home.nearby.emptyText")}
								</p>
								{user ? (
									<Link className="btn btn-primary btn-sm" to="/neu">
										{t("home.createOffer")}
									</Link>
								) : (
									<Link className="btn btn-primary btn-sm" to="/login">
										{t("home.loginToPost")}
									</Link>
								)}
							</div>
						)}
						{(openCount > 0 || recurringCount > 0) && (
							<ul className="list">
								{offers.slice(0, 6).map((o) => {
									const items = formatItemsShort(o.items);
									return (
										<li key={o.id} className="list-item">
											<div className="list-item-main">
												<Link
													className="list-item-title"
													to={`/angebot/${o.id}`}
												>
													<strong>
														{o.title?.trim() ||
															items ||
															t("offer.fallbackTitle")}
													</strong>
												</Link>
												<span className="list-pfand">
													{centsToEuro(o.pfand_value_cents)} €
												</span>
											</div>
											<div className="meta list-item-meta">
												{items ? `${items} · ` : null}
												{o.address_hint || t("map.approxLocation")}
											</div>
										</li>
									);
								})}
								{recurring.slice(0, 6).map((o) => {
									const items = formatItemsShort(o.items);
									return (
										<li key={`r-${o.id}`} className="list-item list-item-recurring">
											<div className="list-item-main">
												<Link
													className="list-item-title"
													to={`/woche/${o.id}`}
												>
													<strong>
														<span className="list-item-badge" aria-hidden>
															↻
														</span>{" "}
														{o.title?.trim() || items || t("home.weekly")}
													</strong>
												</Link>
												<span className="list-pfand">
													{formatRecurringPfandLabel(o.pfand_value_cents)}
												</span>
											</div>
											<div className="meta list-item-meta">
												{weekdayLabel(o.weekday)}
												{o.time_hint ? ` · ${o.time_hint}` : ""}
												{" · "}
												{o.address_hint || t("map.approxLocation")}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</section>

					<section className="panel-block panel-section">
						<div className="panel-head">
							<h2>{t("home.mine.title")}</h2>
							<Link className="btn btn-primary btn-sm" to="/neu">
								{t("home.mine.new")}
							</Link>
						</div>
						{!authLoading && !user && (
							<div className="empty-state">
								<span className="empty-state-icon" aria-hidden>
									🔐
								</span>
								<p className="empty-state-title">
									{t("home.authRequiredTitle")}
								</p>
								<p className="empty-state-text">
									<Link to="/login">{t("home.mine.loginText")}</Link>
								</p>
							</div>
						)}
						{user &&
							sideLoading &&
							mine.length === 0 &&
							mineRecurring.length === 0 && (
							<p className="muted" role="status">
								{t("home.mine.loading")}
							</p>
						)}
						{user &&
							!sideLoading &&
							mine.length === 0 &&
							mineRecurring.length === 0 && (
							<div className="empty-state">
								<span className="empty-state-icon" aria-hidden>
									📦
								</span>
								<p className="empty-state-title">
									{t("home.mine.emptyTitle")}
								</p>
								<p className="empty-state-text">
									{t("home.mine.emptyText")}
								</p>
								<Link className="btn btn-primary btn-sm" to="/neu">
									{t("home.mine.firstCreate")}
								</Link>
							</div>
						)}
						{(mine.length > 0 || mineRecurring.length > 0) && (
							<ul className="list">
								{mine.map((o) => {
									const items = formatItemsShort(o.items);
									return (
										<li key={o.id} className="list-item">
											<div className="list-item-main">
												<Link
													className="list-item-title"
													to={`/angebot/${o.id}`}
												>
													<strong>
														{o.title?.trim() ||
															items ||
															t("offer.fallbackTitle")}
													</strong>
												</Link>
												<span className={offerStatusClass(o.status)}>
													{offerStatusLabel(o.status)}
												</span>
											</div>
											<div className="meta list-item-meta">
												<span className="list-pfand-inline">
													{centsToEuro(o.pfand_value_cents)} €
												</span>
												{" · "}
												{items ? `${items} · ` : null}
												{o.address_hint || o.address_text}
											</div>
											{o.status === "collected" && (
												<div className="list-item-actions">
													<button
														type="button"
														className="btn btn-sm btn-primary"
														disabled={busyId === o.id}
														onClick={() => void onConfirmHandover(o.id)}
													>
														{busyId === o.id
															? "…"
															: t("home.confirmHandoverBtn")}
													</button>
												</div>
											)}
											{o.status === "reserved" && (
												<p className="muted small list-item-hint">
													{t("home.waitCollect")}
												</p>
											)}
										</li>
									);
								})}
								{mineRecurring.map((o) => (
									<li key={`mr-${o.id}`} className="list-item list-item-recurring">
										<div className="list-item-main">
											<Link
												className="list-item-title"
												to={`/woche/${o.id}`}
											>
												<strong>
													<span className="list-item-badge" aria-hidden>
														↻
													</span>{" "}
													{o.title?.trim() || t("home.weekly")}
												</strong>
											</Link>
											<span className={offerStatusClass(o.status)}>
												{recurringStatusLabel(o.status)}
											</span>
										</div>
										<div className="meta list-item-meta">
											<span className="list-pfand-inline">
												{formatRecurringPfandLabel(o.pfand_value_cents)}
											</span>
											{" · "}
											{weekdayLabel(o.weekday)}
											{o.pending_applications > 0
												? ` · ${t("home.pendingApps", {
														n: o.pending_applications,
													})}`
												: ""}
											{o.assigned_display_name
												? ` · ${o.assigned_display_name}`
												: ""}
										</div>
									</li>
								))}
							</ul>
						)}
					</section>

					{user && myRecurringApps.length > 0 && (
						<section className="panel-block panel-section">
							<div className="panel-head">
								<h2>{t("home.apps.title")}</h2>
								<span className="muted small panel-head-meta">
									{t("home.apps.meta")}
								</span>
							</div>
							<ul className="list">
								{myRecurringApps.map((a) => (
									<li key={a.application_id} className="list-item">
										<div className="list-item-main">
											<Link
												className="list-item-title"
												to={`/woche/${a.offer_id}`}
											>
												<strong>{a.title}</strong>
											</Link>
											<span className={offerStatusClass(a.application_status)}>
												{recurringAppStatusLabel(a.application_status)}
											</span>
										</div>
										<div className="meta list-item-meta">
											<span className="list-pfand-inline">
												{formatRecurringPfandLabel(a.pfand_value_cents)}
											</span>
											{" · "}
											{weekdayLabel(a.weekday)}
											{a.is_assigned && a.address_text
												? ` · ${a.address_text}`
												: ` · ${a.address_hint}`}
										</div>
									</li>
								))}
							</ul>
						</section>
					)}

					<section className="panel-block panel-section">
						<div className="panel-head">
							<h2>{t("home.pickups.title")}</h2>
							{user && unfinishedReservations.length > 0 ? (
								<span className="muted small panel-head-meta">
									{t("home.pickups.openMeta", {
										n: unfinishedReservations.length,
									})}{" "}
									<Link to="/route">{t("home.routeLink")}</Link>
								</span>
							) : user ? (
								<span className="muted small panel-head-meta">
									<Link to="/route">{t("home.routePlanner")}</Link>
								</span>
							) : null}
						</div>
						{user && sideLoading && unfinishedReservations.length === 0 && (
							<p className="muted" role="status">
								{t("home.pickups.loading")}
							</p>
						)}
						{!user && !authLoading && (
							<div className="empty-state">
								<span className="empty-state-icon" aria-hidden>
									🔐
								</span>
								<p className="empty-state-title">
									{t("home.authRequiredTitle")}
								</p>
								<p className="empty-state-text">
									<Link to="/login">{t("home.pickups.loginText")}</Link>
								</p>
							</div>
						)}
						{user && !sideLoading && unfinishedReservations.length === 0 && (
							<div className="empty-state">
								<span className="empty-state-icon" aria-hidden>
									✓
								</span>
								<p className="empty-state-title">
									{t("home.pickups.emptyTitle")}
								</p>
								<p className="empty-state-text">
									{t("home.pickups.emptyText")}
								</p>
								{openCount > 0 && (
									<p className="muted small">{t("home.pickups.tip")}</p>
								)}
							</div>
						)}
						{unfinishedReservations.length > 0 && (
							<ul className="list">
								{unfinishedReservations.map((r) => (
									<li key={r.reservation_id} className="list-item">
										<div className="list-item-main">
											<Link
												className="list-item-title"
												to={`/angebot/${r.offer_id}`}
											>
												<strong>{r.title}</strong>
											</Link>
											{r.reservation_status === "active" ? (
												<span className="badge badge-warn">
													{formatCountdown(r.deadline_at, now)}
												</span>
											) : (
												<span className="badge badge-warn">
													{t("home.waitingConfirm")}
												</span>
											)}
										</div>
										<div className="meta list-item-meta">
											<span className="list-pfand-inline">
												{centsToEuro(r.pfand_value_cents)} €
											</span>
											{" · "}
											{r.address_text}
										</div>
										{r.reservation_status === "active" && (
											<div className="list-item-actions">
												<button
													type="button"
													className="btn btn-sm btn-primary"
													disabled={busyId === r.offer_id}
													onClick={() => void onMarkCollected(r.offer_id)}
												>
													{busyId === r.offer_id
														? "…"
														: t("action.collected")}
												</button>
											</div>
										)}
										{r.reservation_status === "collected" && (
											<p className="muted small list-item-hint">
												{t("home.needPosterConfirm")}
											</p>
										)}
									</li>
								))}
							</ul>
						)}
					</section>

					{user && quota && (
						<p className="muted small quota-hint">
							{t("home.quota", {
								accepted: quota.accepted_today,
								limit: quota.daily_limit,
								remaining: quota.remaining_today,
								unfinished: quota.unfinished,
								max: quota.limit_max,
							})}
						</p>
					)}
					<p className="footnote">
						{t("home.footnote")}{" "}
						<Link to="/route">{t("home.routePlanner")}</Link>
					</p>
				</div>
			</aside>
		</div>
	);
}
