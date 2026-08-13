import { Link } from "react-router-dom";
import { COOKIE_CATEGORIES, openCookiePreferences } from "../lib/cookie-consent";

const UPDATED = "12.08.2026";

export function Cookies() {
	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>Cookie-Richtlinie</h1>
				<p className="page-lede muted">
					Informationen zu Cookies und vergleichbaren Technologien (EU-ePrivacy /
					TTDSG / DSGVO) bei Pfloop.
				</p>
				<p className="legal-updated muted">Stand: {UPDATED}</p>
			</header>

			<div className="legal-body">
				<section>
					<h2>1. Was sind Cookies und ähnliche Technologien?</h2>
					<p>
						Neben HTTP-Cookies nutzt Pfloop ggf. lokalen Browser-Speicher
						(localStorage) und den Service Worker der Progressive Web App
						(PWA). Diese Richtlinie gilt für alle diese Speicherarten. Wir
						setzen <strong>keine</strong> Werbe- oder Marketing-Tracker ein und
						verkaufen keine Profile.
					</p>
				</section>

				<section>
					<h2>2. Kategorien</h2>
					{COOKIE_CATEGORIES.map((cat) => (
						<div key={cat.id} className="cookie-policy-cat">
							<h3>
								{cat.label}
								{cat.required ? " (immer aktiv)" : " (optional)"}
							</h3>
							<p>{cat.description}</p>
							<ul>
								{cat.examples.map((ex) => (
									<li key={ex}>{ex}</li>
								))}
							</ul>
						</div>
					))}
				</section>

				<section>
					<h2>3. Rechtsgrundlagen</h2>
					<ul>
						<li>
							<strong>Notwendig:</strong> Bereitstellung des von dir
							gewünschten Dienstes / berechtigtes Interesse (Art. 6 Abs. 1 lit.
							b und f DSGVO) sowie Ausnahme für unbedingt erforderliche
							Speicherzugriffe nach ePrivacy / TTDSG.
						</li>
						<li>
							<strong>Präferenzen &amp; Statistik:</strong> Einwilligung (Art. 6
							Abs. 1 lit. a DSGVO; Einwilligung für nicht notwendige
							Speicherzugriffe).
						</li>
					</ul>
				</section>

				<section>
					<h2>4. Speicherdauer</h2>
					<ul>
						<li>
							<strong>Einwilligung:</strong> bis du sie änderst oder
							Browserdaten löschst.
						</li>
						<li>
							<strong>Sitzungs-Cookie (Login):</strong> begrenzte Gültigkeit
							(typisch mehrere Tage), endet mit Abmeldung oder Ablauf.
						</li>
						<li>
							<strong>Präferenz-Keys:</strong> bis Widerruf der Präferenzen
							oder manuelles Löschen.
						</li>
						<li>
							<strong>Statistik:</strong> nach Anbieter (z. B. Cloudflare Web
							Analytics), nur wenn freigegeben und konfiguriert.
						</li>
					</ul>
				</section>

				<section>
					<h2>5. Deine Wahl steuern</h2>
					<p>
						Beim ersten Besuch erscheint ein Banner. Du kannst jederzeit deine
						Auswahl anpassen:
					</p>
					<p>
						<button
							type="button"
							className="btn btn-primary btn-sm"
							onClick={() => openCookiePreferences()}
						>
							Cookie-Einstellungen öffnen
						</button>
					</p>
					<p className="muted small">
						Link auch im Seitenfuß: „Cookie-Einstellungen“.
					</p>
				</section>

				<section>
					<h2>6. Drittanbieter</h2>
					<p>
						<strong>Cloudflare</strong> hostet die App und kann
						verbindungsbezogene Logs führen. Optionale Web Analytics laden wir
						nur bei erteilter Statistik-Einwilligung und nur, wenn ein Token
						konfiguriert ist.
					</p>
					<p>
						<strong>Karten / Geocoding</strong> (z. B. OpenStreetMap-Kacheln)
						können beim Anzeigen der Karte technische Anfragen von deinem Gerät
						auslösen – das ist für die Kartendarstellung erforderlich.
					</p>
				</section>

				<section>
					<h2>7. Weitere Informationen</h2>
					<nav className="legal-crosslinks" aria-label="Weitere Rechtstexte">
						<Link to="/datenschutz">Datenschutz</Link>
						<Link to="/impressum">Impressum</Link>
						<Link to="/agb">AGB</Link>
					</nav>
				</section>
			</div>
		</div>
	);
}
