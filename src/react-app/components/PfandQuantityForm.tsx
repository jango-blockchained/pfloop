import {
	PFAND_CATALOG,
	centsToEuroDe,
	type PfandItemType,
} from "../../shared/pfand";
import {
	MIN_PFAND_CENTS,
	minProgress,
	minValueHint,
} from "../lib/pfand-ui";

type QtyMap = Record<PfandItemType, number>;

type Props = {
	quantities: QtyMap;
	onChange: (next: QtyMap) => void;
	totalCents: number;
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

export function PfandQuantityForm({ quantities, onChange, totalCents }: Props) {
	const flaschen = PFAND_CATALOG.filter((e) => e.category === "flasche");
	const kaesten = PFAND_CATALOG.filter((e) => e.category === "kasten");
	const meetsMin = totalCents >= MIN_PFAND_CENTS;
	const progress = minProgress(totalCents);
	const itemCount = Object.values(quantities).reduce((a, b) => a + b, 0);

	function setQty(type: PfandItemType, raw: string) {
		const n = raw === "" ? 0 : Number.parseInt(raw, 10);
		const quantity = Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 0;
		onChange({ ...quantities, [type]: quantity });
	}

	function step(type: PfandItemType, delta: number) {
		const next = Math.max(0, Math.min(10_000, (quantities[type] ?? 0) + delta));
		onChange({ ...quantities, [type]: next });
	}

	function renderGroup(title: string, entries: typeof PFAND_CATALOG) {
		return (
			<div className="pfand-group">
				<h3 className="pfand-group-title">{title}</h3>
				<ul className="pfand-list">
					{entries.map((entry) => {
						const q = quantities[entry.type] ?? 0;
						const line = q * entry.unit_cents;
						const unitLabel = centsToEuroDe(entry.unit_cents);
						return (
							<li key={entry.type} className="pfand-row">
								<div className="pfand-row-info">
									<strong>{entry.label}</strong>
									<span className="muted small">
										{entry.hint} · je {unitLabel} €
									</span>
								</div>
								<div className="pfand-row-controls">
									<button
										type="button"
										className="btn btn-sm qty-btn"
										aria-label={`${entry.label} weniger`}
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
										aria-label={`Stückzahl ${entry.label}`}
									/>
									<button
										type="button"
										className="btn btn-sm qty-btn"
										aria-label={`${entry.label} mehr`}
										onClick={() => step(entry.type, 1)}
									>
										+
									</button>
									<span
										className={`pfand-line${q > 0 ? "" : " muted"}`}
										title={
											q > 0
												? `${q} × ${unitLabel} € = ${centsToEuroDe(line)} €`
												: undefined
										}
									>
										{q > 0 ? `${centsToEuroDe(line)} €` : "—"}
									</span>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		);
	}

	return (
		<div className="pfand-form">
			<p className="muted small">
				Einfach die Stückzahlen eintippen. Den Pfandwert rechnen wir fest nach
				deutschem Pfandsystem – den kannst du nicht frei ändern.
			</p>
			{renderGroup("Flaschen & Dosen", flaschen)}
			{renderGroup("Kästen / Kisten", kaesten)}

			<div className={`pfand-total ${meetsMin ? "ok" : "low"}`}>
				<div>
					<span className="label">
						Pfandwert gesamt
						{itemCount > 0 ? ` · ${itemCount} Stück` : ""}
					</span>
					<strong className="pfand-total-value">
						{centsToEuroDe(totalCents)} €
					</strong>
				</div>
				<div
					className="pfand-min-bar"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(progress * 100)}
					aria-label="Fortschritt zum Mindestwert"
				>
					<span style={{ width: `${Math.round(progress * 100)}%` }} />
				</div>
				<span className="pfand-min-hint">{minValueHint(totalCents)}</span>
			</div>
		</div>
	);
}
