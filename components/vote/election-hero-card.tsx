"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiCalendarBlank, PiCoins } from "react-icons/pi";
import type { Election } from "@/lib/types/elections";

interface ElectionHeroCardProps {
  election: Election;
  lang: string;
}

export function ElectionHeroCard({ election, lang }: ElectionHeroCardProps) {
  const now = Date.now();
  const isActive = now >= election.startsAt && now <= election.endsAt;
  const isUpcoming = now < election.startsAt;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link
      href={`/${lang}/vote/elections/${election.id}`}
      className="block mb-6"
    >
      <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <Typography variant="heading" level={3} className="text-gray-900">
              {election.name}
            </Typography>
          </div>
          <div>
            {isActive && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                Active
              </span>
            )}
            {isUpcoming && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                Upcoming
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 text-gray-600">
            <PiCalendarBlank className="text-gray-500 shrink-0" size={16} />
            <Typography variant="body" level={2}>
              {formatDate(election.startsAt)} - {formatDate(election.endsAt)}
            </Typography>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <PiCoins className="text-gray-500 shrink-0" size={16} />
            <Typography variant="body" level={2}>
              Reward pool:{" "}
              {Number.parseInt(election.rewardPool).toLocaleString()} WDD
            </Typography>
          </div>
        </div>

        <Button fullWidth className="mt-5!">
          {isActive ? "Vote now" : "View details"}
        </Button>
      </div>
    </Link>
  );
}
