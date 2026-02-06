import { Suspense } from "react";
import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { TopBar } from "@/components/topbar";
import { VotePageSkeleton } from "@/components/vote/vote-page-skeleton";
import { getElections } from "@/lib/actions/elections";
import type { Election } from "@/lib/types/elections";
import { VotePageClient } from "./page-client";

function pickFeaturedElection(elections: Election[]): Election | null {
  if (elections.length === 0) return null;

  const now = Date.now();

  const active = elections.filter(
    (election) => now >= election.startsAt && now <= election.endsAt,
  );
  if (active.length > 0) {
    return active.sort((a, b) => a.endsAt - b.endsAt)[0];
  }

  const upcoming = elections.filter((election) => now < election.startsAt);
  if (upcoming.length > 0) {
    return upcoming.sort((a, b) => a.startsAt - b.startsAt)[0];
  }

  return elections.sort((a, b) => b.endsAt - a.endsAt)[0];
}

// This enables Static Site Generation (SSG) for all languages
export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const elections = await getElections();
  const featuredElection = pickFeaturedElection(elections);
  const featuredElectionId = featuredElection?.id;

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.nav.world_republic}
        endAdornment={<MenuLink lang={lang} />}
      />
      {/* Suspense is required when using useSearchParams in a Client Component
          embedded in a statically generated page */}
      <Suspense
        fallback={<VotePageSkeleton dictionary={dictionary} lang={lang} />}
      >
        <VotePageClient
          lang={lang}
          dictionary={dictionary}
          featuredElectionId={featuredElectionId}
        />
      </Suspense>
    </div>
  );
}
