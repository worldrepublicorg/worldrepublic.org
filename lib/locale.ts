const DEFAULT_LOCALE = "en";

/**
 * Normalize possibly invalid locale strings for Intl APIs.
 * Falls back to "en" for unsupported or malformed locale input.
 */
export function getSafeLocale(locale: string | null | undefined): string {
	const candidate = locale?.trim();
	if (!candidate) return DEFAULT_LOCALE;

	try {
		const [canonical] = Intl.getCanonicalLocales(candidate);
		return canonical || DEFAULT_LOCALE;
	} catch {
		return DEFAULT_LOCALE;
	}
}
