"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PiCaretLeft, PiShareNetwork } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { PartyDetailContent } from "@/components/parties/party-detail-content";
import { TopBar } from "@/components/topbar";
import { Button, useToast } from "@/components/ui";
import { getParty } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";

interface PartyDetailPageClientProps {
  partyId: string;
  dictionary: Dictionary;
}

export default function PartyDetailPageClient({
  partyId,
  dictionary,
}: PartyDetailPageClientProps) {
  const { lang } = useParams<{ lang: string }>();
  const { toast } = useToast();
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);

  // Fetch party for TopBar share button
  const fetchPartyForShare = async () => {
    if (!partyId || typeof partyId !== "string") return;
    try {
      const partyData = await getParty(partyId);
      setParty(partyData);
    } catch (error) {
      console.error("Error fetching party for share:", error);
    }
  };

  // Fetch party when id changes
  useEffect(() => {
    fetchPartyForShare();
  }, [partyId]);

  // Share URL
  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${lang}/parties/${party?.id || partyId}`;
  };

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.parties.party_details}
        startAdornment={
          <Button onClick={() => router.back()} variant="tertiary" size="icon">
            <PiCaretLeft className="size-4 text-gray-900" />
          </Button>
        }
        endAdornment={
          party && (
            <Button
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
              variant="tertiary"
              size="icon"
              aria-label={dictionary.pages.govern.parties.share_party}
            >
              <PiShareNetwork className="size-4 text-gray-900" />
            </Button>
          )
        }
      />

      {partyId && (
        <div className="flex flex-1 flex-col p-6">
          <PartyDetailContent partyId={partyId} dictionary={dictionary} />
        </div>
      )}
    </div>
  );
}
