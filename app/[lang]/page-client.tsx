"use client";

import {
	Button,
	Skeleton,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { PiInfoFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { BasicIncomeSection } from "@/components/home/basic-income-section";
import { ConnectWalletButton } from "@/components/home/connect-wallet-button";
import { HomePageSkeleton } from "@/components/home/home-page-skeleton";
import { OnchainWalletProvider } from "@/components/home/onchain-wallet-provider";
import {
	type SavingsAccountType,
	SavingsSection,
} from "@/components/home/savings-section";
import { LearnMoreDialog } from "@/components/learn-more-dialog";
import { PartyDetailDrawer } from "@/components/party-detail-drawer";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { TopbarWalletBalanceDisplay } from "@/components/topbar-wallet-balance-display";
import { useAuth } from "@/hooks/use-auth";
import { useWalletAuthCache } from "@/hooks/use-wallet-auth-cache";
import {
	type GetWalletAuthAndDataResult,
	getWalletAuthAndData,
} from "@/lib/actions/member";
import {
	type AmbassadorLeaderboardEntry,
	getAmbassadorLeaderboard,
	getSubsidyLeaderboard,
	type SubsidyLeaderboardEntry,
} from "@/lib/actions/referrals";
import { CANONICAL_SHARE_ORIGIN } from "@/lib/branding";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";
import { setCachedWalletData } from "@/lib/wallet-auth-cache";

const SignInDialog = dynamic(
	() => import("@/components/sign-in-dialog").then((mod) => mod.SignInDialog),
	{ ssr: false },
);

const TABS = ["basic_income", "savings", "subsidies", "ambassadors"] as const;
type TabKey = (typeof TABS)[number];
const SAVINGS_ACCOUNTS = ["offchain", "base_chain"] as const;
const SAVINGS_ACCOUNT_QUERY_KEY = "savings_account";

interface HomePageClientProps {
	lang: string;
	dictionary: Dictionary;
	isRaisedByHumanityBrand: boolean;
}

export default function HomePageClient({
	lang,
	dictionary,
	isRaisedByHumanityBrand,
}: HomePageClientProps) {
	const searchParams = useSearchParams();
	const getTabFromQuery = useCallback((value: string | null): TabKey => {
		return TABS.includes(value as TabKey) ? (value as TabKey) : TABS[0];
	}, []);
	const getSavingsAccountFromQuery = useCallback(
		(value: string | null): SavingsAccountType => {
			if (value === "worldchain") {
				return "base_chain";
			}
			return SAVINGS_ACCOUNTS.includes(value as SavingsAccountType)
				? (value as SavingsAccountType)
				: SAVINGS_ACCOUNTS[0];
		},
		[],
	);
	const [activeTab, setActiveTab] = useState<TabKey>(() =>
		getTabFromQuery(searchParams.get("tab")),
	);
	const { toast } = useToast();
	const {
		isAuthenticated: clientIsAuthenticated,
		showSignInDialog,
		setShowSignInDialog,
	} = useAuth();

	const cachedData = useWalletAuthCache();
	const [serverData, setServerData] =
		useState<GetWalletAuthAndDataResult | null>(null);
	const [referralCode, setReferralCode] = useState<string | null>(
		cachedData?.profileData?.referralCode ?? null,
	);
	const [leaderboard, setLeaderboard] = useState<
		AmbassadorLeaderboardEntry[] | null
	>(null);
	const [leaderboardLoading, setLeaderboardLoading] = useState(false);
	const [leaderboardError, setLeaderboardError] = useState(false);
	const [isLearnMoreDialogOpen, setIsLearnMoreDialogOpen] = useState(false);

	const [subsidyLeaderboard, setSubsidyLeaderboard] = useState<
		SubsidyLeaderboardEntry[] | null
	>(null);
	const [subsidyLeaderboardLoading, setSubsidyLeaderboardLoading] =
		useState(false);
	const [subsidyLeaderboardError, setSubsidyLeaderboardError] = useState(false);

	const [selectedPartyForDrawer, setSelectedPartyForDrawer] =
		useState<Party | null>(null);
	const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [selectedSavingsAccount, setSelectedSavingsAccount] =
		useState<SavingsAccountType>(() =>
			getSavingsAccountFromQuery(searchParams.get(SAVINGS_ACCOUNT_QUERY_KEY)),
		);

	const fetchData = useCallback(async () => {
		const result = await getWalletAuthAndData();
		setServerData(result);
		setCachedWalletData(result);
	}, []);

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

	// Prefer reactive cache data so auth/balance updates after passkey sign-in
	// are reflected immediately without requiring a navigation refresh.
	const data = cachedData ?? serverData;
	const showSkeleton = data === null;
	const isAuthenticated = data?.authenticated ?? clientIsAuthenticated ?? false;
	const profileData = data?.profileData ?? null;

	// Hydrate referral code from server when authenticated and not yet loaded.
	useEffect(() => {
		if (!isAuthenticated || referralCode) return;

		let cancelled = false;

		const fetchReferralCode = async () => {
			try {
				const result = await getWalletAuthAndData();
				if (cancelled) return;

				if (result.profileData?.referralCode) {
					setReferralCode(result.profileData.referralCode);
				}

				setCachedWalletData(result);
			} catch {
				// Best-effort only; handled on button click as well.
			}
		};

		void fetchReferralCode();

		return () => {
			cancelled = true;
		};
	}, [isAuthenticated, referralCode]);

	useEffect(() => {
		const nextTab = getTabFromQuery(searchParams.get("tab"));
		setActiveTab((previousTab) =>
			previousTab === nextTab ? previousTab : nextTab,
		);
	}, [searchParams, getTabFromQuery]);

	const handleTabChange = useCallback((nextTab: string) => {
		if (!TABS.includes(nextTab as TabKey)) return;

		const parsedNextTab = nextTab as TabKey;
		setActiveTab((previousTab) =>
			previousTab === parsedNextTab ? previousTab : parsedNextTab,
		);

		if (typeof window === "undefined") return;
		const updatedParams = new URLSearchParams(window.location.search);
		updatedParams.set("tab", parsedNextTab);
		const nextUrl = `${window.location.pathname}?${updatedParams.toString()}`;
		window.history.replaceState(window.history.state, "", nextUrl);
	}, []);

	const handleSavingsAccountChange = useCallback(
		(nextSavingsAccount: SavingsAccountType) => {
			setSelectedSavingsAccount((previousAccount) =>
				previousAccount === nextSavingsAccount
					? previousAccount
					: nextSavingsAccount,
			);

			if (typeof window === "undefined") return;
			const updatedParams = new URLSearchParams(window.location.search);
			if (nextSavingsAccount === "offchain") {
				updatedParams.delete(SAVINGS_ACCOUNT_QUERY_KEY);
			} else {
				updatedParams.set(SAVINGS_ACCOUNT_QUERY_KEY, nextSavingsAccount);
			}
			const queryString = updatedParams.toString();
			const nextUrl = queryString
				? `${window.location.pathname}?${queryString}`
				: window.location.pathname;
			window.history.replaceState(window.history.state, "", nextUrl);
		},
		[],
	);

	useEffect(() => {
		const nextSavingsAccount = getSavingsAccountFromQuery(
			searchParams.get(SAVINGS_ACCOUNT_QUERY_KEY),
		);
		setSelectedSavingsAccount((previousAccount) =>
			previousAccount === nextSavingsAccount
				? previousAccount
				: nextSavingsAccount,
		);
	}, [searchParams, getSavingsAccountFromQuery]);

	const showLeaderboardScrollToTop =
		activeTab === "ambassadors" || activeTab === "subsidies";

	const locale = lang.trim() || "en";

	const formatInteger = (value: number): string => value.toLocaleString(locale);

	const formatTokenAmount = (amount: number): string =>
		amount.toLocaleString(locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

	const compareUsernameTieBreak = (a: string, b: string): number => {
		const aCustom = !a.startsWith("citizen_");
		const bCustom = !b.startsWith("citizen_");
		if (aCustom && !bCustom) return -1;
		if (!aCustom && bCustom) return 1;
		return a.localeCompare(b, undefined, { sensitivity: "base" });
	};

	const ambassadorWithRank = (() => {
		if (!leaderboard || leaderboard.length === 0) return [];
		const sorted = [...leaderboard].sort((a, b) => {
			if (b.reward !== a.reward) return b.reward - a.reward;
			if (b.totalInvited !== a.totalInvited)
				return b.totalInvited - a.totalInvited;
			return compareUsernameTieBreak(a.username, b.username);
		});
		const withRank: { entry: AmbassadorLeaderboardEntry; rank: number }[] = [];
		for (let i = 0; i < sorted.length; i++) {
			const entry = sorted[i];
			const rank =
				i > 0 &&
				entry.reward === sorted[i - 1].reward &&
				entry.totalInvited === sorted[i - 1].totalInvited
					? withRank[i - 1].rank
					: i + 1;
			withRank.push({ entry, rank });
		}
		return withRank;
	})();

	const subsidyWithRank = (() => {
		if (!subsidyLeaderboard || subsidyLeaderboard.length === 0) return [];
		const sorted = [...subsidyLeaderboard].sort((a, b) => {
			if (b.totalSubsidy !== a.totalSubsidy)
				return b.totalSubsidy - a.totalSubsidy;
			return compareUsernameTieBreak(a.leaderUsername, b.leaderUsername);
		});
		const withRank: { entry: SubsidyLeaderboardEntry; rank: number }[] = [];
		for (let i = 0; i < sorted.length; i++) {
			const entry = sorted[i];
			const rank =
				i > 0 && entry.totalSubsidy === sorted[i - 1].totalSubsidy
					? withRank[i - 1].rank
					: i + 1;
			withRank.push({ entry, rank });
		}
		return withRank;
	})();

	useEffect(() => {
		if (activeTab !== "ambassadors" || leaderboard !== null) return;

		let cancelled = false;

		const fetchLeaderboard = async () => {
			setLeaderboardLoading(true);
			setLeaderboardError(false);
			try {
				const data = await getAmbassadorLeaderboard();
				if (!cancelled) setLeaderboard(data);
			} catch {
				if (!cancelled) setLeaderboardError(true);
			} finally {
				if (!cancelled) setLeaderboardLoading(false);
			}
		};

		void fetchLeaderboard();

		return () => {
			cancelled = true;
		};
	}, [activeTab, leaderboard]);

	useEffect(() => {
		if (activeTab !== "subsidies" || subsidyLeaderboard !== null) return;

		let cancelled = false;

		const fetchSubsidyLeaderboard = async () => {
			setSubsidyLeaderboardLoading(true);
			setSubsidyLeaderboardError(false);
			try {
				const data = await getSubsidyLeaderboard();
				if (!cancelled) setSubsidyLeaderboard(data);
			} catch {
				if (!cancelled) setSubsidyLeaderboardError(true);
			} finally {
				if (!cancelled) setSubsidyLeaderboardLoading(false);
			}
		};

		void fetchSubsidyLeaderboard();

		return () => {
			cancelled = true;
		};
	}, [activeTab, subsidyLeaderboard]);

	useEffect(() => {
		if (!showLeaderboardScrollToTop) {
			setShowScrollToTop(false);
			return;
		}

		const handleScroll = () => {
			setShowScrollToTop(window.scrollY > 300);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [showLeaderboardScrollToTop]);

	const handleCopyReferralLink = async () => {
		if (!isAuthenticated) {
			setShowSignInDialog(true);
			return;
		}

		let code = referralCode;

		if (!code) {
			try {
				const result = await getWalletAuthAndData();
				if (result.profileData?.referralCode) {
					code = result.profileData.referralCode;
					setReferralCode(code);
					setCachedWalletData(result);
				}
			} catch {
				// Ignore here; the "no code" case below handles it.
			}
		}

		if (!code) {
			toast.error({
				title: dictionary.toasts.generic_error,
			});
			return;
		}

		const link = `${CANONICAL_SHARE_ORIGIN}/?ref=${code}`;

		if (navigator.share) {
			try {
				await navigator.share({ url: link });
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					await copyToClipboard(link, toast, {
						success: dictionary.toasts.copied,
						error: dictionary.toasts.generic_error,
					});
				}
			}
		} else {
			await copyToClipboard(link, toast, {
				success: dictionary.toasts.copied,
				error: dictionary.toasts.generic_error,
			});
		}
	};

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (showSkeleton) {
		return <HomePageSkeleton />;
	}

	return (
		<OnchainWalletProvider>
			<div className="pb-safe flex min-h-dvh flex-col">
				<TopBar
					title={dictionary.nav.earn}
					endAdornment={
						activeTab === "savings" &&
						selectedSavingsAccount === "base_chain" ? (
							<ConnectWalletButton
								connectLabel={dictionary.common.connect}
								disconnectLabel={dictionary.common.disconnect}
								disconnectDescription={
									dictionary.pages.wallet.modals.disconnect.confirm
								}
								walletBrowserDialogTitle={
									dictionary.pages.wallet.modals.connect_wallet_browser.title
								}
								walletBrowserDialogDescription={
									dictionary.pages.wallet.modals.connect_wallet_browser
										.description
								}
								walletBrowserDialogButtonLabel={
									dictionary.pages.wallet.modals.connect_wallet_browser
										.copy_link
								}
								walletPickerDialogDescription={
									dictionary.pages.wallet.modals.connect_wallet_picker
										.description
								}
								noWalletDialogDescription={
									dictionary.pages.wallet.modals.connect_wallet_no_wallet
										.description
								}
								noWalletDialogLinkLabel={
									dictionary.pages.wallet.modals.connect_wallet_no_wallet
										.find_wallet_link
								}
								copiedToastTitle={dictionary.toasts.copied}
								copyErrorToastTitle={dictionary.toasts.generic_error}
								accountTitle={dictionary.pages.wallet.sections.account_label}
								lang={lang}
								size="sm"
							/>
						) : (
							<TopbarWalletBalanceDisplay
								lang={lang}
								streams={data?.streams ?? undefined}
								storedWalletBalance={profileData?.storedWalletBalance ?? 0}
								snapshotBalance={profileData?.walletBalance ?? null}
							/>
						)
					}
				/>

				<TabPills
					activeTab={activeTab}
					lang={lang}
					basePath={`/${lang}`}
					onTabChange={handleTabChange}
					tabs={[
						{
							key: "basic_income",
							label: dictionary.pages.earn.tabs.basic_income,
						},
						{
							key: "savings",
							label: dictionary.pages.earn.tabs.savings,
						},
						{
							key: "subsidies",
							label: dictionary.pages.govern.parties.tabs.subsidies,
						},
						{
							key: "ambassadors",
							label: dictionary.pages.govern.parties.tabs.ambassadors,
						},
					]}
				/>

				<main className="flex grow flex-col">
					<div
						className={activeTab === "basic_income" ? "flex grow" : "hidden"}
					>
						<BasicIncomeSection
							lang={lang}
							dictionary={dictionary}
							isRaisedByHumanityBrand={isRaisedByHumanityBrand}
							isActive={activeTab === "basic_income"}
							isAuthenticated={isAuthenticated}
							userUuid={profileData?.userUuid ?? null}
							isSelfVerified={Boolean(profileData?.selfVerifiedAt)}
							basicIncomeActivatedAt={
								profileData?.basicIncomeActivatedAt ?? null
							}
							lastBasicIncomeClaimAt={
								profileData?.lastBasicIncomeClaimAt ?? null
							}
							basicIncomeAndInterestClaimedTotal={
								profileData?.basicIncomeAndInterestClaimedTotal ?? 0
							}
							onSignIn={() => setShowSignInDialog(true)}
							onSuccess={fetchData}
						/>
					</div>

					<div className={activeTab === "savings" ? "flex grow" : "hidden"}>
						<SavingsSection
							lang={lang}
							dictionary={dictionary}
							isActive={activeTab === "savings"}
							isAuthenticated={isAuthenticated}
							userUuid={profileData?.userUuid ?? null}
							walletBalance={profileData?.walletBalance ?? 0}
							savingsBalance={profileData?.savingsBalance ?? 0}
							unclaimedSavingsInterest={
								profileData?.unclaimedSavingsInterest ?? 0
							}
							basicIncomeAndInterestClaimedTotal={
								profileData?.basicIncomeAndInterestClaimedTotal ?? 0
							}
							isSelfVerified={Boolean(profileData?.selfVerifiedAt)}
							savingsLastUpdatedAt={profileData?.savingsLastUpdatedAt ?? null}
							onSuccess={fetchData}
							onSignIn={() => setShowSignInDialog(true)}
							selectedSavingsAccount={selectedSavingsAccount}
							onSelectedSavingsAccountChange={handleSavingsAccountChange}
						/>
					</div>

					{activeTab === "ambassadors" ? (
						<div className="flex flex-col items-start w-full p-6">
							<div className="w-full rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-6 mb-6 flex flex-col items-center text-center">
								<Typography
									variant="subtitle"
									level={1}
									className="mb-[10px]! text-[22px] font-semibold"
								>
									{dictionary.pages.govern.parties.ambassadors.title}
								</Typography>
								<Typography
									variant="body"
									level={3}
									className="text-center text-gray-500"
								>
									{dictionary.pages.govern.parties.ambassadors.description}
									<span className="inline-flex shrink-0 items-center">
										<button
											type="button"
											onClick={() => setIsLearnMoreDialogOpen(true)}
											className="inline-flex shrink-0 items-center justify-center text-gray-400"
											aria-label="Learn more"
										>
											<PiInfoFill className="mx-1 size-4 translate-y-[2px]!" />
										</button>
									</span>
								</Typography>
								<div className="mt-5 flex items-center gap-2 w-full">
									<Button
										variant="primary"
										size="sm"
										onClick={handleCopyReferralLink}
										fullWidth
									>
										{
											dictionary.pages.govern.parties.ambassadors
												.share_referral_link
										}
									</Button>
								</div>
							</div>

							<LearnMoreDialog
								open={isLearnMoreDialogOpen}
								onOpenChange={setIsLearnMoreDialogOpen}
								title={dictionary.pages.govern.parties.learn_more}
								externalLink={{
									url: "https://wiki.worldrepublic.org/building-blocks/ambassador-program",
									label: dictionary.pages.govern.parties.ambassadors.title,
								}}
							/>

							<Typography
								variant="subtitle"
								level={1}
								className="mb-3! text-[19px] font-semibold"
							>
								{dictionary.pages.govern.parties.ambassadors.leaderboard}
							</Typography>

							{leaderboardLoading ? (
								<div className="rounded-xl border border-gray-200 overflow-hidden w-full">
									<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 px-4 py-3">
										<Skeleton height={20} width={100} className="rounded" />
									</div>
									<div className="divide-y divide-gray-100">
										{[0, 1, 2].map((i) => (
											<div
												key={i}
												className="flex items-center justify-between px-4 py-3 gap-4"
											>
												<Skeleton height={16} width="40%" className="rounded" />
												<Skeleton height={16} width="20%" className="rounded" />
												<Skeleton height={16} width="20%" className="rounded" />
											</div>
										))}
									</div>
								</div>
							) : leaderboardError ? (
								<div className="flex flex-1 items-center justify-center text-sm text-gray-500 w-full mt-4 mb-8">
									{dictionary.toasts.generic_error}
								</div>
							) : leaderboard && leaderboard.length > 0 ? (
								<div className="rounded-xl border border-gray-200 overflow-hidden w-full min-w-0">
									<div
										className="grid min-w-0"
										style={{
											gridTemplateColumns:
												"minmax(0, 1fr) max-content max-content",
										}}
									>
										<div
											className="col-span-full row-start-1 min-h-10 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0"
											aria-hidden
										/>
										<div className="col-start-1 row-start-1 px-4 py-3 flex items-center">
											<Typography
												variant="subtitle"
												level={3}
												className="text-gray-500 leading-tight truncate min-w-0"
											>
												{
													dictionary.pages.govern.parties.ambassadors
														.col_ambassador
												}
											</Typography>
										</div>
										<div className="col-start-2 row-start-1 relative px-6 py-3 min-w-0">
											<Typography
												variant="subtitle"
												level={3}
												className="text-gray-500 whitespace-nowrap leading-tight absolute right-6 top-1/2 -translate-y-1/2!"
											>
												{
													dictionary.pages.govern.parties.ambassadors
														.col_invited
												}
											</Typography>
										</div>
										<div className="col-start-3 row-start-1 relative px-4 py-3 min-w-0">
											<Typography
												variant="subtitle"
												level={3}
												className="text-gray-500 whitespace-nowrap leading-tight absolute right-4 top-1/2 -translate-y-1/2!"
											>
												{dictionary.pages.govern.parties.ambassadors.col_reward}
											</Typography>
										</div>
										{ambassadorWithRank.map(({ entry, rank }) => (
											<Fragment key={entry.username}>
												<div className="flex items-center gap-2 min-w-0 pl-4 py-3">
													<span className="text-xs text-gray-400 tabular-nums w-4 shrink-0">
														{rank}
													</span>
													<Typography
														variant="body"
														level={3}
														className="font-medium text-gray-900 truncate min-w-0"
														title={entry.username}
													>
														{entry.username}
													</Typography>
												</div>
												<div className="flex items-center justify-end px-6 py-3 whitespace-nowrap">
													<Typography
														variant="body"
														level={3}
														className="text-gray-400 tabular-nums"
													>
														{formatInteger(entry.totalInvited)}
													</Typography>
												</div>
												<div className="flex items-center justify-end pr-4 py-3 whitespace-nowrap">
													<Typography
														variant="body"
														level={3}
														className="text-gray-900 tabular-nums"
													>
														{entry.reward > 0
															? `${formatTokenAmount(entry.reward)} WDD`
															: "0 WDD"}
													</Typography>
												</div>
											</Fragment>
										))}
									</div>
								</div>
							) : (
								<div className="flex flex-1 items-center justify-center text-sm text-gray-500 w-full mt-4 mb-8">
									{dictionary.pages.govern.parties.ambassadors.no_rewards_yet}
								</div>
							)}
						</div>
					) : activeTab === "subsidies" ? (
						<div className="flex flex-col items-start w-full p-6">
							<div className="w-full rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-6 mb-6 flex flex-col items-center text-center">
								<Typography
									variant="subtitle"
									level={1}
									className="mb-[10px]! text-[22px] font-semibold"
								>
									{dictionary.pages.govern.parties.subsidies.title}
								</Typography>
								<Typography
									variant="body"
									level={3}
									className="text-center text-gray-500 mt-px!"
								>
									{dictionary.pages.govern.parties.subsidies.description}
								</Typography>
								<div className="mt-5 w-full">
									<Button
										size="sm"
										onClick={() => setIsLearnMoreDialogOpen(true)}
										fullWidth
									>
										{dictionary.pages.govern.parties.learn_more}
									</Button>
								</div>
							</div>

							<LearnMoreDialog
								open={isLearnMoreDialogOpen}
								onOpenChange={setIsLearnMoreDialogOpen}
								title={dictionary.pages.govern.parties.learn_more}
								externalLink={{
									url: "https://wiki.worldrepublic.org/building-blocks/party-subsidies",
									label: dictionary.pages.govern.parties.subsidies.title,
								}}
							/>

							<Typography
								variant="subtitle"
								level={1}
								className="mb-3! text-[19px] font-semibold"
							>
								{dictionary.pages.govern.parties.ambassadors.leaderboard}
							</Typography>

							{subsidyLeaderboardLoading ? (
								<div className="rounded-xl border border-gray-200 overflow-hidden w-full">
									<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 px-4 py-3">
										<Skeleton height={20} width={100} className="rounded" />
									</div>
									<div className="divide-y divide-gray-100">
										{[0, 1, 2].map((i) => (
											<div
												key={i}
												className="flex items-center justify-between px-4 py-3 gap-4"
											>
												<Skeleton height={16} width="60%" className="rounded" />
												<Skeleton height={16} width="20%" className="rounded" />
											</div>
										))}
									</div>
								</div>
							) : subsidyLeaderboardError ? (
								<div className="flex flex-1 items-center justify-center text-sm text-gray-500 w-full mt-4 mb-8">
									{dictionary.toasts.generic_error}
								</div>
							) : subsidyLeaderboard && subsidyLeaderboard.length > 0 ? (
								<div className="rounded-xl border border-gray-200 overflow-hidden w-full">
									<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 px-4 py-3 grid grid-cols-[1fr_auto] gap-4">
										<Typography
											variant="subtitle"
											level={3}
											className="text-gray-500"
										>
											{dictionary.pages.govern.parties.detail.leader}
										</Typography>
										<Typography
											variant="subtitle"
											level={3}
											className="text-gray-500 text-right"
										>
											{dictionary.pages.govern.parties.subsidies.col_subsidy}
										</Typography>
									</div>
									<div className="divide-y divide-gray-100">
										{subsidyWithRank.map(({ entry, rank }) => (
											// biome-ignore lint/a11y/noStaticElementInteractions: row uses div for existing layout behavior
											// biome-ignore lint/a11y/useKeyWithClickEvents: click-only behavior is intentional for this row
											<div
												key={entry.partyId}
												onClick={() => {
													setSelectedPartyForDrawer({
														id: entry.partyId,
														name: entry.partyName,
													} as Party);
													setIsPartyDrawerOpen(true);
												}}
												className="grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-3 cursor-pointer"
											>
												<div className="flex items-center gap-2 min-w-0">
													<span className="text-xs text-gray-400 tabular-nums w-4 shrink-0">
														{rank}
													</span>
													<Typography
														variant="body"
														level={3}
														className="font-medium text-gray-900 truncate"
														title={`${entry.leaderUsername} (${entry.partyName})`}
													>
														{entry.leaderUsername}
														<span className="text-gray-400">
															{" "}
															({entry.partyName})
														</span>
													</Typography>
												</div>
												<Typography
													variant="body"
													level={3}
													className="text-gray-900 tabular-nums text-right"
												>
													{entry.totalSubsidy > 0
														? `${formatTokenAmount(entry.totalSubsidy)} WDD`
														: "0 WDD"}
												</Typography>
											</div>
										))}
									</div>
								</div>
							) : (
								<div className="flex flex-1 items-center justify-center text-sm text-gray-500 w-full mt-4 mb-8">
									{dictionary.pages.govern.parties.subsidies.no_subsidies_yet}
								</div>
							)}
						</div>
					) : null}
				</main>

				<PartyDetailDrawer
					open={isPartyDrawerOpen}
					onOpenChange={setIsPartyDrawerOpen}
					party={selectedPartyForDrawer}
					dictionary={dictionary}
				/>

				<SignInDialog
					open={showSignInDialog}
					onOpenChange={setShowSignInDialog}
					dictionary={dictionary}
				/>

				<ScrollToTopButton
					show={showLeaderboardScrollToTop && showScrollToTop}
					onClick={scrollToTop}
				/>
			</div>
		</OnchainWalletProvider>
	);
}
