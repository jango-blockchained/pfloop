import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OfferMap } from "../components/OfferMap";
import {
	emptyQuantities,
	PfandQuantityForm,
} from "../components/PfandQuantityForm";
import { createOffer, getErrorMessage } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import {
	MIN_PFAND_CENTS,
	centsUntilMinimum,
	quantitiesToItems,
	totalFromQuantities,
} from "../lib/pfand-ui";
import { centsToEuroDe } from "../../shared/pfand";

export function CreateOffer() {
	const navigate = useNavigate();
	const { user, loading } = useAuth();
	const [note, setNote] = useState("");
	const [quantities, setQuantities] = useState(emptyQuantities);
	const [addressText, setAddressText] = useState("");
	const [addressHint, setAddressHint] = useState("");
	const [pick, setPick] = useState<[number, number] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [attempted, setAttempted] = useState(false);

	const { totalCents, lines } = useMemo(
		() => totalFromQuantities(quantities),
		[quantities],
	);

	const items = useMemo(() => quantitiesToItems(quantities), [quantities]);
	const missingItems = items.length === 0;
	const belowMin = totalCents < MIN_PFAND_CENTS;
	const missingAddress = !addressText.trim();
	const missingPin = !pick;
	const restToMin = centsUntilMinimum(totalCents);

	const publishBlockedReason = useMemo(() => {
		if (saving) return "Wird veröffentlicht…";
		if (missingItems) return "Bitte Stückzahlen angeben";
		if (belowMin) {
			return `Noch ${centsToEuroDe(restToMin)} € bis ${centsToEuroDe(MIN_PFAND_CENTS)} € Mindestwert`;
		}
		if (missingAddress) return "Volle Adresse fehlt";
		if (missingPin) return "Bitte Standort auf der Karte setzen";
		return null;
	}, [
		saving,
		missingItems,
		belowMin,
		restToMin,
		missingAddress,
		missingPin,
	]);

	const canPublish = !publishBlockedReason;

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		if (saving) return;
		setAttempted(true);
		setError(null);

		if (!user) {
			setError("Bitte zuerst anmelden.");
			return;
		}
		if (missingItems) {
			setError("Bitte Stückzahlen für Flaschen und/oder Kästen angeben.");
			return;
		}
		if (belowMin) {
			setError(
				`Mindest-Pfandwert ist ${centsToEuroDe(MIN_PFAND_CENTS)} € (aktuell ${centsToEuroDe(totalCents)} €).`,
			);
			return;
		}
		if (missingAddress) {
			setError("Bitte die volle Adresse angeben (nur nach Annahme sichtbar).");
			return;
		}
		if (!pick) {
			setError("Bitte einen Punkt auf der Karte setzen.");
			return;
		}

		setSaving(true);
		try {
			const { id } = await createOffer({
				items,
				note: note.trim() || undefined,
				lat: pick[0],
				lng: pick[1],
				address_hint: addressHint.trim() || "—",
				address_text: addressText.trim(),
			});
			navigate(`/angebot/${id}`);
		} catch (err) {
			setError(getErrorMessage(err, "Speichern fehlgeschlagen"));
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="page">
				<p className="muted">Lade Sitzung…</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="page">
				<h1>Angebot erstellen</h1>
				<p className="muted">
					Bitte <Link to="/login">anmelden</Link>, um ein Angebot zu
					inserieren.
				</p>
			</div>
		);
	}

	return (
		<div className="page create-page">
			<h1>Angebot erstellen</h1>
			<p className="muted">
				Stückzahlen nach deutschem Pfandsystem (mind.{" "}
				{centsToEuroDe(MIN_PFAND_CENTS)} €). Die exakte Adresse bleibt privat,
				bis jemand annimmt — dann hat der Abholer 6 Stunden Zeit.
			</p>

			<form className="form" onSubmit={onSubmit} noValidate>
				<section className="form-section">
					<h2 className="form-section-title">1. Pfand-Stückliste</h2>
					<PfandQuantityForm
						quantities={quantities}
						onChange={setQuantities}
						totalCents={totalCents}
					/>
					{attempted && missingItems && (
						<p className="banner error">
							Mindestens eine Stückzahl größer als 0 angeben.
						</p>
					)}
					{lines.length > 0 && (
						<p className="muted small">
							Vorschau:{" "}
							{lines.map((l) => `${l.quantity}× ${l.label}`).join(", ")}
						</p>
					)}
				</section>

				<section className="form-section">
					<h2 className="form-section-title">2. Hinweise & Adresse</h2>
					<label>
						Hinweis für Abholer (optional)
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={2}
							placeholder="z. B. im Hof, klingeln bei Müller…"
							maxLength={500}
						/>
						<span className="muted small">
							Sichtbar für alle — keine Hausnummer nötig, wenn sie in der
							privaten Adresse steht.
						</span>
					</label>

					<label>
						Volle Adresse (privat bis zur Annahme)
						<input
							value={addressText}
							onChange={(e) => setAddressText(e.target.value)}
							placeholder="Musterstraße 1, 10115 Berlin"
							required
							autoComplete="street-address"
							aria-invalid={attempted && missingAddress}
						/>
						<span className="muted small">
							Nur für den Abholer nach Annahme sichtbar.
						</span>
						{attempted && missingAddress && (
							<span className="field-error">Adresse angeben.</span>
						)}
					</label>
					<label>
						Öffentlicher Hinweis (Stadtteil / Gebiet)
						<input
							value={addressHint}
							onChange={(e) => setAddressHint(e.target.value)}
							placeholder="Berlin-Mitte"
							autoComplete="address-level2"
						/>
						<span className="muted small">
							Auf der Karte sichtbar, ohne genaue Straße.
						</span>
					</label>
				</section>

				<section className="form-section">
					<h2 className="form-section-title">3. Standort auf der Karte</h2>
					<div className="form-map">
						<p className="label">
							Adresse suchen, Karte tippen oder ◎ für deinen Standort
						</p>
						<div className="form-map-inner">
							<OfferMap
								offers={[]}
								pickMode
								pickPosition={pick}
								showControls
								onPick={(lat, lng) => setPick([lat, lng])}
								onLocationResolved={({ lat, lng, label }) => {
									setPick([lat, lng]);
									if (label && label !== "Mein Standort") {
										setAddressText(label);
										const parts = label.split(",").map((s) => s.trim());
										if (parts.length >= 2 && !addressHint) {
											setAddressHint(parts[parts.length - 1] ?? "");
										}
									}
								}}
								className="map map-sm"
							/>
						</div>
						{pick ? (
							<p className="muted small">
								Pin gesetzt: {pick[0].toFixed(5)}, {pick[1].toFixed(5)}
							</p>
						) : (
							<p
								className={
									attempted && missingPin
										? "banner error"
										: "muted small"
								}
							>
								{attempted && missingPin
									? "Bitte einen Punkt auf der Karte setzen."
									: "Noch kein Kartenpunkt — Abholer brauchen ungefähren Standort."}
							</p>
						)}
					</div>
				</section>

				{error && <p className="banner error">{error}</p>}

				<div className="form-submit">
					<button
						className="btn btn-primary"
						type="submit"
						disabled={!canPublish}
						title={publishBlockedReason ?? undefined}
					>
						{saving
							? "Veröffentliche Angebot…"
							: `Angebot veröffentlichen (${centsToEuroDe(totalCents)} €)`}
					</button>
					{!canPublish && !saving && (
						<p className="muted small publish-hint">{publishBlockedReason}</p>
					)}
				</div>
			</form>
		</div>
	);
}
