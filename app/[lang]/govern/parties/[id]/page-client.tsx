"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PiCaretLeft, PiShareNetwork } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { PartyDetailPageSkeleton } from "@/components/govern/parties/party-detail-page-skeleton";
import { PartyDetailContent } from "@/components/party-detail-content";
import { TopBar } from "@/components/topbar";
import { getWalletAuthAndData } from "@/lib/actions/member";
import { getParty } from "@/lib/actions/parties";
import { CANONICAL_SHARE_ORIGIN } from "@/lib/branding";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";

interface PartyDetailPageClientProps {
	partyId: string;
	lang: string;
	dictionary: Dictionary;
}

export default function PartyDetailPageClient({
	partyId,
	lang,
	dictionary,
}: PartyDetailPageClientProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [party, setParty] = useState<Party | null | undefined>(undefined);

	// Fetch party for TopBar share button and to know when to show content
	const fetchPartyForShare = useCallback(async () => {
		if (!partyId || typeof partyId !== "string") return;
		try {
			const partyData = await getParty(partyId);
			setParty(partyData ?? null);
		} catch (error) {
			console.error("Error fetching party for share:", error);
			setParty(null);
		}
	}, [partyId]);

	// Fetch party when id changes
	useEffect(() => {
		if (!partyId || typeof partyId !== "string") {
			setParty(null);
			return;
		}
		fetchPartyForShare();
	}, [partyId, fetchPartyForShare]);

	const getShareUrl = async () => {
		if (typeof window === "undefined") return "";
		const shareUrl = new URL(
			`${CANONICAL_SHARE_ORIGIN}/${lang}/govern/parties/${party?.id || partyId}`,
		);

		try {
			const walletData = await getWalletAuthAndData();
			const referralCode = walletData.profileData?.referralCode;
			if (walletData.authenticated && referralCode) {
				shareUrl.searchParams.set("ref", referralCode);
			}
		} catch {
			// Best-effort only; share still works without referral code.
		}

		return shareUrl.toString();
	};

	const handleBack = () => {
		const fallbackPath = `/${lang}/govern?tab=parties`;
		const hasSameOriginReferrer =
			typeof document !== "undefined" &&
			document.referrer.startsWith(window.location.origin);

		if (window.history.length > 1 && hasSameOriginReferrer) {
			router.back();
			return;
		}

		router.push(fallbackPath);
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
						type="button"
						onClick={handleBack}
						className="flex size-10 items-center justify-center rounded-full bg-gray-100"
					>
						<PiCaretLeft className="size-4 text-gray-900" />
					</button>
				}
				endAdornment={
					party && (
						<button
							type="button"
							onClick={async () => {
								const shareUrl = await getShareUrl();
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
					<PartyDetailContent partyId={partyId} dictionary={dictionary} />
				</div>
			)}
		</div>
	);
}
