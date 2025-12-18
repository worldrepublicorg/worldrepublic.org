"use client";

import {
  Button,
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiCopy, PiInfoFill, PiLinkSimple, PiUserFocus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { VoteButton } from "@/components/vote/vote-button";
import { getParty } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";

interface PartyDetailContentProps {
  partyId: string;
  dictionary: Dictionary;
}

export function PartyDetailContent({
  partyId,
  dictionary,
}: PartyDetailContentProps) {
  const { lang } = useParams<{ lang: string }>();
  const { toast } = useToast();

  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch party data
  useEffect(() => {
    const fetchData = async () => {
      if (!partyId || typeof partyId !== "string") {
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        // Fetch party details
        const partyData = await getParty(partyId);
        if (!partyData) {
          throw new Error("Party not found");
        }
        setParty(partyData);
      } catch (error) {
        console.error("[PartyDetailContent] Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load party data",
        );
        toast.error({
          title: dictionary.pages.govern.parties.detail.failed_to_load,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId]);

  // Copy leader address to clipboard
  const handleCopyLeaderAddress = async () => {
    if (!party?.leaderUsername) return;
    await copyToClipboard(party.leaderUsername, toast);
  };

  // Note: Leader check is not needed on detail page since management is on the card

  return (
    <div className="flex flex-1 min-h-full flex-col">
      {isLoading ? (
        // Loading state
        <div className="flex flex-1 min-h-full flex-col">
          {/* Hero section skeleton */}
          <div className="mt-6 mb-10 flex flex-col items-center">
            <div className="h-9 w-3/4 animate-pulse rounded-lg bg-gray-100"></div>
          </div>

          {/* Description skeleton */}
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
              <div className="h-6 w-5/12 animate-pulse rounded bg-gray-100"></div>
            </div>
            <div className="p-4">
              <div className="h-20 w-full animate-pulse rounded bg-gray-100"></div>
            </div>
          </div>

          {/* Party Info skeleton */}
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
              <div className="h-6 w-1/4 animate-pulse rounded bg-gray-100"></div>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between gap-6 p-4">
                <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100"></div>
                <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100"></div>
              </div>
              <div className="flex items-center justify-between gap-6 p-4">
                <div className="h-5 w-1/4 animate-pulse rounded bg-gray-100"></div>
                <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100"></div>
              </div>
            </div>
          </div>

          {/* Vote button skeleton */}
          <div className="mt-auto">
            <div className="h-14 w-full animate-pulse rounded-full bg-gray-100 mt-6"></div>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="flex flex-1 flex-col items-center justify-center">
          <PiInfoFill className="h-16 w-16 text-gray-300" />
          <Typography
            variant="heading"
            level={3}
            className="mt-4 text-center text-gray-900"
          >
            {dictionary.pages.govern.parties.detail.error_loading}
          </Typography>
          <Typography
            variant="body"
            level={2}
            className="mt-2 text-center text-gray-500"
          >
            {error}
          </Typography>
          <Link href={`/${lang}/parties`}>
            <Button variant="secondary" className="mt-8">
              {dictionary.pages.govern.parties.detail.back_to_parties}
            </Button>
          </Link>
        </div>
      ) : party ? (
        // Party details
        <div className="flex flex-1 min-h-full flex-col">
          {/* Hero section */}
          <div className="mt-6 mb-10 flex flex-col items-center">
            <Typography
              variant="heading"
              level={2}
              className="text-center text-gray-900"
            >
              {party.name}
            </Typography>
          </div>

          {/* Description */}
          {party.description && (
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="text-gray-900"
                >
                  {dictionary.pages.govern.parties.detail.description}
                </Typography>
              </div>
              <Typography
                variant="body"
                level={3}
                className="p-4 text-gray-700"
              >
                {party.description}
              </Typography>
            </div>
          )}

          {/* Party Info */}
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
              <Typography variant="subtitle" level={3}>
                {dictionary.pages.govern.parties.detail.party_info}
              </Typography>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Leader */}
              {party.leaderUsername && (
                <div className="flex items-center justify-between gap-6 p-4">
                  <div className="flex items-center">
                    <PiUserFocus className="mr-2 size-4 text-gray-400" />
                    <Typography
                      variant="body"
                      level={3}
                      className="text-gray-700"
                    >
                      {dictionary.pages.govern.parties.detail.leader}
                    </Typography>
                  </div>
                  <button
                    onClick={handleCopyLeaderAddress}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <Typography
                      variant="body"
                      level={3}
                      className="font-medium text-gray-900"
                    >
                      {party.leaderUsername}
                    </Typography>
                    <PiCopy className="size-4 text-gray-400" />
                  </button>
                </div>
              )}

              {/* Website */}
              {party.websiteUrl && (
                <div className="flex items-center justify-between gap-6 p-4">
                  <div className="flex items-center shrink-0">
                    <PiLinkSimple className="mr-2 size-4 text-gray-400 shrink-0" />
                    <Typography
                      variant="body"
                      level={3}
                      className="whitespace-nowrap text-gray-700"
                    >
                      {dictionary.pages.govern.parties.detail.website}
                    </Typography>
                  </div>
                  <a
                    href={
                      party.websiteUrl.startsWith("http")
                        ? party.websiteUrl
                        : `https://${party.websiteUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Typography
                      variant="body"
                      level={3}
                      className="line-clamp-1 break-all font-medium"
                      title={party.websiteUrl}
                    >
                      {party.websiteUrl}
                    </Typography>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Vote button */}
          <div className="mt-auto">
            <VoteButton
              fullWidth
              className="mt-6!"
              label={dictionary.common.vote}
              dictionary={dictionary}
            />
          </div>
        </div>
      ) : (
        // Not found state
        <div className="flex flex-1 flex-col items-center justify-center">
          <PiInfoFill className="h-16 w-16 text-gray-300" />
          <Typography
            variant="heading"
            level={3}
            className="mt-4 text-center text-gray-900"
          >
            {dictionary.pages.govern.parties.detail.party_not_found}
          </Typography>
          <Typography
            variant="body"
            level={2}
            className="mt-2 text-center text-gray-500"
          >
            {dictionary.pages.govern.parties.detail.not_found_description}
          </Typography>
          <Link href={`/${lang}/parties`}>
            <Button variant="secondary" className="mt-8">
              {dictionary.pages.govern.parties.detail.back_to_parties}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
