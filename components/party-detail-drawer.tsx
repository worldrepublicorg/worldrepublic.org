"use client";

import {
	Drawer,
	DrawerContent,
	DrawerTitle,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { PiShareNetwork } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomDrawerHeader } from "@/components/custom-drawer-header";
import { PartyDetailContent } from "@/components/party-detail-content";
import { getWalletAuthAndData } from "@/lib/actions/member";
import { CANONICAL_SHARE_ORIGIN } from "@/lib/branding";
import { defaultLocale } from "@/lib/locales";
import type { Party } from "@/lib/types/parties";

interface PartyDetailDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	party: Party | null;
	dictionary: Dictionary;
}

export function PartyDetailDrawer({
	open,
	onOpenChange,
	party,
	dictionary,
}: PartyDetailDrawerProps) {
	const params = useParams<{ lang?: string }>();
	const lang = params.lang ?? defaultLocale;
	const { toast } = useToast();
	const drawerStatePushedRef = useRef(false);

	// Handle Android back button for drawer
	useEffect(() => {
		if (!open) {
			drawerStatePushedRef.current = false;
			return;
		}

		const state = { drawerOpen: true };
		window.history.pushState(state, "");
		drawerStatePushedRef.current = true;

		const handlePopState = () => {
			onOpenChange(false);
			window.history.pushState(state, "");
		};

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
			if (drawerStatePushedRef.current) {
				window.history.replaceState(null, "");
				drawerStatePushedRef.current = false;
			}
		};
	}, [open, onOpenChange]);

	const handleShare = async () => {
		if (!party) return;
		const shareUrl = new URL(
			`${CANONICAL_SHARE_ORIGIN}/${lang}/govern/parties/${party.id}`,
		);
		const shareTitle = party.name;

		try {
			const walletData = await getWalletAuthAndData();
			const referralCode = walletData.profileData?.referralCode;
			if (walletData.authenticated && referralCode) {
				shareUrl.searchParams.set("ref", referralCode);
			}
		} catch {
			// Best-effort only; share still works without referral code.
		}

		if (navigator.share) {
			try {
				await navigator.share({
					title: shareTitle,
					url: shareUrl.toString(),
				});
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					await navigator.clipboard.writeText(shareUrl.toString());
					toast.success({
						title: dictionary.toasts.copied,
					});
				}
			}
		} else {
			await navigator.clipboard.writeText(shareUrl.toString());
			toast.success({
				title: dictionary.toasts.copied,
			});
		}
	};

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="flex flex-col">
				<div className="shrink-0 px-6 pt-6">
					<CustomDrawerHeader
						icon={
							party ? (
								<button
									type="button"
									onClick={handleShare}
									className="flex size-10 items-center justify-center rounded-full bg-gray-100"
									aria-label={dictionary.pages.govern.parties.share_party}
								>
									<PiShareNetwork className="size-4 text-gray-900" />
								</button>
							) : undefined
						}
					>
						<DrawerTitle>
							{dictionary.pages.govern.parties.party_details}
						</DrawerTitle>
					</CustomDrawerHeader>
				</div>
				<div className="flex-1 overflow-y-auto px-6 pb-6">
					{party && (
						<PartyDetailContent partyId={party.id} dictionary={dictionary} />
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
