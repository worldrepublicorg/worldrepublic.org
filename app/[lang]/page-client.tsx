"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiChartBarHorizontalFill, PiScrollFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { HomePageSkeleton } from "@/components/home/home-page-skeleton";
import { MenuLink } from "@/components/menu-link";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import { getFeaturedElectionId } from "@/lib/actions/elections";

const TABS = ["elections", "referendums"] as const;
type TabKey = (typeof TABS)[number];

interface HomePageClientProps {
  lang: string;
  dictionary: Dictionary;
}

export function HomePageClient({ lang, dictionary }: HomePageClientProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const [featuredElectionId, setFeaturedElectionId] = useState<
    string | null | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    getFeaturedElectionId().then((result) => {
      if (cancelled) return;
      setFeaturedElectionId(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Client-side logic for tabs
  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

  const voteHref = featuredElectionId
    ? `/${lang}/vote/elections/${featuredElectionId}`
    : `/${lang}/vote`;

  // Show skeleton while loading
  if (featuredElectionId === undefined) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.nav.world_republic}
        endAdornment={<MenuLink lang={lang} />}
      />
      <TabPills
        activeTab={activeTab}
        lang={lang}
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
      <div className="flex grow items-center justify-center">
        {activeTab === "elections" ? (
          <div className="flex w-full flex-col items-center justify-center p-6 text-center">
            <div className="flex w-full flex-col items-center gap-4">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <PiChartBarHorizontalFill className="h-10 w-10 text-gray-400" />
              </div>
              <Typography variant="heading" level={2}>
                {dictionary.pages.govern.sections.elections.title}
              </Typography>
              <Typography
                variant="subtitle"
                level={2}
                className="text-gray-500"
              >
                {dictionary.pages.govern.sections.elections.subtitle}
              </Typography>
              <Link href={voteHref} className="w-full">
                <Button fullWidth className="mt-6!">
                  {dictionary.common.vote}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center p-6 text-center">
            <div className="flex w-full flex-col items-center gap-4">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <PiScrollFill className="h-10 w-10 text-gray-400" />
              </div>
              <Typography variant="heading" level={2}>
                {dictionary.pages.govern.sections.referendums.title}
              </Typography>
              <Typography
                variant="subtitle"
                level={2}
                className="text-gray-500"
              >
                {dictionary.pages.govern.sections.referendums.subtitle}
              </Typography>
              <Button disabled fullWidth className="mt-6!">
                {dictionary.common.coming_soon}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
