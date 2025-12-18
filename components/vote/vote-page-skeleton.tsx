import { PiChartBarHorizontalFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button, Pill, Typography } from "@/components/ui";

interface VotePageSkeletonProps {
  dictionary: Dictionary;
  lang: string;
}

export function VotePageSkeleton({ dictionary, lang }: VotePageSkeletonProps) {
  return (
    <>
      <div className="flex gap-1 px-6">
        <div className="shrink-0 whitespace-nowrap">
          <Pill checked={true}>{dictionary.pages.govern.tabs.elections}</Pill>
        </div>
        <div className="shrink-0 whitespace-nowrap">
          <Pill checked={false}>
            {dictionary.pages.govern.tabs.referendums}
          </Pill>
        </div>
      </div>
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
