import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import ElectionDetailPageClient from "./page-client";

export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

export default async function ElectionDetailPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const dictionary = await getDictionary(lang);

	return <ElectionDetailPageClient lang={lang} dictionary={dictionary} />;
}
