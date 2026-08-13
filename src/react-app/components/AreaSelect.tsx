import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type MouseEvent,
} from "react";
import { filterAreaGroups } from "../../shared/areas";
import { useT } from "../i18n";

type Props = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	disabled?: boolean;
	/** Shown when empty */
	placeholder?: string;
	"aria-invalid"?: boolean;
	className?: string;
};

type FlatOption = { group: string; value: string };

/**
 * Searchable Stadtteil / Gegend picker (combobox).
 * Value must be a catalog entry (validated server-side via isPublicArea).
 */
export function AreaSelect({
	id,
	value,
	onChange,
	required = false,
	disabled = false,
	placeholder,
	"aria-invalid": ariaInvalid,
	className,
}: Props) {
	const t = useT();
	const autoId = useId();
	const inputId = id ?? `area-${autoId}`;
	const listboxId = `${inputId}-listbox`;
	const rootRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [highlight, setHighlight] = useState(0);

	// When closed, show the selected value; when open, show search query
	const display = open ? query : value;

	const filtered = useMemo(
		() => filterAreaGroups(open ? query : ""),
		[open, query],
	);

	const flat: FlatOption[] = useMemo(() => {
		const rows: FlatOption[] = [];
		for (const g of filtered) {
			for (const opt of g.options) {
				rows.push({ group: g.group, value: opt });
			}
		}
		return rows;
	}, [filtered]);

	useEffect(() => {
		if (highlight >= flat.length) setHighlight(0);
	}, [flat.length, highlight]);

	useEffect(() => {
		if (!open || !listRef.current) return;
		const el = listRef.current.querySelector<HTMLElement>(
			`[data-index="${highlight}"]`,
		);
		el?.scrollIntoView({ block: "nearest" });
	}, [highlight, open]);

	const close = useCallback(() => {
		setOpen(false);
		setQuery("");
		setHighlight(0);
	}, []);

	const select = useCallback(
		(v: string) => {
			onChange(v);
			close();
		},
		[onChange, close],
	);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e: Event) => {
			if (!rootRef.current?.contains(e.target as Node)) close();
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open, close]);

	const openList = () => {
		if (disabled) return;
		setOpen(true);
		setQuery("");
		const all = filterAreaGroups("");
		let idx = 0;
		let i = 0;
		outer: for (const g of all) {
			for (const opt of g.options) {
				if (opt === value) {
					idx = i;
					break outer;
				}
				i++;
			}
		}
		setHighlight(idx);
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (disabled) return;

		if (
			!open &&
			(e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
		) {
			e.preventDefault();
			openList();
			return;
		}

		if (!open) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlight((h) => (flat.length ? (h + 1) % flat.length : 0));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlight((h) =>
				flat.length ? (h - 1 + flat.length) % flat.length : 0,
			);
		} else if (e.key === "Home") {
			e.preventDefault();
			setHighlight(0);
		} else if (e.key === "End") {
			e.preventDefault();
			setHighlight(flat.length > 0 ? flat.length - 1 : 0);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const hit = flat[highlight];
			if (hit) select(hit.value);
		} else if (e.key === "Escape") {
			e.preventDefault();
			close();
			inputRef.current?.blur();
		} else if (e.key === "Tab") {
			close();
		}
	};

	const clear = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onChange("");
		setQuery("");
		setOpen(true);
		inputRef.current?.focus();
	};

	let running = 0;
	const groupsWithIndex = filtered.map((g) => ({
		group: g.group,
		options: g.options.map((opt) => {
			const idx = running++;
			return { opt, idx };
		}),
	}));

	return (
		<div
			ref={rootRef}
			className={`area-select${className ? ` ${className}` : ""}${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}
		>
			<input
				type="text"
				value={value}
				required={required}
				onChange={() => {}}
				tabIndex={-1}
				aria-hidden
				className="area-select-native"
			/>
			<div className="area-select-control">
				<input
					ref={inputRef}
					id={inputId}
					type="search"
					role="combobox"
					className="area-select-input"
					value={display}
					disabled={disabled}
					placeholder={placeholder ?? t("area.placeholder")}
					autoComplete="off"
					autoCorrect="off"
					spellCheck={false}
					aria-invalid={ariaInvalid}
					aria-expanded={open}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={
						open && flat[highlight]
							? `${listboxId}-opt-${highlight}`
							: undefined
					}
					onFocus={() => {
						if (!disabled) openList();
					}}
					onClick={() => {
						if (!open) openList();
					}}
					onChange={(e) => {
						setQuery(e.target.value);
						if (!open) setOpen(true);
						setHighlight(0);
					}}
					onKeyDown={onKeyDown}
				/>
				{value && !disabled && (
					<button
						type="button"
						className="area-select-clear"
						aria-label={t("area.clearAria")}
						onMouseDown={clear}
					>
						×
					</button>
				)}
				<span className="area-select-chevron" aria-hidden>
					▾
				</span>
			</div>

			{open && (
				<ul
					ref={listRef}
					id={listboxId}
					role="listbox"
					className="area-select-list"
					aria-label={t("area.listAria")}
				>
					{flat.length === 0 && (
						<li className="area-select-empty" role="presentation">
							{t("area.empty")}
						</li>
					)}
					{groupsWithIndex.map((g) => (
						<li
							key={g.group}
							role="presentation"
							className="area-select-group"
						>
							<div className="area-select-group-label">{g.group}</div>
							<ul
								role="group"
								aria-label={g.group}
								className="area-select-group-list"
							>
								{g.options.map(({ opt, idx }) => {
									const active = idx === highlight;
									const selected = opt === value;
									return (
										<li
											key={opt}
											id={`${listboxId}-opt-${idx}`}
											role="option"
											data-index={idx}
											aria-selected={selected || active}
											className={`area-select-option${active ? " is-active" : ""}${selected ? " is-selected" : ""}`}
											onMouseEnter={() => setHighlight(idx)}
											onMouseDown={(e) => {
												e.preventDefault();
												select(opt);
											}}
										>
											{opt}
										</li>
									);
								})}
							</ul>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
