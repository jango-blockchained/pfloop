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

type BusyAction = "accept" | "collect" | "confirm" | "cancel" | null;

export function OfferDetail() {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();
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
			setLoadError(getErrorMessage(e, "Laden hat nicht geklappt"));
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		setLoading(true);
		overdueRefreshDone.current = false;
		void load();
	}, [load]);

	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 10_000);
		return () => clearInterval(t);
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
			setError(getErrorMessage(e, "Das hat nicht geklappt"));
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
		if (
			!confirm(
				"Hast du das Pfand abgeholt?\n\nDer Inserent muss danach noch bestätigen. Erst dann kannst du ein neues Angebot annehmen.",
			)
		) {
			return;
		}
		await runAction("collect", async () => {
			await collectOffer(id);
		});
	}

	async function onConfirm() {
		if (!id) return;
		if (
			!confirm(
				"Hat der Abholer das Pfand wirklich mitgenommen?\n\nDann ist die Abholung erledigt.",
			)
		) {
			return;
		}
		await runAction("confirm", async () => {
			await confirmOffer(id);
		});
	}

	async function onCancel() {
		if (!id) return;
		if (!confirm("Angebot wirklich stornieren?")) return;
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
			setError("Adresse konnte nicht kopiert werden.");
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
						<span className="label">Pfandwert</span>
						<span className="skeleton skeleton-title" />
					</div>
					<div className="detail-row">
						<span className="label">Status</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="detail-row">
						<span className="label">Gebiet</span>
						<span className="skeleton skeleton-text short" />
					</div>
					<div className="skeleton skeleton-block" />
					<p className="muted small">Angebot wird geladen…</p>
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
				<Link to="/">← Karte</Link>
			</p>

			<header className="page-header">
				<h1>{offer.title || "Pfand-Angebot"}</h1>
			</header>

			{nextStep && (
				<div className="banner info handover-hint status-banner">
					<strong>Als Nächstes:</strong> {nextStep}
				</div>
			)}

			<div className="detail-card">
				<div className="detail-hero detail-row">
					<span className="label">Pfandwert</span>
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
							{offerStatusLabel(offer.status)}
						</span>
					</div>
					{offerStatusHint(offer.status) && (
						<p className="muted small status-hint">
							{offerStatusHint(offer.status)}
						</p>
					)}
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
									<a className="btn btn-sm" href={maps.geo}>
										Karten-App
									</a>
								</>
							)}
						</div>
					</div>
				)}

				{!offer.address_text && offer.status === "open" && (
					<p className="muted small address-privacy-hint">
						Die genaue Adresse siehst du erst nach der Annahme. Danach hast du
						6 Stunden zum Abholen. Danach: du tippst „Abgeholt“, der Inserent
						bestätigt – fertig.
					</p>
				)}

				{offer.description && (
					<div className="detail-section detail-desc">
						<span className="label">Hinweis</span>
						<p className="detail-note" style={{ whiteSpace: "pre-wrap" }}>
							{offer.description}
						</p>
					</div>
				)}

				{showCountdown && deadline && (
					<div className="detail-row countdown-row">
						<span className="label">
							{offer.status === "reserved"
								? "Zeit zum Abholen"
								: "Reservierung"}
						</span>
						<span
							className={`badge ${overdue ? "badge-muted" : "badge-warn"} countdown-badge`}
						>
							{overdue
								? "Zeit um – wir aktualisieren…"
								: `Noch ${formatCountdown(deadline, now)}`}
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
						<strong>Schritt 1:</strong> Hol das Pfand ab und tipp auf „Abgeholt“.
						Der Inserent bestätigt danach – erst dann kannst du was Neues
						annehmen.
					</div>
				)}

				{isCollectorView && offer.status === "collected" && (
					<div className="banner info handover-hint status-banner">
						<strong>Fast geschafft:</strong> Du hast abgeholt. Bitte den
						Inserenten, in der App zu bestätigen. Bis dahin kein neues Angebot.
					</div>
				)}

				{offer.is_own && offer.status === "reserved" && (
					<div className="banner info handover-hint status-banner">
						<strong>Abholung läuft:</strong> Jemand ist unterwegs (6 Stunden
						Zeit). Sobald er oder sie „Abgeholt“ tippt, bestätigst du die
						Übergabe.
					</div>
				)}

				{canConfirm && (
					<div className="banner info handover-hint status-banner">
						<strong>Deine Bestätigung:</strong> Der Abholer sagt, er war da.
						Bestätige bitte, dass das Pfand wirklich weg ist.
					</div>
				)}

				{offer.is_own && offer.status === "open" && (
					<div className="banner info handover-hint status-banner">
						<strong>Dein Angebot ist online.</strong> Adresse und genaue
						Position sehen andere erst nach der Annahme. Stornieren geht,
						solange noch nicht alles erledigt ist.
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
						{busy === "accept"
							? "Wird angenommen…"
							: "Annehmen (6 Stunden Zeit)"}
					</button>
				)}
				{canCollect && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onCollect()}
					>
						{busy === "collect" ? "Wird gemeldet…" : "Abgeholt"}
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
							? "Wird bestätigt…"
							: "Übergabe bestätigen"}
					</button>
				)}
				{canCancel && (
					<button
						type="button"
						className="btn"
						disabled={anyBusy}
						onClick={() => void onCancel()}
					>
						{busy === "cancel" ? "Storniere…" : "Angebot stornieren"}
					</button>
				)}
				{offer.status === "completed" && (
					<p className="muted action-done">
						Passt – Abholung erledigt. Danke!
					</p>
				)}
				{offer.status === "cancelled" && (
					<p className="muted action-done">Dieses Angebot wurde storniert.</p>
				)}
			</div>
		</div>
	);
}
