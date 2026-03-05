"use client";

import {
  Button,
  Skeleton,
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { PiInfoFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { LearnMoreDrawer } from "@/components/learn-more-drawer";
import { MenuLink } from "@/components/menu-link";
import { PoliticalPartyList } from "@/components/parties/political-party-list";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import { getWalletAuthAndData } from "@/lib/actions/member";
import {
  type AmbassadorLeaderboardEntry,
  getAmbassadorLeaderboard,
  getSubsidyLeaderboard,
  type SubsidyLeaderboardEntry,
} from "@/lib/actions/referrals";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";
import {
  getCachedWalletData,
  setCachedWalletData,
} from "@/lib/wallet-auth-cache";

const SignInDialog = dynamic(
  () => import("@/components/sign-in-dialog").then((mod) => mod.SignInDialog),
  { ssr: false },
);

const TABS = ["registry", "subsidies", "ambassadors"] as const;
type TabKey = (typeof TABS)[number];

interface PartiesPageClientProps {
  parties: Party[] | null;
  dictionary: Dictionary;
  lang: string;
}

export default function PartiesPageClient({
  parties,
  dictionary,
  lang,
}: PartiesPageClientProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const { toast } = useToast();
  const { isAuthenticated, showSignInDialog, setShowSignInDialog } = useAuth();

  const [cachedData] = useState(() => getCachedWalletData());
  const [referralCode, setReferralCode] = useState<string | null>(
    cachedData?.profileData?.referralCode ?? null,
  );

  const [leaderboard, setLeaderboard] = useState<
    AmbassadorLeaderboardEntry[] | null
  >(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [isLearnMoreDrawerOpen, setIsLearnMoreDrawerOpen] = useState(false);

  const [subsidyLeaderboard, setSubsidyLeaderboard] = useState<
    SubsidyLeaderboardEntry[] | null
  >(null);
  const [subsidyLeaderboardLoading, setSubsidyLeaderboardLoading] =
    useState(false);
  const [subsidyLeaderboardError, setSubsidyLeaderboardError] = useState(false);

  // Hydrate referral code from server when authenticated and not yet loaded
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

        // Keep auth cache in sync so other pages see latest data
        setCachedWalletData(result);
      } catch {
        // Best-effort only; handled on button click as well
      }
    };

    void fetchReferralCode();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, referralCode]);

  // Client-side logic for tabs (declared early so effects can reference it)
  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

  const locale = lang.trim() || "en";

  const formatInteger = (value: number): string => value.toLocaleString(locale);

  const formatTokenAmount = (amount: number): string =>
    amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Fetch leaderboard lazily when the ambassadors tab becomes active
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

  // Fetch subsidy leaderboard lazily when the subsidies tab becomes active
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

  const handleCopyReferralLink = async () => {
    if (!isAuthenticated) {
      setShowSignInDialog(true);
      return;
    }

    let code = referralCode;

    // Fallback: fetch fresh data if we don't yet have a referral code
    if (!code) {
      try {
        const result = await getWalletAuthAndData();
        if (result.profileData?.referralCode) {
          code = result.profileData.referralCode;
          setReferralCode(code);
          setCachedWalletData(result);
        }
      } catch {
        // Ignore here; we'll handle the "no code" case below
      }
    }

    if (!code) {
      // Unlikely, but avoid opening sign-in again when user is already authenticated
      toast.error({
        title: dictionary.toasts.generic_error,
      });
      return;
    }

    const link = `${window.location.origin}/?ref=${code}`;

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

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.sections.parties.title}
        endAdornment={<MenuLink lang={lang} />}
      />

      <TabPills
        activeTab={activeTab}
        lang={lang}
        basePath={`/${lang}/parties`}
        tabs={[
          {
            key: "registry",
            label: dictionary.pages.govern.parties.tabs.registry,
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

      <main className="flex grow flex-col items-start">
        {activeTab === "registry" ? (
          <PoliticalPartyList
            initialParties={parties}
            dictionary={dictionary}
            lang={lang}
          />
        ) : activeTab === "ambassadors" ? (
          <div className="flex flex-col items-start w-full p-6">
            <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-6 mb-6 flex flex-col items-center text-center shadow-sm">
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
                    onClick={() => setIsLearnMoreDrawerOpen(true)}
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

            <LearnMoreDrawer
              open={isLearnMoreDrawerOpen}
              onOpenChange={setIsLearnMoreDrawerOpen}
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
                  {/* Single header background spanning full width */}
                  <div
                    className="col-span-full row-start-1 min-h-10 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0"
                    aria-hidden
                  />
                  {/* Header row – labels only; column widths come from data grid below */}
                  <div className="col-start-1 row-start-1 px-4 py-3 flex items-center">
                    <Typography
                      variant="subtitle"
                      level={3}
                      className="text-gray-500 leading-tight truncate min-w-0"
                    >
                      {
                        dictionary.pages.govern.parties.ambassadors.col_ambassador
                      }
                    </Typography>
                  </div>
                  <div className="col-start-2 row-start-1 relative px-6 py-3 min-w-0">
                    <Typography
                      variant="subtitle"
                      level={3}
                      className="text-gray-500 whitespace-nowrap leading-tight absolute right-6 top-1/2 -translate-y-1/2!"
                    >
                      {dictionary.pages.govern.parties.ambassadors.col_invited}
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
                  {/* Data rows – these define column widths (Invited/Reward = max-content) */}
                  {leaderboard.map((entry, index) => (
                    <Fragment key={entry.username}>
                      <div className="flex items-center gap-2 min-w-0 pl-4 py-3">
                        <span className="text-xs text-gray-400 tabular-nums w-4 shrink-0">
                          {index + 1}
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
            <div className="w-full rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-6 mb-6 flex flex-col items-center text-center shadow-sm">
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
                className="text-center text-gray-500"
              >
                {dictionary.pages.govern.parties.subsidies.description}
              </Typography>
              <div className="mt-5 w-full">
                <Button
                  size="sm"
                  onClick={() => setIsLearnMoreDrawerOpen(true)}
                  fullWidth
                >
                  {dictionary.pages.govern.parties.learn_more}
                </Button>
              </div>
            </div>

            <LearnMoreDrawer
              open={isLearnMoreDrawerOpen}
              onOpenChange={setIsLearnMoreDrawerOpen}
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
                  {subsidyLeaderboard.map((entry, index) => (
                    <div
                      key={`${entry.leaderUsername}-${entry.partyName}`}
                      className="grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 tabular-nums w-4 shrink-0">
                          {index + 1}
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

      <SignInDialog
        open={showSignInDialog}
        onOpenChange={setShowSignInDialog}
        dictionary={dictionary}
      />
    </div>
  );
}
