"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiScrollFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ElectionsList } from "@/components/govern/elections-list";
import { PoliticalPartyList } from "@/components/govern/political-party-list";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { TopbarWalletBalanceDisplay } from "@/components/topbar-wallet-balance-display";
import { useWalletAuthCache } from "@/hooks/use-wallet-auth-cache";
import {
	type GetWalletAuthAndDataResult,
	getWalletAuthAndData,
} from "@/lib/actions/member";
import type { Election } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";
import { setCachedWalletData } from "@/lib/wallet-auth-cache";

const TABS = ["elections", "parties", "referendums"] as const;
type TabKey = (typeof TABS)[number];

interface GovernPageClientProps {
	elections: Election[];
	parties: Party[] | null;
	dictionary: Dictionary;
	lang: string;
}

export default function GovernPageClient({
	elections,
	parties,
	dictionary,
	lang,
}: GovernPageClientProps) {
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");

	const cachedData = useWalletAuthCache();
	const [serverData, setServerData] =
		useState<GetWalletAuthAndDataResult | null>(null);
	const [showScrollToTop, setShowScrollToTop] = useState(false);

	useEffect(() => {
		let cancelled = false;
		getWalletAuthAndData().then((result) => {
			if (cancelled) return;
			setServerData(result);
			setCachedWalletData(result);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const data = serverData ?? cachedData;

	// Client-side logic for tabs
	const activeTab: TabKey = TABS.includes(tab as TabKey)
		? (tab as TabKey)
		: TABS[0];
	const showElectionsScrollToTop = activeTab === "elections";

	useEffect(() => {
		if (!showElectionsScrollToTop) {
			setShowScrollToTop(false);
			return;
		}

		const handleScroll = () => {
			setShowScrollToTop(window.scrollY > 300);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [showElectionsScrollToTop]);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<>
			<TopBar
				title={dictionary.nav.govern}
				endAdornment={
					<TopbarWalletBalanceDisplay
						lang={lang}
						streams={data?.streams ?? undefined}
						storedWalletBalance={data?.profileData?.storedWalletBalance ?? 0}
						snapshotBalance={data?.profileData?.walletBalance ?? null}
					/>
				}
			/>
			<TabPills
				activeTab={activeTab}
				lang={lang}
				basePath={`/${lang}/govern`}
				tabs={[
					{
						key: "elections",
						label: dictionary.pages.govern.tabs.elections,
					},
					{
						key: "parties",
						label: dictionary.pages.govern.tabs.parties,
					},
					{
						key: "referendums",
						label: dictionary.pages.govern.tabs.referendums,
					},
				]}
			/>
			<div className="flex grow flex-col overflow-y-auto">
				{activeTab === "elections" ? (
					<div className="flex-1 overflow-y-auto p-6">
						<ElectionsList
							elections={elections}
							lang={lang}
							dictionary={dictionary}
						/>
					</div>
				) : activeTab === "parties" ? (
					<PoliticalPartyList
						initialParties={parties}
						dictionary={dictionary}
					/>
				) : (
					<div className="flex grow items-center justify-center">
						<div className="flex w-full min-w-0 flex-col items-center justify-center p-6 text-center">
							<div className="flex w-full min-w-0 flex-col items-center gap-4">
								<div className="mb-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-100">
									<PiScrollFill className="h-10 w-10 text-gray-400" />
								</div>
								<Typography
									variant="heading"
									level={2}
									className="w-full min-w-0 wrap-break-word text-center"
									title={dictionary.pages.govern.sections.referendums.title}
								>
									{dictionary.pages.govern.sections.referendums.title}
								</Typography>
								<Typography
									variant="subtitle"
									level={2}
									className="w-full min-w-0 wrap-break-word text-center text-gray-500"
								>
									{dictionary.pages.govern.sections.referendums.subtitle}
								</Typography>
								<Button disabled fullWidth className="mt-6!">
									{dictionary.common.coming_soon}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
			<ScrollToTopButton
				show={showElectionsScrollToTop && showScrollToTop}
				onClick={scrollToTop}
			/>
		</>
	);
}
