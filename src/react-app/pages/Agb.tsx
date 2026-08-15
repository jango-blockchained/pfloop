// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Link } from "react-router-dom";
import { useLocale } from "../i18n";

const UPDATED = "12.08.2026";

export function Agb() {
	const { locale, t } = useLocale();
	const en = locale === "en";

	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>{en ? "Terms of use" : "Nutzungsbedingungen"}</h1>
				<p className="page-lede muted">
					{en
						? "General terms for using Pfloop (terms of service)."
						: "Allgemeine Bedingungen für die Nutzung von Pfloop (AGB-ähnlich)."}
				</p>
				<p className="legal-updated muted">
					{t("legal.asOf", { date: UPDATED })}
				</p>
			</header>

			<div className="legal-body">
				{en ? (
					<>
						<section>
							<h2>1. Scope</h2>
							<p>
								These terms of use govern use of the app and website{" "}
								<strong>Pfloop</strong> (the “Service”). By using or registering
								you accept these terms.
							</p>
							<p>
								The <Link to="/datenschutz">{t("footer.privacy")}</Link> policy
								applies in addition. Provider: see{" "}
								<Link to="/impressum">{t("footer.imprint")}</Link>.
							</p>
						</section>

						<section>
							<h2>2. Service description</h2>
							<p>
								Pfloop is a platform on which users can post{" "}
								<strong>deposit (Pfand) offers</strong> (bottles, cans, crates
								under the German deposit system) and arrange collections –
								one-off or weekly.
							</p>
							<ul>
								<li>
									<strong>One-off:</strong> acceptance by a collector, collection
									within the displayed deadline (currently 6 hours), two-step
									completion (collector reports collected, poster confirms within
									24 hours; otherwise cancellation). Collectors have a progressive
									daily limit (1–5 acceptances).
								</li>
								<li>
									<strong>Weekly:</strong> applications, selection of a fixed
									collector by the poster; quantities and deposit value are an{" "}
									<strong>estimate</strong> and may vary (by up to about −50%).
								</li>
							</ul>
							<p>
								Pfloop is <strong>not</strong> a payment service and does not
								arrange money transfers. The “consideration” is the deposit value
								of the containers taken, which arises at the return machine or
								retailer.
							</p>
						</section>

						<section>
							<h2>3. Free of charge</h2>
							<p>
								The service is currently free. We reserve the right to introduce
								paid features in future; we will inform you in good time and
								separately.
							</p>
						</section>

						<section>
							<h2>4. Registration and account</h2>
							<p>
								Sign-in is via a magic link to an email address you provide. You
								are responsible for the confidentiality of your mailbox and for
								activity under your account. Details (name, offers, addresses)
								must be accurate and not misleading.
							</p>
						</section>

						<section>
							<h2>5. User obligations</h2>
							<ul>
								<li>
									Only offer or collect deposit items you are authorised to
									handle.
								</li>
								<li>
									No unlawful, harassing, discriminatory, or otherwise
									impermissible content.
								</li>
								<li>
									No abusive use (spam, scraping, automation against the
									service, circumventing limits).
								</li>
								<li>
									Keep agreed times and places; report or confirm collections
									correctly in the app.
								</li>
								<li>
									For weekly offers, give realistic estimates and communicate
									deviations fairly.
								</li>
							</ul>
						</section>

						<section>
							<h2>6. Intermediary role – no guarantee</h2>
							<p>
								Pfloop only provides technical intermediation. Contracts for
								handover of deposit items – if any – arise solely between users.
								We do not fully vet offers or users and give no guarantee for:
							</p>
							<ul>
								<li>availability, quantity, or condition of the deposit items,</li>
								<li>appearance of poster or collector,</li>
								<li>accuracy of addresses or third-party statements.</li>
							</ul>
						</section>

						<section>
							<h2>7. Minimum values and estimates</h2>
							<p>
								For one-off offers the minimum deposit value shown in the app
								applies. Weekly offers are based on an estimate with tolerance
								for variation (see in-app notices). The listed value is not a
								binding promise of a fixed payout.
							</p>
						</section>

						<section>
							<h2>8. Suspension and deletion</h2>
							<p>
								We may remove offers, suspend accounts temporarily or permanently,
								or restrict access if these terms are breached, third-party rights
								or operations are endangered, or legal grounds require it.
							</p>
						</section>

						<section>
							<h2>9. Availability</h2>
							<p>
								We aim for stable operation but do not guarantee uninterrupted
								availability. Maintenance, infrastructure provider outages, or
								force majeure may impair the service.
							</p>
						</section>

						<section>
							<h2>10. Liability</h2>
							<p>
								We are liable without limitation for intent and gross negligence
								and for injury to life, body, or health. In cases of slight
								negligence we are only liable for breach of essential contractual
								obligations (cardinal duties) and limited to the foreseeable,
								typical damage. Liability under the German Product Liability Act
								remains unaffected.
							</p>
							<p>
								We are not liable for content and actions of other users or for
								damage arising from on-site collection (e.g. access, theft,
								accidents), unless we are at fault in the sense set out above.
							</p>
						</section>

						<section>
							<h2>11. Indemnity</h2>
							<p>
								You indemnify us against third-party claims arising from your
								content or use of the service to the extent you are responsible,
								including reasonable legal defence costs.
							</p>
						</section>

						<section>
							<h2>12. Changes to the terms</h2>
							<p>
								We may update these terms of use. The current version is available
								at this URL. For material changes we may notify registered users
								by email or in the app. If you do not object and continue to use
								the service, the new version applies where legally permitted.
							</p>
						</section>

						<section>
							<h2>13. Final provisions</h2>
							<p>
								The law of the Federal Republic of Germany applies, excluding the
								UN Convention on Contracts for the International Sale of Goods,
								unless mandatory consumer protection rules of your country of
								residence provide otherwise.
							</p>
							<p>
								If individual provisions are invalid, the validity of the
								remaining provisions is unaffected.
							</p>
						</section>

						<section>
							<h2>14. Contact</h2>
							<p>
								Questions about these terms: see{" "}
								<Link to="/impressum">{t("footer.imprint")}</Link>. Privacy:{" "}
								<Link to="/datenschutz">{t("footer.privacy")}</Link>. Cookies:{" "}
								<Link to="/cookies">{t("footer.cookies")}</Link>.
							</p>
						</section>
					</>
				) : (
					<>
						<section>
							<h2>1. Geltungsbereich</h2>
							<p>
								Diese Nutzungsbedingungen regeln die Nutzung der App und Website{" "}
								<strong>Pfloop</strong> (nachfolgend „Dienst“). Mit der Nutzung
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
								Pfloop ist eine Plattform, über die Nutzer{" "}
								<strong>Pfand-Angebote</strong> (Flaschen, Dosen, Kästen nach
								deutschem Pfandsystem) inserieren und Abholungen vereinbaren
								können – einmalig oder wöchentlich.
							</p>
							<ul>
								<li>
									<strong>Einmalig:</strong> Annahme durch einen Abholer, Abholung
									innerhalb der angezeigten Frist (derzeit 6 Stunden),
									Zwei-Schritt-Abschluss (Abholer meldet abgeholt, Inserent
									bestätigt innerhalb von 24 Stunden; sonst Storno). Abholer
									haben ein progressives Tageslimit (1–5 Annahmen).
								</li>
								<li>
									<strong>Wöchentlich:</strong> Bewerbungen, Auswahl eines festen
									Abholers durch den Inserenten; Mengen und Pfandwert sind eine{" "}
									<strong>Schätzung</strong> und können schwanken (bis etwa −50
									%).
								</li>
							</ul>
							<p>
								Pfloop ist <strong>kein</strong> Zahlungsdienst und vermittelt
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
								Pfloop stellt nur die technische Vermittlung bereit. Verträge
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
					</>
				)}
			</div>
		</div>
	);
}
