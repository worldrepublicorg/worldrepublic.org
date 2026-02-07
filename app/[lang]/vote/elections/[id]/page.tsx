import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { ElectionDetailPageSkeleton } from "@/components/vote/election-detail-page-skeleton";
import { getElection, getElectionResults } from "@/lib/actions/elections";
import { getParties } from "@/lib/actions/parties";
import type { Election, ElectionResult } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";
import ElectionDetailPageClient from "./page-client";

const getCachedElection = unstable_cache(
  async (id: string) => {
    return await getElection(id);
  },
  ["election-detail"],
  { revalidate: 60, tags: ["election-detail"] },
);

const getCachedResults = unstable_cache(
  async (id: string) => {
    return await getElectionResults(id);
  },
  ["election-results"],
  { revalidate: 60, tags: ["election-results"] },
);

const getCachedParties = unstable_cache(
  async () => {
    return await getParties();
  },
  ["parties-list"],
  { revalidate: 60, tags: ["parties-list"] },
);

async function ElectionDetailData({
  id,
  lang,
  dictionary,
}: {
  id: string;
  lang: string;
  dictionary: Dictionary;
}) {
  const election: Election | null = await getCachedElection(id);

  if (!election) {
    return (
      <ElectionDetailPageClient
        election={null}
        parties={[]}
        results={[]}
        lang={lang}
        dictionary={dictionary}
      />
    );
  }

  const now = Date.now();
  const isEnded = now > election.endsAt;

  let electionParties: Party[] = [];
  let results: ElectionResult[] = [];

  if (isEnded) {
    results = await getCachedResults(id);
  } else {
    const partiesResult = await getCachedParties();
    electionParties = partiesResult ?? [];
  }

  return (
    <ElectionDetailPageClient
      election={election}
      parties={electionParties}
      results={results}
      lang={lang}
      dictionary={dictionary}
    />
  );
}

export default async function ElectionDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<ElectionDetailPageSkeleton dictionary={dictionary} />}>
      <ElectionDetailData id={id} lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
