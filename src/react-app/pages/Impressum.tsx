// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { Link } from "react-router-dom";
import { useLocale } from "../i18n";

const UPDATED = "15.08.2026";

export function Impressum() {
	const { locale, t } = useLocale();
	const en = locale === "en";

	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>{t("footer.imprint")}</h1>
				<p className="page-lede muted">
					{en
						? "Information pursuant to § 5 TMG and § 18 MStV (German Telemedia Act / Interstate Media Treaty)."
						: "Angaben gemäß § 5 TMG und § 18 MStV."}
				</p>
				<p className="legal-updated muted">
					{t("legal.asOf", { date: UPDATED })}
				</p>
			</header>

			<div className="legal-body">
				{en ? (
					<>
						<section>
							<h2>Service provider</h2>
							<p>
								<strong>Pfloop</strong>
								<br />
								Operated by: jango-blockchained
								<br />
								Online service for arranging deposit (Pfand) collections
							</p>
							<p>
								Web:{" "}
								<a
									href="https://pfloop.cryptolinx.workers.dev"
									target="_blank"
									rel="noopener noreferrer"
								>
									pfloop.cryptolinx.workers.dev
								</a>
							</p>
						</section>

						<section>
							<h2>Contact</h2>
							<p>
								Email:{" "}
								<a href="mailto:op@hoox.sh">op@hoox.sh</a>
								<br />
								(Login and general enquiries; please include “Pfloop” in the
								subject line)
							</p>
							<p className="muted small">
								A serviceable postal address will be provided promptly on
								request where required for asserting claims and is not yet
								published.
							</p>
						</section>

						<section>
							<h2>Responsible for content</h2>
							<p>
								Responsible under § 18 (2) MStV: the service provider named
								above (contact by email).
							</p>
						</section>

						<section>
							<h2>EU dispute resolution</h2>
							<p>
								The European Commission provides a platform for online dispute
								resolution (ODR):{" "}
								<a
									href="https://ec.europa.eu/consumers/odr/"
									target="_blank"
									rel="noopener noreferrer"
								>
									ec.europa.eu/consumers/odr
								</a>
								.
							</p>
							<p>
								We are neither obliged nor willing to participate in dispute
								resolution proceedings before a consumer arbitration board,
								unless required by law.
							</p>
						</section>

						<section>
							<h2>Liability for content</h2>
							<p>
								As a service provider we are responsible for our own content on
								these pages under general law pursuant to § 7 (1) TMG. Under
								§§ 8 to 10 TMG we are not obliged to monitor transmitted or
								stored third-party information or to investigate circumstances
								indicating illegal activity.
							</p>
							<p>
								Obligations to remove or block the use of information under
								general law remain unaffected. Liability in this regard is only
								possible from the time we become aware of a specific legal
								infringement. Upon becoming aware of such infringements, we will
								remove the content promptly.
							</p>
						</section>

						<section>
							<h2>Liability for links</h2>
							<p>
								Our offering contains links to external third-party websites
								over whose content we have no control. Therefore we cannot
								assume any liability for that third-party content. The
								respective provider or operator of the linked pages is always
								responsible for their content. At the time of linking, no legal
								violations were apparent.
							</p>
						</section>

						<section>
							<h2>Copyright</h2>
							<p>
								Content and works created by the site operators on these pages
								are subject to German copyright law. Contributions by third
								parties (e.g. offer descriptions) remain attributed to the
								respective user. Reproduction, editing, distribution, and any
								kind of exploitation beyond the limits of copyright require the
								written consent of the respective author or creator.
							</p>
							<p>
								The Pfloop source code is licensed under the{" "}
								<a
									href="https://polyformproject.org/licenses/noncommercial/1.0.0"
									target="_blank"
									rel="noopener noreferrer"
								>
									PolyForm Noncommercial License 1.0.0
								</a>
								: free for noncommercial use, not for commercial use. Commercial
								licensing:{" "}
								<a href="mailto:op@hoox.sh">op@hoox.sh</a>.
							</p>
						</section>

						<section>
							<h2>Further legal notices</h2>
							<nav
								className="legal-crosslinks"
								aria-label={t("footer.legalNavAria")}
							>
								<Link to="/datenschutz">{t("footer.privacy")}</Link>
								<Link to="/cookies">{t("footer.cookies")}</Link>
								<Link to="/agb">{t("footer.terms")}</Link>
							</nav>
						</section>
					</>
				) : (
					<>
						<section>
							<h2>Diensteanbieter</h2>
							<p>
								<strong>Pfloop</strong>
								<br />
								Betrieb: jango-blockchained
								<br />
								Online-Dienst zur Vermittlung von Pfand-Abholungen
							</p>
							<p>
								Web:{" "}
								<a
									href="https://pfloop.cryptolinx.workers.dev"
									target="_blank"
									rel="noopener noreferrer"
								>
									pfloop.cryptolinx.workers.dev
								</a>
							</p>
						</section>

						<section>
							<h2>Kontakt</h2>
							<p>
								E-Mail:{" "}
								<a href="mailto:op@hoox.sh">op@hoox.sh</a>
								<br />
								(Login- und allgemeine Anfragen; bitte „Pfloop“ im Betreff
								angeben)
							</p>
							<p className="muted small">
								Eine ladungsfähige Postanschrift wird auf Anfrage unverzüglich
								mitgeteilt, soweit sie für die Geltendmachung von Ansprüchen
								erforderlich ist und noch nicht veröffentlicht ist.
							</p>
						</section>

						<section>
							<h2>Verantwortlich für den Inhalt</h2>
							<p>
								Verantwortlich nach § 18 Abs. 2 MStV: der oben genannte
								Diensteanbieter (Kontakt per E-Mail).
							</p>
						</section>

						<section>
							<h2>EU-Streitbeilegung</h2>
							<p>
								Die Europäische Kommission stellt eine Plattform zur
								Online-Streitbeilegung (OS) bereit:{" "}
								<a
									href="https://ec.europa.eu/consumers/odr/"
									target="_blank"
									rel="noopener noreferrer"
								>
									ec.europa.eu/consumers/odr
								</a>
								.
							</p>
							<p>
								Wir sind nicht verpflichtet und nicht bereit, an
								Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
								teilzunehmen, soweit nicht gesetzlich anders vorgeschrieben.
							</p>
						</section>

						<section>
							<h2>Haftung für Inhalte</h2>
							<p>
								Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene
								Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
								verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
								Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
								gespeicherte fremde Informationen zu überwachen oder nach
								Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
								hinweisen.
							</p>
							<p>
								Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
								Informationen nach den allgemeinen Gesetzen bleiben hiervon
								unberührt. Eine diesbezügliche Haftung ist erst ab dem Zeitpunkt
								der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
								Bekanntwerden von entsprechenden Rechtsverletzungen werden wir
								diese Inhalte umgehend entfernen.
							</p>
						</section>

						<section>
							<h2>Haftung für Links</h2>
							<p>
								Unser Angebot enthält Links zu externen Websites Dritter, auf
								deren Inhalte wir keinen Einfluss haben. Deshalb können wir für
								diese fremden Inhalte auch keine Gewähr übernehmen. Für die
								Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
								oder Betreiber der Seiten verantwortlich. Zum Zeitpunkt der
								Verlinkung waren keine Rechtsverstöße ersichtlich.
							</p>
						</section>

						<section>
							<h2>Urheberrecht</h2>
							<p>
								Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
								diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge
								Dritter (z. B. Angebotsbeschreibungen) bleiben dem jeweiligen
								Nutzer zugeordnet. Vervielfältigung, Bearbeitung, Verbreitung und
								jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
								bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw.
								Erstellers.
							</p>
							<p>
								Der Quellcode von Pfloop steht unter der{" "}
								<a
									href="https://polyformproject.org/licenses/noncommercial/1.0.0"
									target="_blank"
									rel="noopener noreferrer"
								>
									PolyForm Noncommercial License 1.0.0
								</a>
								: kostenlos für nicht-kommerzielle Nutzung, nicht für
								kommerzielle Nutzung. Kommerzielle Lizenz:{" "}
								<a href="mailto:op@hoox.sh">op@hoox.sh</a>.
							</p>
						</section>

						<section>
							<h2>Weitere rechtliche Hinweise</h2>
							<nav
								className="legal-crosslinks"
								aria-label={t("footer.legalNavAria")}
							>
								<Link to="/datenschutz">{t("footer.privacy")}</Link>
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
