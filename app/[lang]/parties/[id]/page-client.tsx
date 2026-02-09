"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PiCaretLeft, PiShareNetwork } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { PartyDetailContent } from "@/components/parties/party-detail-content";
import { PartyDetailPageSkeleton } from "@/components/parties/party-detail-page-skeleton";
import { TopBar } from "@/components/topbar";
import { getParty } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";

interface PartyDetailPageClientProps {
  partyId: string;
  dictionary: Dictionary;
  featuredElectionId?: string;
}

export default function PartyDetailPageClient({
  partyId,
  dictionary,
  featuredElectionId,
}: PartyDetailPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [party, setParty] = useState<Party | null | undefined>(undefined);

  // Fetch party for TopBar share button and to know when to show content
  const fetchPartyForShare = async () => {
    if (!partyId || typeof partyId !== "string") return;
    try {
      const partyData = await getParty(partyId);
      setParty(partyData ?? null);
    } catch (error) {
      console.error("Error fetching party for share:", error);
      setParty(null);
    }
  };

  // Fetch party when id changes
  useEffect(() => {
    if (!partyId || typeof partyId !== "string") {
      setParty(null);
      return;
    }
    fetchPartyForShare();
  }, [partyId]);

  // Share URL
  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/parties/${party?.id || partyId}`;
  };

  // Show skeleton until first fetch has completed (party undefined = still loading)
  if (!partyId || party === undefined) {
    return <PartyDetailPageSkeleton />;
  }

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.parties.party_details}
        startAdornment={
          <button
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-full bg-gray-100"
          >
            <PiCaretLeft className="size-4 text-gray-900" />
          </button>
        }
        endAdornment={
          party && (
            <button
              onClick={async () => {
                const shareUrl = getShareUrl();
                const shareTitle = party.name;

                // Check if Web Share API is supported
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: shareTitle,
                      url: shareUrl,
                    });
                  } catch (error) {
                    // User cancelled or share failed - fallback to clipboard
                    if (error instanceof Error && error.name !== "AbortError") {
                      await copyToClipboard(shareUrl, toast, {
                        success: dictionary.toasts.copied,
                        error: dictionary.toasts.generic_error,
                      });
                    }
                  }
                } else {
                  // Fallback for browsers that don't support Web Share API
                  await copyToClipboard(shareUrl, toast, {
                    success: dictionary.toasts.copied,
                    error: dictionary.toasts.generic_error,
                  });
                }
              }}
              className="flex size-10 items-center justify-center rounded-full bg-gray-100"
              aria-label={dictionary.pages.govern.parties.share_party}
            >
              <PiShareNetwork className="size-4 text-gray-900" />
            </button>
          )
        }
      />

      {partyId && (
        <div className="flex flex-1 flex-col p-6">
          <PartyDetailContent
            partyId={partyId}
            dictionary={dictionary}
            featuredElectionId={featuredElectionId}
          />
        </div>
      )}
    </div>
  );
}
