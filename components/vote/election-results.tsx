"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { ElectionResult } from "@/lib/types/elections";

interface ElectionResultsProps {
  results: ElectionResult[];
  dictionary: Dictionary;
}

export function ElectionResults({
  results,
  dictionary,
}: ElectionResultsProps) {
  const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
  const t = dictionary.pages.govern.elections.detail;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
        <div className="flex items-center justify-between">
          <Typography variant="subtitle" level={3} className="text-gray-900">
            {t.results_title}
          </Typography>
          <Typography variant="body" level={3} className="text-gray-500">
            {totalVotes}{" "}
            {totalVotes === 1 ? t.vote_singular : t.vote_plural}
          </Typography>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="p-6 text-center">
          <Typography variant="body" level={3} className="text-gray-500">
            {t.no_votes}
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-7 p-4 divide-y divide-gray-100">
          {results.map((result, index) => {
            const percentage =
              totalVotes > 0
                ? Math.round((result.voteCount / totalVotes) * 100)
                : 0;

            return (
              <div key={result.partyId}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">
                      #{index + 1}
                    </span>
                    <Typography
                      variant="subtitle"
                      level={3}
                      className="text-gray-900"
                    >
                      {result.partyName}
                    </Typography>
                  </div>
                  <Typography
                    variant="body"
                    level={3}
                    className="text-gray-600"
                  >
                    {result.voteCount}{" "}
                    {result.voteCount === 1
                      ? t.vote_singular
                      : t.vote_plural}{" "}
                    ({percentage}%)
                  </Typography>
                </div>
                {/* Bar visualization */}
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-gray-900 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
