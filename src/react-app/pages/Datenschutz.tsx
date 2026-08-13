import { Link } from "react-router-dom";

const UPDATED = "12.08.2026";

export function Datenschutz() {
	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>Datenschutzerklärung</h1>
				<p className="page-lede muted">
					Informationen zur Verarbeitung personenbezogener Daten bei Nutzung
					von Pfloop (DSGVO / TTDSG).
				</p>
				<p className="legal-updated muted">Stand: {UPDATED}</p>
			</header>

			<div className="legal-body">
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
							<strong>Standort & Adresse:</strong> Koordinaten (Karte),
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
							<strong>Konto & Angebote:</strong> solange das Konto bzw. das
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
					<nav className="legal-crosslinks" aria-label="Weitere Rechtstexte">
						<Link to="/impressum">Impressum</Link>
						<Link to="/cookies">Cookies</Link>
						<Link to="/agb">Nutzungsbedingungen (AGB)</Link>
					</nav>
				</section>
			</div>
		</div>
	);
}
