// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OfferMap } from "../components/OfferMap";
import {
	emptyQuantities,
	PfandQuantityForm,
} from "../components/PfandQuantityForm";
import {
	createAddress,
	createOffer,
	createRecurringOffer,
	fetchMyAddresses,
	getErrorMessage,
	type SavedAddress,
	type Weekday,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useT } from "../i18n";
import { weekdayLabel } from "../lib/labels";
import {
	MIN_PFAND_CENTS,
	MIN_RECURRING_PFAND_CENTS,
	centsUntilMinimum,
	quantitiesToItems,
	totalFromQuantities,
} from "../lib/pfand-ui";
import { AreaSelect } from "../components/AreaSelect";
import { OfferTips } from "../components/OfferTips";
import { WeeklyTips } from "../components/WeeklyTips";
import {
	canonicalizePublicArea,
	isPublicArea,
	suggestPublicArea,
} from "../../shared/areas";
import { centsToEuroDe } from "../../shared/pfand";

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export function CreateOffer() {
	const navigate = useNavigate();
	const { user, loading } = useAuth();
	const t = useT();
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
	const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
	const [selectedAddressId, setSelectedAddressId] = useState<string>("");
	const [saveAsNew, setSaveAsNew] = useState(false);
	const [addressPrefillDone, setAddressPrefillDone] = useState(false);

	useEffect(() => {
		if (!user) {
			setSavedAddresses([]);
			setAddressPrefillDone(false);
			return;
		}
		let cancelled = false;
		void (async () => {
			try {
				const data = await fetchMyAddresses();
				if (cancelled) return;
				setSavedAddresses(data.addresses);
				const def =
					data.addresses.find((a) => a.is_default) ?? data.addresses[0];
				if (def && !addressPrefillDone) {
					applySavedAddress(def);
					setSelectedAddressId(def.id);
					setAddressPrefillDone(true);
				} else {
					setAddressPrefillDone(true);
				}
			} catch {
				if (!cancelled) setAddressPrefillDone(true);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- prefill once per login
	}, [user]);

	function applySavedAddress(a: SavedAddress) {
		setAddressText(a.address_text);
		// Only apply catalog areas (legacy free-text hints may not match)
		setAddressHint(
			isPublicArea(a.address_hint)
				? canonicalizePublicArea(a.address_hint)
				: (suggestPublicArea(a.address_hint || a.address_text) ?? ""),
		);
		setPick([a.lat, a.lng]);
		setSelectedAddressId(a.id);
	}

	function onSelectSaved(id: string) {
		setSelectedAddressId(id);
		if (!id) return;
		const a = savedAddresses.find((x) => x.id === id);
		if (a) applySavedAddress(a);
	}

	const { totalCents, lines } = useMemo(
		() => totalFromQuantities(quantities),
		[quantities],
	);

	const minPfandCents =
		mode === "recurring" ? MIN_RECURRING_PFAND_CENTS : MIN_PFAND_CENTS;

	const items = useMemo(() => quantitiesToItems(quantities), [quantities]);
	const missingItems = items.length === 0;
	const belowMin = totalCents < minPfandCents;
	const missingAddress = !addressText.trim();
	const missingArea = !addressHint || !isPublicArea(addressHint);
	const missingPin = !pick;
	const restToMin = centsUntilMinimum(totalCents, minPfandCents);

	const publishBlockedReason = useMemo(() => {
		if (saving) return t("create.publishing");
		if (missingItems) return t("create.needItems");
		if (belowMin) {
			return t("create.needMin", {
				rest: centsToEuroDe(restToMin),
				min: centsToEuroDe(minPfandCents),
			});
		}
		if (missingAddress) return t("create.needAddress");
		if (missingArea) return t("create.needArea");
		if (missingPin) return t("create.needPin");
		return null;
	}, [
		t,
		saving,
		missingItems,
		belowMin,
		restToMin,
		minPfandCents,
		missingAddress,
		missingArea,
		missingPin,
	]);

	const canPublish = !publishBlockedReason;

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		if (saving) return;
		setAttempted(true);
		setError(null);

		if (!user) {
			setError(t("create.needLogin"));
			return;
		}
		if (missingItems) {
			setError(t("create.itemsError"));
			return;
		}
		if (belowMin) {
			setError(
				mode === "recurring"
					? t("create.minRecurringError", {
							min: centsToEuroDe(minPfandCents),
							total: centsToEuroDe(totalCents),
						})
					: t("create.minOnceError", {
							min: centsToEuroDe(minPfandCents),
							total: centsToEuroDe(totalCents),
						}),
			);
			return;
		}
		if (missingAddress) {
			setError(
				mode === "recurring"
					? t("create.addressRecurringError")
					: t("create.addressOnceError"),
			);
			return;
		}
		if (missingArea) {
			setError(t("create.areaError"));
			return;
		}
		if (!pick) {
			setError(t("create.pinError"));
			return;
		}

		setSaving(true);
		try {
			const payload = {
				items,
				note: note.trim() || undefined,
				lat: pick[0],
				lng: pick[1],
				address_hint: addressHint.trim(),
				address_text: addressText.trim(),
			};

			if (saveAsNew) {
				try {
					await createAddress({
						address_text: payload.address_text,
						address_hint: payload.address_hint,
						lat: payload.lat,
						lng: payload.lng,
						is_default: savedAddresses.length === 0,
					});
				} catch {
					// Offer still publishes; address save is best-effort
				}
			}

			if (mode === "recurring") {
				const { id } = await createRecurringOffer({
					...payload,
					weekday,
					time_hint: timeHint.trim() || undefined,
				});
				navigate(`/woche/${id}`);
			} else {
				const { id } = await createOffer(payload);
				navigate(`/angebot/${id}`);
			}
		} catch (err) {
			setError(getErrorMessage(err, t("create.saveFailed")));
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="page create-page">
				<p className="muted" role="status">
					{t("create.loadingSession")}
				</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="page create-page">
				<header className="page-header">
					<h1>{t("create.title")}</h1>
				</header>
				<div className="empty-state">
					<span className="empty-state-icon" aria-hidden>
						🔐
					</span>
					<p className="empty-state-title">{t("create.authRequired")}</p>
					<p className="empty-state-text">
						{t("create.authText")}{" "}
						<Link to="/login">{t("nav.login")}</Link>
					</p>
				</div>
			</div>
		);
	}

	const myLocationLabel = t("map.locate.myLocation");

	return (
		<div className="page create-page">
			<header className="page-header">
				<h1>{t("create.title")}</h1>
				<p className="page-lede muted">
					{t("create.lede", {
						once: centsToEuroDe(MIN_PFAND_CENTS),
						rec: centsToEuroDe(MIN_RECURRING_PFAND_CENTS),
					})}
				</p>
			</header>

			<form className="form" onSubmit={onSubmit} noValidate>
				<section className="form-section">
					<h2 className="form-section-title">{t("create.section.kind")}</h2>
					<div
						className="mode-toggle"
						role="radiogroup"
						aria-label={t("create.modeAria")}
					>
						<label className={`mode-option ${mode === "once" ? "active" : ""}`}>
							<input
								type="radio"
								name="offer-mode"
								checked={mode === "once"}
								onChange={() => setMode("once")}
							/>
							<span>
								<strong>{t("create.mode.once")}</strong>
								<span className="muted small">{t("create.mode.onceHint")}</span>
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
								<strong>{t("create.mode.recurring")}</strong>
								<span className="muted small">
									{t("create.mode.recurringHint")}
								</span>
							</span>
						</label>
					</div>
					{mode === "once" && (
						<>
							<div className="banner info handover-hint">
								{t("create.banner.once")}
							</div>
							<OfferTips variant="create" />
						</>
					)}
					{mode === "recurring" && (
						<>
							<div className="banner info handover-hint">
								{t("create.banner.recurring")}
							</div>
							<WeeklyTips variant="create" />
						</>
					)}
				</section>

				<section className="form-section">
					<h2 className="form-section-title">{t("create.section.items")}</h2>
					<p className="muted small form-section-hint">
						{mode === "recurring"
							? t("create.itemsHint.recurring")
							: t("create.itemsHint.once")}
					</p>
					<PfandQuantityForm
						quantities={quantities}
						onChange={setQuantities}
						totalCents={totalCents}
						minCents={minPfandCents}
						recurring={mode === "recurring"}
					/>
					{attempted && missingItems && (
						<p className="banner error">{t("create.itemsValidation")}</p>
					)}
					{lines.length > 0 && (
						<p className="muted small form-preview">
							{t("create.itemsPreview", {
								preview: lines
									.map((l) => `${l.quantity}× ${l.label}`)
									.join(", "),
							})}
						</p>
					)}
				</section>

				{mode === "recurring" && (
					<section className="form-section">
						<h2 className="form-section-title">
							{t("create.section.pickupTime")}
						</h2>
						<label>
							{t("create.weekday")}
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
							{t("create.timeHint")}
							<input
								value={timeHint}
								onChange={(e) => setTimeHint(e.target.value)}
								placeholder={t("create.timePlaceholder")}
								maxLength={80}
							/>
							<span className="muted small">{t("create.timeHelp")}</span>
						</label>
					</section>
				)}

				<section className="form-section">
					<h2 className="form-section-title">
						{mode === "recurring"
							? `3. ${t("create.section.notes")}`
							: `2. ${t("create.section.notes")}`}
					</h2>
					<label>
						{t("create.noteLabel")}
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={2}
							placeholder={t("create.notePlaceholder")}
							maxLength={500}
						/>
					</label>
				</section>

				<section className="form-section address-picker-section">
					<h2 className="form-section-title">
						{mode === "recurring"
							? `4. ${t("create.section.address")}`
							: `3. ${t("create.section.address")}`}
					</h2>
					<p className="muted small form-section-hint">
						{mode === "recurring"
							? t("create.addressHint.recurring")
							: t("create.addressHint.once")}
					</p>

					{savedAddresses.length > 0 && (
						<label>
							{t("create.savedAddress")}
							<select
								value={selectedAddressId}
								onChange={(e) => onSelectSaved(e.target.value)}
							>
								<option value="">{t("create.manualAddress")}</option>
								{savedAddresses.map((a) => (
									<option key={a.id} value={a.id}>
										{a.label || a.address_text}
										{a.is_default ? ` ${t("create.defaultSuffix")}` : ""}
									</option>
								))}
							</select>
							<span className="muted small">
								<Link to="/profil">{t("create.manageAddresses")}</Link>
							</span>
						</label>
					)}

					{savedAddresses.length === 0 && (
						<p className="muted small address-picker-tip">
							{t("create.addressTip")}{" "}
							<Link to="/profil">{t("nav.account")}</Link>
						</p>
					)}

					<label>
						{mode === "recurring"
							? t("create.fullAddress.recurring")
							: t("create.fullAddress.once")}
						<input
							value={addressText}
							onChange={(e) => {
								setAddressText(e.target.value);
								setSelectedAddressId("");
							}}
							placeholder={t("create.addressPlaceholder")}
							required
							autoComplete="street-address"
							aria-invalid={attempted && missingAddress}
						/>
						{attempted && missingAddress && (
							<span className="field-error">{t("create.addressRequired")}</span>
						)}
					</label>
					<label>
						{t("create.areaLabel")}
						<AreaSelect
							value={addressHint}
							required
							aria-invalid={attempted && missingArea}
							onChange={(v) => {
								setAddressHint(v);
								setSelectedAddressId("");
							}}
						/>
						<span className="muted small">{t("create.areaHelp")}</span>
						{attempted && missingArea && (
							<span className="field-error">{t("create.areaRequired")}</span>
						)}
					</label>
					<label className="checkbox-row">
						<input
							type="checkbox"
							checked={saveAsNew}
							onChange={(e) => setSaveAsNew(e.target.checked)}
						/>
						<span>{t("create.saveAddress")}</span>
					</label>
				</section>

				<section className="form-section">
					<h2 className="form-section-title">
						{mode === "recurring"
							? `5. ${t("create.section.map")}`
							: `4. ${t("create.section.map")}`}
					</h2>
					<div className="form-map">
						<p className="label">{t("create.mapLabel")}</p>
						<div className="form-map-inner">
							<OfferMap
								offers={[]}
								pickMode
								pickPosition={pick}
								showControls
								center={pick ?? undefined}
								onPick={(lat, lng) => {
									setPick([lat, lng]);
									setSelectedAddressId("");
								}}
								onLocationResolved={({ lat, lng, label }) => {
									setPick([lat, lng]);
									setSelectedAddressId("");
									if (label && label !== myLocationLabel) {
										setAddressText(label);
										if (!addressHint || !isPublicArea(addressHint)) {
											const suggested = suggestPublicArea(label);
											if (suggested) setAddressHint(suggested);
										}
									}
								}}
								className="map map-sm"
							/>
						</div>
						{pick ? (
							<p className="muted small map-pin-status">
								{t("create.pinStatus", {
									lat: pick[0].toFixed(5),
									lng: pick[1].toFixed(5),
								})}
							</p>
						) : (
							<p
								className={
									attempted && missingPin
										? "banner error map-pin-status"
										: "muted small map-pin-status"
								}
							>
								{attempted && missingPin
									? t("create.pinError")
									: t("create.noPin")}
							</p>
						)}
					</div>
				</section>

				{error && <p className="banner error">{error}</p>}

				<div className="form-submit sticky-actions">
					<button
						className="btn btn-primary"
						type="submit"
						disabled={!canPublish}
						title={publishBlockedReason ?? undefined}
					>
						{saving
							? t("create.submitting")
							: mode === "recurring"
								? t("create.submit.recurring", {
										total: centsToEuroDe(totalCents),
										weekday: weekdayLabel(weekday),
									})
								: t("create.submit.once", {
										total: centsToEuroDe(totalCents),
									})}
					</button>
					{!canPublish && !saving && (
						<p className="muted small publish-hint">{publishBlockedReason}</p>
					)}
				</div>
			</form>
		</div>
	);
}
