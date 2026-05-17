import { Suspense } from "react";
import {
	type Dictionary,
	getDictionary,
	locales,
} from "@/app/[lang]/dictionaries";
import { LanguagePageSkeleton } from "@/components/menu/language/language-page-skeleton";
import LanguagePageClient from "./page-client";

interface LanguagePageProps {
	params: Promise<{ lang: string }>;
}

const languages = [
	{ code: "af", label: "Afrikaans" },
	{ code: "am", label: "አማርኛ (Amharic)" },
	{ code: "ar", label: "العربية (Arabic)" },
	{ code: "az", label: "Azərbaycan (Azerbaijani)" },
	{ code: "bg", label: "Български (Bulgarian)" },
	{ code: "bn", label: "বাংলা (Bengali)" },
	{ code: "bs", label: "Bosanski (Bosnian)" },
	{ code: "my", label: "မြန်မာ (Burmese)" },
	{ code: "cs", label: "Čeština (Czech)" },
	{ code: "co", label: "Corsu (Corsican)" },
	{ code: "zh", label: "中文 (Chinese)" },
	{ code: "nl", label: "Nederlands (Dutch)" },
	{ code: "en", label: "English" },
	{ code: "fi", label: "Suomi (Finnish)" },
	{ code: "fr", label: "Français (French)" },
	{ code: "gu", label: "ગુજરાતી (Gujarati)" },
	{ code: "de", label: "Deutsch (German)" },
	{ code: "el", label: "Ελληνικά (Greek)" },
	{ code: "ha", label: "Hausa" },
	{ code: "hi", label: "हिन्दी (Hindi)" },
	{ code: "hu", label: "Magyar (Hungarian)" },
	{ code: "id", label: "Bahasa Indonesia (Indonesian)" },
	{ code: "it", label: "Italiano (Italian)" },
	{ code: "ja", label: "日本語 (Japanese)" },
	{ code: "ko", label: "한국어 (Korean)" },
	{ code: "km", label: "ភាសាខ្មែរ (Khmer)" },
	{ code: "lt", label: "Lietuvių (Lithuanian)" },
	{ code: "lv", label: "Latviešu (Latvian)" },
	{ code: "ms", label: "Bahasa Melayu (Malay)" },
	{ code: "fa", label: "فارسی (Persian)" },
	{ code: "ps", label: "پښتو (Pashto)" },
	{ code: "pl", label: "Polski (Polish)" },
	{ code: "pt", label: "Português (Portuguese)" },
	{ code: "ro", label: "Română (Romanian)" },
	{ code: "ru", label: "Русский (Russian)" },
	{ code: "rw", label: "Kinyarwanda (Rwandan)" },
	{ code: "sk", label: "Slovenčina (Slovak)" },
	{ code: "sl", label: "Slovenščina (Slovenian)" },
	{ code: "sr", label: "Српски (Serbian)" },
	{ code: "so", label: "Soomaali (Somali)" },
	{ code: "sw", label: "Kiswahili (Swahili)" },
	{ code: "es", label: "Español (Spanish)" },
	{ code: "th", label: "ภาษาไทย (Thai)" },
	{ code: "tl", label: "Filipino (Filipino)" },
	{ code: "tr", label: "Türkçe (Turkish)" },
	{ code: "uk", label: "Українська (Ukrainian)" },
	{ code: "ur", label: "اردو (Urdu)" },
	{ code: "uz", label: "Oʻzbek (Uzbek)" },
	{ code: "vi", label: "Tiếng Việt (Vietnamese)" },
	{ code: "yo", label: "Yorùbá (Yoruba)" },
].sort((a, b) => {
	return a.label.localeCompare(b.label);
});

// This enables Static Site Generation (SSG) for all languages
export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

async function LanguagePageData({
	lang,
	dictionary,
}: {
	lang: string;
	dictionary: Dictionary;
}) {
	return (
		<LanguagePageClient
			lang={lang}
			dictionary={dictionary}
			languages={languages}
		/>
	);
}

export default async function LanguagePage({ params }: LanguagePageProps) {
	const { lang } = await params;
	const dictionary = await getDictionary(lang);

	return (
		<Suspense
			fallback={
				<LanguagePageSkeleton
					dictionary={dictionary}
					languages={languages}
					currentLang={lang}
				/>
			}
		>
			<LanguagePageData lang={lang} dictionary={dictionary} />
		</Suspense>
	);
}
