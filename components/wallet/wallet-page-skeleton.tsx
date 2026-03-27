import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { TopBar } from "@/components/topbar";

/**
 * Shared wallet page skeleton. Used by:
 * - app/[lang]/wallet/loading.tsx (route-level loading, no text before data)
 * - WalletPageClient when showSkeleton (client-side wait for getWalletAuthAndData)
 * No title in TopBar to avoid text popping before data (same as Elections page).
 */
export function WalletPageSkeleton() {
  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        startAdornment={
          <Skeleton height={40} width={40} className="rounded-full" />
        }
      />
      <div className="flex flex-col gap-9 p-6">
        {/* Balance Display Skeleton */}
        <div className="flex flex-col items-center justify-center">
          <Skeleton height={18} width={40} className="rounded-lg mt-1!" />
          <div className="flex items-center justify-center mt-3">
            <Skeleton height={41} width={180} className="rounded-lg" />
          </div>
          <div className="flex flex-row w-full justify-around mt-5 px-6">
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Skeleton height={20} width={20} className="rounded-full" />
              </div>
              <Skeleton height={17} width={32} className="rounded-lg" />
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Skeleton height={20} width={20} className="rounded-full" />
              </div>
              <Skeleton height={17} width={32} className="rounded-lg" />
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <div className="mb-4 flex">
            <Skeleton height={18} width={48} className="rounded-lg" />
          </div>
          <div className="flex flex-1 flex-col">
            <button
              className="mb-8! flex items-center gap-1 self-start"
              disabled
            >
              <Skeleton height={20} width={48} className="rounded-lg" />
            </button>
            <div className="mb-6 space-y-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <div className="size-4.5 animate-pulse rounded-full bg-gray-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="h-[20px] w-24 animate-pulse rounded bg-gray-100" />
                      <div className="h-[17px] w-30 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="mt-1 h-4 w-10 animate-pulse rounded bg-gray-100" />
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
