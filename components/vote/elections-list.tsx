"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ElectionCard } from "@/components/vote/election-card";
import type { Election } from "@/lib/types/elections";

interface ElectionsListProps {
  elections: Election[];
  dictionary: Dictionary;
}

export function ElectionsList({ elections, dictionary }: ElectionsListProps) {
  if (elections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Typography variant="body" level={1} className="text-gray-500">
          No elections found
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {elections.map((election, index) => (
        <ElectionCard
          key={election.id}
          election={election}
          isLastItem={index === elections.length - 1}
          dictionary={dictionary}
        />
      ))}
    </div>
  );
}
