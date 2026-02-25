"use client";

import {
  Button,
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PiArrowSquareOut } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { PoliticalPartyList } from "@/components/parties/political-party-list";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";
import { getCachedWalletData } from "@/lib/wallet-auth-cache";

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
  const referralCode = cachedData?.profileData?.referralCode ?? null;

  const handleCopyReferralLink = async () => {
    if (!isAuthenticated || !referralCode) {
      setShowSignInDialog(true);
      return;
    }
    const link = `${window.location.origin}/?ref=${referralCode}`;
    await copyToClipboard(link, toast, {
      success: dictionary.toasts.copied,
      error: dictionary.toasts.generic_error,
    });
  };

  // Client-side logic for tabs
  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

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
                className="mb-2 text-[21px] font-semibold"
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
              <div className="mt-4.5 flex items-center gap-2">
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
                  href="https://wiki.worldrepublic.org/building-blocks/party-subsidies"
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

            <div className="flex flex-1 items-center justify-center text-sm text-gray-500 w-full mt-4 mb-8">
              {dictionary.pages.govern.parties.ambassadors.no_stipends_yet}
            </div>
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
