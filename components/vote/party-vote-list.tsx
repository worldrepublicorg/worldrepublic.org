"use client";

import { Input, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState<string>("");

  const shuffledParties = useMemo(() => {
    const copy = [...parties];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [parties]);

  // Filter parties based on search term
  const filteredParties = useMemo(() => {
    if (searchTerm.trim() === "") {
      return shuffledParties;
    }
    return shuffledParties.filter(
      (party) =>
        party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (party.leaderUsername
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false),
    );
  }, [shuffledParties, searchTerm]);

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
    <div className="w-full overflow-x-hidden">
      <Typography
        variant="subtitle"
        level={1}
        className="mb-3! text-[19px] font-semibold"
      >
        Choose a party
      </Typography>

      {/* Search bar */}
      <div className="mb-5 h-12.5">
        <Input
          type="text"
          startAdornment={
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          }
          label="Search parties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Parties list */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {filteredParties.length === 0 ? (
          <div className="mt-12 mb-8 p-6 text-center text-sm text-gray-500">
            No parties found matching your search.
          </div>
        ) : (
          <div className="flex flex-col gap-7 p-4 divide-y divide-gray-100">
            {filteredParties.map((party) => (
              <div
                key={party.id}
                className="flex items-center justify-between gap-4"
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
        )}
      </div>
    </div>
  );
}
