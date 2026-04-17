import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Dictionary, getDictionary, locales } from "@/app/[lang]/dictionaries";
import { GovernPageSkeleton } from "@/components/vote/govern-page-skeleton";
import { getElections } from "@/lib/actions/elections";
import type { Election } from "@/lib/types/elections";
import VotePageClient from "./page-client";

// Cache elections list for 60 seconds
const getCachedElections = unstable_cache(
  async () => {
    return await getElections();
  },
  ["elections-list"],
  { revalidate: 60, tags: ["elections-list"] },
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
      <VotePageClient
        elections={elections}
        dictionary={dictionary}
        lang={lang}
      />
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
    <Suspense fallback={<GovernPageSkeleton />}>
      <VoteData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
