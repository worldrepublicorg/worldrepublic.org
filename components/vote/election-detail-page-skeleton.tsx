import {
  Button,
  Skeleton,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import {
  PiCalendarBlank,
  PiCaretLeft,
  PiCoins,
  PiUserFocus,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";

interface ElectionDetailPageSkeletonProps {
  dictionary: Dictionary;
}

export function ElectionDetailPageSkeleton({
  dictionary,
}: ElectionDetailPageSkeletonProps) {
  const t = dictionary.pages.govern.elections.detail;

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={t.topbar_title}
        startAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiCaretLeft className="size-4 text-gray-900" />
          </div>
        }
      />

      <div className="flex flex-1 flex-col p-6">
        {/* Hero section - skeletons for title and status badge */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <Skeleton height={36} width={200} className="rounded-lg" />
          <Skeleton height={30} width={60} className="rounded-full" />
        </div>

        {/* Election info card - fixed header, skeletons for variable content */}
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
            <Typography variant="subtitle" level={3} className="text-gray-900">
              {t.election_info}
            </Typography>
          </div>
          <div className="flex flex-col gap-7 p-4 divide-y divide-gray-100">
            <div className="flex items-center gap-2">
              <PiCalendarBlank className="text-gray-400 shrink-0 size-4" />
              <Skeleton height={20} width="80%" className="rounded" />
            </div>
            <div className="flex items-center gap-2">
              <PiCoins className="text-gray-400 shrink-0 size-4" />
              <Skeleton height={20} width={160} className="rounded" />
            </div>
          </div>
        </div>

        {/* Choose a party section - fixed label, search skeleton, party row skeletons */}
        <Typography
          variant="subtitle"
          level={1}
          className="mb-3! text-[19px] font-semibold"
        >
          {t.choose_a_party}
        </Typography>

        <div className="mb-5 h-12.5">
          <div className="bg-gray-100 text-gray-900 inline-flex h-14 w-full shrink cursor-text items-center overflow-hidden rounded-[0.625rem] border border-gray-100 px-4 outline-none transition-all duration-300 ease-out gap-2">
            <div className="inline-flex shrink-0 items-center justify-center text-gray-500">
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
            <Skeleton height={20} width={120} className="rounded" />
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-7 p-4 divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Skeleton height={24} width="60%" className="mb-1 rounded" />
                  <div className="flex items-center gap-1 mt-1">
                    <PiUserFocus className="size-3.5 text-gray-400 shrink-0" />
                    <Skeleton height={16} width={100} className="rounded" />
                  </div>
                </div>
                <Skeleton height={32} width={72} className="rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
