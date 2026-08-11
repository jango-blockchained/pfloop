import { useEffect, useId, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "grabme_install_dismissed";

export function InstallPrompt() {
	const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
		null,
	);
	const [visible, setVisible] = useState(false);
	const [installing, setInstalling] = useState(false);
	const titleId = useId();
	const descId = useId();
	const primaryRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (localStorage.getItem(DISMISS_KEY) === "1") return;
		// Already standalone
		if (
			window.matchMedia("(display-mode: standalone)").matches ||
			// iOS Safari
			("standalone" in navigator &&
				(navigator as Navigator & { standalone?: boolean }).standalone)
		) {
			return;
		}

		const onBip = (e: Event) => {
			e.preventDefault();
			setDeferred(e as BeforeInstallPromptEvent);
			setVisible(true);
		};
		window.addEventListener("beforeinstallprompt", onBip);
		return () => window.removeEventListener("beforeinstallprompt", onBip);
	}, []);

	useEffect(() => {
		if (visible && primaryRef.current) {
			primaryRef.current.focus();
		}
	}, [visible]);

	if (!visible || !deferred) return null;

	const dismiss = () => {
		localStorage.setItem(DISMISS_KEY, "1");
		setVisible(false);
	};

	const install = () => {
		void (async () => {
			setInstalling(true);
			try {
				await deferred.prompt();
				await deferred.userChoice;
			} finally {
				setVisible(false);
				setDeferred(null);
				setInstalling(false);
			}
		})();
	};

	return (
		<div
			className="install-banner"
			role="dialog"
			aria-modal="false"
			aria-labelledby={titleId}
			aria-describedby={descId}
		>
			<span className="install-icon" aria-hidden="true">
				↓
			</span>
			<div className="install-copy">
				<strong id={titleId} className="install-title">
					GrabMe aufs Handy legen?
				</strong>
				<p id={descId} className="install-desc muted small">
					Als App auf dem Homescreen – schneller Start, und die Oberfläche geht
					auch offline.
				</p>
			</div>
			<div className="install-actions">
				<button
					type="button"
					className="btn btn-sm install-action-dismiss"
					onClick={dismiss}
					disabled={installing}
				>
					Später
				</button>
				<button
					ref={primaryRef}
					type="button"
					className={`btn btn-sm btn-primary install-action-primary${installing ? " is-loading" : ""}`}
					onClick={install}
					disabled={installing}
					aria-busy={installing}
				>
					Installieren
				</button>
			</div>
		</div>
	);
}
