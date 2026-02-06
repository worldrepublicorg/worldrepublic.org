"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
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
}: PartyVoteListProps) {
  if (parties.length === 0) {
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
        {parties.map((party) => (
          <div
            key={party.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex-1 min-w-0">
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
            </div>
            <VoteButton
              electionId={electionId}
              partyId={party.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
