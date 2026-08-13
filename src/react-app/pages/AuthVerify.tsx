import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useT } from "../i18n";
import { getErrorMessage, verifyMagicLink } from "../lib/api";
import { useAuth } from "../lib/auth-context";

type Phase = "loading" | "success" | "error";

export function AuthVerify() {
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const { refresh } = useAuth();
	const t = useT();
	const [phase, setPhase] = useState<Phase>("loading");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		function friendlyVerifyError(raw: string): string {
			const lower = raw.toLowerCase();
			if (
				lower.includes("expir") ||
				lower.includes("abgelaufen") ||
				lower.includes("gültig") ||
				lower.includes("invalid") ||
				lower.includes("ungültig") ||
				lower.includes("used") ||
				lower.includes("bereits")
			) {
				return t("authVerify.expired");
			}
			if (
				lower.includes("token") ||
				lower.includes("missing") ||
				lower.includes("fehlt")
			) {
				return t("authVerify.missingToken");
			}
			return raw;
		}

		const token = params.get("token");
		if (!token) {
			setPhase("error");
			setError(t("authVerify.noToken"));
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				await verifyMagicLink(token);
				await refresh();
				if (cancelled) return;
				setPhase("success");
				window.setTimeout(() => {
					if (!cancelled) navigate("/", { replace: true });
				}, 600);
			} catch (e) {
				if (cancelled) return;
				const raw = getErrorMessage(e, t("authVerify.failed"));
				setError(friendlyVerifyError(raw));
				setPhase("error");
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [params, navigate, refresh, t]);

	return (
		<div className="page auth-page auth-verify-page">
			<header className="page-header">
				<h1>
					{phase === "error"
						? t("authVerify.failed")
						: phase === "success"
							? t("authVerify.successTitle")
							: t("common.loadingMoment")}
				</h1>
			</header>

			{phase === "loading" && (
				<div className="auth-verify-status" role="status" aria-live="polite">
					<p className="muted">{t("authVerify.checking")}</p>
					<p className="muted small">{t("authVerify.checkingHint")}</p>
				</div>
			)}

			{phase === "success" && (
				<div className="banner info auth-feedback">
					<strong>{t("authVerify.successBody")}</strong>
					<br />
					{t("authVerify.redirect")}
				</div>
			)}

			{phase === "error" && error && (
				<div className="auth-verify-error">
					<p className="banner error auth-feedback">{error}</p>
					<div className="actions sticky-actions action-stack">
						<Link className="btn btn-primary" to="/login">
							{t("authVerify.newLink")}
						</Link>
						<Link className="btn" to="/">
							{t("common.toMap")}
						</Link>
					</div>
					<p className="muted small auth-footnote">{t("authVerify.tip")}</p>
				</div>
			)}
		</div>
	);
}
