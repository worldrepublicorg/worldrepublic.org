import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { PiList } from "react-icons/pi";
import { TopBar } from "@/components/topbar";

/**
 * Homepage skeleton. Used by:
 * - app/[lang]/loading.tsx (route-level loading)
 * - HomePageClient when featuredElectionId is undefined (loading state)
 * No title in TopBar to avoid text popping before data (same as Wallet/Menu/Account).
 */
export function HomePageSkeleton() {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        endAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiList className="size-4 text-gray-900" />
          </div>
        }
      />
      {/* Tab pills skeleton */}
      <div className="flex gap-1 overflow-x-auto px-6">
        <Skeleton height={36} width={80} className="rounded-full" />
        <Skeleton height={36} width={80} className="rounded-full" />
      </div>
      <div className="flex grow items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex w-full flex-col items-center gap-4">
            <Skeleton height={96} width={96} className="rounded-full mb-4!" />
            <Skeleton height={36} width={120} className="rounded-lg" />
            <Skeleton height={20} width={160} className="rounded-lg" />
            <Skeleton height={56} width="100%" className="mt-6! rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
