"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiScrollFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { TopbarWalletBalanceDisplay } from "@/components/wallet/topbar-wallet-balance-display";
import { ElectionsList } from "@/components/vote/elections-list";
import type { Election } from "@/lib/types/elections";
import {
  type GetWalletAuthAndDataResult,
  getWalletAuthAndData,
} from "@/lib/actions/member";
import {
  getCachedWalletData,
  setCachedWalletData,
} from "@/lib/wallet-auth-cache";

const TABS = ["elections", "referendums"] as const;
type TabKey = (typeof TABS)[number];

interface VotePageClientProps {
  elections: Election[];
  dictionary: Dictionary;
  lang: string;
}

export default function VotePageClient({
  elections,
  dictionary,
  lang,
}: VotePageClientProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const [cachedData] = useState<GetWalletAuthAndDataResult | null>(
    getCachedWalletData,
  );
  const [serverData, setServerData] =
    useState<GetWalletAuthAndDataResult | null>(null);

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
  const walletBalance = data?.profileData?.walletBalance ?? null;

  // Client-side logic for tabs
  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

  return (
    <>
      <TopBar
        title={dictionary.nav.world_republic}
        endAdornment={
          <TopbarWalletBalanceDisplay walletBalance={walletBalance} lang={lang} />
        }
      />
      <TabPills
        activeTab={activeTab}
        lang={lang}
        basePath={`/${lang}`}
        tabs={[
          {
            key: "elections",
            label: dictionary.pages.govern.tabs.elections,
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
    </>
  );
}
