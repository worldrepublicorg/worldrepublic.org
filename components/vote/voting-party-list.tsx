"use client";

import { Input, Typography, useToast } from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import type { FocusEvent as ReactFocusEvent } from "react";
import { useEffect, useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { VotingPartyCard } from "@/components/vote/voting-party-card";
import type { Election } from "@/lib/actions/elections";
import type { Party } from "@/lib/types/parties";

// Lazy load Self verification dialog
const SelfVerificationDialog = dynamic(
  () =>
    import("@/components/identity/self-verification-dialog").then(
      (mod) => mod.SelfVerificationDialog,
    ),
  { ssr: false },
);

export interface VotingPartyListProps {
  dictionary: Dictionary;
  lang: string;
  /** Fetched on the server (same pattern as parties page) */
  initialElection: Election | null;
  initialParties: Party[];
}

export function VotingPartyList({
  dictionary,
  lang,
  initialElection,
  initialParties,
}: VotingPartyListProps) {
  const { toast } = useToast();

  // Use server-passed data (no client fetch)
  const [election] = useState<Election | null>(initialElection);
  const [parties] = useState<Party[]>(initialParties);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false);

  // Generate a random userId for Self verification
  const [randomUserId, setRandomUserId] = useState<string | null>(null);

  // Generate random UUID on mount for Self verification
  useEffect(() => {
    if (typeof window !== "undefined" && !randomUserId) {
      setRandomUserId(crypto.randomUUID());
    }
  }, [randomUserId]);

  // Filter parties based on search term
  const filteredParties =
    searchTerm.trim() === ""
      ? parties
      : parties.filter(
          (party) =>
            party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (party.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ??
              false),
        );

  const handleVote = (party: Party) => {
    setSelectedParty(party);
    // Generate a new userId for this verification session
    setRandomUserId(crypto.randomUUID());
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationSuccess = () => {
    toast.success({
      title: dictionary.pages.govern.vote.vote_recorded,
    });
    setIsVerificationDialogOpen(false);
    setSelectedParty(null);
  };

  const handleInputFocus = (e: ReactFocusEvent) => {
    if (
      e.target &&
      (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement)
    ) {
      setTimeout(() => {
        (e.target as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  };

  // No active election
  if (!election) {
    return (
      <div className="flex grow flex-col items-center justify-center p-6 text-center">
        <Typography variant="heading" level={3} className="mb-2">
          {dictionary.pages.govern.vote.no_active_election}
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex w-full grow flex-col">
      {/* Search bar */}
      <div className="mb-5 h-12.5 px-6">
        <Input
          type="text"
          startAdornment={<PiMagnifyingGlass className="h-5 w-5" />}
          label={dictionary.pages.govern.vote.search_parties}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
        />
      </div>

      {/* Party list */}
      <div className="flex-1 px-6 pb-6">
        {filteredParties.length === 0 ? (
          <div className="mt-12 mb-8 text-center text-sm text-gray-500">
            {dictionary.pages.govern.parties.no_parties_found}
          </div>
        ) : (
          filteredParties.map((party, index) => (
            <VotingPartyCard
              key={party.id}
              party={party}
              onVote={handleVote}
              isLastItem={index === filteredParties.length - 1}
              dictionary={dictionary}
            />
          ))
        )}
      </div>

      {/* Self verification dialog for voting */}
      {selectedParty && election && (
        <SelfVerificationDialog
          open={isVerificationDialogOpen}
          onOpenChange={setIsVerificationDialogOpen}
          onSuccess={handleVerificationSuccess}
          userId={randomUserId}
          dictionary={dictionary}
          voteParams={{
            electionId: election.id,
            partyId: selectedParty.id,
          }}
        />
      )}
    </div>
  );
}
