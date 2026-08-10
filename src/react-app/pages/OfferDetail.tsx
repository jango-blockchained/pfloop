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
			setLoadError(getErrorMessage(e, "Laden fehlgeschlagen"));
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
			setError(getErrorMessage(e, "Aktion fehlgeschlagen"));
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
				"Hast du das Pfand abgeholt?\n\nDer Inserent muss die Übergabe danach noch bestätigen (Schritt 2/2). Erst dann kannst du ein neues Angebot annehmen.",
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
				"Bestätigst du, dass der Abholer das Pfand erhalten hat?\n\nDanach ist die Abholung erledigt.",
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
			<div className="page">
				<p className="banner error">Keine Angebots-ID</p>
				<p>
					<Link to="/">Zurück zur Karte</Link>
				</p>
			</div>
		);
	}

	if (loading && !offer) {
		return (
			<div className="page">
				<p className="back">
					<Link to="/">← Karte</Link>
				</p>
				<div className="detail-card detail-skeleton" aria-busy="true">
					<div className="detail-row">
						<span className="label">Pfandwert</span>
						<span className="muted">lädt…</span>
					</div>
					<div className="detail-row">
						<span className="label">Status</span>
						<span className="muted">lädt…</span>
					</div>
					<div className="detail-row">
						<span className="label">Gebiet</span>
						<span className="muted">lädt…</span>
					</div>
					<p className="muted small">Angebot wird geladen…</p>
				</div>
			</div>
		);
	}

	if (!offer) {
		return (
			<div className="page">
				<p className="back">
					<Link to="/">← Karte</Link>
				</p>
				<p className="banner error">
					{loadError ?? "Angebot konnte nicht geladen werden."}
				</p>
				<div className="actions">
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => {
							setLoading(true);
							void load();
						}}
					>
						Erneut versuchen
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
		<div className="page">
			<p className="back">
				<Link to="/">← Karte</Link>
			</p>
			<h1>{offer.title || "Pfand-Angebot"}</h1>

			{nextStep && (
				<div className="banner info handover-hint">
					<strong>Nächster Schritt:</strong> {nextStep}
				</div>
			)}

			<div className="detail-card">
				<div className="detail-row">
					<span className="label">Pfandwert</span>
					<strong className="pfand">
						{centsToEuro(offer.pfand_value_cents)} €
					</strong>
				</div>
				<div className="detail-desc">
					<span className="label">Stückliste (Pfandsystem)</span>
					<PfandItemsList items={offer.items ?? []} />
				</div>
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

				{offer.address_text && (
					<div className="detail-desc address-block">
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
					<p className="muted small">
						Die genaue Adresse wird erst nach Annahme angezeigt. Danach hast du
						6 Stunden Zeit für die Abholung. Die Übergabe läuft in zwei
						Schritten: Abholer meldet „Abgeholt“, Inserent bestätigt.
					</p>
				)}

				{offer.description && (
					<div className="detail-desc">
						<span className="label">Hinweis</span>
						<p style={{ whiteSpace: "pre-wrap" }}>{offer.description}</p>
					</div>
				)}

				{showCountdown && deadline && (
					<div className="detail-row countdown-row">
						<span className="label">
							{offer.status === "reserved"
								? "Abholfenster"
								: "Reservierung"}
						</span>
						<span
							className={`badge ${overdue ? "badge-muted" : "badge-warn"} countdown-badge`}
						>
							{overdue
								? "Zeit abgelaufen — wird aktualisiert…"
								: `Noch ${formatCountdown(deadline, now)}`}
						</span>
					</div>
				)}
			</div>

			{(error || loadError) && offer && (
				<p className="banner error">{error ?? loadError}</p>
			)}

			{isCollectorView && offer.status === "reserved" && (
				<div className="banner info handover-hint">
					<strong>Zwei-Schritt-Übergabe · Schritt 1:</strong> Hole das Pfand ab
					und tippe „Abgeholt melden“. Der Inserent bestätigt danach die
					Übergabe — erst dann kannst du ein neues Angebot annehmen.
				</div>
			)}

			{isCollectorView && offer.status === "collected" && (
				<div className="banner info handover-hint">
					<strong>Schritt 2 beim Inserenten:</strong> Du hast abgeholt. Bitte den
					Inserenten, die Übergabe in der App zu bestätigen. Bis dahin ist kein
					neues Angebot möglich.
				</div>
			)}

			{offer.is_own && offer.status === "reserved" && (
				<div className="banner info handover-hint">
					<strong>Abholung läuft:</strong> Ein Abholer ist unterwegs (6h-Fenster).
					Warte auf „Abgeholt melden“, danach bestätigst du die Übergabe.
				</div>
			)}

			{canConfirm && (
				<div className="banner info handover-hint">
					<strong>Schritt 2/2 — deine Bestätigung:</strong> Der Abholer meldet
					Abholung. Bitte bestätige, dass das Pfand übergeben wurde.
				</div>
			)}

			{offer.is_own && offer.status === "open" && (
				<div className="banner info handover-hint">
					<strong>Dein Angebot ist live.</strong> Adresse und genaue Position
					sehen andere erst nach der Annahme. Du kannst stornieren, solange die
					Übergabe nicht bestätigt ist.
				</div>
			)}

			<div className="actions">
				{canAccept && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onAccept()}
					>
						{busy === "accept"
							? "Annahme läuft…"
							: "Angebot annehmen (6h-Fenster)"}
					</button>
				)}
				{canCollect && (
					<button
						type="button"
						className="btn btn-primary"
						disabled={anyBusy}
						onClick={() => void onCollect()}
					>
						{busy === "collect" ? "Meldung wird gesendet…" : "Abgeholt melden"}
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
							? "Bestätige Übergabe…"
							: "Übergabe bestätigen (erledigt)"}
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
					<p className="muted">
						Übergabe bestätigt — Abholung erledigt. Danke!
					</p>
				)}
				{offer.status === "cancelled" && (
					<p className="muted">Dieses Angebot wurde storniert.</p>
				)}
			</div>
		</div>
	);
}
