import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	applyToRecurring,
	cancelRecurringOffer,
	centsToEuro,
	fetchRecurringOffer,
	getErrorMessage,
	selectRecurringApplicant,
	unassignRecurringCollector,
	withdrawRecurringApplication,
	type RecurringDetail as RecurringDetailType,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useT } from "../i18n";
import { mapsLinks } from "../lib/format";
import {
	offerStatusClass,
	recurringAppStatusLabel,
	recurringStatusLabel,
	weekdayLabel,
} from "../lib/labels";
import { recurringFloorCents } from "../lib/pfand-ui";
import { PfandItemsList } from "../components/PfandItemsList";
import { WeeklyTips } from "../components/WeeklyTips";

export function RecurringDetail() {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();
	const t = useT();
	const navigate = useNavigate();
	const [offer, setOffer] = useState<RecurringDetailType | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState<string | null>(null);
	const [applyMsg, setApplyMsg] = useState("");
	const [copied, setCopied] = useState(false);

	const load = useCallback(async () => {
		if (!id) return;
		try {
			const data = await fetchRecurringOffer(id);
			setOffer(data.offer);
			setLoadError(null);
		} catch (e) {
			setLoadError(getErrorMessage(e, t("recurring.loadFailed")));
			setOffer(null);
		} finally {
			setLoading(false);
		}
	}, [id, t]);

	useEffect(() => {
		setLoading(true);
		void load();
	}, [load]);

	async function onApply() {
		if (!id) return;
		if (!user) {
			navigate("/login");
			return;
		}
		setBusy("apply");
		setError(null);
		try {
			await applyToRecurring(id, applyMsg.trim() || undefined);
			await load();
		} catch (e) {
			setError(getErrorMessage(e, t("recurring.actionFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onWithdraw() {
		if (!id) return;
		setBusy("withdraw");
		setError(null);
		try {
			await withdrawRecurringApplication(id);
			await load();
		} catch (e) {
			setError(getErrorMessage(e, t("recurring.withdrawFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onSelect(applicantId: string) {
		if (!id) return;
		if (!confirm(t("recurring.confirm.select"))) {
			return;
		}
		setBusy(`select-${applicantId}`);
		setError(null);
		try {
			await selectRecurringApplicant(id, { applicant_id: applicantId });
			await load();
		} catch (e) {
			setError(getErrorMessage(e, t("recurring.actionFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onUnassign() {
		if (!id) return;
		if (!confirm(t("recurring.confirm.unassign"))) {
			return;
		}
		setBusy("unassign");
		setError(null);
		try {
			await unassignRecurringCollector(id);
			await load();
		} catch (e) {
			setError(getErrorMessage(e, t("recurring.actionFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onCancel() {
		if (!id) return;
		if (!confirm(t("recurring.confirm.cancel"))) return;
		setBusy("cancel");
		setError(null);
		try {
			await cancelRecurringOffer(id);
			await load();
		} catch (e) {
			setError(getErrorMessage(e, t("recurring.actionFailed")));
		} finally {
			setBusy(null);
		}
	}

	async function onCopyAddress(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setError(t("recurring.copyFailed"));
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
						<span className="label">{t("recurring.label.pfand")}</span>
						<span className="skeleton skeleton-title" />
					</div>
					<div className="detail-row">
						<span className="label">{t("recurring.label.status")}</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="detail-row">
						<span className="label">{t("recurring.label.weekday")}</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="skeleton skeleton-block" />
					<p className="muted small">{t("recurring.loading")}</p>
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

	const maps =
		offer.address_text != null
			? mapsLinks(offer.lat, offer.lng, offer.address_text)
			: null;
	const myApp = offer.my_application;
	const canApply =
		!offer.is_own &&
		offer.status === "open" &&
		(!myApp || myApp.status === "rejected" || myApp.status === "withdrawn");
	const canWithdraw =
		!offer.is_own && myApp?.status === "pending" && offer.status === "open";
	const anyBusy = busy !== null;
	const timeSuffix = offer.time_hint
		? t("recurring.timeSuffix", { time: offer.time_hint })
		: "";
	const floorCents =
		offer.pfand_floor_cents ?? recurringFloorCents(offer.pfand_value_cents);

	return (
		<div className="page detail-page">
			<p className="back">
				<Link to="/">{t("common.backMap")}</Link>
			</p>

			<header className="page-header">
				<h1>{offer.title || t("offer.recurringFallbackTitle")}</h1>
				<p className="page-meta muted small">
					<span className="badge">{t("recurring.badge")}</span>{" "}
					{weekdayLabel(offer.weekday)}
					{offer.time_hint ? ` · ${offer.time_hint}` : ""}
				</p>
			</header>

			{(offer.is_own && offer.status === "open") ||
			(offer.is_own && offer.status === "assigned") ||
			offer.is_assigned_collector ||
			(!offer.is_own &&
				!offer.is_assigned_collector &&
				offer.status === "open") ? (
				<div className="status-banners">
					<div className="banner info handover-hint status-banner">
						{offer.is_own && offer.status === "open" && (
							<>{t("recurring.banner.next")}</>
						)}
						{offer.is_own && offer.status === "assigned" && (
							<>
								{t("recurring.banner.assigned", {
									weekday: weekdayLabel(offer.weekday),
									time: timeSuffix,
								})}
							</>
						)}
						{offer.is_assigned_collector && (
							<>
								{t("recurring.banner.youCollect", {
									weekday: weekdayLabel(offer.weekday),
									time: timeSuffix,
								})}
							</>
						)}
						{!offer.is_own &&
							!offer.is_assigned_collector &&
							offer.status === "open" && (
								<>{t("recurring.banner.apply")}</>
							)}
					</div>
				</div>
			) : null}

			{offer.is_own && <WeeklyTips variant="poster" />}
			{offer.is_assigned_collector && <WeeklyTips variant="collector" />}
			{!offer.is_own &&
				!offer.is_assigned_collector &&
				offer.status === "open" && <WeeklyTips variant="applicant" compact />}

			<div className="detail-card">
				<div className="detail-hero detail-row">
					<span className="label">{t("recurring.estimateLabel")}</span>
					<strong className="pfand detail-hero-value">
						{t("recurring.estimateValue", {
							value: centsToEuro(offer.pfand_value_cents),
						})}
					</strong>
				</div>
				<p className="muted small detail-pfand-floor">
					{t("recurring.floorHint", {
						floor: centsToEuro(floorCents),
					})}
				</p>

				<div className="detail-section">
					<div className="detail-desc">
						<span className="label">{t("recurring.itemsLabel")}</span>
						<PfandItemsList items={offer.items ?? []} />
					</div>
				</div>

				<div className="detail-section detail-facts">
					<div className="detail-row">
						<span className="label">{t("recurring.label.status")}</span>
						<span className={offerStatusClass(offer.status)}>
							{recurringStatusLabel(offer.status)}
						</span>
					</div>
					<div className="detail-row">
						<span className="label">{t("recurring.label.weekday")}</span>
						<span>
							{weekdayLabel(offer.weekday)}
							{offer.time_hint ? ` · ${offer.time_hint}` : ""}
						</span>
					</div>
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
								</>
							)}
						</div>
					</div>
				)}

				{offer.description && (
					<div className="detail-section detail-desc">
						<span className="label">{t("detail.note")}</span>
						<p className="detail-note" style={{ whiteSpace: "pre-wrap" }}>
							{offer.description}
						</p>
					</div>
				)}
			</div>

			{(error || loadError) && offer && (
				<p className="banner error">{error ?? loadError}</p>
			)}

			{myApp && !offer.is_own && (
				<div className="banner info status-banner">
					<strong>{t("recurring.myApp")}</strong>{" "}
					{recurringAppStatusLabel(myApp.status)}
					{myApp.message ? ` — „${myApp.message}“` : ""}
				</div>
			)}

			{offer.is_own && offer.applications && (
				<section className="panel-block panel-section applicants-section">
					<div className="panel-head">
						<h2>{t("recurring.appsTitle")}</h2>
						<span className="muted small panel-head-meta">
							{offer.applications.length}
						</span>
					</div>
					{offer.applications.length === 0 ? (
						<div className="empty-state">
							<p className="empty-state-title">
								{t("recurring.appsEmptyTitle")}
							</p>
							<p className="empty-state-text">
								{t("recurring.appsEmptyText")}
							</p>
						</div>
					) : (
						<ul className="list">
							{offer.applications.map((a) => (
								<li key={a.id} className="list-item">
									<div className="list-item-main">
										<strong className="list-item-title">
											{a.display_name}
										</strong>
										<span className={offerStatusClass(a.status)}>
											{recurringAppStatusLabel(a.status)}
										</span>
									</div>
									{a.message && (
										<div className="meta list-item-meta">„{a.message}“</div>
									)}
									<div className="meta muted small list-item-meta">{a.email}</div>
									{offer.status === "open" && a.status === "pending" && (
										<div className="list-item-actions">
											<button
												type="button"
												className="btn btn-sm btn-primary"
												disabled={anyBusy}
												onClick={() => void onSelect(a.applicant_id)}
											>
												{busy === `select-${a.applicant_id}`
													? t("recurring.select.busy")
													: t("recurring.select")}
											</button>
										</div>
									)}
								</li>
							))}
						</ul>
					)}
				</section>
			)}

			<div className="actions sticky-actions action-stack">
				{canApply && (
					<div className="apply-form">
						<div className="banner info apply-threshold-hint">
							{t("recurring.applyThreshold", {
								estimate: centsToEuro(offer.pfand_value_cents),
								floor: centsToEuro(floorCents),
							})}
						</div>
						<label>
							{t("recurring.messageLabel")}
							<textarea
								value={applyMsg}
								onChange={(e) => setApplyMsg(e.target.value)}
								rows={2}
								maxLength={400}
								placeholder={t("recurring.messagePlaceholder")}
							/>
						</label>
						<button
							type="button"
							className="btn btn-primary"
							disabled={anyBusy}
							onClick={() => void onApply()}
						>
							{busy === "apply"
								? t("recurring.apply.busy")
								: t("recurring.apply")}
						</button>
					</div>
				)}
				{canWithdraw && (
					<button
						type="button"
						className="btn"
						disabled={anyBusy}
						onClick={() => void onWithdraw()}
					>
						{busy === "withdraw" ? "…" : t("recurring.withdraw")}
					</button>
				)}
				{offer.is_own && offer.status === "assigned" && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onUnassign()}
					>
						{busy === "unassign" ? "…" : t("recurring.unassign")}
					</button>
				)}
				{offer.is_own &&
					(offer.status === "open" || offer.status === "assigned") && (
						<button
							type="button"
							className="btn"
							disabled={anyBusy}
							onClick={() => void onCancel()}
						>
							{busy === "cancel" ? "…" : t("recurring.cancel")}
						</button>
					)}
				{offer.status === "cancelled" && (
					<p className="muted action-done">{t("recurring.cancelledDone")}</p>
				)}
			</div>
		</div>
	);
}
