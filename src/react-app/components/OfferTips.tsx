// SPDX-FileCopyrightText: 2026 jango-blockchained <op@hoox.sh>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { useT } from "../i18n";
import type { MessageParams } from "../i18n";

type Variant = "create" | "poster" | "collector" | "public";

type Props = {
	/** Who is reading the tips – wording adapts slightly. */
	variant?: Variant;
	/** Compact one-liner + expandable details. Default: full list. */
	compact?: boolean;
};

type TFn = (key: string, params?: MessageParams) => string;

/**
 * Practical tips for one-shot (einmalige) Pfand pickups – who does what.
 */
export function OfferTips({ variant = "public", compact = false }: Props) {
	const t = useT();
	const title =
		variant === "create" || variant === "poster"
			? t("tips.offer.title.create")
			: variant === "collector"
				? t("tips.offer.title.collector")
				: t("tips.offer.title.public");

	const items = tipsFor(variant, t);

	if (compact) {
		const [lead, ...rest] = items;
		return (
			<div className="banner info handover-hint weekly-tips weekly-tips-compact offer-tips">
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
		<div className="banner info handover-hint weekly-tips offer-tips">
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
	if (variant === "create") {
		return [
			t("tips.offer.create.1"),
			t("tips.offer.create.2"),
			t("tips.offer.create.3"),
			t("tips.offer.create.4"),
			t("tips.offer.create.5"),
			t("tips.offer.create.6"),
		];
	}

	if (variant === "poster") {
		return [
			t("tips.offer.poster.1"),
			t("tips.offer.poster.2"),
			t("tips.offer.poster.3"),
			t("tips.offer.poster.4"),
			t("tips.offer.poster.5"),
			t("tips.offer.poster.6"),
		];
	}

	if (variant === "collector") {
		return [
			t("tips.offer.collector.1"),
			t("tips.offer.collector.2"),
			t("tips.offer.collector.3"),
			t("tips.offer.collector.4"),
			t("tips.offer.collector.5"),
			t("tips.offer.collector.6"),
		];
	}

	// public / open listing (browsing before accept)
	return [
		t("tips.offer.public.1"),
		t("tips.offer.public.2"),
		t("tips.offer.public.3"),
		t("tips.offer.public.4"),
		t("tips.offer.public.5"),
	];
}
