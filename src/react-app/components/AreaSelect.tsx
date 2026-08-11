import { PUBLIC_AREA_GROUPS } from "../../shared/areas";

type Props = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	disabled?: boolean;
	/** Show empty first option */
	placeholder?: string;
	"aria-invalid"?: boolean;
	className?: string;
};

/**
 * Predefined public Stadtteil / Gegend for map visibility (address_hint).
 */
export function AreaSelect({
	id,
	value,
	onChange,
	required = false,
	disabled = false,
	placeholder = "— Stadtteil / Gegend wählen —",
	"aria-invalid": ariaInvalid,
	className,
}: Props) {
	return (
		<select
			id={id}
			className={className}
			value={value}
			required={required}
			disabled={disabled}
			aria-invalid={ariaInvalid}
			onChange={(e) => onChange(e.target.value)}
		>
			<option value="">{placeholder}</option>
			{PUBLIC_AREA_GROUPS.map((g) => (
				<optgroup key={g.group} label={g.group}>
					{g.options.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</optgroup>
			))}
		</select>
	);
}
