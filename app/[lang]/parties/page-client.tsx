"use client";

import type { Dictionary } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { PoliticalPartyList } from "@/components/parties/political-party-list";
import { TopBar } from "@/components/topbar";
import type { Party } from "@/lib/types/parties";

interface PartiesPageClientProps {
  parties: Party[];
  dictionary: Dictionary;
  lang: string;
}

export default function PartiesPageClient({
  parties,
  dictionary,
  lang,
}: PartiesPageClientProps) {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.sections.parties.title}
        endAdornment={<MenuLink lang={lang} />}
      />

      <main className="flex grow flex-col items-start">
        <PoliticalPartyList
          initialParties={parties}
          dictionary={dictionary}
          lang={lang}
        />
      </main>
    </div>
  );
}
