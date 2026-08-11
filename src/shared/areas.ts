/**
 * Public area labels (Stadtteil / Gegend) shown on the map before accept.
 * Stored as free-text `address_hint` but limited to this catalog.
 */

export type AreaGroup = {
	/** City / region label for optgroup */
	group: string;
	/** Values stored in address_hint and shown publicly */
	options: readonly string[];
};

/**
 * Curated list — major cities + common districts.
 * Keep labels short; they appear on map pins and lists.
 */
export const PUBLIC_AREA_GROUPS: readonly AreaGroup[] = [
	{
		group: "Berlin",
		options: [
			"Berlin-Mitte",
			"Berlin-Moabit",
			"Berlin-Wedding",
			"Berlin-Tiergarten",
			"Berlin-Friedrichshain",
			"Berlin-Kreuzberg",
			"Berlin-Prenzlauer Berg",
			"Berlin-Pankow",
			"Berlin-Weißensee",
			"Berlin-Charlottenburg",
			"Berlin-Wilmersdorf",
			"Berlin-Schöneberg",
			"Berlin-Tempelhof",
			"Berlin-Neukölln",
			"Berlin-Treptow",
			"Berlin-Köpenick",
			"Berlin-Lichtenberg",
			"Berlin-Marzahn",
			"Berlin-Hellersdorf",
			"Berlin-Spandau",
			"Berlin-Steglitz",
			"Berlin-Zehlendorf",
			"Berlin-Reinickendorf",
			"Berlin (sonstiges)",
		],
	},
	{
		group: "Hamburg",
		options: [
			"Hamburg-Mitte",
			"Hamburg-Altona",
			"Hamburg-Eimsbüttel",
			"Hamburg-Nord",
			"Hamburg-Wandsbek",
			"Hamburg-Bergedorf",
			"Hamburg-Harburg",
			"Hamburg-St. Pauli",
			"Hamburg-St. Georg",
			"Hamburg (sonstiges)",
		],
	},
	{
		group: "München",
		options: [
			"München-Altstadt",
			"München-Maxvorstadt",
			"München-Schwabing",
			"München-Haidhausen",
			"München-Au",
			"München-Sendling",
			"München-Neuhausen",
			"München-Pasing",
			"München (sonstiges)",
		],
	},
	{
		group: "Köln",
		options: [
			"Köln-Innenstadt",
			"Köln-Ehrenfeld",
			"Köln-Nippes",
			"Köln-Lindenthal",
			"Köln-Deutz",
			"Köln-Kalk",
			"Köln-Mülheim",
			"Köln (sonstiges)",
		],
	},
	{
		group: "Frankfurt am Main",
		options: [
			"Frankfurt-Innenstadt",
			"Frankfurt-Sachsenhausen",
			"Frankfurt-Bornheim",
			"Frankfurt-Bockenheim",
			"Frankfurt-Nordend",
			"Frankfurt-Ostend",
			"Frankfurt (sonstiges)",
		],
	},
	{
		group: "Weitere Städte",
		options: [
			"Stuttgart",
			"Düsseldorf",
			"Leipzig",
			"Dortmund",
			"Essen",
			"Bremen",
			"Dresden",
			"Hannover",
			"Nürnberg",
			"Duisburg",
			"Bochum",
			"Wuppertal",
			"Bielefeld",
			"Bonn",
			"Münster",
			"Karlsruhe",
			"Mannheim",
			"Augsburg",
			"Wiesbaden",
			"Mönchengladbach",
			"Gelsenkirchen",
			"Braunschweig",
			"Kiel",
			"Aachen",
			"Magdeburg",
			"Freiburg",
			"Lübeck",
			"Erfurt",
			"Rostock",
			"Mainz",
			"Kassel",
			"Hagen",
			"Hamm",
			"Saarbrücken",
			"Potsdam",
			"Ludwigshafen",
			"Oldenburg",
			"Osnabrück",
			"Leverkusen",
			"Heidelberg",
			"Darmstadt",
			"Regensburg",
			"Ingolstadt",
			"Würzburg",
			"Wolfsburg",
			"Ulm",
			"Heilbronn",
			"Paderborn",
			"Offenbach",
			"Göttingen",
			"Bottrop",
			"Recklinghausen",
			"Reutlingen",
			"Koblenz",
			"Bergisch Gladbach",
			"Jena",
			"Trier",
			"Hildesheim",
			"Erlangen",
			"Moers",
			"Siegen",
			"Cottbus",
			"Schwerin",
			"Brandenburg an der Havel",
		],
	},
] as const;

/** Flat unique list of allowed address_hint values. */
export const PUBLIC_AREAS: readonly string[] = (() => {
	const set = new Set<string>();
	for (const g of PUBLIC_AREA_GROUPS) {
		for (const o of g.options) set.add(o);
	}
	return Object.freeze([...set]);
})();

const AREA_SET = new Set(PUBLIC_AREAS);

export function isPublicArea(value: string): boolean {
	return AREA_SET.has(value.trim());
}

/** Suggest a catalog area from a free-text geocode / address label (best effort). */
export function suggestPublicArea(raw: string): string | null {
	const t = raw.trim().toLowerCase();
	if (!t) return null;

	// Exact / contains match on known labels (longer first)
	const sorted = [...PUBLIC_AREAS].sort((a, b) => b.length - a.length);
	for (const area of sorted) {
		const a = area.toLowerCase().replace(/\s*\(sonstiges\)\s*$/, "");
		if (t.includes(a.toLowerCase()) || a.toLowerCase().includes(t)) {
			return area;
		}
	}

	// City keywords → "(sonstiges)" or bare city
	const cityHints: Array<[string, string]> = [
		["berlin", "Berlin (sonstiges)"],
		["hamburg", "Hamburg (sonstiges)"],
		["münchen", "München (sonstiges)"],
		["muenchen", "München (sonstiges)"],
		["munich", "München (sonstiges)"],
		["köln", "Köln (sonstiges)"],
		["koeln", "Köln (sonstiges)"],
		["cologne", "Köln (sonstiges)"],
		["frankfurt", "Frankfurt (sonstiges)"],
	];
	for (const [key, area] of cityHints) {
		if (t.includes(key) && isPublicArea(area)) return area;
	}

	// Bare city names in "Weitere Städte"
	for (const area of PUBLIC_AREAS) {
		if (!area.includes("-") && !area.includes("(")) {
			if (t.includes(area.toLowerCase())) return area;
		}
	}

	return null;
}
