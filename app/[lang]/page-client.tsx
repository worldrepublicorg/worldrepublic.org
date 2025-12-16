"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useSearchParams } from "next/navigation";
import { PiChartBarHorizontalFill, PiScrollFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TabPills } from "@/components/tab-pills";
import { VoteButton } from "@/components/vote/vote-button";

const TABS = ["elections", "referendums"] as const;
type TabKey = (typeof TABS)[number];

export function VotePageClient({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  // Client-side logic for tabs
  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

  return (
    <>
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
              <VoteButton
                fullWidth
                className="mt-6!"
                label={dictionary.common.vote}
                dictionary={dictionary}
              />
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
    </>
  );
}

