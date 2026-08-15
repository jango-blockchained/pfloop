// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import {
	PFAND_CATALOG,
	centsToEuroDe,
	type PfandItemType,
} from "../../shared/pfand";
import { useT } from "../i18n";
import {
	MIN_PFAND_CENTS,
	hintForItemType,
	labelForItemType,
	minProgress,
	minValueHint,
	recurringFloorCents,
} from "../lib/pfand-ui";

type QtyMap = Record<PfandItemType, number>;

type Props = {
	quantities: QtyMap;
	onChange: (next: QtyMap) => void;
	totalCents: number;
	/** Minimum to publish; defaults to one-shot €3. */
	minCents?: number;
	/** Weekly estimate mode: −50 % floor copy. */
	recurring?: boolean;
};

export function emptyQuantities(): QtyMap {
	return {
		einweg_025: 0,
		mehrweg_015: 0,
		mehrweg_008: 0,
		kasten_150: 0,
		kasten_300: 0,
	};
}

export function PfandQuantityForm({
	quantities,
	onChange,
	totalCents,
	minCents = MIN_PFAND_CENTS,
	recurring = false,
}: Props) {
	const t = useT();
	const flaschen = PFAND_CATALOG.filter((e) => e.category === "flasche");
	const kaesten = PFAND_CATALOG.filter((e) => e.category === "kasten");
	const meetsMin = totalCents >= minCents;
	const progress = minProgress(totalCents, minCents);
	const progressPct = Math.round(progress * 100);
	const itemCount = Object.values(quantities).reduce((a, b) => a + b, 0);
	const floorCents = recurring ? recurringFloorCents(totalCents) : 0;

	function setQty(type: PfandItemType, raw: string) {
		const n = raw === "" ? 0 : Number.parseInt(raw, 10);
		const quantity = Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 0;
		onChange({ ...quantities, [type]: quantity });
	}

	function step(type: PfandItemType, delta: number) {
		const next = Math.max(0, Math.min(10_000, (quantities[type] ?? 0) + delta));
		onChange({ ...quantities, [type]: next });
	}

	function renderGroup(
		title: string,
		entries: typeof PFAND_CATALOG,
		groupKey: string,
	) {
		const titleId = `pfand-group-${groupKey}`;
		return (
			<section
				className={`pfand-group pfand-group--${groupKey}`}
				aria-labelledby={titleId}
			>
				<h3 id={titleId} className="pfand-group-title">
					{title}
				</h3>
				<ul className="pfand-list">
					{entries.map((entry) => {
						const q = quantities[entry.type] ?? 0;
						const line = q * entry.unit_cents;
						const unitLabel = centsToEuroDe(entry.unit_cents);
						const label = labelForItemType(entry.type);
						const hint = hintForItemType(entry.type);
						return (
							<li
								key={entry.type}
								className={`pfand-row${q > 0 ? " has-qty" : ""}`}
								data-item-type={entry.type}
							>
								<div className="pfand-row-info">
									<strong className="pfand-row-label">{label}</strong>
									<span className="pfand-row-meta muted small">
										{hint} · {t("pfand.form.perUnit", { unit: unitLabel })}
									</span>
								</div>
								<div
									className="pfand-row-controls"
									role="group"
									aria-label={t("pfand.form.qtyGroupAria", { label })}
								>
									<button
										type="button"
										className="btn btn-sm qty-btn qty-btn-dec"
										aria-label={t("pfand.form.decAria", { label })}
										disabled={q <= 0}
										onClick={() => step(entry.type, -1)}
									>
										−
									</button>
									<input
										className="qty-input"
										type="number"
										inputMode="numeric"
										min={0}
										max={10000}
										value={q === 0 ? "" : q}
										placeholder="0"
										onChange={(e) => setQty(entry.type, e.target.value)}
										aria-label={t("pfand.form.qtyInputAria", { label })}
									/>
									<button
										type="button"
										className="btn btn-sm qty-btn qty-btn-inc"
										aria-label={t("pfand.form.incAria", { label })}
										onClick={() => step(entry.type, 1)}
									>
										+
									</button>
									<span
										className={`pfand-line${q > 0 ? "" : " muted"}`}
										aria-label={
											q > 0
												? t("pfand.form.lineSumAria", {
														line: centsToEuroDe(line),
													})
												: t("pfand.form.noQtyAria")
										}
										title={
											q > 0
												? `${q} × ${unitLabel} € = ${centsToEuroDe(line)} €`
												: undefined
										}
									>
										{q > 0 ? `${centsToEuroDe(line)} €` : t("common.emDash")}
									</span>
								</div>
							</li>
						);
					})}
				</ul>
			</section>
		);
	}

	return (
		<div className="pfand-form">
			<p className="pfand-form-intro muted small">
				{recurring
					? t("pfand.form.intro.recurring")
					: t("pfand.form.intro.once")}
			</p>
			<div className="pfand-groups">
				{renderGroup(t("pfand.form.group.bottles"), flaschen, "flaschen")}
				{renderGroup(t("pfand.form.group.crates"), kaesten, "kaesten")}
			</div>

			<div
				className={`pfand-total ${meetsMin ? "ok" : "low"}`}
				aria-live="polite"
			>
				<div className="pfand-total-head">
					<span className="label">
						{recurring
							? t("pfand.form.total.recurring")
							: t("pfand.form.total.once")}
						{itemCount > 0 ? (
							<span className="pfand-total-count">
								{t("pfand.form.itemCount", { count: itemCount })}
							</span>
						) : null}
					</span>
					<strong className="pfand-total-value">
						{centsToEuroDe(totalCents)} €
					</strong>
				</div>
				{recurring && totalCents > 0 && (
					<div className="pfand-total-floor muted small">
						{t("pfand.form.floor", { floor: centsToEuroDe(floorCents) })}
					</div>
				)}
				<div
					className="pfand-min-bar"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={progressPct}
					aria-label={t("pfand.form.progressAria")}
				>
					<span
						className="pfand-min-bar-fill"
						style={{ width: `${progressPct}%` }}
					/>
				</div>
				<span className="pfand-min-hint">
					{minValueHint(totalCents, minCents, { recurring })}
				</span>
			</div>
		</div>
	);
}
