import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Dictionary, getDictionary, locales } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { TopBar } from "@/components/topbar";
import { VotePageSkeleton } from "@/components/vote/vote-page-skeleton";
import { getElections } from "@/lib/actions/elections";
import type { Election } from "@/lib/types/elections";
import VotePageClient from "./page-client";

// Cache elections list for 60 seconds
const getCachedElections = unstable_cache(
  async () => {
    return await getElections();
  },
  ["elections-list"],
  { revalidate: 86400, tags: ["elections-list"] },
);

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

async function VoteData({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  const elections: Election[] = await getCachedElections();

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.nav.world_republic}
        endAdornment={<MenuLink lang={lang} />}
      />
      <VotePageClient elections={elections} dictionary={dictionary} lang={lang} />
    </div>
  );
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<VotePageSkeleton />}>
      <VoteData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
