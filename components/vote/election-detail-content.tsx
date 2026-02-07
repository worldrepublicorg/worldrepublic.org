"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiCalendarBlank, PiCoins, PiInfoFill } from "react-icons/pi";
import { ElectionResults } from "@/components/vote/election-results";
import { PartyVoteList } from "@/components/vote/party-vote-list";
import type { Election, ElectionResult } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";

interface ElectionDetailContentProps {
  election: Election | null;
  parties: Party[];
  results: ElectionResult[];
  lang: string;
}

export function ElectionDetailContent({
  election,
  parties,
  results,
  lang,
}: ElectionDetailContentProps) {
  if (!election) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <PiInfoFill className="h-16 w-16 text-gray-300" />
        <Typography
          variant="heading"
          level={3}
          className="mt-4 text-center text-gray-900"
        >
          Election not found
        </Typography>
        <Typography
          variant="body"
          level={2}
          className="mt-2 text-center text-gray-500"
        >
          The election you&apos;re looking for doesn&apos;t exist.
        </Typography>
        <Link href={`/${lang}/vote`}>
          <Button variant="secondary" className="mt-8">
            Back to elections
          </Button>
        </Link>
      </div>
    );
  }

  const now = Date.now();
  const isActive = now >= election.startsAt && now <= election.endsAt;
  const isUpcoming = now < election.startsAt;
  const isEnded = now > election.endsAt;

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <div className="flex flex-1 min-h-full flex-col">
      {/* Hero section */}
      <div className="mt-2 mb-6 flex flex-col items-center">
        <Typography
          variant="heading"
          level={2}
          className="text-center text-gray-900"
        >
          {election.name}
        </Typography>
        <div className="mt-3">
          {isActive && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Active
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              Upcoming
            </span>
          )}
          {isEnded && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
              Ended
            </span>
          )}
        </div>
      </div>

      {/* Election info card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
          <Typography variant="subtitle" level={3} className="text-gray-900">
            Election info
          </Typography>
        </div>
        <div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
          <div className="flex items-center gap-2">
            <PiCalendarBlank className="text-gray-400 shrink-0 size-4" />
            <Typography variant="body" level={3} className="text-gray-700">
              {formatDateTime(election.startsAt)} – {formatDateTime(election.endsAt)}
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <PiCoins className="text-gray-400 shrink-0 size-4" />
            <Typography variant="body" level={3} className="text-gray-700">
              Reward pool:{" "}
              {Number.parseInt(election.rewardPool).toLocaleString()} WDD
            </Typography>
          </div>
        </div>
      </div>

      {/* Conditional content based on election status */}
      {isActive && (
        <PartyVoteList parties={parties} electionId={election.id} lang={lang} />
      )}

      {isUpcoming && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-6 text-center">
          <Typography variant="subtitle" level={2} className="text-blue-900">
            Voting opens {formatDateTime(election.startsAt)}
          </Typography>
          <Typography variant="body" level={3} className="text-blue-700">
            Check back when the election starts to cast your vote.
          </Typography>
        </div>
      )}

      {isEnded && <ElectionResults results={results} />}
    </div>
  );
}
