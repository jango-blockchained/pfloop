/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	/** Optional Cloudflare Web Analytics token — loaded only with analytics consent. */
	readonly VITE_CF_WEB_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
