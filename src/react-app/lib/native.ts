/**
 * Capacitor native shell helpers (no-ops on web).
 * Safe to import from the web app — dynamic import keeps the web bundle lean.
 */

export async function initNativeShell(): Promise<void> {
	try {
		const { Capacitor } = await import("@capacitor/core");
		if (!Capacitor.isNativePlatform()) return;

		const [{ StatusBar, Style }, { SplashScreen }, { App }] =
			await Promise.all([
				import("@capacitor/status-bar"),
				import("@capacitor/splash-screen"),
				import("@capacitor/app"),
			]);

		await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
		await StatusBar.setBackgroundColor({ color: "#0f172a" }).catch(() => {});
		await SplashScreen.hide().catch(() => {});

		// Magic-link / external https URLs that open the app (Android App Links)
		App.addListener("appUrlOpen", ({ url }) => {
			try {
				const parsed = new URL(url);
				const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
				if (path && path !== window.location.pathname + window.location.search) {
					window.location.assign(path);
				}
			} catch {
				// ignore malformed deep links
			}
		});
	} catch {
		// Capacitor not available (pure web build)
	}
}
