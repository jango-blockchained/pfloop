import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { fetchMe, logout as apiLogout, type AuthUser } from "./api";

type AuthState = {
	user: AuthUser | null;
	loading: boolean;
	/** Last auth/session load error (null if ok or not yet loaded). */
	error: string | null;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			const data = await fetchMe();
			setUser(data.user);
			setError(null);
		} catch (e) {
			setUser(null);
			setError(
				e instanceof Error && e.message
					? e.message
					: "Sitzung konnte nicht geladen werden",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} catch {
			// Clear local session even if the network call fails.
		} finally {
			setUser(null);
			setError(null);
		}
	}, []);

	const value = useMemo(
		() => ({ user, loading, error, refresh, logout }),
		[user, loading, error, refresh, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}
