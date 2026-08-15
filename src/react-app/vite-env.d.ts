/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

interface ImportMetaEnv {
	/** Optional Cloudflare Web Analytics token — loaded only with analytics consent. */
	readonly VITE_CF_WEB_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
