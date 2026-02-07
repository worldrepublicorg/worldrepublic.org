import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiChartBarHorizontalFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TabPills } from "@/components/tab-pills";

interface VotePageSkeletonProps {
  dictionary: Dictionary;
  lang: string;
}

export function VotePageSkeleton({ dictionary, lang }: VotePageSkeletonProps) {
  return (
    <>
      <TabPills
        activeTab="elections"
        lang={lang}
        tabs={[
          {
            key: "elections",
            label: dictionary.pages.govern.tabs.elections,
          },
          {
            key: "referendums",
            label: dictionary.pages.govern.tabs.referendums,
          },
        ]}
      />
      <div className="flex grow items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex w-full flex-col items-center gap-4">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <PiChartBarHorizontalFill className="h-10 w-10 text-gray-400" />
            </div>
            <Typography variant="heading" level={2}>
              {dictionary.pages.govern.sections.elections.title}
            </Typography>
            <Typography variant="subtitle" level={2} className="text-gray-500">
              {dictionary.pages.govern.sections.elections.subtitle}
            </Typography>
            <Button disabled fullWidth className="mt-6!">
              {dictionary.common.vote}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
