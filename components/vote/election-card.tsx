"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiCalendarBlank, PiCoins } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { formatElectionDate } from "@/lib/format-date";
import type { Election } from "@/lib/types/elections";
import { cn } from "@/lib/utils";

interface ElectionCardProps {
  election: Election;
  lang: string;
  dictionary: Dictionary;
  isLastItem?: boolean;
}

export function ElectionCard({
  election,
  lang,
  dictionary,
  isLastItem = false,
}: ElectionCardProps) {
  const t = dictionary.pages.govern.elections.detail;
  const now = Date.now();
  const isActive = now >= election.startsAt && now <= election.endsAt;
  const isUpcoming = now < election.startsAt;
  const isEnded = now > election.endsAt;

  return (
    <Link
      href={`/${lang}/vote/elections/${election.id}`}
      className={cn("block", !isLastItem && "mb-4")}
    >
      <div className="rounded-xl border border-gray-200 p-4">
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
                {t.status_active}
              </span>
            )}
            {isUpcoming && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {t.status_upcoming}
              </span>
            )}
            {isEnded && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {t.status_ended}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <div className="flex items-center gap-2 text-gray-600">
            <PiCalendarBlank className="text-gray-500 shrink-0" size={15} />
            <Typography variant="body" level={2} className="text-[15px]">
              {formatElectionDate(election.startsAt, lang)} - {formatElectionDate(election.endsAt, lang)}
            </Typography>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <PiCoins className="text-gray-500 shrink-0" size={15} />
            <Typography variant="body" level={2} className="text-[15px]">
              {t.reward_pool.replace(
                "{amount}",
                Number.parseInt(election.rewardPool).toLocaleString(),
              )}
            </Typography>
          </div>
        </div>
      </div>
    </Link>
  );
}
