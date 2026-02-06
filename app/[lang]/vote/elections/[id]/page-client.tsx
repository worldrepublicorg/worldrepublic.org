"use client";

import { useRouter } from "next/navigation";
import { PiCaretLeft } from "react-icons/pi";
import { TopBar } from "@/components/topbar";
import { ElectionDetailContent } from "@/components/vote/election-detail-content";
import type { Election, ElectionResult } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";

interface ElectionDetailPageClientProps {
  election: Election | null;
  parties: Party[];
  results: ElectionResult[];
  lang: string;
}

export default function ElectionDetailPageClient({
  election,
  parties,
  results,
  lang,
}: ElectionDetailPageClientProps) {
  const router = useRouter();

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title="Election"
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
        />
      </div>
    </div>
  );
}
