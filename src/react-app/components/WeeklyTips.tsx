import { useT } from "../i18n";
import type { MessageParams } from "../i18n";

type Variant = "create" | "poster" | "collector" | "applicant" | "public";

type Props = {
	/** Who is reading the tips – wording adapts slightly. */
	variant?: Variant;
	/** Compact one-liner + expandable details. Default: full list. */
	compact?: boolean;
};

type TFn = (key: string, params?: MessageParams) => string;

/**
 * Practical tips for weekly (recurring) Pfand pickups.
 */
export function WeeklyTips({ variant = "public", compact = false }: Props) {
	const t = useT();
	const title =
		variant === "create" || variant === "poster"
			? t("tips.weekly.title.create")
			: variant === "collector"
				? t("tips.weekly.title.collector")
				: t("tips.weekly.title.public");

	const items = tipsFor(variant, t);

	if (compact) {
		const [lead, ...rest] = items;
		return (
			<div className="banner info handover-hint weekly-tips weekly-tips-compact">
				<strong className="weekly-tips-title">{title}</strong>
				<p className="weekly-tips-lead muted small">{lead}</p>
				{rest.length > 0 && (
					<details className="weekly-tips-more">
						<summary className="weekly-tips-more-summary">
							{t("tips.more")}
						</summary>
						<ul className="weekly-tips-list">
							{rest.map((tip) => (
								<li key={tip} className="weekly-tips-item">
									{tip}
								</li>
							))}
						</ul>
					</details>
				)}
			</div>
		);
	}

	return (
		<div className="banner info handover-hint weekly-tips">
			<strong className="weekly-tips-title">{title}</strong>
			<ul className="weekly-tips-list">
				{items.map((tip) => (
					<li key={tip} className="weekly-tips-item">
						{tip}
					</li>
				))}
			</ul>
		</div>
	);
}

function tipsFor(variant: Variant, t: TFn): string[] {
	if (variant === "create" || variant === "poster") {
		// Preserve previous order (note tip before confirm rule)
		return [
			t("tips.weekly.create.1"),
			t("tips.weekly.readyTime"),
			t("tips.weekly.outside"),
			t("tips.weekly.rhythm"),
			t("tips.weekly.create.6"),
			t("tips.weekly.confirm"),
		];
	}

	if (variant === "collector") {
		return [
			t("tips.weekly.collector.1"),
			t("tips.weekly.collector.2"),
			t("tips.weekly.collector.3"),
			t("tips.weekly.collector.4"),
			t("tips.weekly.collector.5"),
		];
	}

	if (variant === "applicant") {
		return [
			t("tips.weekly.public.1"),
			t("tips.weekly.public.2"),
			t("tips.weekly.public.3"),
			t("tips.weekly.public.4"),
			t("tips.weekly.public.5"),
		];
	}

	// public / open listing — previous compact set (not full public.1–5)
	return [
		t("tips.weekly.estimate"),
		t("tips.weekly.rhythm"),
		t("tips.weekly.readyTime"),
		t("tips.weekly.outside"),
		t("tips.weekly.confirm"),
	];
}
