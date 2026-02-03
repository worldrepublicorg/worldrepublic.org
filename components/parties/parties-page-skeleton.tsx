import { Pill, Skeleton, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiList, PiPlus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";

interface PartiesPageSkeletonProps {
  dictionary: Dictionary;
}

export function PartiesPageSkeleton({ dictionary }: PartiesPageSkeletonProps) {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.pages.govern.sections.parties.title}
        endAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiList className="size-4 text-gray-900" />
          </div>
        }
      />

      {/* <div className="flex gap-1 overflow-x-auto scroll-smooth scroll-snap-type-x-mandatory px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0 scroll-snap-align-start whitespace-nowrap pl-0">
          <Pill checked>{dictionary.pages.govern.parties.tabs.registry}</Pill>
        </div>
        <div className="shrink-0 scroll-snap-align-start whitespace-nowrap pr-0">
          <Pill checked={false}>
            {dictionary.pages.govern.parties.tabs.subsidies}
          </Pill>
        </div>
      </div> */}

      <main className="flex grow flex-col items-start">
        {/* My Party Section */}
        <div className="mt-2 mb-6 w-full px-6">
          <div className="mb-3 flex items-center justify-between">
            <Typography
              variant="subtitle"
              level={1}
              className="text-[19px] font-semibold"
            >
              {dictionary.pages.govern.parties.my_party}
            </Typography>
            <button
              className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-900"
              disabled
              aria-label="Create party"
            >
              <PiPlus className="size-4 text-gray-900" />
            </button>
          </div>
          {/* Party card skeleton - assuming user has a party */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              {/* Party name */}
              <div className="flex-1">
                <Skeleton height={24} width="60%" className="mb-1" />
              </div>
              <Skeleton height={32} width={32} className="rounded-full" />
            </div>
            {/* Party website */}
            <div className="flex items-center justify-between mt-3">
              <Skeleton height={20} width={120} />
              <Skeleton height={20} width={95} />
            </div>
          </div>
        </div>

        {/* Discover Section */}
        <Typography
          variant="subtitle"
          level={1}
          className="mb-3! text-[19px] font-semibold px-6 w-full"
        >
          {dictionary.pages.govern.parties.discover}
        </Typography>

        {/* Search bar skeleton - matching Input component structure */}
        <div className="mb-5 h-12.5 px-6 w-full">
          <div className="bg-gray-100 text-gray-900 h-14 inline-flex w-full shrink cursor-text items-center overflow-hidden border border-gray-100 rounded-[0.625rem] outline-none transition-all duration-300 ease-out px-4 gap-2">
            {/* Start adornment - search icon */}
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
            {/* Input placeholder text */}
            <input
              type="text"
              placeholder={dictionary.pages.govern.parties.search_placeholder}
              disabled
              className="peer inline-block h-full grow w-full appearance-none bg-transparent border-none text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed text-sm leading-tight"
              readOnly
            />
          </div>
        </div>

        {/* Party cards skeleton - matching actual PartyCard structure */}
        <div className="w-full px-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  {/* Party name */}
                  <div className="flex-1">
                    <Skeleton height={24} width="60%" className="mb-1" />
                  </div>
                </div>
                {/* Party description */}
                <div className="mt-3">
                  <Skeleton height={16} width="100%" className="mb-1" />
                  <Skeleton height={16} width="80%" />
                </div>
                {/* Party website */}
                <div className="flex items-center justify-between mt-3">
                  <Skeleton height={20} width={120} />
                  <Skeleton height={20} width={95} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
