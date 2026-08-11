import { centsToEuro } from "../lib/api";
import type { OfferItemDto } from "../lib/pfand-ui";
import { getPfandEntry, isPfandItemType } from "../../shared/pfand";

type Props = {
	items: OfferItemDto[];
	/** Optional total to show under the list (defaults to sum of lines). */
	showTotal?: boolean;
};

export function PfandItemsList({ items, showTotal = true }: Props) {
	if (!items.length) {
		return (
			<p className="pfand-items pfand-items-empty muted small">
				Keine Stückliste angegeben.
			</p>
		);
	}

	const totalCents = items.reduce((sum, i) => sum + (i.line_cents || 0), 0);

	return (
		<div className="pfand-items">
			<ul className="pfand-breakdown">
				{items.map((item) => {
					const label = isPfandItemType(item.item_type)
						? getPfandEntry(item.item_type).label
						: item.item_type;
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
									à {centsToEuro(item.unit_cents)} €
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
					<span className="pfand-items-total-label">Zusammen:</span>{" "}
					<strong className="pfand-items-total-value">
						{centsToEuro(totalCents)} €
					</strong>
				</p>
			)}
		</div>
	);
}
