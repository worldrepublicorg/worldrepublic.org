import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { PiList, PiPlus } from "react-icons/pi";
import { TopBar } from "@/components/topbar";

/**
 * Parties page skeleton. Used by:
 * - app/[lang]/parties/loading.tsx (route-level loading)
 * - Parties page Suspense fallback
 * No title in TopBar to avoid text popping before data (same as Wallet/Menu/Account).
 */
export function PartiesPageSkeleton() {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        endAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiList className="size-4 text-gray-900" />
          </div>
        }
      />

      <main className="flex grow flex-col items-start">
        {/* My Party Section */}
        <div className="mt-4 mb-6 w-full px-6">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton height={23} width={80} className="rounded-lg" />
            <button
              className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-900"
              disabled
              aria-label="Create party"
            >
              <PiPlus className="size-4 text-gray-900" />
            </button>
          </div>
          {/* Party card skeleton */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton height={24} width="60%" className="mb-1 rounded-lg" />
              </div>
              <Skeleton height={32} width={32} className="rounded-full" />
            </div>
            <div className="flex items-center justify-between mt-4">
              <Skeleton height={22} width={120} className="rounded-lg" />
              <Skeleton height={22} width={95} className="rounded-lg" />
            </div>
          </div>
        </div>

        {/* Discover Section */}
        <div className="mb-3! px-6 w-full">
          <Skeleton height={23} width={80} className="rounded-lg" />
        </div>

        {/* Search bar skeleton */}
        <div className="mb-5 h-12.5 px-6 w-full">
          <div className="bg-gray-100 text-gray-900 h-14 inline-flex w-full shrink cursor-text items-center overflow-hidden border border-gray-100 rounded-[0.625rem] outline-none transition-all duration-300 ease-out px-4 gap-2">
            <div className="inline-flex items-center justify-center shrink-0 text-gray-500">
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <Skeleton height={15} width={40} className="rounded-lg" />
          </div>
        </div>

        {/* Party cards skeleton */}
        <div className="w-full px-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton
                      height={24}
                      width="60%"
                      className="mb-1 rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton
                    height={16}
                    width="100%"
                    className="mb-1! rounded-lg"
                  />
                  <Skeleton height={16} width="80%" className="rounded-lg" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Skeleton height={20} width={120} className="rounded-lg" />
                  <Skeleton height={20} width={95} className="rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
