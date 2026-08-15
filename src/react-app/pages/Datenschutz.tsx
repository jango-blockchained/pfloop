// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Link } from "react-router-dom";
import { useLocale } from "../i18n";

const UPDATED = "12.08.2026";

export function Datenschutz() {
	const { locale, t } = useLocale();
	const en = locale === "en";

	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>{en ? "Privacy policy" : "Datenschutzerklärung"}</h1>
				<p className="page-lede muted">
					{en
						? "Information on the processing of personal data when using Pfloop (GDPR / TTDSG)."
						: "Informationen zur Verarbeitung personenbezogener Daten bei Nutzung von Pfloop (DSGVO / TTDSG)."}
				</p>
				<p className="legal-updated muted">
					{t("legal.asOf", { date: UPDATED })}
				</p>
			</header>

			<div className="legal-body">
				{en ? (
					<>
						<section>
							<h2>1. Controller</h2>
							<p>
								The controller for data processing is the service provider named
								on the <Link to="/impressum">{t("footer.imprint")}</Link> page.
								Contact:{" "}
								<a href="mailto:login@hoox.sh">login@hoox.sh</a> (subject
								“Privacy Pfloop”).
							</p>
						</section>

						<section>
							<h2>2. Overview: why Pfloop needs data</h2>
							<p>
								Pfloop arranges <strong>deposit (Pfand) collections</strong>{" "}
								between posters and collectors. This requires, among other
								things, an account, location details, and offer content. The
								service is currently <strong>free of charge</strong>; no payment
								processing takes place via Pfloop.
							</p>
						</section>

						<section>
							<h2>3. What data we process</h2>
							<ul>
								<li>
									<strong>Account / login:</strong> email address, optional
									display name; magic-link tokens (time-limited) and session
									cookies for sign-in.
								</li>
								<li>
									<strong>Offers:</strong> item lists / deposit value (or
									estimate for weekly offers), notes, status, timestamps.
								</li>
								<li>
									<strong>Location &amp; address:</strong> coordinates (map),
									public area (neighbourhood), full address – the full address
									is visible only to the poster and the active or selected
									collector.
								</li>
								<li>
									<strong>Collection / application data:</strong> acceptances,
									deadlines, “collected” / confirmation reports, applications and
									messages for weekly offers.
								</li>
								<li>
									<strong>Saved addresses (profile):</strong> address templates
									you create for posting again.
								</li>
								<li>
									<strong>Technical logs:</strong> IP address, user agent, time
									and path of requests – typically via the hosting/CDN provider
									(Cloudflare) for security and operations.
								</li>
							</ul>
						</section>

						<section>
							<h2>4. Purposes and legal bases (Art. 6 GDPR)</h2>
							<ul>
								<li>
									<strong>Contract / pre-contractual measures</strong> (Art. 6
									(1) lit. b): account, offers, collections, applications,
									address disclosure to the collector.
								</li>
								<li>
									<strong>Legitimate interest</strong> (Art. 6 (1) lit. f):
									operation, abuse and security defence, error analysis, short
									server logs.
								</li>
								<li>
									<strong>Legal obligation</strong> (Art. 6 (1) lit. c), where
									disclosure or retention duties apply.
								</li>
							</ul>
						</section>

						<section>
							<h2>5. Recipients and processors</h2>
							<p>
								The app runs on infrastructure from{" "}
								<strong>Cloudflare, Inc.</strong> (including Workers, D1
								database, assets). Cloudflare processes technical connection data
								and the application data we store there as a service provider /
								within the hosting chain. Details: Cloudflare privacy notices.
							</p>
							<p>
								<strong>Email delivery (magic link):</strong> if configured, via
								an email service provider (e.g. Resend). Recipient address and
								link content are transmitted.
							</p>
							<p>
								<strong>Map display:</strong> third-party map tiles and geocoding
								services (e.g. the OpenStreetMap ecosystem) may receive technical
								requests from your device when the map loads.
							</p>
							<p>We do not sell personal data.</p>
						</section>

						<section>
							<h2>6. Retention period</h2>
							<ul>
								<li>
									<strong>Account &amp; offers:</strong> for as long as the
									account or offer is needed for the service; deleted/cancelled
									content is removed unless statutory retention applies.
								</li>
								<li>
									<strong>Magic links:</strong> only briefly until use or expiry
									(typically about 15 minutes).
								</li>
								<li>
									<strong>Sessions:</strong> until sign-out or automatic expiry /
									cleanup of expired sessions.
								</li>
								<li>
									<strong>Server logs:</strong> as short as usual for operations
									and security (provider standard, typically days to a few
									weeks).
								</li>
							</ul>
						</section>

						<section>
							<h2>7. Cookies and local storage (TTDSG)</h2>
							<p>
								We distinguish <strong>necessary</strong> and{" "}
								<strong>optional</strong> cookies / storage. Optional categories
								(preferences, analytics) are only set with your consent. Details,
								categories and controls:{" "}
								<Link to="/cookies">{t("cookies.banner.policyLink")}</Link>.
							</p>
							<ul>
								<li>
									<strong>Necessary:</strong> e.g. session cookie after login
									(sign-in does not work without it), storing your cookie
									choice, PWA/service-worker cache.
								</li>
								<li>
									<strong>Preferences (optional):</strong> e.g. hiding the
									install prompt.
								</li>
								<li>
									<strong>Analytics (optional):</strong> privacy-friendly
									measurement (e.g. Cloudflare Web Analytics), only with consent
									and if configured – no advertising profiles.
								</li>
							</ul>
							<p>
								There is <strong>no</strong> marketing tracking and no
								third-party advertising cookies via Pfloop. You can change your
								choice anytime via “Cookie settings” in the footer.
							</p>
						</section>

						<section>
							<h2>8. Location and address data – special notes</h2>
							<p>
								Coordinates and addresses are required to arrange collection. The{" "}
								<strong>exact address</strong> is not shown publicly on the map,
								but only after acceptance (one-off) or selection as collector
								(weekly). Please enter only addresses you are authorised to use.
							</p>
						</section>

						<section>
							<h2>9. Your rights</h2>
							<p>
								Under the GDPR you have, among others, rights of access,
								rectification, erasure, restriction of processing, data
								portability, and objection to processing based on legitimate
								interests. To exercise them, contact us at the email stated in the{" "}
								<Link to="/impressum">{t("footer.imprint")}</Link>.
							</p>
							<p>
								You have the right to lodge a complaint with a data protection
								supervisory authority (in Germany: the state authority competent
								for your place of residence).
							</p>
						</section>

						<section>
							<h2>10. Obligation to provide data</h2>
							<p>
								Without an email, login is not possible. Without sufficient
								offer and address details, no listing can be published. Other app
								features are then only available to a limited extent.
							</p>
						</section>

						<section>
							<h2>11. No automated decision-making</h2>
							<p>
								There is no automated decision-making within the meaning of Art.
								22 GDPR that produces legal effects concerning you or similarly
								significantly affects you.
							</p>
						</section>

						<section>
							<h2>12. Changes</h2>
							<p>
								We may update this policy if the service or legal situation
								changes. The version published on this page applies (as-of date
								above).
							</p>
						</section>

						<section>
							<h2>13. Further legal texts</h2>
							<nav
								className="legal-crosslinks"
								aria-label={t("footer.legalNavAria")}
							>
								<Link to="/impressum">{t("footer.imprint")}</Link>
								<Link to="/cookies">{t("footer.cookies")}</Link>
								<Link to="/agb">{t("footer.terms")}</Link>
							</nav>
						</section>
					</>
				) : (
					<>
						<section>
							<h2>1. Verantwortlicher</h2>
							<p>
								Verantwortlich für die Datenverarbeitung ist der in der{" "}
								<Link to="/impressum">Impressum</Link>-Seite genannte
								Diensteanbieter. Kontakt:{" "}
								<a href="mailto:login@hoox.sh">login@hoox.sh</a> (Betreff
								„Datenschutz Pfloop“).
							</p>
						</section>

						<section>
							<h2>2. Überblick: wofür Pfloop Daten braucht</h2>
							<p>
								Pfloop vermittelt <strong>Pfand-Abholungen</strong> zwischen
								Inserenten und Abholern. Dafür sind u. a. Konto, Standortangaben
								und Angebotsinhalte erforderlich. Der Dienst ist derzeit{" "}
								<strong>kostenlos</strong>; es findet keine Zahlungsabwicklung über
								Pfloop statt.
							</p>
						</section>

						<section>
							<h2>3. Welche Daten wir verarbeiten</h2>
							<ul>
								<li>
									<strong>Konto / Login:</strong> E-Mail-Adresse, optional
									Anzeigename; Magic-Link-Tokens (zeitlich begrenzt) und
									Sitzungs-Cookies zur Anmeldung.
								</li>
								<li>
									<strong>Angebote:</strong> Stücklisten / Pfandwert (bzw.
									Schätzung bei wöchentlichen Angeboten), Notizen, Status,
									Zeitstempel.
								</li>
								<li>
									<strong>Standort &amp; Adresse:</strong> Koordinaten (Karte),
									öffentliche Gegend (Stadtteil), volle Adresse – die volle
									Adresse ist nur für den Inserenten und den aktiven bzw.
									ausgewählten Abholer sichtbar.
								</li>
								<li>
									<strong>Abhol- / Bewerbungsdaten:</strong> Annahmen,
									Deadlines, Meldungen „abgeholt“ / Bestätigung, Bewerbungen und
									Nachrichten zu wöchentlichen Angeboten.
								</li>
								<li>
									<strong>Gespeicherte Adressen (Profil):</strong> von dir
									angelegte Adressvorlagen fürs erneute Inserieren.
								</li>
								<li>
									<strong>Technische Protokolle:</strong> IP-Adresse, User-Agent,
									Zeitpunkt und Pfad von Anfragen – typischerweise über den
									Hosting-/CDN-Anbieter (Cloudflare) zur Sicherheit und zum
									Betrieb.
								</li>
							</ul>
						</section>

						<section>
							<h2>4. Zwecke und Rechtsgrundlagen (Art. 6 DSGVO)</h2>
							<ul>
								<li>
									<strong>Vertrag / vorvertragliche Maßnahmen</strong> (Art. 6
									Abs. 1 lit. b): Konto, Angebote, Abholungen, Bewerbungen,
									Adressfreigabe an den Abholer.
								</li>
								<li>
									<strong>Berechtigtes Interesse</strong> (Art. 6 Abs. 1 lit. f):
									Betrieb, Missbrauchs- und Sicherheitsabwehr, Fehleranalyse,
									kurze Server-Logs.
								</li>
								<li>
									<strong>Rechtliche Verpflichtung</strong> (Art. 6 Abs. 1 lit.
									c), soweit Auskunfts- oder Aufbewahrungspflichten greifen.
								</li>
							</ul>
						</section>

						<section>
							<h2>5. Empfänger und Auftragsverarbeitung</h2>
							<p>
								Die App wird auf Infrastruktur von{" "}
								<strong>Cloudflare, Inc.</strong> (u. a. Workers, D1-Datenbank,
								Assets) betrieben. Cloudflare verarbeitet technische
								Verbindungsdaten und die von uns dort gespeicherten
								Anwendungsdaten als Dienstleister / im Rahmen der Hosting-Kette.
								Details: Cloudflare-Datenschutzinformationen.
							</p>
							<p>
								<strong>E-Mail-Versand (Magic-Link):</strong> sofern konfiguriert,
								über einen E-Mail-Dienstleister (z. B. Resend). Es werden
								Empfängeradresse und Link-Inhalt übermittelt.
							</p>
							<p>
								<strong>Kartendarstellung:</strong> Kartenkacheln und
								Geocoding-Dienste Dritter (z. B. OpenStreetMap-Ökosystem) können
								beim Laden der Karte technische Anfragen von deinem Gerät
								empfangen.
							</p>
							<p>Wir verkaufen keine personenbezogenen Daten.</p>
						</section>

						<section>
							<h2>6. Speicherdauer</h2>
							<ul>
								<li>
									<strong>Konto &amp; Angebote:</strong> solange das Konto bzw. das
									Angebot für den Dienst benötigt wird; gelöschte/stornierte
									Inhalte entfallen, soweit keine gesetzlichen Aufbewahrungen
									entgegenstehen.
								</li>
								<li>
									<strong>Magic-Links:</strong> nur kurzzeitig bis Nutzung oder
									Ablauf (typisch ca. 15 Minuten).
								</li>
								<li>
									<strong>Sitzungen:</strong> bis Abmeldung bzw. automatischem
									Ablauf / Bereinigung abgelaufener Sitzungen.
								</li>
								<li>
									<strong>Server-Logs:</strong> so kurz wie für Betrieb und
									Sicherheit üblich (Anbieter-Standard, typischerweise Tage bis
									wenige Wochen).
								</li>
							</ul>
						</section>

						<section>
							<h2>7. Cookies und lokale Speicherung (TTDSG)</h2>
							<p>
								Wir unterscheiden <strong>notwendige</strong> und{" "}
								<strong>optionale</strong> Cookies / Speicher. Optionale Kategorien
								(Präferenzen, Statistik) setzen wir nur mit deiner Einwilligung.
								Details, Kategorien und Steuerung:{" "}
								<Link to="/cookies">Cookie-Richtlinie</Link>.
							</p>
							<ul>
								<li>
									<strong>Notwendig:</strong> u. a. Sitzungs-Cookie nach dem Login
									(ohne sie funktioniert die Anmeldung nicht), Speichern deiner
									Cookie-Wahl, PWA-/Service-Worker-Cache.
								</li>
								<li>
									<strong>Präferenzen (optional):</strong> z. B. Ausblenden des
									Installations-Hinweises.
								</li>
								<li>
									<strong>Statistik (optional):</strong> datenschutzfreundliche
									Messung (z. B. Cloudflare Web Analytics), nur bei Einwilligung
									und wenn konfiguriert – keine Werbeprofile.
								</li>
							</ul>
							<p>
								Es gibt <strong>kein</strong> Marketing-Tracking und keine
								Werbe-Cookies von Dritten über Pfloop. Deine Wahl kannst du jederzeit
								über „Cookie-Einstellungen“ im Fußbereich ändern.
							</p>
						</section>

						<section>
							<h2>8. Standort und Adressdaten – besondere Hinweise</h2>
							<p>
								Koordinaten und Adressen sind für die Vermittlung der Abholung
								erforderlich. Die <strong>genaue Adresse</strong> wird nicht
								öffentlich auf der Karte angezeigt, sondern erst nach Annahme
								(einmalig) bzw. Auswahl als Abholer (wöchentlich). Bitte trage
								nur Adressen ein, zu deren Nutzung du berechtigt bist.
							</p>
						</section>

						<section>
							<h2>9. Deine Rechte</h2>
							<p>
								Du hast nach der DSGVO u. a. Rechte auf Auskunft, Berichtigung,
								Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
								sowie Widerspruch gegen Verarbeitungen auf Basis berechtigter
								Interessen. Zur Ausübung kontaktiere uns unter der im{" "}
								<Link to="/impressum">Impressum</Link> genannten E-Mail.
							</p>
							<p>
								Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
								beschweren (in Deutschland: die für dich örtlich zuständige
								Landesbehörde).
							</p>
						</section>

						<section>
							<h2>10. Pflicht zur Bereitstellung</h2>
							<p>
								Ohne E-Mail ist kein Login möglich. Ohne ausreichende
								Angebots- und Adressangaben kann kein Inserat veröffentlicht
								werden. Andere Funktionen der App sind dann nur eingeschränkt
								nutzbar.
							</p>
						</section>

						<section>
							<h2>11. Keine automatisierte Entscheidungsfindung</h2>
							<p>
								Es findet keine automatisierte Entscheidungsfindung im Sinne von
								Art. 22 DSGVO statt, die dich rechtlich erheblich beeinträchtigt.
							</p>
						</section>

						<section>
							<h2>12. Änderungen</h2>
							<p>
								Wir können diese Erklärung anpassen, wenn sich der Dienst oder
								Rechtslage ändert. Es gilt die auf dieser Seite veröffentlichte
								Fassung (Stand-Datum oben).
							</p>
						</section>

						<section>
							<h2>13. Weitere Rechtstexte</h2>
							<nav
								className="legal-crosslinks"
								aria-label={t("footer.legalNavAria")}
							>
								<Link to="/impressum">{t("footer.imprint")}</Link>
								<Link to="/cookies">{t("footer.cookies")}</Link>
								<Link to="/agb">{t("footer.terms")}</Link>
							</nav>
						</section>
					</>
				)}
			</div>
		</div>
	);
}
