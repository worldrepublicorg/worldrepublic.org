"use client";

import { Input, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PiUserFocus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { VoteButton } from "@/components/vote/vote-button";
import { getParties } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";

interface PartyVoteListProps {
  parties: Party[];
  electionId: string;
  lang: string;
  dictionary: Dictionary;
}

const SEARCH_DEBOUNCE_MS = 300;

export function PartyVoteList({
  parties,
  electionId,
  lang,
  dictionary,
}: PartyVoteListProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Party[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTermRef = useRef(searchTerm);
  searchTermRef.current = searchTerm;

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === "") {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await getParties({
          search: trimmed,
          limit: 50,
        });
        if (searchTermRef.current.trim() === trimmed) {
          setSearchResults(results ?? []);
        }
      } catch {
        if (searchTermRef.current.trim() === trimmed) {
          setSearchResults([]);
        }
      } finally {
        if (searchTermRef.current.trim() === trimmed) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const isSearchActive = searchTerm.trim() !== "";
  const listToShow = isSearchActive ? (searchResults ?? []) : parties;

  if (parties.length === 0 && !isSearchActive) {
    return (
      <div className="rounded-xl border border-gray-200 p-6 text-center">
        <Typography variant="body" level={3} className="text-gray-500">
          {dictionary.pages.govern.elections.detail.no_parties_for_election}
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
        {dictionary.pages.govern.elections.detail.choose_a_party}
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
          label={dictionary.pages.govern.parties.search_placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Parties list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {isSearchActive && (isSearching || searchResults === null) ? (
          <div className="mt-8 mb-8 p-6 text-center text-sm text-gray-500">
            {dictionary.common.loading}
          </div>
        ) : isSearchActive && searchResults !== null && searchResults.length === 0 ? (
          <div className="mt-8 mb-8 p-6 text-center text-sm text-gray-500">
            {dictionary.pages.govern.parties.no_parties_found}
          </div>
        ) : (
          <div className="flex flex-col gap-7 p-4 divide-y divide-gray-100">
            {listToShow.map((party) => (
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
                  dictionary={dictionary}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
