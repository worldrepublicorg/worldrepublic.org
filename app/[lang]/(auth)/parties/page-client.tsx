"use client";

import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { PoliticalPartyList } from "@/components/parties/political-party-list";
import { TabPills } from "@/components/tab-pills";
import { TopBar } from "@/components/topbar";
import type { Party } from "@/lib/types/parties";

const TABS = ["registry", "subsidies"] as const;
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
          {
            key: "subsidies",
            label: dictionary.pages.govern.parties.tabs.subsidies,
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
        ) : (
          <div className="flex w-full grow items-center justify-center">
            {/* Subsidies tab - empty for now */}
          </div>
        )}
      </main>
    </div>
  );
}
