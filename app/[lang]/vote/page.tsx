import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { TopBar } from "@/components/topbar";
import {
  VotingPartyList,
  type VotingPartyListProps,
} from "@/components/vote/voting-party-list";
import type { Election } from "@/lib/actions/elections";
import { getActiveElection } from "@/lib/actions/elections";
import { getParties } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";

// Cache active election for 60 seconds
const getCachedActiveElection = unstable_cache(
  async () => getActiveElection(),
  ["active-election"],
  { revalidate: 60, tags: ["active-election"] },
);

// Reuse parties cache from parties page (same tag)
const getCachedParties = unstable_cache(
  async () => {
    const parties = await getParties({ limit: 1000 });
    if (parties === null) {
      throw new Error("Failed to fetch parties");
    }
    return parties;
  },
  ["parties-list"],
  { revalidate: 60, tags: ["parties-list"] },
);

async function VoteData({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  let election: Election | null = null;
  let parties: Party[] = [];

  try {
    const [activeElection, partiesList] = await Promise.all([
      getCachedActiveElection(),
      getCachedParties(),
    ]);
    election = activeElection;
    parties = partiesList;
  } catch (error) {
    const errorDetails = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      lang,
    };
    console.error(
      "[VotePage] Error fetching vote data:",
      JSON.stringify(errorDetails, null, 2),
    );
  }

  const listProps: VotingPartyListProps = {
    dictionary,
    lang,
    initialElection: election,
    initialParties: parties,
  };
  return <VotingPartyList {...listProps} />;
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.common.vote}
        endAdornment={<MenuLink lang={lang} />}
      />
      <Suspense
        fallback={
          <div className="flex grow items-center justify-center">
            {dictionary.common.loading}
          </div>
        }
      >
        <VoteData lang={lang} dictionary={dictionary} />
      </Suspense>
    </div>
  );
}
