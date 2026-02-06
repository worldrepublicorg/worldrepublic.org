import { Suspense } from "react";
import { Dictionary, getDictionary } from "@/app/[lang]/dictionaries";
import { MenuPageSkeleton } from "@/components/menu/menu-page-skeleton";
import { auth } from "@/lib/auth";
import MenuPageClient from "./page-client";

interface MenuPageProps {
  params: Promise<{ lang: string }>;
}

async function MenuPageData({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <MenuPageClient
      lang={lang}
      isAuthenticated={isAuthenticated}
      dictionary={dictionary}
    />
  );
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<MenuPageSkeleton dictionary={dictionary} />}>
      <MenuPageData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
