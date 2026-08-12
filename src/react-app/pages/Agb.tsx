import { Link } from "react-router-dom";

const UPDATED = "12.08.2026";

export function Agb() {
	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>Nutzungsbedingungen</h1>
				<p className="page-lede muted">
					Allgemeine Bedingungen für die Nutzung von GrabMe (AGB-ähnlich).
				</p>
				<p className="legal-updated muted">Stand: {UPDATED}</p>
			</header>

			<div className="legal-body">
				<section>
					<h2>1. Geltungsbereich</h2>
					<p>
						Diese Nutzungsbedingungen regeln die Nutzung der App und Website{" "}
						<strong>GrabMe</strong> (nachfolgend „Dienst“). Mit der Nutzung
						oder Registrierung erkennst du diese Bedingungen an.
					</p>
					<p>
						Ergänzend gilt die{" "}
						<Link to="/datenschutz">Datenschutzerklärung</Link>. Anbieter:
						siehe <Link to="/impressum">Impressum</Link>.
					</p>
				</section>

				<section>
					<h2>2. Leistungsbeschreibung</h2>
					<p>
						GrabMe ist eine Plattform, über die Nutzer{" "}
						<strong>Pfand-Angebote</strong> (Flaschen, Dosen, Kästen nach
						deutschem Pfandsystem) inserieren und Abholungen vereinbaren
						können – einmalig oder wöchentlich.
					</p>
					<ul>
						<li>
							<strong>Einmalig:</strong> Annahme durch einen Abholer, Abholung
							innerhalb der angezeigten Frist (derzeit 6 Stunden),
							Zwei-Schritt-Abschluss (Abholer meldet abgeholt, Inserent
							bestätigt).
						</li>
						<li>
							<strong>Wöchentlich:</strong> Bewerbungen, Auswahl eines festen
							Abholers durch den Inserenten; Mengen und Pfandwert sind eine{" "}
							<strong>Schätzung</strong> und können schwanken (bis etwa −50
							%).
						</li>
					</ul>
					<p>
						GrabMe ist <strong>kein</strong> Zahlungsdienst und vermittelt
						keinen Geldaustausch. „Gegenleistung“ ist der Pfandwert der
						mitgenommenen Gebinde, der beim Rückgabeautomaten bzw. Händler
						entsteht.
					</p>
				</section>

				<section>
					<h2>3. Kostenfreiheit</h2>
					<p>
						Der Dienst ist derzeit kostenlos. Wir behalten uns vor, künftig
						entgeltliche Funktionen einzuführen; darüber informieren wir
						rechtzeitig und gesondert.
					</p>
				</section>

				<section>
					<h2>4. Registrierung und Konto</h2>
					<p>
						Die Anmeldung erfolgt per Magic-Link an eine von dir angegebene
						E-Mail-Adresse. Du bist für die Vertraulichkeit deines
						Postfachs und für Aktivitäten unter deinem Konto verantwortlich.
						Angaben (Name, Angebote, Adressen) müssen zutreffend und nicht
						irreführend sein.
					</p>
				</section>

				<section>
					<h2>5. Pflichten der Nutzer</h2>
					<ul>
						<li>
							Nur Pfand anbieten bzw. abholen, zu dem du berechtigt bist.
						</li>
						<li>
							Keine rechtswidrigen, belästigenden, diskriminierenden oder
							sonst unzulässigen Inhalte.
						</li>
						<li>
							Keine missbräuchliche Nutzung (Spam, Scraping, Automatisierung
							gegen den Betrieb, Umgehung von Limits).
						</li>
						<li>
							Vereinbarte Zeiten und Orte einhalten; Abholungen in der App
							korrekt melden bzw. bestätigen.
						</li>
						<li>
							Bei wöchentlichen Angeboten realistische Schätzungen angeben
							und Abweichungen fair kommunizieren.
						</li>
					</ul>
				</section>

				<section>
					<h2>6. Vermittlerrolle – keine Garantie</h2>
					<p>
						GrabMe stellt nur die technische Vermittlung bereit. Verträge
						über die Übergabe des Pfands kommen – soweit überhaupt –
						ausschließlich zwischen den Nutzern zustande. Wir prüfen
						Angebote und Nutzer nicht vollständig und übernehmen keine
						Garantie für:
					</p>
					<ul>
						<li>Verfügbarkeit, Menge oder Zustand des Pfands,</li>
						<li>Erscheinen von Inserent oder Abholer,</li>
						<li>Richtigkeit von Adressen oder Angaben Dritter.</li>
					</ul>
				</section>

				<section>
					<h2>7. Mindestwerte und Schätzungen</h2>
					<p>
						Für einmalige Angebote gilt der in der App ausgewiesene
						Mindest-Pfandwert. Wöchentliche Angebote basieren auf einer
						Schätzung mit Schwankungstoleranz (siehe Hinweise in der App).
						Der gelistete Wert ist keine verbindliche Zusicherung einer
						festen Auszahlung.
					</p>
				</section>

				<section>
					<h2>8. Sperrung und Löschung</h2>
					<p>
						Wir können Angebote entfernen, Konten vorübergehend oder dauerhaft
						sperren oder den Zugang beschränken, wenn gegen diese Bedingungen
						verstoßen wird, Rechte Dritter oder der Betrieb gefährdet sind
						oder gesetzliche Gründe dies erfordern.
					</p>
				</section>

				<section>
					<h2>9. Verfügbarkeit</h2>
					<p>
						Wir bemühen uns um einen stabilen Betrieb, schulden aber keine
						ununterbrochene Verfügbarkeit. Wartung, Störungen bei
						Infrastrukturanbietern oder höhere Gewalt können den Dienst
						beeinträchtigen.
					</p>
				</section>

				<section>
					<h2>10. Haftung</h2>
					<p>
						Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit
						sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei
						leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher
						Vertragspflichten (Kardinalpflichten) und begrenzt auf den
						vorhersehbaren, vertragstypischen Schaden. Die Haftung nach dem
						Produkthaftungsgesetz bleibt unberührt.
					</p>
					<p>
						Für Inhalte und Handlungen anderer Nutzer sowie für Schäden aus
						der Abholung vor Ort (z. B. Zutritt, Diebstahl, Unfälle) haften
						wir nicht, soweit uns kein eigenes Verschulden im vorstehenden
						Sinne trifft.
					</p>
				</section>

				<section>
					<h2>11. Freistellung</h2>
					<p>
						Du stellst uns von Ansprüchen Dritter frei, die aus deinen
						Inhalten oder deiner Nutzung des Dienstes entstehen, soweit du
						dies zu vertreten hast, einschließlich angemessener
						Rechtsverteidigungskosten.
					</p>
				</section>

				<section>
					<h2>12. Änderungen der Bedingungen</h2>
					<p>
						Wir können diese Nutzungsbedingungen anpassen. Die aktuelle
						Fassung ist unter dieser URL abrufbar. Bei wesentlichen Änderungen
						können wir registrierte Nutzer per E-Mail oder in der App
						hinweisen. Widersprichst du nicht und nutzt den Dienst weiter,
						gilt die neue Fassung, soweit gesetzlich zulässig.
					</p>
				</section>

				<section>
					<h2>13. Schlussbestimmungen</h2>
					<p>
						Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
						des UN-Kaufrechts, soweit dem keine zwingenden
						Verbraucherschutzvorschriften deines Wohnsitzstaates entgegenstehen.
					</p>
					<p>
						Sollten einzelne Bestimmungen unwirksam sein, bleibt die
						Wirksamkeit der übrigen unberührt.
					</p>
				</section>

				<section>
					<h2>14. Kontakt</h2>
					<p>
						Fragen zu diesen Bedingungen: siehe{" "}
						<Link to="/impressum">Impressum</Link>. Datenschutz:{" "}
						<Link to="/datenschutz">Datenschutzerklärung</Link>. Cookies:{" "}
						<Link to="/cookies">Cookie-Richtlinie</Link>.
					</p>
				</section>
			</div>
		</div>
	);
}
