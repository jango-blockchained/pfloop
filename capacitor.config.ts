// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shells for Pfloop (Android + iOS via Capacitor).
 *
 * Default: load the live production origin so magic-link cookies, /api, and
 * the PWA stay same-origin (HttpOnly session works in the WebView).
 *
 * Bundled offline shell (no remote URL):
 *   CAP_SERVER_URL= npm run android:sync   # or ios:sync
 * (API/auth then need same-origin or extra CORS cookie work — prefer remote.)
 *
 * Local Worker while developing:
 *   CAP_SERVER_URL=http://10.0.2.2:5173 npm run android:sync  # Android emulator → host
 *   CAP_SERVER_URL=http://localhost:5173 npm run ios:sync     # iOS Simulator → host
 */
const remoteUrl = (process.env.CAP_SERVER_URL ??
	"https://pfloop.cryptolinx.workers.dev").trim();

const config: CapacitorConfig = {
	appId: "dev.cryptolinx.grabme",
	appName: "Pfloop",
	// Cloudflare/Vite client build output (see wrangler assets.directory)
	webDir: "dist/client",
	android: {
		allowMixedContent: false,
		backgroundColor: "#0f1221",
	},
	ios: {
		// Matches production HTTPS scheme; content from server.url
		scheme: "Pfloop",
		contentInset: "automatic",
		backgroundColor: "#0f1221",
		// Preferred for remote URL + cookies
		allowsLinkPreview: false,
		scrollEnabled: true,
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 1200,
			launchAutoHide: true,
			backgroundColor: "#0f1221",
			showSpinner: false,
			androidScaleType: "CENTER_CROP",
		},
		StatusBar: {
			style: "DARK",
			backgroundColor: "#0f1221",
		},
	},
	server: {
		androidScheme: "https",
		iosScheme: "https",
		// Allow deep links / magic-link redirects on our origin
		allowNavigation: [
			"pfloop.cryptolinx.workers.dev",
			"*.cryptolinx.workers.dev",
		],
		...(remoteUrl
			? {
					url: remoteUrl,
					cleartext: remoteUrl.startsWith("http://"),
				}
			: {}),
	},
};

export default config;
