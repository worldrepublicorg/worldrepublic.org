"use client";

import {
  Button,
  Skeleton,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiPlus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { PartyCard } from "@/components/parties/party-card";
import type { Party } from "@/lib/types/parties";

interface MyPartySectionProps {
  userParty: Party | null;
  isLoading?: boolean;
  isUserLeader: (party: Party) => boolean;
  shortenUrl: (url: string, maxLength?: number) => string;
  dictionary: Dictionary;
  lang: string;
  onCreateParty: () => void;
  onOpenDrawer: (party: Party) => void;
  onEditParty: (party: Party) => void;
  onDeleteParty: () => void;
}

export function MyPartySection({
  userParty,
  isLoading = false,
  isUserLeader,
  shortenUrl,
  dictionary,
  lang,
  onCreateParty,
  onOpenDrawer,
  onEditParty,
  onDeleteParty,
}: MyPartySectionProps) {
  return (
    <div className="mb-6 px-6 mt-2">
      <div className="mb-3 flex items-center justify-between">
        <Typography
          variant="subtitle"
          level={1}
          className="text-[19px] font-semibold"
        >
          {dictionary.pages.govern.parties.my_party}
        </Typography>
        <button
          className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-900"
          onClick={onCreateParty}
          disabled={isLoading}
        >
          <PiPlus className="size-4 text-gray-900" />
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton height={24} width="60%" />
            </div>
            <Skeleton height={32} width={32} className="rounded-full" />
          </div>
          <div className="mt-3">
            <Skeleton height={16} width="80%" />
          </div>
          <div className="flex items-center justify-between mt-3">
            <Skeleton height={20} width={120} />
            <Skeleton height={20} width={95} />
          </div>
        </div>
      ) : userParty ? (
        <PartyCard
          key={userParty.id}
          party={userParty}
          isUserLeader={isUserLeader}
          shortenUrl={shortenUrl}
          onOpenDrawer={onOpenDrawer}
          onEditParty={onEditParty}
          onDeleteParty={onDeleteParty}
          dictionary={dictionary}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 p-4 text-center">
          <Typography
            variant="body"
            level={3}
            className="text-sm text-gray-500"
          >
            {dictionary.pages.govern.parties.run_on_elections_and_earn}
          </Typography>
          <Link href={`/${lang}/menu/faq?q=party-subsidies`}>
            <Button variant="tertiary" size="sm">
              {dictionary.pages.govern.parties.learn_more}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
