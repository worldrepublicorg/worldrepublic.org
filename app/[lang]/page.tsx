import { getDictionary, locales } from "@/app/[lang]/dictionaries";
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
  const dictionary = await getDictionary(lang);

  return <HomePageClient lang={lang} dictionary={dictionary} />;
}
