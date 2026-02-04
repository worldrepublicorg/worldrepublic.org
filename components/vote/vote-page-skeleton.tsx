import { PiCaretLeft } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";

interface VotePageSkeletonProps {
  dictionary?: Dictionary;
  lang?: string;
  showTopBar?: boolean;
}

export function VotePageSkeleton({
  dictionary,
  lang,
  showTopBar = false,
}: VotePageSkeletonProps = {}) {
  return (
    <div className="flex h-full flex-col">
      {showTopBar && (
        <TopBar
          title={dictionary?.common?.vote || "Vote"}
          startAdornment={
            <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
              <PiCaretLeft className="size-4 text-gray-900" />
            </div>
          }
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-6">
          <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>

        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
