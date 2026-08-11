import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OfferMap } from "../components/OfferMap";
import {
	emptyQuantities,
	PfandQuantityForm,
} from "../components/PfandQuantityForm";
import {
	createOffer,
	createRecurringOffer,
	getErrorMessage,
	type Weekday,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { weekdayLabel } from "../lib/labels";
import {
	MIN_PFAND_CENTS,
	centsUntilMinimum,
	quantitiesToItems,
	totalFromQuantities,
} from "../lib/pfand-ui";
import { WeeklyTips } from "../components/WeeklyTips";
import { centsToEuroDe } from "../../shared/pfand";

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export function CreateOffer() {
	const navigate = useNavigate();
	const { user, loading } = useAuth();
	const [mode, setMode] = useState<"once" | "recurring">("once");
	const [note, setNote] = useState("");
	const [quantities, setQuantities] = useState(emptyQuantities);
	const [addressText, setAddressText] = useState("");
	const [addressHint, setAddressHint] = useState("");
	const [weekday, setWeekday] = useState<Weekday>(1);
	const [timeHint, setTimeHint] = useState("");
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
		if (saving) return "Wird gerade veröffentlicht…";
		if (missingItems) return "Bitte Stückzahlen eintragen";
		if (belowMin) {
			return `Noch ${centsToEuroDe(restToMin)} € bis zu den ${centsToEuroDe(MIN_PFAND_CENTS)} € Minimum`;
		}
		if (missingAddress) return "Die Adresse fehlt noch";
		if (missingPin) return "Setz bitte noch einen Punkt auf der Karte";
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
			setError("Bitte melde dich zuerst an.");
			return;
		}
		if (missingItems) {
			setError("Trag bitte ein, wie viele Flaschen oder Kästen du hast.");
			return;
		}
		if (belowMin) {
			setError(
				`Mindestens ${centsToEuroDe(MIN_PFAND_CENTS)} € Pfand – du hast gerade ${centsToEuroDe(totalCents)} €.`,
			);
			return;
		}
		if (missingAddress) {
			setError(
				mode === "recurring"
					? "Bitte die volle Adresse – die sieht nur der gewählte Abholer."
					: "Bitte die volle Adresse – die sieht man erst nach der Annahme.",
			);
			return;
		}
		if (!pick) {
			setError("Setz bitte noch einen Punkt auf der Karte.");
			return;
		}

		setSaving(true);
		try {
			if (mode === "recurring") {
				const { id } = await createRecurringOffer({
					items,
					note: note.trim() || undefined,
					lat: pick[0],
					lng: pick[1],
					address_hint: addressHint.trim() || "—",
					address_text: addressText.trim(),
					weekday,
					time_hint: timeHint.trim() || undefined,
				});
				navigate(`/woche/${id}`);
			} else {
				const { id } = await createOffer({
					items,
					note: note.trim() || undefined,
					lat: pick[0],
					lng: pick[1],
					address_hint: addressHint.trim() || "—",
					address_text: addressText.trim(),
				});
				navigate(`/angebot/${id}`);
			}
		} catch (err) {
			setError(getErrorMessage(err, "Speichern hat nicht geklappt"));
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
					Bitte <Link to="/login">anmelden</Link>, dann kannst du ein Angebot
					einstellen.
				</p>
			</div>
		);
	}

	return (
		<div className="page create-page">
			<h1>Angebot erstellen</h1>
			<p className="muted">
				Stückzahlen nach deutschem Pfandsystem (mind.{" "}
				{centsToEuroDe(MIN_PFAND_CENTS)} €). Die genaue Adresse bleibt privat,
				bis jemand annimmt – oder bis du beim Wöchentlichen jemanden auswählst.
			</p>

			<form className="form" onSubmit={onSubmit} noValidate>
				<section className="form-section">
					<h2 className="form-section-title">Art des Angebots</h2>
					<div className="mode-toggle" role="radiogroup" aria-label="Angebotsart">
						<label className={`mode-option ${mode === "once" ? "active" : ""}`}>
							<input
								type="radio"
								name="offer-mode"
								checked={mode === "once"}
								onChange={() => setMode("once")}
							/>
							<span>
								<strong>Einmalig</strong>
								<span className="muted small">
									Jemand nimmt an und hat 6 Stunden Zeit
								</span>
							</span>
						</label>
						<label
							className={`mode-option ${mode === "recurring" ? "active" : ""}`}
						>
							<input
								type="radio"
								name="offer-mode"
								checked={mode === "recurring"}
								onChange={() => setMode("recurring")}
							/>
							<span>
								<strong>Wöchentlich</strong>
								<span className="muted small">
									Bis 2 Stück · Leute bewerben sich, du wählst
								</span>
							</span>
						</label>
					</div>
					{mode === "recurring" && (
						<>
							<div className="banner info handover-hint">
								<strong>So läuft’s wöchentlich:</strong> Andere können sich
								bewerben. Du suchst jemanden aus – danach ist das Angebot von der
								Karte weg, bis du den Abholer wieder freigibst. Maximal zwei
								aktive wöchentliche Angebote.
							</div>
							<WeeklyTips variant="create" />
						</>
					)}
				</section>

				<section className="form-section">
					<h2 className="form-section-title">1. Pfand-Stückliste</h2>
					<PfandQuantityForm
						quantities={quantities}
						onChange={setQuantities}
						totalCents={totalCents}
					/>
					{attempted && missingItems && (
						<p className="banner error">
							Mindestens bei einer Sorte etwas eintragen.
						</p>
					)}
					{lines.length > 0 && (
						<p className="muted small">
							So sieht’s aus:{" "}
							{lines.map((l) => `${l.quantity}× ${l.label}`).join(", ")}
						</p>
					)}
				</section>

				{mode === "recurring" && (
					<section className="form-section">
						<h2 className="form-section-title">Wann soll abgeholt werden?</h2>
						<label>
							Wochentag
							<select
								value={weekday}
								onChange={(e) =>
									setWeekday(Number(e.target.value) as Weekday)
								}
							>
								{WEEKDAYS.map((d) => (
									<option key={d} value={d}>
										{weekdayLabel(d)}
									</option>
								))}
							</select>
						</label>
						<label>
							Uhrzeit / Hinweis (optional)
							<input
								value={timeHint}
								onChange={(e) => setTimeHint(e.target.value)}
								placeholder="z. B. ab 18 Uhr im Hof, vormittags bei den Tonnen…"
								maxLength={80}
							/>
							<span className="muted small">
								Feste Zeit und kurzer Ortshinweis machen die Abholung für beide
								entspannt und schnell.
							</span>
						</label>
					</section>
				)}

				<section className="form-section">
					<h2 className="form-section-title">
						{mode === "recurring" ? "Hinweise & Adresse" : "2. Hinweise & Adresse"}
					</h2>
					<label>
						Hinweis für den Abholer (optional)
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={2}
							placeholder="z. B. im Hof, klingeln bei Müller…"
							maxLength={500}
						/>
					</label>

					<label>
						{mode === "recurring"
							? "Volle Adresse (nur für den gewählten Abholer)"
							: "Volle Adresse (privat bis zur Annahme)"}
						<input
							value={addressText}
							onChange={(e) => setAddressText(e.target.value)}
							placeholder="Musterstraße 1, 10115 Berlin"
							required
							autoComplete="street-address"
							aria-invalid={attempted && missingAddress}
						/>
						{attempted && missingAddress && (
							<span className="field-error">Adresse angeben.</span>
						)}
					</label>
					<label>
						Stadtteil / Gegend (öffentlich)
						<input
							value={addressHint}
							onChange={(e) => setAddressHint(e.target.value)}
							placeholder="Berlin-Mitte"
							autoComplete="address-level2"
						/>
					</label>
				</section>

				<section className="form-section">
					<h2 className="form-section-title">Standort auf der Karte</h2>
					<div className="form-map">
						<p className="label">
							Adresse suchen, auf die Karte tippen oder ◎ für deinen Standort
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
								Standort: {pick[0].toFixed(5)}, {pick[1].toFixed(5)}
							</p>
						) : (
							<p
								className={
									attempted && missingPin ? "banner error" : "muted small"
								}
							>
								{attempted && missingPin
									? "Setz bitte noch einen Punkt auf der Karte."
									: "Noch kein Punkt auf der Karte."}
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
							? "Wird veröffentlicht…"
							: mode === "recurring"
								? `Wöchentlich online stellen (${centsToEuroDe(totalCents)} € · ${weekdayLabel(weekday)})`
								: `Angebot online stellen (${centsToEuroDe(totalCents)} €)`}
					</button>
					{!canPublish && !saving && (
						<p className="muted small publish-hint">{publishBlockedReason}</p>
					)}
				</div>
			</form>
		</div>
	);
}
