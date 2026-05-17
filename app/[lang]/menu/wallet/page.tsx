import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import WalletPageClient from "./page-client";

// This enables Static Site Generation (SSG) for all languages
export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

export default async function WalletPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const dictionary = await getDictionary(lang);

	return <WalletPageClient lang={lang} dictionary={dictionary} />;
}
