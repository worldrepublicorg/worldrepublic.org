import {
  PiArrowsClockwise,
  PiArrowUp,
  PiCaretDown,
  PiList,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";
import { Skeleton, Typography } from "@/components/ui";

interface WalletPageSkeletonProps {
  dictionary: Dictionary;
}

export function WalletPageSkeleton({ dictionary }: WalletPageSkeletonProps) {
  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title={dictionary.pages.wallet.topbar.title}
        endAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiList className="size-4 text-gray-900" />
          </div>
        }
      />
      <div className="flex flex-col gap-9 p-6">
        {/* Balance Display Skeleton */}
        <div className="flex flex-col items-center justify-center">
          <Typography
            variant="subtitle"
            level={3}
            className="text-gray-500 mt-1!"
          >
            {dictionary.pages.wallet.balance}
          </Typography>
          <div className="flex items-center justify-center mt-3">
            <Skeleton height={41} width={180} />
          </div>
          <div className="flex flex-row w-full justify-around mt-5 px-6">
            {/* Send */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <PiArrowUp className="h-5 w-5 text-gray-900" />
              </div>
              <Typography
                variant="body"
                level={4}
                className="text-gray-900 font-medium"
              >
                {dictionary.pages.wallet.modals.send.button}
              </Typography>
            </div>

            {/* Trade */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <PiArrowsClockwise className="h-5 w-5 text-gray-900" />
              </div>
              <Typography
                variant="body"
                level={4}
                className="text-gray-900 font-medium"
              >
                {dictionary.common.trade}
              </Typography>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <div className="mb-4 flex">
            <Typography variant="subtitle" level={3} className="text-gray-400">
              {dictionary.pages.wallet.history.title}
            </Typography>
          </div>
          <div className="flex flex-1 flex-col">
            {/* Filter button skeleton */}
            <button
              className="mb-8! flex items-center gap-1 self-start"
              disabled
            >
              <Typography
                variant="body"
                level={3}
                className="font-medium text-gray-900"
              >
                {dictionary.pages.wallet.transactions.filter.all_types}
              </Typography>
              <PiCaretDown className="size-4 text-gray-500" />
            </button>

            {/* Transaction skeletons */}
            <div className="mb-6 space-y-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  {/* Icon skeleton */}
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <div className="size-4.5 animate-pulse rounded-full bg-gray-200"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="h-[20px] w-24 animate-pulse rounded bg-gray-100"></div>
                      <div className="h-[17px] w-30 animate-pulse rounded bg-gray-100"></div>
                    </div>
                    <div className="mt-1 h-4 w-10 animate-pulse rounded bg-gray-100"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
