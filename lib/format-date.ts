import { getSafeLocale } from "@/lib/locale";

/**
 * Format an election date (date only) in the given locale.
 * Uses the app language for locale-aware formatting (order, month names, etc.).
 */
export function formatElectionDate(timestamp: number, lang: string): string {
  const locale = getSafeLocale(lang);
  return new Date(timestamp).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an election date and time in the given locale.
 * Uses the app language and the user's local timezone.
 */
export function formatElectionDateTime(
  timestamp: number,
  lang: string,
): string {
  const locale = getSafeLocale(lang);
  return new Date(timestamp).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
