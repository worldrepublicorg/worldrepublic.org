"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiChartBarHorizontalFill } from "react-icons/pi";
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
function pickHeroElection(elections: Election[]): Election {
  const now = Date.now();

  const active = elections.filter(
    (e) => now >= e.startsAt && now <= e.endsAt,
  );
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

  // 0 elections — empty state
  if (elections.length === 0) {
    return (
      <div className="mt-4 mb-8 text-center text-sm text-gray-500">
        No elections found
      </div>
    );
  }

  // 1 election — centered homepage-style layout
  if (elections.length === 1) {
    const election = elections[0];
    const isActive = now >= election.startsAt && now <= election.endsAt;

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    return (
      <div className="flex grow items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex w-full flex-col items-center gap-4">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <PiChartBarHorizontalFill className="h-10 w-10 text-gray-400" />
            </div>
            <Typography variant="heading" level={2}>
              {election.name}
            </Typography>
            <Typography
              variant="subtitle"
              level={2}
              className="text-gray-500"
            >
              {formatDate(election.startsAt)} - {formatDate(election.endsAt)}
            </Typography>
            <Link
              href={`/${lang}/vote/elections/${election.id}`}
              className="w-full"
            >
              <Button fullWidth className="mt-6!">
                {isActive ? "Vote now" : "View details"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2+ elections — hero card on top + remaining cards below
  const heroElection = pickHeroElection(elections);
  const remaining = elections.filter((e) => e.id !== heroElection.id);

  // Group the remaining elections
  const upcomingElections = remaining.filter((e) => now < e.startsAt);
  const activeElections = remaining.filter(
    (e) => now >= e.startsAt && now <= e.endsAt,
  );
  const endedElections = remaining.filter((e) => now > e.endsAt);

  return (
    <div className="flex flex-col pb-24">
      {/* Hero card for the most important election */}
      <ElectionHeroCard election={heroElection} lang={lang} />

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
