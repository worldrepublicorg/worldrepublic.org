"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { BasicIncomeSection } from "@/components/earn/basic-income-section";
import { MenuLink } from "@/components/menu-link";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import {
  type GetWalletAuthAndDataResult,
  getWalletAuthAndData,
} from "@/lib/actions/member";
import {
  getCachedWalletData,
  setCachedWalletData,
} from "@/lib/wallet-auth-cache";

const SignInDialog = dynamic(
  () => import("@/components/sign-in-dialog").then((mod) => mod.SignInDialog),
  { ssr: false },
);

const TABS = ["basic_income"] as const;
type TabKey = (typeof TABS)[number];

interface EarnPageClientProps {
  lang: string;
  dictionary: Dictionary;
}

export default function EarnPageClient({ lang, dictionary }: EarnPageClientProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const { isAuthenticated: clientIsAuthenticated, showSignInDialog, setShowSignInDialog } = useAuth();

  const [cachedData] = useState<GetWalletAuthAndDataResult | null>(
    getCachedWalletData,
  );
  const [serverData, setServerData] =
    useState<GetWalletAuthAndDataResult | null>(null);

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

  const data = serverData ?? cachedData;
  const isAuthenticated =
    data?.authenticated ?? clientIsAuthenticated ?? false;
  const profileData = data?.profileData ?? null;

  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar title="Earn" endAdornment={<MenuLink lang={lang} />} />

      <TabPills
        activeTab={activeTab}
        lang={lang}
        basePath={`/${lang}/earn`}
        tabs={[{ key: "basic_income", label: "Basic income" }]}
      />

      <main className="flex grow flex-col">
        {activeTab === "basic_income" && (
          <BasicIncomeSection
            isAuthenticated={isAuthenticated}
            basicIncomeActivatedAt={
              profileData?.basicIncomeActivatedAt ?? null
            }
            lastBasicIncomeClaimAt={
              profileData?.lastBasicIncomeClaimAt ?? null
            }
            basicIncomeClaimedTotal={profileData?.basicIncomeClaimedTotal ?? 0}
            onSignIn={() => setShowSignInDialog(true)}
            onSuccess={fetchData}
          />
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
