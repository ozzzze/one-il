export const SUPPORTED_LOCALES = ["en", "th"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | null | undefined): value is Locale {
	return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getLocaleFromAcceptLanguage(header: string | null): Locale {
	if (!header) return DEFAULT_LOCALE;

	const lowered = header.toLowerCase();
	if (lowered.includes("th")) return "th";
	if (lowered.includes("en")) return "en";

	return DEFAULT_LOCALE;
}

export function resolveRequestLocale(params: {
	cookieLocale: string | null | undefined;
	acceptLanguage: string | null;
}): Locale {
	if (isLocale(params.cookieLocale)) {
		return params.cookieLocale;
	}

	return getLocaleFromAcceptLanguage(params.acceptLanguage);
}
