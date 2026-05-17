import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { trackUnsupportedLanguage } from "./lib/actions/analytics";
import { DOCUMENT_LANG_HEADER, defaultLocale, locales } from "./lib/locales";

function documentLocaleFromPathname(pathname: string): string {
	const segment = pathname.split("/").filter(Boolean)[0];
	if (segment && (locales as readonly string[]).includes(segment)) {
		return segment;
	}
	return defaultLocale;
}

// Helper function to validate if a string is a valid BCP 47 locale
function isValidLocale(locale: string): boolean {
	try {
		// Skip quality values, wildcards, and other non-locale strings
		if (locale === "*" || locale.startsWith("q=") || locale.includes(";")) {
			return false;
		}

		// Basic BCP 47 format validation: language[-script][-region]
		// Language: 2-3 letters (ISO 639-1 or ISO 639-2)
		// Script: 4 letters (ISO 15924)
		// Region: 2-3 letters (ISO 3166-1 or UN M.49)
		const localeRegex = /^[a-z]{2,3}(-[A-Z]{4})?(-[A-Z]{2,3})?$/;
		return localeRegex.test(locale);
	} catch {
		return false;
	}
}

function getLocale(request: NextRequest): string {
	// Check for stored preference in cookie
	const preferredLanguage = request.cookies.get("preferredLanguage")?.value;
	if (
		preferredLanguage &&
		(locales as readonly string[]).includes(preferredLanguage)
	) {
		return preferredLanguage;
	}

	const negotiatorHeaders: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		negotiatorHeaders[key] = value;
	});

	try {
		const languages = new Negotiator({
			headers: negotiatorHeaders,
		}).languages();

		// Log all languages for debugging (only in development)
		if (process.env.NODE_ENV === "development") {
			console.log("All languages from negotiator:", languages);
		}

		// Filter out invalid locales and ensure we have valid ones
		const validLanguages = languages.filter((lang) => {
			try {
				// Use our robust locale validation
				const isValid =
					lang &&
					typeof lang === "string" &&
					lang.length > 0 &&
					isValidLocale(lang);

				return isValid;
			} catch {
				return false;
			}
		});

		// If no valid languages, return default
		if (!validLanguages.length) {
			return defaultLocale;
		}

		const matchedLocale = match(
			validLanguages,
			locales as readonly string[],
			defaultLocale,
		);

		// Track unsupported language requests
		if (matchedLocale === defaultLocale && validLanguages.length > 0) {
			// Get the most preferred unsupported language
			const mostPreferredUnsupported = validLanguages.find(
				(lang) => !(locales as readonly string[]).includes(lang),
			);

			if (mostPreferredUnsupported) {
				// Normalize to primary language code (first two characters)
				const primaryLanguage = mostPreferredUnsupported
					.substring(0, 2)
					.toLowerCase();

				// Only track if the primary language isn't supported
				if (!(locales as readonly string[]).includes(primaryLanguage)) {
					// Track the request asynchronously (don't block the redirect)
					trackUnsupportedLanguage(primaryLanguage);
				}
			}
		}

		return matchedLocale;
	} catch (error) {
		console.error("Error in locale matching:", error);
		// Track that an error occurred during locale matching
		trackUnsupportedLanguage("error");
		return defaultLocale;
	}
}

export function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Skip if the request is for an asset or API route
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api/") ||
		pathname.includes(".")
	) {
		return;
	}

	// Check if the pathname is missing a locale
	const pathnameIsMissingLocale = (locales as readonly string[]).every(
		(locale) =>
			!pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
	);

	// Redirect if there is no locale
	if (pathnameIsMissingLocale) {
		const locale = getLocale(request);
		// Redirect root path directly to root [lang] page
		const targetPath =
			pathname === "/" ? `/${locale}/` : `/${locale}${pathname}`;
		const newUrl = new URL(targetPath, request.url);

		// Preserve all query parameters
		request.nextUrl.searchParams.forEach((value, key) => {
			newUrl.searchParams.set(key, value);
		});

		return NextResponse.redirect(newUrl);
	}

	const documentLocale = documentLocaleFromPathname(pathname);
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(DOCUMENT_LANG_HEADER, documentLocale);
	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}

export const config = {
	matcher: [
		// Skip all internal paths (_next)
		"/((?!_next|api|.*\\.).*)",
		// Optional: Match all root level pages
		"/",
	],
};
