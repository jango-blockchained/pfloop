// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Link } from "react-router-dom";
import { useLocale } from "../i18n";
import {
	getCookieCategories,
	openCookiePreferences,
} from "../lib/cookie-consent";

const UPDATED = "12.08.2026";

export function Cookies() {
	const { locale, t } = useLocale();
	const en = locale === "en";
	const categories = getCookieCategories();

	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>{en ? "Cookie policy" : "Cookie-Richtlinie"}</h1>
				<p className="page-lede muted">
					{en
						? "Information on cookies and similar technologies (EU ePrivacy / TTDSG / GDPR) at Pfloop."
						: "Informationen zu Cookies und vergleichbaren Technologien (EU-ePrivacy / TTDSG / DSGVO) bei Pfloop."}
				</p>
				<p className="legal-updated muted">
					{t("legal.asOf", { date: UPDATED })}
				</p>
			</header>

			<div className="legal-body">
				{en ? (
					<>
						<section>
							<h2>1. What are cookies and similar technologies?</h2>
							<p>
								Besides HTTP cookies, Pfloop may use local browser storage
								(localStorage) and the Progressive Web App (PWA) service worker.
								This policy covers all of these storage types. We do{" "}
								<strong>not</strong> use advertising or marketing trackers and do
								not sell profiles.
							</p>
						</section>

						<section>
							<h2>2. Categories</h2>
							{categories.map((cat) => (
								<div key={cat.id} className="cookie-policy-cat">
									<h3>
										{cat.label}
										{cat.required ? " (always on)" : " (optional)"}
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
							<h2>3. Legal bases</h2>
							<ul>
								<li>
									<strong>Necessary:</strong> providing the service you
									requested / legitimate interest (Art. 6 (1) lit. b and f GDPR)
									and the exception for strictly necessary storage access under
									ePrivacy / TTDSG.
								</li>
								<li>
									<strong>Preferences &amp; analytics:</strong> consent (Art. 6
									(1) lit. a GDPR; consent for non-essential storage access).
								</li>
							</ul>
						</section>

						<section>
							<h2>4. Retention</h2>
							<ul>
								<li>
									<strong>Consent:</strong> until you change it or clear browser
									data.
								</li>
								<li>
									<strong>Session cookie (login):</strong> limited validity
									(typically several days), ends on sign-out or expiry.
								</li>
								<li>
									<strong>Preference keys:</strong> until withdrawal of
									preferences or manual deletion.
								</li>
								<li>
									<strong>Analytics:</strong> per provider (e.g. Cloudflare Web
									Analytics), only if allowed and configured.
								</li>
							</ul>
						</section>

						<section>
							<h2>5. Control your choice</h2>
							<p>
								A banner appears on your first visit. You can adjust your
								selection anytime:
							</p>
							<p>
								<button
									type="button"
									className="btn btn-primary btn-sm"
									onClick={() => openCookiePreferences()}
								>
									{t("footer.cookieSettings")}
								</button>
							</p>
							<p className="muted small">
								Also linked in the site footer: “{t("footer.cookieSettings")}”.
							</p>
						</section>

						<section>
							<h2>6. Third parties</h2>
							<p>
								<strong>Cloudflare</strong> hosts the app and may keep
								connection-related logs. Optional Web Analytics load only with
								analytics consent and only if a token is configured.
							</p>
							<p>
								<strong>Maps / geocoding</strong> (e.g. OpenStreetMap tiles) may
								trigger technical requests from your device when the map is shown
								– this is required for map display.
							</p>
						</section>

						<section>
							<h2>7. Further information</h2>
							<nav
								className="legal-crosslinks"
								aria-label={t("footer.legalNavAria")}
							>
								<Link to="/datenschutz">{t("footer.privacy")}</Link>
								<Link to="/impressum">{t("footer.imprint")}</Link>
								<Link to="/agb">{t("footer.terms")}</Link>
							</nav>
						</section>
					</>
				) : (
					<>
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
							{categories.map((cat) => (
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
									{t("footer.cookieSettings")}
								</button>
							</p>
							<p className="muted small">
								Link auch im Seitenfuß: „{t("footer.cookieSettings")}“.
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
							<nav
								className="legal-crosslinks"
								aria-label={t("footer.legalNavAria")}
							>
								<Link to="/datenschutz">{t("footer.privacy")}</Link>
								<Link to="/impressum">{t("footer.imprint")}</Link>
								<Link to="/agb">{t("footer.terms")}</Link>
							</nav>
						</section>
					</>
				)}
			</div>
		</div>
	);
}
