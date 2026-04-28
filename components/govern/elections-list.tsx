"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ElectionCard } from "@/components/govern/election-card";
import { ElectionHeroCard } from "@/components/govern/election-hero-card";
import type { Election } from "@/lib/types/elections";

interface ElectionsListProps {
  elections: Election[];
  lang: string;
  dictionary: Dictionary;
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

export function ElectionsList({
  elections,
  lang,
  dictionary,
}: ElectionsListProps) {
  const now = Date.now();

  // Empty state
  if (elections.length === 0) {
    return (
      <div className="mt-4 mb-8 text-center text-sm text-gray-500">
        {dictionary.pages.govern.elections.list.empty_state}
      </div>
    );
  }

  // Hero card layout for all cases
  const heroElection = pickHeroElection(elections);
  const remaining = heroElection
    ? elections.filter((e) => e.id !== heroElection.id)
    : [];

  // Group the remaining elections (soonest first for upcoming)
  const upcomingElections = remaining
    .filter((e) => now < e.startsAt)
    .sort((a, b) => a.startsAt - b.startsAt);
  const activeElections = remaining.filter(
    (e) => now >= e.startsAt && now <= e.endsAt,
  );
  const endedElections = remaining.filter((e) => now > e.endsAt);

  return (
    <div className="flex flex-col">
      {/* Hero card for the most important election */}
      {heroElection && (
        <ElectionHeroCard
          election={heroElection}
          lang={lang}
          dictionary={dictionary}
        />
      )}

      {/* Active Elections Section (excluding hero) */}
      {activeElections.length > 0 && (
        <div className="mb-6">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold mb-3!"
          >
            {dictionary.pages.govern.elections.list.active_section}
          </Typography>
          <div className="flex flex-col">
            {activeElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                lang={lang}
                dictionary={dictionary}
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
            {dictionary.pages.govern.elections.list.upcoming_section}
          </Typography>
          <div className="flex flex-col">
            {upcomingElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                lang={lang}
                dictionary={dictionary}
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
            {dictionary.pages.govern.elections.list.previous_section}
          </Typography>
          <div className="flex flex-col">
            {endedElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                lang={lang}
                dictionary={dictionary}
                isLastItem={index === endedElections.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
