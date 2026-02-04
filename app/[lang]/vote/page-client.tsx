"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { PiCaretLeft } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";
import { ElectionsList } from "@/components/vote/elections-list";
import type { Election } from "@/lib/types/elections";

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
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Elections"
        startAdornment={
          <button
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-full bg-gray-100"
          >
            <PiCaretLeft className="size-4 text-gray-900" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <ElectionsList elections={elections} dictionary={dictionary} />
      </div>
    </div>
  );
}
