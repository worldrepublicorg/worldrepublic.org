import { headers } from "next/headers";
import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import { getBrandingForHost } from "@/lib/branding";
import HomePageClient from "./page-client";

export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

export default async function HomePage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const requestHeaders = await headers();
	const host =
		requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const branding = getBrandingForHost(host);
	const dictionary = await getDictionary(lang);

	return (
		<HomePageClient
			lang={lang}
			dictionary={dictionary}
			isRaisedByHumanityBrand={branding.appName === "Raised by Humanity"}
		/>
	);
}
