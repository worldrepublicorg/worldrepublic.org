import { Suspense } from "react";
import { Dictionary, getDictionary, locales } from "@/app/[lang]/dictionaries";
import { FaqPageSkeleton } from "@/components/menu/faq-page-skeleton";
import FaqPageClient from "./page-client";

interface FaqPageProps {
  params: Promise<{ lang: string }>;
}

// This enables Static Site Generation (SSG) for all languages
export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

async function FaqPageData({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  return <FaqPageClient lang={lang} dictionary={dictionary} />;
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<FaqPageSkeleton dictionary={dictionary} />}>
      <FaqPageData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
