import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TabPills } from "@/components/tab-pills";

interface VotePageSkeletonProps {
  dictionary?: Dictionary;
  lang?: string;
}

export function VotePageSkeleton({
  dictionary,
  lang = "en",
}: VotePageSkeletonProps = {}) {
  return (
    <>
      <TabPills
        activeTab="elections"
        lang={lang}
        basePath={`/${lang}/vote`}
        tabs={[
          {
            key: "elections",
            label: dictionary?.pages?.govern?.tabs?.elections || "Elections",
          },
          {
            key: "referendums",
            label:
              dictionary?.pages?.govern?.tabs?.referendums || "Referendums",
          },
        ]}
      />
      <div className="flex grow flex-col overflow-y-auto">
        <div className="flex-1 overflow-y-auto p-6">
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
    </>
  );
}
