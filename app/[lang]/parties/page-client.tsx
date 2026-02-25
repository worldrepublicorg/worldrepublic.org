"use client";

import {
  Button,
  Skeleton,
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiArrowSquareOut } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { PoliticalPartyList } from "@/components/parties/political-party-list";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import { getWalletAuthAndData } from "@/lib/actions/member";
import {
  type AmbassadorLeaderboardEntry,
  getAmbassadorLeaderboard,
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
    await copyToClipboard(link, toast, {
      success: dictionary.toasts.copied,
      error: dictionary.toasts.generic_error,
    });
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
          // {
          //   key: "subsidies",
          //   label: dictionary.pages.govern.parties.tabs.subsidies,
          // },
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
          <div className="flex flex-col items-start w-full px-6 pt-4 pb-6">
            <div className="rounded-xl w-full border border-gray-200 bg-gray-50 p-4 mb-6 flex flex-col items-center text-center">
              <Typography
                variant="subtitle"
                level={1}
                className="mb-2 text-[22px] font-semibold"
              >
                {dictionary.pages.govern.parties.ambassadors.title}
              </Typography>
              <Typography
                variant="body"
                level={3}
                className="text-sm text-gray-500"
              >
                {dictionary.pages.govern.parties.ambassadors.description}
              </Typography>
              <div className="mt-5 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyReferralLink}
                >
                  {
                    dictionary.pages.govern.parties.ambassadors
                      .copy_referral_link
                  }
                </Button>
                <Link
                  href="https://wiki.worldrepublic.org/building-blocks/ambassador-program"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="inline-flex items-center gap-1.5"
                  >
                    {dictionary.pages.govern.parties.learn_more}
                    <PiArrowSquareOut className="size-4 shrink-0 text-gray-400" />
                  </Button>
                </Link>
              </div>
            </div>

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
              <div className="rounded-xl border border-gray-200 overflow-hidden w-full">
                <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 px-4 py-3 grid grid-cols-[1fr_auto_auto] gap-4">
                  <Typography
                    variant="subtitle"
                    level={3}
                    className="text-gray-700"
                  >
                    Ambassador
                  </Typography>
                  <Typography
                    variant="subtitle"
                    level={3}
                    className="text-gray-700 text-right whitespace-nowrap"
                  >
                    Leaders invited
                  </Typography>
                  <Typography
                    variant="subtitle"
                    level={3}
                    className="text-gray-700 text-right w-16"
                  >
                    Total stipend
                  </Typography>
                </div>
                <div className="divide-y divide-gray-100">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.username}
                      className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 tabular-nums w-4 shrink-0">
                          {index + 1}
                        </span>
                        <Typography
                          variant="body"
                          level={3}
                          className="font-medium text-gray-900 truncate"
                          title={entry.username}
                        >
                          {entry.username}
                        </Typography>
                      </div>
                      <Typography
                        variant="body"
                        level={3}
                        className="text-gray-900 tabular-nums text-right"
                      >
                        {entry.leadersInvited}
                      </Typography>
                      <Typography
                        variant="body"
                        level={3}
                        className="text-gray-400 tabular-nums text-right w-16"
                      >
                        0 WDD
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-500 w-full mt-4 mb-8">
                {dictionary.pages.govern.parties.ambassadors.no_stipends_yet}
              </div>
            )}
          </div>
        ) : (
          <div className="flex w-full grow items-center justify-center">
            {/* Subsidies tab - empty for now */}
          </div>
        )}
      </main>

      <SignInDialog
        open={showSignInDialog}
        onOpenChange={setShowSignInDialog}
        dictionary={dictionary}
      />
    </div>
  );
}
