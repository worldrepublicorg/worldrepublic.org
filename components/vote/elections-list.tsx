"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { ElectionCard } from "@/components/vote/election-card";
import { ElectionHeroCard } from "@/components/vote/election-hero-card";
import type { Election } from "@/lib/types/elections";

interface ElectionsListProps {
  elections: Election[];
  lang: string;
}

/**
 * Pick the most important election for the hero card.
 * Priority: active > soonest upcoming > most recently ended.
 */
function pickHeroElection(elections: Election[]): Election | null {
  if (elections.length === 0) return null;

  const now = Date.now();

  const active = elections.filter((e) => now >= e.startsAt && now <= e.endsAt);
  if (active.length > 0) {
    // Pick the one ending soonest
    return active.sort((a, b) => a.endsAt - b.endsAt)[0];
  }

  const upcoming = elections.filter((e) => now < e.startsAt);
  if (upcoming.length > 0) {
    // Pick the one starting soonest
    return upcoming.sort((a, b) => a.startsAt - b.startsAt)[0];
  }

  // All ended — pick the most recently ended
  return elections.sort((a, b) => b.endsAt - a.endsAt)[0];
}

export function ElectionsList({ elections, lang }: ElectionsListProps) {
  const now = Date.now();

  // Empty state
  if (elections.length === 0) {
    return (
      <div className="mt-4 mb-8 text-center text-sm text-gray-500">
        No elections found
      </div>
    );
  }

  // Hero card layout for all cases
  const heroElection = pickHeroElection(elections);
  const remaining = heroElection
    ? elections.filter((e) => e.id !== heroElection.id)
    : [];

  // Group the remaining elections
  const upcomingElections = remaining.filter((e) => now < e.startsAt);
  const activeElections = remaining.filter(
    (e) => now >= e.startsAt && now <= e.endsAt,
  );
  const endedElections = remaining.filter((e) => now > e.endsAt);

  return (
    <div className="flex flex-col pb-24">
      {/* Hero card for the most important election */}
      {heroElection && <ElectionHeroCard election={heroElection} lang={lang} />}

      {/* Active Elections Section (excluding hero) */}
      {activeElections.length > 0 && (
        <div className="mb-6">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold mb-3!"
          >
            Active elections
          </Typography>
          <div className="flex flex-col">
            {activeElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                lang={lang}
                isLastItem={index === activeElections.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Elections Section */}
      {upcomingElections.length > 0 && (
        <div className="mb-6">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold mb-3!"
          >
            Upcoming elections
          </Typography>
          <div className="flex flex-col">
            {upcomingElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                lang={lang}
                isLastItem={index === upcomingElections.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previous Elections Section */}
      {endedElections.length > 0 && (
        <div className="mb-6">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold mb-3!"
          >
            Previous elections
          </Typography>
          <div className="flex flex-col">
            {endedElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                lang={lang}
                isLastItem={index === endedElections.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
