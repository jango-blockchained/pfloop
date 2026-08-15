// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "../i18n";
import {
	PREF_INSTALL_DISMISS_KEY,
	persistPreference,
	readPreference,
} from "../lib/cookie-consent";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
	const t = useT();
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
		// Only honor dismiss when preferences consent allows storage
		if (readPreference(PREF_INSTALL_DISMISS_KEY) === "1") return;
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
		// Only persists if preferences consent is granted
		persistPreference(PREF_INSTALL_DISMISS_KEY, "1");
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
					{t("install.title")}
				</strong>
				<p id={descId} className="install-desc muted small">
					{t("install.desc")}
				</p>
			</div>
			<div className="install-actions">
				<button
					type="button"
					className="btn btn-sm install-action-dismiss"
					onClick={dismiss}
					disabled={installing}
				>
					{t("install.later")}
				</button>
				<button
					ref={primaryRef}
					type="button"
					className={`btn btn-sm btn-primary install-action-primary${installing ? " is-loading" : ""}`}
					onClick={install}
					disabled={installing}
					aria-busy={installing}
				>
					{t("install.action")}
				</button>
			</div>
		</div>
	);
}
