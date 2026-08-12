import { Link } from "react-router-dom";

const UPDATED = "12.08.2026";

export function Impressum() {
	return (
		<div className="page legal-page">
			<header className="page-header">
				<h1>Impressum</h1>
				<p className="page-lede muted">
					Angaben gemäß § 5 TMG und § 18 MStV.
				</p>
				<p className="legal-updated muted">Stand: {UPDATED}</p>
			</header>

			<div className="legal-body">
				<section>
					<h2>Diensteanbieter</h2>
					<p>
						<strong>GrabMe</strong>
						<br />
						Betrieb / Marke: CryptoLinx
						<br />
						Online-Dienst zur Vermittlung von Pfand-Abholungen
					</p>
					<p>
						Web:{" "}
						<a
							href="https://grabme.cryptolinx.workers.dev"
							target="_blank"
							rel="noopener noreferrer"
						>
							grabme.cryptolinx.workers.dev
						</a>
					</p>
				</section>

				<section>
					<h2>Kontakt</h2>
					<p>
						E-Mail:{" "}
						<a href="mailto:login@hoox.sh">login@hoox.sh</a>
						<br />
						(Login- und allgemeine Anfragen; bitte „GrabMe“ im Betreff
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
				</section>

				<section>
					<h2>Weitere rechtliche Hinweise</h2>
					<nav className="legal-crosslinks" aria-label="Weitere Rechtstexte">
						<Link to="/datenschutz">Datenschutz</Link>
						<Link to="/agb">Nutzungsbedingungen (AGB)</Link>
					</nav>
				</section>
			</div>
		</div>
	);
}
