import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import MenuPageClient from "./page-client";

export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

export default async function MenuPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const dictionary = await getDictionary(lang);

	return <MenuPageClient lang={lang} dictionary={dictionary} />;
}
