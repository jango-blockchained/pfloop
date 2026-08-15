// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		cloudflare(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"favicon.svg",
				"favicon-32.png",
				"logo-mark.svg",
				"logo.svg",
				"apple-touch-icon.png",
			],
			manifest: {
				name: "Pfloop – Pfand abholen",
				short_name: "Pfloop",
				description:
					"Pfand-Angebote in der Nähe finden und selbst einstellen",
				theme_color: "#5B4FE9",
				background_color: "#0f1221",
				display: "standalone",
				orientation: "portrait-primary",
				lang: "de",
				start_url: "/",
				scope: "/",
				categories: ["lifestyle", "utilities"],
				icons: [
					{
						src: "/favicon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any",
					},
					{
						src: "/pwa-192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/pwa-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/pwa-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				navigateFallback: "/index.html",
				// Never cache API responses offline as truth
				navigateFallbackDenylist: [/^\/api\//],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "osm-tiles",
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24 * 7,
							},
						},
					},
					{
						urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
						handler: "NetworkOnly",
					},
				],
			},
			devOptions: {
				enabled: false,
			},
		}),
	],
});
