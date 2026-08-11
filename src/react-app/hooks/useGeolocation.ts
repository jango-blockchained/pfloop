import { useEffect, useState } from "react";

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
			finishFallback(
				"Standort geht hier nicht – wir zeigen Berlin",
				"unsupported",
			);
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

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				if (cancelled) return;
				setCenter([pos.coords.latitude, pos.coords.longitude]);
				setFromUser(true);
				setPermission("granted");
				setError(null);
				setReady(true);
			},
			(err) => {
				let message = "Standort unklar – wir zeigen erstmal Berlin";
				let perm: GeoPermission = "prompt";
				if (err.code === err.PERMISSION_DENIED) {
					message =
						"Standort blockiert – wir zeigen Berlin. Du kannst ihn später freigeben oder suchen.";
					perm = "denied";
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					message = "Standort nicht gefunden – wir zeigen Berlin";
				} else if (err.code === err.TIMEOUT) {
					message = "Standort dauert zu lange – wir zeigen Berlin";
				}
				finishFallback(message, perm);
			},
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
		);

		return () => {
			cancelled = true;
		};
	}, []);

	return { center, ready, error, fromUser, permission };
}
