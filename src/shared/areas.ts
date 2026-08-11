/**
 * Public area labels (Stadtteil / Gegend) shown on the map before accept.
 * Stored as free-text `address_hint` but limited to this catalog.
 *
 * Every city has named districts + a "(sonstiges)" fallback.
 * Labels stay short for map pins and lists.
 */

export type AreaGroup = {
	/** City / region label for optgroup */
	group: string;
	/** Values stored in address_hint and shown publicly */
	options: readonly string[];
};

/** Build City-District options + sonstiges. */
function districts(prefix: string, parts: readonly string[]): string[] {
	return [...parts.map((p) => `${prefix}-${p}`), `${prefix} (sonstiges)`];
}

/**
 * Curated list — German Großstädte & common Mittelstädte with Stadtteile.
 * Sources: official Bezirke / well-known Ortsteile (Wikipedia / city sites).
 */
export const PUBLIC_AREA_GROUPS: readonly AreaGroup[] = [
	{
		group: "Berlin",
		options: districts("Berlin", [
			"Mitte",
			"Moabit",
			"Wedding",
			"Tiergarten",
			"Friedrichshain",
			"Kreuzberg",
			"Prenzlauer Berg",
			"Pankow",
			"Weißensee",
			"Charlottenburg",
			"Wilmersdorf",
			"Schöneberg",
			"Tempelhof",
			"Neukölln",
			"Treptow",
			"Köpenick",
			"Lichtenberg",
			"Marzahn",
			"Hellersdorf",
			"Spandau",
			"Steglitz",
			"Zehlendorf",
			"Reinickendorf",
		]),
	},
	{
		group: "Hamburg",
		options: districts("Hamburg", [
			"Mitte",
			"Altona",
			"Eimsbüttel",
			"Nord",
			"Wandsbek",
			"Bergedorf",
			"Harburg",
			"St. Pauli",
			"St. Georg",
			"Winterhude",
			"Eppendorf",
			"Barmbek",
			"Billstedt",
		]),
	},
	{
		group: "München",
		options: districts("München", [
			"Altstadt",
			"Maxvorstadt",
			"Schwabing",
			"Haidhausen",
			"Au",
			"Sendling",
			"Neuhausen",
			"Pasing",
			"Bogenhausen",
			"Giesing",
			"Laim",
			"Milbertshofen",
			"Trudering",
			"Perlach",
			"Freiham",
		]),
	},
	{
		group: "Köln",
		options: districts("Köln", [
			"Innenstadt",
			"Ehrenfeld",
			"Nippes",
			"Lindenthal",
			"Deutz",
			"Kalk",
			"Mülheim",
			"Porz",
			"Chorweiler",
			"Rodenkirchen",
			"Sülz",
			"Bayenthal",
			"Müngersdorf",
		]),
	},
	{
		group: "Frankfurt am Main",
		options: districts("Frankfurt", [
			"Innenstadt",
			"Sachsenhausen",
			"Bornheim",
			"Bockenheim",
			"Nordend",
			"Ostend",
			"Westend",
			"Gallus",
			"Höchst",
			"Niederrad",
			"Fechenheim",
			"Ginnheim",
		]),
	},
	{
		group: "Stuttgart",
		options: districts("Stuttgart", [
			"Mitte",
			"Bad Cannstatt",
			"Vaihingen",
			"Zuffenhausen",
			"Feuerbach",
			"Möhringen",
			"Degerloch",
			"Untertürkheim",
			"Ost",
			"Nord",
			"West",
			"Süd",
			"Botnang",
		]),
	},
	{
		group: "Düsseldorf",
		options: districts("Düsseldorf", [
			"Altstadt",
			"Stadtmitte",
			"Pempelfort",
			"Oberkassel",
			"Bilk",
			"Friedrichstadt",
			"Derendorf",
			"Flingern",
			"Gerresheim",
			"Benrath",
			"Unterbilk",
			"Garath",
			"Eller",
		]),
	},
	{
		group: "Leipzig",
		options: districts("Leipzig", [
			"Mitte",
			"Plagwitz",
			"Connewitz",
			"Südvorstadt",
			"Gohlis",
			"Schleußig",
			"Reudnitz",
			"Lindenau",
			"Stötteritz",
			"Paunsdorf",
			"Möckern",
			"Volkmarsdorf",
			"Leutzsch",
		]),
	},
	{
		group: "Dortmund",
		options: districts("Dortmund", [
			"Innenstadt-West",
			"Innenstadt-Ost",
			"Innenstadt-Nord",
			"Hörde",
			"Aplerbeck",
			"Brackel",
			"Eving",
			"Hombruch",
			"Lütgendortmund",
			"Mengede",
			"Scharnhorst",
			"Huckarde",
		]),
	},
	{
		group: "Essen",
		options: districts("Essen", [
			"Stadtkern",
			"Rüttenscheid",
			"Werden",
			"Steele",
			"Kray",
			"Altenessen",
			"Borbeck",
			"Stoppenberg",
			"Karnap",
			"Überruhr",
			"Frohnhausen",
			"Holsterhausen",
		]),
	},
	{
		group: "Bremen",
		options: districts("Bremen", [
			"Mitte",
			"Neustadt",
			"Schwachhausen",
			"Vahr",
			"Findorff",
			"Walle",
			"Gröpelingen",
			"Huchting",
			"Obervieland",
			"Hemelingen",
			"Osterholz",
			"Vegesack",
			"Blumenthal",
		]),
	},
	{
		group: "Dresden",
		options: districts("Dresden", [
			"Altstadt",
			"Neustadt",
			"Blasewitz",
			"Plauen",
			"Pieschen",
			"Löbtau",
			"Striesen",
			"Johannstadt",
			"Cotta",
			"Prohlis",
			"Klotzsche",
			"Loschwitz",
			"Trachau",
		]),
	},
	{
		group: "Hannover",
		options: districts("Hannover", [
			"Mitte",
			"List",
			"Oststadt",
			"Südstadt",
			"Linden",
			"Nordstadt",
			"Vahrenwald",
			"Bothfeld",
			"Kirchrode",
			"Misburg",
			"Ricklingen",
			"Ahlem",
			"Badenstedt",
		]),
	},
	{
		group: "Nürnberg",
		options: districts("Nürnberg", [
			"Altstadt",
			"Gostenhof",
			"St. Johannis",
			"Maxfeld",
			"Gibitzenhof",
			"Langwasser",
			"Mögeldorf",
			"Thon",
			"Eibach",
			"Zerzabelshof",
			"Schweinau",
			"Reichelsdorf",
		]),
	},
	{
		group: "Duisburg",
		options: districts("Duisburg", [
			"Mitte",
			"Neudorf",
			"Hochfeld",
			"Meiderich",
			"Hamborn",
			"Rheinhausen",
			"Homberg",
			"Walsum",
			"Süd",
			"Ruhrort",
			"Marxloh",
		]),
	},
	{
		group: "Bochum",
		options: districts("Bochum", [
			"Mitte",
			"Wattenscheid",
			"Langendreer",
			"Querenburg",
			"Werne",
			"Hordel",
			"Linden",
			"Dahlhausen",
			"Weitmar",
			"Gerthe",
		]),
	},
	{
		group: "Wuppertal",
		options: districts("Wuppertal", [
			"Elberfeld",
			"Barmen",
			"Vohwinkel",
			"Ronsdorf",
			"Cronenberg",
			"Langerfeld",
			"Unterbarmen",
			"Oberbarmen",
			"Heckinghausen",
		]),
	},
	{
		group: "Bielefeld",
		options: districts("Bielefeld", [
			"Mitte",
			"Schildesche",
			"Gadderbaum",
			"Brackwede",
			"Senne",
			"Sennestadt",
			"Heepen",
			"Jöllenbeck",
			"Stieghorst",
			"Dornberg",
		]),
	},
	{
		group: "Bonn",
		options: districts("Bonn", [
			"Zentrum",
			"Poppelsdorf",
			"Endenich",
			"Beuel",
			"Bad Godesberg",
			"Hardtberg",
			"Duisdorf",
			"Ippendorf",
			"Kessenich",
			"Tannenbusch",
		]),
	},
	{
		group: "Münster",
		options: districts("Münster", [
			"Altstadt",
			"Kreuzviertel",
			"Hansaviertel",
			"Hüffer",
			"Hiltrup",
			"Gievenbeck",
			"Kinderhaus",
			"Handorf",
			"Wolbeck",
			"Roxel",
			"Coerde",
		]),
	},
	{
		group: "Karlsruhe",
		options: districts("Karlsruhe", [
			"Innenstadt-Ost",
			"Innenstadt-West",
			"Südstadt",
			"Weststadt",
			"Oststadt",
			"Durlach",
			"Mühlburg",
			"Knielingen",
			"Rüppurr",
			"Waldstadt",
			"Neureut",
		]),
	},
	{
		group: "Mannheim",
		options: districts("Mannheim", [
			"Innenstadt",
			"Neckarstadt-Ost",
			"Neckarstadt-West",
			"Lindenhof",
			"Schwetzingerstadt",
			"Jungbusch",
			"Käfertal",
			"Feudenheim",
			"Seckenheim",
			"Rheinau",
			"Waldhof",
		]),
	},
	{
		group: "Augsburg",
		options: districts("Augsburg", [
			"Innenstadt",
			"Pfersee",
			"Göggingen",
			"Haunstetten",
			"Lechhausen",
			"Oberhausen",
			"Kriegshaber",
			"Hochzoll",
			"Antonsviertel",
			"Universitätsviertel",
		]),
	},
	{
		group: "Wiesbaden",
		options: districts("Wiesbaden", [
			"Mitte",
			"Westend",
			"Rheingauviertel",
			"Biebrich",
			"Schierstein",
			"Dotzheim",
			"Klarenthal",
			"Nordenstadt",
			"Bierstadt",
			"Erbenheim",
		]),
	},
	{
		group: "Mönchengladbach",
		options: districts("Mönchengladbach", [
			"Mitte",
			"Rheydt",
			"Hardt",
			"Odenkirchen",
			"Giesenkirchen",
			"Wickrath",
			"Neuwerk",
			"Rheindahlen",
		]),
	},
	{
		group: "Gelsenkirchen",
		options: districts("Gelsenkirchen", [
			"Altstadt",
			"Buer",
			"Horst",
			"Erle",
			"Ückendorf",
			"Bismarck",
			"Hassel",
			"Schalke",
			"Rotthausen",
		]),
	},
	{
		group: "Braunschweig",
		options: districts("Braunschweig", [
			"Innenstadt",
			"Östliches Ringgebiet",
			"Weststadt",
			"Nordstadt",
			"Viewegs Garten",
			"Gliesmarode",
			"Rühme",
			"Heidberg",
			"Stöckheim",
			"Lehndorf",
		]),
	},
	{
		group: "Kiel",
		options: districts("Kiel", [
			"Altstadt",
			"Vorstadt",
			"Gaarden",
			"Wik",
			"Holtenau",
			"Mettenhof",
			"Hassee",
			"Ellerbek",
			"Suchsdorf",
			"Schreventeich",
		]),
	},
	{
		group: "Aachen",
		options: districts("Aachen", [
			"Innenstadt",
			"Burtscheid",
			"Laurensberg",
			"Eilendorf",
			"Haaren",
			"Brand",
			"Kornelimünster",
			"Richterich",
			"Forst",
		]),
	},
	{
		group: "Magdeburg",
		options: districts("Magdeburg", [
			"Altstadt",
			"Neustadt",
			"Buckau",
			"Sudenburg",
			"Olvenstedt",
			"Reform",
			"Cracau",
			"Stadtfeld",
			"Salbke",
			"Diesdorf",
		]),
	},
	{
		group: "Freiburg im Breisgau",
		options: districts("Freiburg", [
			"Altstadt",
			"Wiehre",
			"Stühlinger",
			"Herdern",
			"Haslach",
			"Zähringen",
			"Littenweiler",
			"Betzenhausen",
			"Weingarten",
			"Rieselfeld",
			"Vauban",
		]),
	},
	{
		group: "Lübeck",
		options: districts("Lübeck", [
			"Altstadt",
			"St. Jürgen",
			"St. Gertrud",
			"St. Lorenz",
			"Kücknitz",
			"Travemünde",
			"Schlutup",
			"Moisling",
		]),
	},
	{
		group: "Erfurt",
		options: districts("Erfurt", [
			"Altstadt",
			"Andreasvorstadt",
			"Krämpfervorstadt",
			"Daberstedt",
			"Melchendorf",
			"Gispersleben",
			"Marbach",
			"Bindersleben",
			"Hochheim",
		]),
	},
	{
		group: "Rostock",
		options: districts("Rostock", [
			"Stadtmitte",
			"Kröpeliner-Tor-Vorstadt",
			"Warnemünde",
			"Hansaviertel",
			"Reutershagen",
			"Evershagen",
			"Lichtenhagen",
			"Toitenwinkel",
			"Gehlsdorf",
		]),
	},
	{
		group: "Mainz",
		options: districts("Mainz", [
			"Altstadt",
			"Neustadt",
			"Oberstadt",
			"Hartenberg-Münchfeld",
			"Mombach",
			"Gonsenheim",
			"Bretzenheim",
			"Weisenau",
			"Hechtsheim",
			"Finthen",
		]),
	},
	{
		group: "Kassel",
		options: districts("Kassel", [
			"Mitte",
			"Vorderer Westen",
			"Wesertor",
			"Bad Wilhelmshöhe",
			"Bettenhausen",
			"Nord-Holland",
			"Südstadt",
			"Harleshausen",
			"Niederzwehren",
			"Rothenditmold",
		]),
	},
	{
		group: "Hagen",
		options: districts("Hagen", [
			"Mitte",
			"Haspe",
			"Hohenlimburg",
			"Eilpe",
			"Emst",
			"Boele",
			"Vorhalle",
			"Dahl",
		]),
	},
	{
		group: "Hamm",
		options: districts("Hamm", [
			"Mitte",
			"Bockum-Hövel",
			"Heessen",
			"Rhynern",
			"Uentrop",
			"Pelkum",
			"Herringen",
		]),
	},
	{
		group: "Saarbrücken",
		options: districts("Saarbrücken", [
			"Mitte",
			"St. Johann",
			"Malstatt",
			"Burbach",
			"Dudweiler",
			"Altenkessel",
			"Gersweiler",
			"Klarenthal",
		]),
	},
	{
		group: "Potsdam",
		options: districts("Potsdam", [
			"Innenstadt",
			"Babelsberg",
			"Bornstedt",
			"Drewitz",
			"Waldstadt",
			"Bornim",
			"Sanssouci",
			"Stern",
			"Golm",
		]),
	},
	{
		group: "Ludwigshafen",
		options: districts("Ludwigshafen", [
			"Mitte",
			"Friesenheim",
			"Mundenheim",
			"Oggersheim",
			"Oppau",
			"Rheingönheim",
			"Gartenstadt",
			"Maudach",
		]),
	},
	{
		group: "Oldenburg",
		options: districts("Oldenburg", [
			"Innenstadt",
			"Ofenerdiek",
			"Kreyenbrück",
			"Eversten",
			"Bloherfelde",
			"Dietrichsfeld",
			"Ohmstede",
			"Wechloy",
		]),
	},
	{
		group: "Osnabrück",
		options: districts("Osnabrück", [
			"Innenstadt",
			"Westerberg",
			"Schinkel",
			"Haste",
			"Dodesheide",
			"Fledder",
			"Kalkhügel",
			"Voxtrup",
			"Atter",
		]),
	},
	{
		group: "Leverkusen",
		options: districts("Leverkusen", [
			"Mitte",
			"Opladen",
			"Schlebusch",
			"Rheindorf",
			"Küppersteg",
			"Hitdorf",
			"Quettingen",
			"Steinbüchel",
		]),
	},
	{
		group: "Heidelberg",
		options: districts("Heidelberg", [
			"Altstadt",
			"Bergheim",
			"Weststadt",
			"Südstadt",
			"Neuenheim",
			"Handschuhsheim",
			"Rohrbach",
			"Kirchheim",
			"Wieblingen",
			"Ziegelhausen",
		]),
	},
	{
		group: "Darmstadt",
		options: districts("Darmstadt", [
			"Mitte",
			"Bessungen",
			"Arheilgen",
			"Eberstadt",
			"Kranichstein",
			"Wixhausen",
			"Nord",
			"West",
		]),
	},
	{
		group: "Regensburg",
		options: districts("Regensburg", [
			"Altstadt",
			"Stadtamhof",
			"Kasernenviertel",
			"Kumpfmühl",
			"Galgenberg",
			"Reinhausen",
			"Prüfening",
			"Burgweinting",
		]),
	},
	{
		group: "Ingolstadt",
		options: districts("Ingolstadt", [
			"Mitte",
			"Nordwest",
			"Nordost",
			"Südwest",
			"Südost",
			"Mitte-West",
			"Friedrichshofen",
			"Oberhaunstadt",
		]),
	},
	{
		group: "Würzburg",
		options: districts("Würzburg", [
			"Altstadt",
			"Sanderau",
			"Zellerau",
			"Grombühl",
			"Heidingsfeld",
			"Heuchelhof",
			"Lindleinsmühle",
			"Frauenland",
		]),
	},
	{
		group: "Wolfsburg",
		options: districts("Wolfsburg", [
			"Stadtmitte",
			"Detmerode",
			"Westhagen",
			"Vorsfelde",
			"Fallersleben",
			"Kästorf",
			"Nordstadt",
			"Hattorf",
		]),
	},
	{
		group: "Ulm",
		options: districts("Ulm", [
			"Mitte",
			"Söflingen",
			"Wiblingen",
			"Eselsberg",
			"Böfingen",
			"Jungingen",
			"Lehr",
			"Donautal",
		]),
	},
	{
		group: "Heilbronn",
		options: districts("Heilbronn", [
			"Innenstadt",
			"Böckingen",
			"Sontheim",
			"Neckargartach",
			"Klingenberg",
			"Biberach",
			"Frankenbach",
		]),
	},
	{
		group: "Paderborn",
		options: districts("Paderborn", [
			"Kernstadt",
			"Schloß Neuhaus",
			"Elsen",
			"Sennelager",
			"Wewer",
			"Dahl",
			"Neuenbeken",
		]),
	},
	{
		group: "Offenbach am Main",
		options: districts("Offenbach", [
			"Mitte",
			"Kaiserlei",
			"Bieber",
			"Bürgel",
			"Rumpenheim",
			"Tempelsee",
			"Lauterborn",
			"Waldheim",
		]),
	},
	{
		group: "Göttingen",
		options: districts("Göttingen", [
			"Innenstadt",
			"Weende",
			"Geismar",
			"Grone",
			"Nikolausberg",
			"Herberhausen",
			"Holtensen",
		]),
	},
	{
		group: "Bottrop",
		options: districts("Bottrop", [
			"Mitte",
			"Batenbrock",
			"Boy",
			"Eigen",
			"Fuhlenbrock",
			"Kirchhellen",
			"Vonderort",
		]),
	},
	{
		group: "Recklinghausen",
		options: districts("Recklinghausen", [
			"Innenstadt",
			"Süd",
			"Ost",
			"West",
			"Nord",
			"Hillerheide",
			"Hochlarmark",
			"Suderwich",
		]),
	},
	{
		group: "Reutlingen",
		options: districts("Reutlingen", [
			"Mitte",
			"Betzingen",
			"Sondelfingen",
			"Gönningen",
			"Oferdingen",
			"Altenburg",
			"Mittelstadt",
		]),
	},
	{
		group: "Koblenz",
		options: districts("Koblenz", [
			"Altstadt",
			"Ehrenbreitstein",
			"Metternich",
			"Lützel",
			"Karthause",
			"Moselweiß",
			"Pfaffendorf",
			"Horchheim",
		]),
	},
	{
		group: "Bergisch Gladbach",
		options: districts("Bergisch Gladbach", [
			"Stadtmitte",
			"Bensberg",
			"Refrath",
			"Paffrath",
			"Schildgen",
			"Hebborn",
			"Hand",
		]),
	},
	{
		group: "Jena",
		options: districts("Jena", [
			"Zentrum",
			"West",
			"Nord",
			"Ost",
			"Süd",
			"Lobeda",
			"Winzerla",
			"Wenigenjena",
			"Zwätzen",
		]),
	},
	{
		group: "Trier",
		options: districts("Trier", [
			"Mitte",
			"Nord",
			"Süd",
			"West",
			"Ehrang",
			"Pfalzel",
			"Olewig",
			"Euren",
			"Biewer",
		]),
	},
	{
		group: "Hildesheim",
		options: districts("Hildesheim", [
			"Mitte",
			"Neustadt",
			"Moritzberg",
			"Himmelsthür",
			"Ochtersum",
			"Drispenstedt",
			"Itzum",
		]),
	},
	{
		group: "Erlangen",
		options: districts("Erlangen", [
			"Altstadt",
			"Bruck",
			"Büchenbach",
			"Frauenaurach",
			"Kriegenbrunn",
			"Tennenlohe",
			"Süd",
			"Nord",
		]),
	},
	{
		group: "Moers",
		options: districts("Moers", [
			"Altstadt",
			"Asberg",
			"Hülsdonk",
			"Kapellen",
			"Repelen",
			"Schwafheim",
			"Utfort",
		]),
	},
	{
		group: "Siegen",
		options: districts("Siegen", [
			"Mitte",
			"Weidenau",
			"Geisweid",
			"Eiserfeld",
			"Trupbach",
			"Kaan-Marienborn",
			"Seelbach",
		]),
	},
	{
		group: "Cottbus",
		options: districts("Cottbus", [
			"Mitte",
			"Sandow",
			"Spremberger Vorstadt",
			"Schmellwitz",
			"Sachsendorf",
			"Ströbitz",
			"Madlow",
		]),
	},
	{
		group: "Schwerin",
		options: districts("Schwerin", [
			"Altstadt",
			"Schelfstadt",
			"Paulsstadt",
			"Werdervorstadt",
			"Lankow",
			"Neumühle",
			"Krebsförden",
			"Zippendorf",
		]),
	},
	{
		group: "Brandenburg an der Havel",
		options: districts("Brandenburg", [
			"Altstadt",
			"Neustadt",
			"Dom",
			"Nord",
			"Görden",
			"Hohenstücken",
			"Kirchmöser",
		]),
	},
	// Additional Großstädte previously missing
	{
		group: "Chemnitz",
		options: districts("Chemnitz", [
			"Zentrum",
			"Kaßberg",
			"Sonnenberg",
			"Hilbersdorf",
			"Gablenz",
			"Bernsdorf",
			"Yorckgebiet",
			"Reichenbrand",
		]),
	},
	{
		group: "Halle (Saale)",
		options: districts("Halle", [
			"Altstadt",
			"Neustadt",
			"Giebichenstein",
			"Kröllwitz",
			"Südstadt",
			"Heide-Süd",
			"Trotha",
			"Büschdorf",
		]),
	},
	{
		group: "Krefeld",
		options: districts("Krefeld", [
			"Innenstadt",
			"Uerdingen",
			"Fischeln",
			"Hüls",
			"Linn",
			"Oppum",
			"Bockum",
			"Traar",
		]),
	},
	{
		group: "Oberhausen",
		options: districts("Oberhausen", [
			"Altstadt",
			"Sterkrade",
			"Osterfeld",
			"Alstaden",
			"Schmachtendorf",
			"Lirich",
			"Styrum",
		]),
	},
	{
		group: "Mülheim an der Ruhr",
		options: districts("Mülheim", [
			"Mitte",
			"Styrum",
			"Speldorf",
			"Saarn",
			"Heißen",
			"Dümpten",
			"Broich",
		]),
	},
	{
		group: "Solingen",
		options: districts("Solingen", [
			"Mitte",
			"Ohligs",
			"Wald",
			"Gräfrath",
			"Höhscheid",
			"Aufderhöhe",
			"Merscheid",
		]),
	},
	{
		group: "Herne",
		options: districts("Herne", [
			"Mitte",
			"Wanne",
			"Eickel",
			"Baukau",
			"Sodingen",
			"Horsthausen",
			"Röhlinghausen",
		]),
	},
	{
		group: "Neuss",
		options: districts("Neuss", [
			"Innenstadt",
			"Hammfeld",
			"Reuschenberg",
			"Weckhoven",
			"Norf",
			"Grimlinghausen",
			"Holzheim",
		]),
	},
	{
		group: "Pforzheim",
		options: districts("Pforzheim", [
			"Innenstadt",
			"Brötzingen",
			"Dillweißenstein",
			"Eutingen",
			"Büchenbronn",
			"Hohenwart",
			"Würm",
		]),
	},
	{
		group: "Fürth",
		options: districts("Fürth", [
			"Altstadt",
			"Südstadt",
			"Hardhöhe",
			"Stadeln",
			"Vach",
			"Unterfarrnbach",
			"Poppenreuth",
		]),
	},
	{
		group: "Remscheid",
		options: districts("Remscheid", [
			"Mitte",
			"Lüttringhausen",
			"Lennep",
			"Hasten",
			"Reinshagen",
			"Bliedinghausen",
		]),
	},
	{
		group: "Salzgitter",
		options: districts("Salzgitter", [
			"Lebenstedt",
			"Bad",
			"Thiede",
			"Gebhardshagen",
			"Hallendorf",
			"Beddingen",
		]),
	},
	{
		group: "Gütersloh",
		options: districts("Gütersloh", [
			"Innenstadt",
			"Nord",
			"Süd",
			"Isselhorst",
			"Spexard",
			"Avenwedde",
			"Blankenhagen",
		]),
	},
	{
		group: "Kaiserslautern",
		options: districts("Kaiserslautern", [
			"Innenstadt",
			"Betzenberg",
			"Morlautern",
			"Erfenbach",
			"Hohenecken",
			"Erlenbach",
			"Dansenberg",
		]),
	},
	{
		group: "Iserlohn",
		options: districts("Iserlohn", [
			"Mitte",
			"Letmathe",
			"Hennen",
			"Sümmern",
			"Kalthof",
			"Grüne",
		]),
	},
	{
		group: "Zwickau",
		options: districts("Zwickau", [
			"Mitte",
			"Pölbitz",
			"Eckersbach",
			"Planitz",
			"Marienthal",
			"Oberhohndorf",
			"Schedewitz",
		]),
	},
	{
		group: "Dessau-Roßlau",
		options: districts("Dessau", [
			"Mitte",
			"Süd",
			"Nord",
			"Alten",
			"Roßlau",
			"Ziebigk",
			"Kochstedt",
		]),
	},
	{
		group: "Flensburg",
		options: districts("Flensburg", [
			"Altstadt",
			"Neustadt",
			"Nordstadt",
			"Westliche Höhe",
			"Fruerlund",
			"Mürwik",
			"Engelsby",
			"Tarup",
		]),
	},
	{
		group: "Konstanz",
		options: districts("Konstanz", [
			"Altstadt",
			"Paradies",
			"Petershausen",
			"Allmannsdorf",
			"Wollmatingen",
			"Litzelstetten",
			"Dingelsdorf",
		]),
	},
	{
		group: "Worms",
		options: districts("Worms", [
			"Mitte",
			"Neuhausen",
			"Herrnsheim",
			"Horchheim",
			"Pfiffligheim",
			"Weinsheim",
			"Leiselheim",
		]),
	},
	{
		group: "Gießen",
		options: districts("Gießen", [
			"Mitte",
			"Nordstadt",
			"Weststadt",
			"Süd",
			"Wieseck",
			"Rödgen",
			"Allendorf",
		]),
	},
	{
		group: "Marburg",
		options: districts("Marburg", [
			"Oberstadt",
			"Unterstadt",
			"Südviertel",
			"Wehrda",
			"Cappel",
			"Ockershausen",
			"Richtsberg",
		]),
	},
	{
		group: "Bayreuth",
		options: districts("Bayreuth", [
			"Mitte",
			"Altstadt",
			"St. Georgen",
			"Saas",
			"Oberkonnersreuth",
			"Laineck",
			"Meyernberg",
		]),
	},
	{
		group: "Bamberg",
		options: districts("Bamberg", [
			"Inselstadt",
			"Theuerstadt",
			"Gärtnerstadt",
			"Bergstadt",
			"Bug",
			"Gaustadt",
			"Wildensorg",
		]),
	},
	{
		group: "Passau",
		options: districts("Passau", [
			"Altstadt",
			"Innstadt",
			"Haidenhof",
			"Hacklberg",
			"Grubweg",
			"Heining",
		]),
	},
	{
		group: "Landshut",
		options: districts("Landshut", [
			"Altstadt",
			"Nikola",
			"West",
			"Achdorf",
			"Berg",
			"Schönbrunn",
			"Wolfgang",
		]),
	},
	{
		group: "Rosenheim",
		options: districts("Rosenheim", [
			"Zentrum",
			"Fürstätt",
			"Aising",
			"Pang",
			"Westerndorf",
			"Happing",
		]),
	},
	{
		group: "Schweinfurt",
		options: districts("Schweinfurt", [
			"Altstadt",
			"Bergl",
			"Hochfeld",
			"Oberndorf",
			"Musikerviertel",
			"Hafen-Ost",
		]),
	},
	{
		group: "Aschaffenburg",
		options: districts("Aschaffenburg", [
			"Innenstadt",
			"Damm",
			"Schweinheim",
			"Obernau",
			"Gailbach",
			"Strietwald",
			"Leider",
		]),
	},
	{
		group: "Fulda",
		options: districts("Fulda", [
			"Innenstadt",
			"Horas",
			"Aschenberg",
			"Ziehers",
			"Kohlhaus",
			"Maberzell",
			"Edelzell",
		]),
	},
	{
		group: "Celle",
		options: districts("Celle", [
			"Altstadt",
			"Hehlentor",
			"Neustadt",
			"Westercelle",
			"Klein Hehlen",
			"Blumlage",
		]),
	},
	{
		group: "Weimar",
		options: districts("Weimar", [
			"Altstadt",
			"Nordvorstadt",
			"Westvorstadt",
			"Schöndorf",
			"Ehringsdorf",
			"Taubach",
		]),
	},
	{
		group: "Greifswald",
		options: districts("Greifswald", [
			"Innenstadt",
			"Schönwalde I",
			"Schönwalde II",
			"Wieck",
			"Eldena",
			"Ostseeviertel",
		]),
	},
	{
		group: "Stralsund",
		options: districts("Stralsund", [
			"Altstadt",
			"Knieper",
			"Franken",
			"Tribseer",
			"Andershof",
			"Devin",
		]),
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

/**
 * Bare city labels from the old catalog (e.g. "Hannover") — still accepted
 * for existing rows; UI should prefer "City (sonstiges)" / districts.
 */
const LEGACY_BARE_AREAS = new Set<string>();

/** City group name → sonstiges label (for geocode hints). */
const CITY_SONSTIGES: ReadonlyMap<string, string> = (() => {
	const m = new Map<string, string>();
	for (const g of PUBLIC_AREA_GROUPS) {
		const sonst = g.options.find((o) => o.includes("(sonstiges)"));
		if (!sonst) continue;
		if (sonst) m.set(g.group.toLowerCase(), sonst);
		const bare = sonst.replace(/\s*\(sonstiges\)\s*$/i, "");
		if (bare) {
			LEGACY_BARE_AREAS.add(bare);
			m.set(bare.toLowerCase(), sonst);
		}
	}
	// Common aliases
	const aliases: Array<[string, string]> = [
		["muenchen", "München (sonstiges)"],
		["munich", "München (sonstiges)"],
		["koeln", "Köln (sonstiges)"],
		["cologne", "Köln (sonstiges)"],
		["frankfurt am main", "Frankfurt (sonstiges)"],
		["frankfurt/main", "Frankfurt (sonstiges)"],
		["halle (saale)", "Halle (sonstiges)"],
		["halle saale", "Halle (sonstiges)"],
		["freiburg im breisgau", "Freiburg (sonstiges)"],
		["offenbach am main", "Offenbach (sonstiges)"],
		["mülheim an der ruhr", "Mülheim (sonstiges)"],
		["muelheim", "Mülheim (sonstiges)"],
		["brandenburg an der havel", "Brandenburg (sonstiges)"],
		["dessau-roßlau", "Dessau (sonstiges)"],
		["dessau-rosslau", "Dessau (sonstiges)"],
	];
	for (const [k, v] of aliases) {
		if (AREA_SET.has(v)) m.set(k, v);
	}
	return m;
})();

export function isPublicArea(value: string): boolean {
	const v = value.trim();
	if (AREA_SET.has(v)) return true;
	// Legacy bare city names remain valid
	return LEGACY_BARE_AREAS.has(v);
}

/** Prefer district catalog label over legacy bare city. */
export function canonicalizePublicArea(value: string): string {
	const v = value.trim();
	if (AREA_SET.has(v)) return v;
	const mapped = CITY_SONSTIGES.get(v.toLowerCase());
	if (mapped) return mapped;
	return v;
}

/** Normalize for fuzzy search (umlauts → ascii, lower). */
export function normalizeAreaQuery(s: string): string {
	return s
		.trim()
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
		.replace(/\s+/g, " ");
}

/**
 * Filter area groups by search query (city or district substring).
 * Empty query returns all groups.
 */
export function filterAreaGroups(query: string): AreaGroup[] {
	const q = normalizeAreaQuery(query);
	if (!q) {
		return PUBLIC_AREA_GROUPS.map((g) => ({
			group: g.group,
			options: [...g.options],
		}));
	}
	const out: AreaGroup[] = [];
	for (const g of PUBLIC_AREA_GROUPS) {
		const groupMatch = normalizeAreaQuery(g.group).includes(q);
		const opts = groupMatch
			? [...g.options]
			: g.options.filter((o) => normalizeAreaQuery(o).includes(q));
		if (opts.length) out.push({ group: g.group, options: opts });
	}
	return out;
}

/** Label key for fuzzy match: strip sonstiges, hyphens → spaces, normalize. */
function areaMatchKey(area: string): string {
	return normalizeAreaQuery(
		area.replace(/\s*\(sonstiges\)\s*$/i, "").replace(/-/g, " "),
	);
}

/** Suggest a catalog area from a free-text geocode / address label (best effort). */
export function suggestPublicArea(raw: string): string | null {
	const t = raw.trim();
	if (!t) return null;
	const tn = normalizeAreaQuery(raw.replace(/-/g, " "));

	const districts = PUBLIC_AREAS.filter((a) => !a.includes("(sonstiges)")).sort(
		(a, b) => b.length - a.length,
	);

	// 1) Full "City District" key (hyphen ≈ space), longest first
	for (const area of districts) {
		const a = areaMatchKey(area);
		if (a.length < 4) continue;
		if (tn.includes(a)) return area;
	}

	// 2) City + district tokens both present (order-independent)
	for (const area of districts) {
		const dash = area.indexOf("-");
		if (dash < 0) continue;
		const city = normalizeAreaQuery(area.slice(0, dash));
		const district = normalizeAreaQuery(area.slice(dash + 1).replace(/-/g, " "));
		if (city.length < 3 || district.length < 3) continue;
		if (tn.includes(city) && tn.includes(district)) return area;
	}

	// 3) City / alias → "(sonstiges)"
	const cityKeys = [...CITY_SONSTIGES.keys()].sort((a, b) => b.length - a.length);
	for (const key of cityKeys) {
		const k = normalizeAreaQuery(key);
		if (k.length >= 3 && tn.includes(k)) {
			const area = CITY_SONSTIGES.get(key);
			if (area && AREA_SET.has(area)) return area;
		}
	}

	return null;
}
