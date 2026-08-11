type Variant = "create" | "poster" | "collector" | "applicant" | "public";

type Props = {
	/** Who is reading the tips – wording adapts slightly. */
	variant?: Variant;
	/** Compact one-liner + expandable details. Default: full list. */
	compact?: boolean;
};

/**
 * Practical tips for weekly (recurring) Pfand pickups – human German.
 */
export function WeeklyTips({ variant = "public", compact = false }: Props) {
	const title =
		variant === "create" || variant === "poster"
			? "Tipps für den wöchentlichen Ablauf"
			: variant === "collector"
				? "Tipps für dich als fester Abholer"
				: "So läuft wöchentliches Pfand am besten";

	const items = tipsFor(variant);

	if (compact) {
		return (
			<div className="banner info handover-hint weekly-tips weekly-tips-compact">
				<strong>{title}</strong>
				<p className="muted small" style={{ margin: "0.35rem 0 0" }}>
					{items[0]}
				</p>
				<ul className="weekly-tips-list">
					{items.slice(1).map((t) => (
						<li key={t}>{t}</li>
					))}
				</ul>
			</div>
		);
	}

	return (
		<div className="banner info handover-hint weekly-tips">
			<strong>{title}</strong>
			<ul className="weekly-tips-list">
				{items.map((t) => (
					<li key={t}>{t}</li>
				))}
			</ul>
		</div>
	);
}

function tipsFor(variant: Variant): string[] {
	const timeReady =
		"Stell das Pfand immer zur vereinbarten Uhrzeit bereit – dann dauert der Stopp für beide nur kurz.";
	const outdoor =
		"Nach Absprache kannst du es auch draußen hinstellen (Hof, bei den Mülltonnen o. Ä.) – bitte zur festen Zeit, damit niemand warten muss.";
	const fixedTimeBoth =
		"Ein fester Wochentag plus Uhrzeit spart Hin und Her. Kurz und unaufwendig hält den Rhythmus am Laufen.";
	const confirmRule =
		"Wichtig: Der Abholer meldet die Abholung selbst in der App. Ohne Meldung und Bestätigung des Inserenten bleibt die Abholung offen – und blockiert (wie bei normalen Angeboten) neue Annahmen.";

	if (variant === "create" || variant === "poster") {
		return [
			timeReady,
			outdoor,
			fixedTimeBoth,
			"Schreib Uhrzeit und Ort gerne in den Hinweis (z. B. „ab 18 Uhr im Hof“).",
			confirmRule,
		];
	}

	if (variant === "collector") {
		return [
			"Komm zur vereinbarten Zeit – der Inserent stellt das Pfand dann bereit, damit es schnell geht.",
			"Steht das Pfand draußen (Hof, Mülltonnen, …), nimm es mit – so entfällt das Klingeln, wenn ihr das so vereinbart habt.",
			confirmRule,
			"Kläre Unklarheiten einmal kurz – danach läuft der wöchentliche Rhythmus von allein.",
		];
	}

	if (variant === "applicant") {
		return [
			"Der Inserent wählt jemanden aus. Die Adresse siehst du erst, wenn du dran bist.",
			"Danach gilt ein fester Wochentag (und oft eine Uhrzeit). Kurze Absprachen halten den Aufwand klein.",
			confirmRule,
		];
	}

	// public / open listing
	return [fixedTimeBoth, timeReady, outdoor, confirmRule];
}
