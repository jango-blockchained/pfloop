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
import { mapsLinks } from "../lib/format";
import {
	offerStatusClass,
	recurringAppStatusLabel,
	recurringStatusLabel,
	weekdayLabel,
} from "../lib/labels";
import { PfandItemsList } from "../components/PfandItemsList";
import { WeeklyTips } from "../components/WeeklyTips";

export function RecurringDetail() {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();
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
			setLoadError(getErrorMessage(e, "Laden hat nicht geklappt"));
			setOffer(null);
		} finally {
			setLoading(false);
		}
	}, [id]);

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
			setError(getErrorMessage(e, "Bewerbung hat nicht geklappt"));
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
			setError(getErrorMessage(e, "Zurückziehen hat nicht geklappt"));
		} finally {
			setBusy(null);
		}
	}

	async function onSelect(applicantId: string) {
		if (!id) return;
		if (
			!confirm(
				"Diesen Abholer nehmen? Danach ist das Angebot für andere weg, bis du ihn wieder freigibst.",
			)
		) {
			return;
		}
		setBusy(`select-${applicantId}`);
		setError(null);
		try {
			await selectRecurringApplicant(id, { applicant_id: applicantId });
			await load();
		} catch (e) {
			setError(getErrorMessage(e, "Auswahl hat nicht geklappt"));
		} finally {
			setBusy(null);
		}
	}

	async function onUnassign() {
		if (!id) return;
		if (
			!confirm(
				"Abholer freigeben? Dann taucht das Angebot wieder auf der Karte auf und andere können sich bewerben.",
			)
		) {
			return;
		}
		setBusy("unassign");
		setError(null);
		try {
			await unassignRecurringCollector(id);
			await load();
		} catch (e) {
			setError(getErrorMessage(e, "Freigabe hat nicht geklappt"));
		} finally {
			setBusy(null);
		}
	}

	async function onCancel() {
		if (!id) return;
		if (!confirm("Wöchentliches Angebot wirklich stornieren?")) return;
		setBusy("cancel");
		setError(null);
		try {
			await cancelRecurringOffer(id);
			await load();
		} catch (e) {
			setError(getErrorMessage(e, "Stornieren hat nicht geklappt"));
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
			setError("Kopieren hat nicht geklappt");
		}
	}

	if (!id) {
		return (
			<div className="page detail-page">
				<p className="banner error">Hier fehlt die Angebots-ID.</p>
				<p className="back">
					<Link to="/">Zurück zur Karte</Link>
				</p>
			</div>
		);
	}

	if (loading && !offer) {
		return (
			<div className="page detail-page">
				<p className="back">
					<Link to="/">← Karte</Link>
				</p>
				<div className="detail-card detail-skeleton" aria-busy="true">
					<div className="detail-hero">
						<span className="label">Pfandwert (ca.)</span>
						<span className="skeleton skeleton-title" />
					</div>
					<div className="detail-row">
						<span className="label">Status</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="detail-row">
						<span className="label">Wochentag</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="skeleton skeleton-block" />
					<p className="muted small">Wöchentliches Angebot wird geladen…</p>
				</div>
			</div>
		);
	}

	if (!offer) {
		return (
			<div className="page detail-page">
				<p className="back">
					<Link to="/">← Karte</Link>
				</p>
				<p className="banner error">
					{loadError ?? "Das Angebot ließ sich nicht laden."}
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
						Nochmal versuchen
					</button>
					<Link className="btn" to="/">
						Zur Karte
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

	return (
		<div className="page detail-page">
			<p className="back">
				<Link to="/">← Karte</Link>
			</p>

			<header className="page-header">
				<h1>{offer.title || "Wöchentliches Pfand"}</h1>
				<p className="page-meta muted small">
					<span className="badge">Wöchentlich</span>{" "}
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
							<>
								<strong>Als Nächstes:</strong> Warte auf Bewerbungen und such
								dir jemanden aus. Danach ist das Angebot von der Karte weg.
							</>
						)}
						{offer.is_own && offer.status === "assigned" && (
							<>
								<strong>Abholer steht fest:</strong> Andere sehen das Angebot
								nicht mehr. Freigeben, wenn wieder Bewerbungen rein sollen.
								Stell das Pfand bitte immer zur vereinbarten Zeit bereit.
							</>
						)}
						{offer.is_assigned_collector && (
							<>
								<strong>Du holst regelmäßig ab:</strong> Die Adresse siehst du.
								Termin: {weekdayLabel(offer.weekday)}
								{offer.time_hint ? `, ${offer.time_hint}` : ""}. Melde die
								Abholung bitte selbst in der App – sonst blockiert eine offene
								Abholung neue Angebote.
							</>
						)}
						{!offer.is_own &&
							!offer.is_assigned_collector &&
							offer.status === "open" && (
								<>
									<strong>Bewerben:</strong> Der Inserent sucht jemanden aus.
									Die Adresse siehst du erst, wenn du dran bist.
								</>
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
					<span className="label">Pfandwert (ca.)</span>
					<strong className="pfand detail-hero-value">
						{centsToEuro(offer.pfand_value_cents)} €
					</strong>
				</div>

				<div className="detail-section">
					<div className="detail-desc">
						<span className="label">Stückliste</span>
						<PfandItemsList items={offer.items ?? []} />
					</div>
				</div>

				<div className="detail-section detail-facts">
					<div className="detail-row">
						<span className="label">Status</span>
						<span className={offerStatusClass(offer.status)}>
							{recurringStatusLabel(offer.status)}
						</span>
					</div>
					<div className="detail-row">
						<span className="label">Wochentag</span>
						<span>
							{weekdayLabel(offer.weekday)}
							{offer.time_hint ? ` · ${offer.time_hint}` : ""}
						</span>
					</div>
					<div className="detail-row">
						<span className="label">Gebiet</span>
						<span>{offer.address_hint || "—"}</span>
					</div>
				</div>

				{offer.address_text && (
					<div className="detail-section detail-desc address-block">
						<span className="label">Adresse</span>
						<p className="address">{offer.address_text}</p>
						<div className="address-actions">
							<button
								type="button"
								className="btn btn-sm"
								onClick={() => void onCopyAddress(offer.address_text!)}
							>
								{copied ? "Kopiert!" : "Adresse kopieren"}
							</button>
							{maps && (
								<>
									<a
										className="btn btn-sm"
										href={maps.google}
										target="_blank"
										rel="noopener noreferrer"
									>
										Google Maps
									</a>
									<a
										className="btn btn-sm"
										href={maps.apple}
										target="_blank"
										rel="noopener noreferrer"
									>
										Apple Karten
									</a>
								</>
							)}
						</div>
					</div>
				)}

				{offer.description && (
					<div className="detail-section detail-desc">
						<span className="label">Hinweis</span>
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
					<strong>Deine Bewerbung:</strong>{" "}
					{recurringAppStatusLabel(myApp.status)}
					{myApp.message ? ` — „${myApp.message}“` : ""}
				</div>
			)}

			{offer.is_own && offer.applications && (
				<section className="panel-block panel-section applicants-section">
					<div className="panel-head">
						<h2>Bewerbungen</h2>
						<span className="muted small panel-head-meta">
							{offer.applications.length}
						</span>
					</div>
					{offer.applications.length === 0 ? (
						<div className="empty-state">
							<p className="empty-state-title">Noch keine Bewerbungen</p>
							<p className="empty-state-text">
								Sobald sich jemand meldet, erscheint die Person hier.
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
													? "Wird gewählt…"
													: "Als Abholer nehmen"}
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
						<label>
							Kurze Nachricht (optional)
							<textarea
								value={applyMsg}
								onChange={(e) => setApplyMsg(e.target.value)}
								rows={2}
								maxLength={400}
								placeholder="Kurz vorstellen…"
							/>
						</label>
						<button
							type="button"
							className="btn btn-primary"
							disabled={anyBusy}
							onClick={() => void onApply()}
						>
							{busy === "apply" ? "Wird gesendet…" : "Bewerben"}
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
						{busy === "withdraw" ? "…" : "Bewerbung zurückziehen"}
					</button>
				)}
				{offer.is_own && offer.status === "assigned" && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onUnassign()}
					>
						{busy === "unassign" ? "…" : "Abholer freigeben (wieder sichtbar)"}
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
							{busy === "cancel" ? "…" : "Wöchentliches Angebot stornieren"}
						</button>
					)}
				{offer.status === "cancelled" && (
					<p className="muted action-done">
						Dieses wöchentliche Angebot wurde storniert.
					</p>
				)}
			</div>
		</div>
	);
}
