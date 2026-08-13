import { useLocale } from "../i18n";
import type { Locale } from "../i18n";

const OPTIONS: { value: Locale; shortKey: string; fullKey: string }[] = [
	{ value: "de", shortKey: "lang.de", fullKey: "lang.deFull" },
	{ value: "en", shortKey: "lang.en", fullKey: "lang.enFull" },
];

export function LanguagePicker() {
	const { locale, setLocale, t } = useLocale();

	return (
		<div
			className="lang-picker"
			role="group"
			aria-label={t("nav.languageAria")}
		>
			{OPTIONS.map((opt) => {
				const active = locale === opt.value;
				return (
					<button
						key={opt.value}
						type="button"
						className={`lang-picker-btn${active ? " active" : ""}`}
						aria-pressed={active}
						title={t(opt.fullKey)}
						onClick={() => setLocale(opt.value)}
					>
						{t(opt.shortKey)}
					</button>
				);
			})}
		</div>
	);
}
