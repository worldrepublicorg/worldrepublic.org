import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import AccountPageClient from "./page-client";

export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

export default async function AccountPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const dictionary = await getDictionary(lang);

	return <AccountPageClient lang={lang} dictionary={dictionary} />;
}
