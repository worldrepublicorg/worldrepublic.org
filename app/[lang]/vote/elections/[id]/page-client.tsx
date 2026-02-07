"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PiCaretLeft } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ScrollToTopButton } from "@/components/parties/scroll-to-top-button";
import { TopBar } from "@/components/topbar";
import { ElectionDetailContent } from "@/components/vote/election-detail-content";
import type { Election, ElectionResult } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";

interface ElectionDetailPageClientProps {
  election: Election | null;
  parties: Party[];
  results: ElectionResult[];
  lang: string;
  dictionary: Dictionary;
}

export default function ElectionDetailPageClient({
  election,
  parties,
  results,
  lang,
  dictionary,
}: ElectionDetailPageClientProps) {
  const router = useRouter();
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.elections.detail.topbar_title}
        startAdornment={
          <button
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-full bg-gray-100"
          >
            <PiCaretLeft className="size-4 text-gray-900" />
          </button>
        }
      />

      <div className="flex flex-1 flex-col p-6">
        <ElectionDetailContent
          election={election}
          parties={parties}
          results={results}
          lang={lang}
          dictionary={dictionary}
        />
      </div>

      <ScrollToTopButton show={showScrollToTop} onClick={scrollToTop} />
    </div>
  );
}
