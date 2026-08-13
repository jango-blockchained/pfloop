type Variant = "create" | "poster" | "collector" | "public";

type Props = {
	/** Who is reading the tips – wording adapts slightly. */
	variant?: Variant;
	/** Compact one-liner + expandable details. Default: full list. */
	compact?: boolean;
};

/**
 * Practical tips for one-shot (einmalige) Pfand pickups – who does what.
 */
export function OfferTips({ variant = "public", compact = false }: Props) {
	const title =
		variant === "create" || variant === "poster"
			? "So läuft ein einmaliges Angebot"
			: variant === "collector"
				? "Tipps für dich als Abholer"
				: "Wer macht was?";

	const items = tipsFor(variant);

	if (compact) {
		const [lead, ...rest] = items;
		return (
			<div className="banner info handover-hint weekly-tips weekly-tips-compact offer-tips">
				<strong className="weekly-tips-title">{title}</strong>
				<p className="weekly-tips-lead muted small">{lead}</p>
				{rest.length > 0 && (
					<details className="weekly-tips-more">
						<summary className="weekly-tips-more-summary">
							Weitere Tipps
						</summary>
						<ul className="weekly-tips-list">
							{rest.map((t) => (
								<li key={t} className="weekly-tips-item">
									{t}
								</li>
							))}
						</ul>
					</details>
				)}
			</div>
		);
	}

	return (
		<div className="banner info handover-hint weekly-tips offer-tips">
			<strong className="weekly-tips-title">{title}</strong>
			<ul className="weekly-tips-list">
				{items.map((t) => (
					<li key={t} className="weekly-tips-item">
						{t}
					</li>
				))}
			</ul>
		</div>
	);
}

function tipsFor(variant: Variant): string[] {
	const sixHours =
		"Nach der Annahme hat der Abholer 6 Stunden Zeit. Danach wird das Angebot wieder frei, wenn niemand abholt.";
	const addressPrivacy =
		"Die genaue Adresse bleibt privat, bis jemand annimmt – auf der Karte siehst du nur die Gegend.";
	const twoStep =
		"Übergabe in 2 Schritten: 1) Abholer tippt „Abgeholt“, 2) Inserent bestätigt innerhalb von 24 Stunden. Ohne Bestätigung storniert das System das Angebot.";
	const blockRule =
		"Neue Abholer starten mit 1 Annahme pro Tag. Wenn alles bestätigt wird, steigt das Limit (max. 5/Tag). Weniger Bestätigungen = niedrigeres Limit am nächsten Tag.";
	const readyHint =
		"Stell das Pfand bereit, sobald es reserviert ist – idealerweise an der Tür, im Hof oder wo ihr es kurz und klar findet.";

	if (variant === "create") {
		return [
			"Du inserierst Menge und Ort. Mindestens 3 € Pfand nach deutschem Katalog.",
			addressPrivacy,
			"Jemand nimmt an → der Abholer sieht die Adresse und hat 6 Stunden.",
			twoStep,
			"Du bestätigst erst, wenn das Pfand wirklich weg ist. Stornieren geht, solange noch nicht alles erledigt ist.",
			readyHint,
		];
	}

	if (variant === "poster") {
		return [
			"Dein Job: Angebot online halten, Pfand bereitstellen, am Ende die Übergabe bestätigen.",
			sixHours,
			"Sobald der Abholer „Abgeholt“ tippt, bestätigst du in der App – sonst bleibt die Sache für ihn blockiert.",
			readyHint,
			"Hinweis mit Klingelcode, Hofeingang o. Ä. spart Hin und Her.",
			"Stimmt etwas nicht (falsche Menge, niemand da), sprich dich kurz ab oder storniere, wenn nötig.",
		];
	}

	if (variant === "collector") {
		return [
			"Dein Job: annehmen → innerhalb von 6 Stunden abholen → „Abgeholt“ tippen → auf Bestätigung warten.",
			"Nach der Annahme siehst du die Adresse. Nutze die Karten-Links und komm in der Frist.",
			twoStep,
			blockRule,
			"Steht das Pfand draußen und ihr habt das so abgesprochen, nimm es mit – dann entfällt das Klingeln.",
			"Nur „Abgeholt“ tippen, wenn du das Pfand wirklich hast – der Inserent muss danach noch bestätigen.",
		];
	}

	// public / open listing (browsing before accept)
	return [
		"Inserent stellt ein → Abholer nimmt an → Abholer holt ab und meldet „Abgeholt“ → Inserent bestätigt.",
		addressPrivacy,
		sixHours,
		twoStep,
		blockRule,
	];
}
