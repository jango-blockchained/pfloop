// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useEffect, useState } from "react";
import { t } from "../i18n/translate";

/** Berlin center — sensible default when permission denied or unavailable. */
export const DEFAULT_MAP_CENTER: [number, number] = [52.52, 13.405];

export type GeoPermission = "prompt" | "granted" | "denied" | "unsupported";

/** User position when available; falls back to Berlin. */
export function useGeolocation(): {
	center: [number, number];
	ready: boolean;
	error: string | null;
	/** Whether we used a real GPS fix (false = default city). */
	fromUser: boolean;
	permission: GeoPermission;
} {
	const [center, setCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fromUser, setFromUser] = useState(false);
	const [permission, setPermission] = useState<GeoPermission>("prompt");

	useEffect(() => {
		let cancelled = false;

		function finishFallback(message: string, perm: GeoPermission) {
			if (cancelled) return;
			setCenter(DEFAULT_MAP_CENTER);
			setFromUser(false);
			setPermission(perm);
			setError(message);
			setReady(true);
		}

		if (!navigator.geolocation) {
			finishFallback(t("geo.unsupported"), "unsupported");
			return;
		}

		// Best-effort permission query (not all browsers expose geolocation here)
		if (navigator.permissions?.query) {
			void navigator.permissions
				.query({ name: "geolocation" as PermissionName })
				.then((status) => {
					if (cancelled) return;
					if (status.state === "granted") setPermission("granted");
					else if (status.state === "denied") setPermission("denied");
					else setPermission("prompt");
				})
				.catch(() => {
					/* ignore */
				});
		}

		// maximumAge: 0 — avoid a stale/coarse network location (wrong city)
		// as the first map center. Prefer a quick GPS-ish fix; fall back to Berlin.
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				if (cancelled) return;
				// Extremely coarse first fix (often ISP city) → keep Berlin + banner
				// so the user isn't teleported to a random city; ◎ can refine.
				const acc = pos.coords.accuracy;
				if (Number.isFinite(acc) && acc > 25_000) {
					finishFallback(t("geo.coarse"), "granted");
					return;
				}
				setCenter([pos.coords.latitude, pos.coords.longitude]);
				setFromUser(true);
				setPermission("granted");
				setError(null);
				setReady(true);
			},
			(err) => {
				let message = t("geo.unknown");
				let perm: GeoPermission = "prompt";
				if (err.code === err.PERMISSION_DENIED) {
					message = t("geo.denied");
					perm = "denied";
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					message = t("geo.unavailable");
				} else if (err.code === err.TIMEOUT) {
					message = t("geo.timeout");
				}
				finishFallback(message, perm);
			},
			{ enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
		);

		return () => {
			cancelled = true;
		};
	}, []);

	return { center, ready, error, fromUser, permission };
}
