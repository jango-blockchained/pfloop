import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	acceptOffer,
	cancelOffer,
	centsToEuro,
	collectOffer,
	confirmOffer,
	fetchOffer,
	getErrorMessage,
	type OfferDetail as OfferDetailType,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useT } from "../i18n";
import {
	formatCountdown,
	isDeadlineOverdue,
	mapsLinks,
} from "../lib/format";
import {
	offerNextStep,
	offerStatusClass,
	offerStatusHint,
	offerStatusLabel,
	type OfferRole,
} from "../lib/labels";
import { PfandItemsList } from "../components/PfandItemsList";
import { OfferTips } from "../components/OfferTips";

type BusyAction = "accept" | "collect" | "confirm" | "cancel" | null;

export function OfferDetail() {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();
	const t = useT();
	const navigate = useNavigate();
	const [offer, setOffer] = useState<OfferDetailType | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState<BusyAction>(null);
	const [now, setNow] = useState(Date.now());
	const [copied, setCopied] = useState(false);
	const overdueRefreshDone = useRef(false);

	const load = useCallback(async () => {
		if (!id) return;
		try {
			const data = await fetchOffer(id);
			setOffer(data.offer);
			setLoadError(null);
			setError(null);
		} catch (e) {
			setLoadError(getErrorMessage(e, t("detail.loadFailed")));
		} finally {
			setLoading(false);
		}
	}, [id, t]);

	useEffect(() => {
		setLoading(true);
		overdueRefreshDone.current = false;
		void load();
	}, [load]);

	useEffect(() => {
		const tick = setInterval(() => setNow(Date.now()), 10_000);
		return () => clearInterval(tick);
	}, []);

	// When the 6h window ends, refresh so status can flip back to open.
	useEffect(() => {
		if (!offer?.deadline_at || offer.status !== "reserved") return;
		if (!isDeadlineOverdue(offer.deadline_at, now)) return;
		if (overdueRefreshDone.current) return;
		overdueRefreshDone.current = true;
		void load();
	}, [offer?.deadline_at, offer?.status, now, load]);

	async function runAction(
		action: Exclude<BusyAction, null>,
		fn: () => Promise<void>,
	) {
		if (!id || busy) return;
		setBusy(action);
		setError(null);
		try {
			await fn();
			await load();
		} catch (e) {
			setError(getErrorMessage(e, t("detail.actionFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onAccept() {
		if (!id) return;
		if (!user) {
			navigate("/login");
			return;
		}
		await runAction("accept", async () => {
			await acceptOffer(id);
		});
	}

	async function onCollect() {
		if (!id) return;
		if (!confirm(t("detail.confirm.collect"))) {
			return;
		}
		await runAction("collect", async () => {
			await collectOffer(id);
		});
	}

	async function onConfirm() {
		if (!id) return;
		if (!confirm(t("detail.confirm.handover"))) {
			return;
		}
		await runAction("confirm", async () => {
			await confirmOffer(id);
		});
	}

	async function onCancel() {
		if (!id) return;
		if (!confirm(t("detail.confirm.cancel"))) return;
		await runAction("cancel", async () => {
			await cancelOffer(id);
		});
	}

	async function onCopyAddress(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setError(t("detail.copyFailed"));
		}
	}

	if (!id) {
		return (
			<div className="page detail-page">
				<p className="banner error">{t("detail.missingId")}</p>
				<p className="back">
					<Link to="/">{t("detail.backToMap")}</Link>
				</p>
			</div>
		);
	}

	if (loading && !offer) {
		return (
			<div className="page detail-page">
				<p className="back">
					<Link to="/">{t("common.backMap")}</Link>
				</p>
				<div className="detail-card detail-skeleton" aria-busy="true">
					<div className="detail-hero">
						<span className="label">{t("detail.label.pfand")}</span>
						<span className="skeleton skeleton-title" />
					</div>
					<div className="detail-row">
						<span className="label">{t("detail.label.status")}</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="detail-row">
						<span className="label">{t("detail.label.area")}</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="skeleton skeleton-block" />
					<p className="muted small">{t("detail.loading")}</p>
				</div>
			</div>
		);
	}

	if (!offer) {
		return (
			<div className="page detail-page">
				<p className="back">
					<Link to="/">{t("common.backMap")}</Link>
				</p>
				<p className="banner error">
					{loadError ?? t("detail.notFound")}
				</p>
				<div className="actions sticky-actions">
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => {
							setLoading(true);
							void load();
						}}
					>
						{t("common.retry")}
					</button>
					<Link className="btn" to="/">
						{t("common.toMap")}
					</Link>
				</div>
			</div>
		);
	}

	const isCollectorView = Boolean(offer.is_active_collector);
	const role: OfferRole = offer.is_own
		? "own"
		: isCollectorView
			? "collector"
			: "public";
	const canAccept = offer.status === "open" && !offer.is_own;
	const canCollect = isCollectorView && offer.status === "reserved";
	const canConfirm = offer.is_own && offer.status === "collected";
	const canCancel =
		offer.is_own &&
		(offer.status === "open" ||
			offer.status === "reserved" ||
			offer.status === "collected");
	const deadline = offer.deadline_at ?? null;
	const showCountdown =
		Boolean(deadline) &&
		(isCollectorView || offer.is_own) &&
		(offer.status === "reserved" || offer.status === "collected");
	const overdue = deadline ? isDeadlineOverdue(deadline, now) : false;
	const nextStep = offerNextStep(offer.status, role);
	const maps =
		offer.address_text != null
			? mapsLinks(offer.lat, offer.lng, offer.address_text)
			: null;
	const anyBusy = busy !== null;

	return (
		<div className="page detail-page">
			<p className="back">
				<Link to="/">{t("common.backMap")}</Link>
			</p>

			<header className="page-header">
				<h1>{offer.title || t("offer.fallbackTitle")}</h1>
			</header>

			{nextStep && (
				<div className="banner info handover-hint status-banner">
					<strong>{t("detail.nextLabel")}</strong> {nextStep}
				</div>
			)}

			{offer.is_own && <OfferTips variant="poster" compact />}
			{isCollectorView && <OfferTips variant="collector" compact />}
			{!offer.is_own && !isCollectorView && offer.status === "open" && (
				<OfferTips variant="public" compact />
			)}

			<div className="detail-card">
				<div className="detail-hero detail-row">
					<span className="label">{t("detail.label.pfand")}</span>
					<strong className="pfand detail-hero-value">
						{centsToEuro(offer.pfand_value_cents)} €
					</strong>
				</div>

				<div className="detail-section">
					<div className="detail-desc">
						<span className="label">{t("detail.items")}</span>
						<PfandItemsList items={offer.items ?? []} />
					</div>
				</div>

				<div className="detail-section detail-facts">
					<div className="detail-row">
						<span className="label">{t("detail.label.status")}</span>
						<span className={offerStatusClass(offer.status)}>
							{offerStatusLabel(offer.status)}
						</span>
					</div>
					{offerStatusHint(offer.status) && (
						<p className="muted small status-hint">
							{offerStatusHint(offer.status)}
						</p>
					)}
					<div className="detail-row">
						<span className="label">{t("detail.label.area")}</span>
						<span>{offer.address_hint || t("common.emDash")}</span>
					</div>
				</div>

				{offer.address_text && (
					<div className="detail-section detail-desc address-block">
						<span className="label">{t("detail.address")}</span>
						<p className="address">{offer.address_text}</p>
						<div className="address-actions">
							<button
								type="button"
								className="btn btn-sm"
								onClick={() => void onCopyAddress(offer.address_text!)}
							>
								{copied ? t("detail.copied") : t("detail.copyAddress")}
							</button>
							{maps && (
								<>
									<a
										className="btn btn-sm"
										href={maps.google}
										target="_blank"
										rel="noopener noreferrer"
									>
										{t("maps.google")}
									</a>
									<a
										className="btn btn-sm"
										href={maps.apple}
										target="_blank"
										rel="noopener noreferrer"
									>
										{t("maps.apple")}
									</a>
									<a className="btn btn-sm" href={maps.geo}>
										{t("maps.geoApp")}
									</a>
								</>
							)}
						</div>
					</div>
				)}

				{!offer.address_text && offer.status === "open" && (
					<p className="muted small address-privacy-hint">
						{t("detail.addressPrivacy")}
					</p>
				)}

				{offer.description && (
					<div className="detail-section detail-desc">
						<span className="label">{t("detail.note")}</span>
						<p className="detail-note" style={{ whiteSpace: "pre-wrap" }}>
							{offer.description}
						</p>
					</div>
				)}

				{showCountdown && deadline && (
					<div className="detail-row countdown-row">
						<span className="label">
							{offer.status === "reserved"
								? t("detail.countdown.pickup")
								: t("detail.countdown.reservation")}
						</span>
						<span
							className={`badge ${overdue ? "badge-muted" : "badge-warn"} countdown-badge`}
						>
							{overdue
								? t("detail.countdown.overdue")
								: t("detail.countdown.left", {
										countdown: formatCountdown(deadline, now),
									})}
						</span>
					</div>
				)}
			</div>

			{(error || loadError) && offer && (
				<p className="banner error">{error ?? loadError}</p>
			)}

			<div className="status-banners">
				{isCollectorView && offer.status === "reserved" && (
					<div className="banner info handover-hint status-banner">
						{t("detail.banner.step1")}
					</div>
				)}

				{isCollectorView && offer.status === "collected" && (
					<div className="banner info handover-hint status-banner">
						{t("detail.banner.almost")}
					</div>
				)}

				{offer.is_own && offer.status === "reserved" && (
					<div className="banner info handover-hint status-banner">
						{t("detail.banner.running")}
					</div>
				)}

				{canConfirm && (
					<div className="banner info handover-hint status-banner">
						{t("detail.banner.yourConfirm")}
					</div>
				)}

				{offer.is_own && offer.status === "open" && (
					<div className="banner info handover-hint status-banner">
						{t("detail.banner.online")}
					</div>
				)}
			</div>

			<div className="actions sticky-actions action-stack">
				{canAccept && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onAccept()}
					>
						{busy === "accept" ? t("detail.accept.busy") : t("detail.accept")}
					</button>
				)}
				{canCollect && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onCollect()}
					>
						{busy === "collect"
							? t("detail.collect.busy")
							: t("detail.collect")}
					</button>
				)}
				{canConfirm && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onConfirm()}
					>
						{busy === "confirm"
							? t("detail.confirm.busy")
							: t("detail.confirm")}
					</button>
				)}
				{canCancel && (
					<button
						type="button"
						className="btn"
						disabled={anyBusy}
						onClick={() => void onCancel()}
					>
						{busy === "cancel" ? t("detail.cancel.busy") : t("detail.cancel")}
					</button>
				)}
				{offer.status === "completed" && (
					<p className="muted action-done">{t("detail.done")}</p>
				)}
				{offer.status === "cancelled" && (
					<p className="muted action-done">{t("detail.cancelled")}</p>
				)}
			</div>
		</div>
	);
}
