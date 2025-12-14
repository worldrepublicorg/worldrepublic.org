import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import { PiChartBarHorizontalFill, PiScrollFill } from "react-icons/pi";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";

const TABS = ["elections", "referendums"] as const;
type TabKey = (typeof TABS)[number];

export default async function VotePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { lang } = await params;
  const { tab } = await searchParams;
  const dictionary = await getDictionary(lang);

  // Lazy load VoteButton with skeleton fallback
  const VoteButton = dynamic(
    () => import("@/components/vote/vote-button").then((mod) => mod.VoteButton),
    {
      loading: () => (
        <Button disabled fullWidth className="mt-6!">
          {dictionary.common.vote}
        </Button>
      ),
    },
  );

  // Validate tab from URL or default to first
  const activeTab: TabKey = TABS.includes(tab as TabKey)
    ? (tab as TabKey)
    : TABS[0];

  const currentIndex = TABS.indexOf(activeTab);

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

      <div className="relative flex grow items-center justify-center overflow-hidden">
        <div
          className="flex w-full items-center transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {/* Elections tab */}
          <div className="flex min-w-full flex-col items-center justify-center p-6 text-center">
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

          {/* Referendums tab */}
          <div className="flex min-w-full flex-col items-center justify-center p-6 text-center">
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
        </div>
      </div>
    </div>
  );
}
