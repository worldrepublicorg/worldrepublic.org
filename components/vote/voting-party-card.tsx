"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiLinkSimple, PiUserFocus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Party } from "@/lib/types/parties";
import { cn } from "@/lib/utils";

interface VotingPartyCardProps {
  party: Party;
  onVote: (party: Party) => void;
  isLastItem?: boolean;
  dictionary: Dictionary;
}

function shortenUrl(url: string, maxLength = 64): string {
  if (!url) return "";
  try {
    let cleanUrl = url.replace(/^https?:\/\//, "");
    cleanUrl = cleanUrl.replace(/^www\./, "");
    cleanUrl = cleanUrl.replace(/\/$/, "");
    if (cleanUrl.length <= maxLength) return cleanUrl;
    return `${cleanUrl.substring(0, maxLength - 3)}...`;
  } catch {
    return url;
  }
}

export function VotingPartyCard({
  party,
  onVote,
  isLastItem = false,
  dictionary,
}: VotingPartyCardProps) {
  return (
    <div
      className={cn(
        !isLastItem && "mb-4",
        "rounded-xl border border-gray-200 p-4",
      )}
    >
      {/* Party name */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold"
          >
            {party.name}
          </Typography>
        </div>
      </div>

      {/* Description */}
      {party.description && (
        <div className="mt-3">
          <Typography
            as="p"
            variant="body"
            level={2}
            className="text-[15px] text-gray-700 line-clamp-3"
          >
            {party.description}
          </Typography>
        </div>
      )}

      {/* Website and Leader */}
      <div className="mt-3 flex justify-between gap-2">
        <div className="flex items-center gap-1">
          {party.websiteUrl ? (
            <>
              <PiLinkSimple className="text-gray-500 shrink-0" size={15} />
              <a
                href={
                  party.websiteUrl.startsWith("http")
                    ? party.websiteUrl
                    : `https://${party.websiteUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="-m-1 flex rounded-md px-1 py-1 transition-colors"
                title={party.websiteUrl}
                onClick={(e) => e.stopPropagation()}
              >
                <Typography
                  variant="label"
                  level={1}
                  className="line-clamp-1 break-all text-[15px] text-[#0A66C2] font-normal"
                >
                  {shortenUrl(party.websiteUrl)}
                </Typography>
              </a>
            </>
          ) : (
            <PiLinkSimple className="text-gray-300 shrink-0" size={15} />
          )}
        </div>
        <div className="flex items-center gap-1">
          <PiUserFocus className="text-gray-500" size={15} />
          <Typography
            as="span"
            variant="label"
            level={1}
            className="text-[15px] font-semibold"
          >
            {party.leaderUsername}
          </Typography>
        </div>
      </div>

      {/* Vote button */}
      <div className="mt-4">
        <Button fullWidth onClick={() => onVote(party)}>
          {dictionary.common.vote}
        </Button>
      </div>
    </div>
  );
}
