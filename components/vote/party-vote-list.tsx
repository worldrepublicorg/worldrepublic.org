"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useMemo } from "react";
import { PiUserFocus } from "react-icons/pi";
import { VoteButton } from "@/components/vote/vote-button";
import type { Party } from "@/lib/types/parties";

interface PartyVoteListProps {
  parties: Party[];
  electionId: string;
  lang: string;
}

export function PartyVoteList({
  parties,
  electionId,
  lang,
}: PartyVoteListProps) {
  const shuffledParties = useMemo(() => {
    const copy = [...parties];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [parties]);

  if (shuffledParties.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-6 text-center">
        <Typography variant="body" level={3} className="text-gray-500">
          No parties available for this election.
        </Typography>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
        <Typography variant="subtitle" level={3} className="text-gray-900">
          Choose a party
        </Typography>
      </div>

      <div className="divide-y divide-gray-100">
        {shuffledParties.map((party) => (
          <div
            key={party.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <Link
              href={`/${lang}/parties/${party.id}`}
              className="flex-1 min-w-0"
            >
              <Typography
                variant="subtitle"
                level={3}
                className="text-gray-900 truncate"
              >
                {party.name}
              </Typography>
              <div className="flex items-center gap-1 mt-1">
                <PiUserFocus className="size-3.5 text-gray-400 shrink-0" />
                <Typography
                  variant="body"
                  level={4}
                  className="text-gray-500 truncate"
                >
                  {party.leaderUsername}
                </Typography>
              </div>
            </Link>
            <VoteButton
              electionId={electionId}
              partyId={party.id}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
