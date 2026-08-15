// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useEffect, useState } from "react";
import { useT } from "../i18n";

export function OfflineBanner() {
	const t = useT();
	const [offline, setOffline] = useState(
		typeof navigator !== "undefined" ? !navigator.onLine : false,
	);

	useEffect(() => {
		const goOffline = () => setOffline(true);
		const goOnline = () => setOffline(false);
		window.addEventListener("offline", goOffline);
		window.addEventListener("online", goOnline);
		return () => {
			window.removeEventListener("offline", goOffline);
			window.removeEventListener("online", goOnline);
		};
	}, []);

	if (!offline) return null;

	return (
		<div
			className="offline-banner"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<span className="offline-banner-icon" aria-hidden="true">
				!
			</span>
			<span className="offline-banner-body">
				<span className="offline-banner-text">{t("offline.banner")}</span>
			</span>
		</div>
	);
}
