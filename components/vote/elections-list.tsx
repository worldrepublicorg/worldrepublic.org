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
  const now = Date.now();

  // Group elections by status
  const activeElections = elections.filter(
    (election) => now >= election.startsAt && now <= election.endsAt,
  );
  const upcomingElections = elections.filter(
    (election) => now < election.startsAt,
  );
  const endedElections = elections.filter((election) => now > election.endsAt);

  // If no elections at all
  if (elections.length === 0) {
    return (
      <div className="mt-4 mb-8 text-center text-sm text-gray-500">
        No elections found
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Active Elections Section */}
      {activeElections.length > 0 && (
        <div className="mb-6">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold mb-3!"
          >
            Active elections
          </Typography>
          <div className="flex flex-col">
            {activeElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                isLastItem={index === activeElections.length - 1}
                dictionary={dictionary}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Elections Section */}
      {upcomingElections.length > 0 && (
        <div className="mb-6">
          <Typography
            variant="subtitle"
            level={1}
            className="text-[19px] font-semibold mb-3!"
          >
            Upcoming elections
          </Typography>
          <div className="flex flex-col">
            {upcomingElections.map((election, index) => (
              <ElectionCard
                key={election.id}
                election={election}
                isLastItem={index === upcomingElections.length - 1}
                dictionary={dictionary}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previous Elections Section - Always shown */}
      <Typography
        variant="subtitle"
        level={1}
        className="text-[19px] font-semibold mb-3!"
      >
        Previous elections
      </Typography>
      {endedElections.length > 0 ? (
        <div className="flex flex-col">
          {endedElections.map((election, index) => (
            <ElectionCard
              key={election.id}
              election={election}
              isLastItem={index === endedElections.length - 1}
              dictionary={dictionary}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 mb-8 text-center text-sm text-gray-500">
          No previous elections
        </div>
      )}
    </div>
  );
}
