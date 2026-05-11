import type { Locale } from "./locales.js";

/**
 * Maps bilingual DB/content fields to one string for the active UI locale.
 * - `th`: primary (Thai) value
 * - `en`: prefers secondary (English) when non-empty, otherwise falls back to primary
 *
 * Pair with `locals.locale` / `data.locale` from the language switcher (`?lang=` → `locale` cookie).
 */
export function localizedDualField(
	locale: Locale,
	primaryTh: string,
	secondaryEn: string | null | undefined,
): string {
	if (locale === "th") return primaryTh;
	const en = secondaryEn?.trim();
	return en && en.length > 0 ? en : primaryTh;
}

/** Rows shaped like HR lookup tables (`label_th` / `label_en`). */
export function localizedLookupLabel(
	locale: Locale,
	row: { label_th: string; label_en?: string | null },
): string {
	return localizedDualField(locale, row.label_th, row.label_en ?? null);
}
