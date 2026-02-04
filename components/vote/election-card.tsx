"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiCalendarBlank, PiCoins } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Election } from "@/lib/types/elections";
import { cn } from "@/lib/utils";

interface ElectionCardProps {
  election: Election;
  isLastItem?: boolean;
  dictionary: Dictionary;
}

export function ElectionCard({
  election,
  isLastItem = false,
  dictionary,
}: ElectionCardProps) {
  const now = Date.now();
  const isActive = now >= election.startsAt && now <= election.endsAt;
  const isUpcoming = now < election.startsAt;
  const isEnded = now > election.endsAt;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={cn(
        !isLastItem && "mb-4",
        "rounded-xl border border-gray-200 p-4",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold"
          >
            {election.name}
          </Typography>
        </div>
        <div>
          {isActive && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Active
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Upcoming
            </span>
          )}
          {isEnded && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              Ended
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center gap-2 text-gray-600">
          <PiCalendarBlank className="text-gray-500 shrink-0" size={15} />
          <Typography variant="body" level={2} className="text-[15px]">
            {formatDate(election.startsAt)} - {formatDate(election.endsAt)}
          </Typography>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <PiCoins className="text-gray-500 shrink-0" size={15} />
          <Typography variant="body" level={2} className="text-[15px]">
            Reward pool: {parseInt(election.rewardPool).toLocaleString()} WDD
          </Typography>
        </div>
      </div>
    </div>
  );
}
