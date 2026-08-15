// SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

import { centsToEuro } from "../lib/api";
import type { OfferItemDto } from "../lib/pfand-ui";
import { labelForItemType } from "../lib/pfand-ui";
import { useT } from "../i18n";

type Props = {
	items: OfferItemDto[];
	/** Optional total to show under the list (defaults to sum of lines). */
	showTotal?: boolean;
};

export function PfandItemsList({ items, showTotal = true }: Props) {
	const t = useT();

	if (!items.length) {
		return (
			<p className="pfand-items pfand-items-empty muted small">
				{t("pfand.list.empty")}
			</p>
		);
	}

	const totalCents = items.reduce((sum, i) => sum + (i.line_cents || 0), 0);

	return (
		<div className="pfand-items">
			<ul className="pfand-breakdown">
				{items.map((item) => {
					const label = labelForItemType(item.item_type);
					return (
						<li
							key={`${item.item_type}-${item.quantity}-${item.unit_cents}`}
							className="pfand-item"
						>
							<span className="pfand-item-main">
								<span className="pfand-item-qty">{item.quantity}×</span>{" "}
								<strong className="pfand-item-label">{label}</strong>
								<span className="pfand-item-unit muted small">
									{" "}
									{t("pfand.list.unit", {
										unit: centsToEuro(item.unit_cents),
									})}
								</span>
							</span>
							<span className="pfand-item-line">
								{centsToEuro(item.line_cents)} €
							</span>
						</li>
					);
				})}
			</ul>
			{showTotal && items.length > 1 && (
				<p className="pfand-items-total muted small">
					<span className="pfand-items-total-label">
						{t("pfand.list.totalLabel")}
					</span>{" "}
					<strong className="pfand-items-total-value">
						{centsToEuro(totalCents)} €
					</strong>
				</p>
			)}
		</div>
	);
}
