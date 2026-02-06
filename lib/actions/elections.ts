"use server";

import { count, desc, eq, getTableColumns } from "drizzle-orm";
import { getDbReadOnly } from "@/lib/db/connection";
import { elections, parties, votes } from "@/lib/db/schema";
import type { Election, ElectionResult } from "@/lib/types/elections";

// Helper to convert PostgreSQL election row to Election object
function pgRowToElection(row: {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  rewardPool: string;
  createdAt: Date;
}): Election {
  return {
    id: row.id,
    name: row.name,
    startsAt: row.startsAt.getTime(),
    endsAt: row.endsAt.getTime(),
    rewardPool: row.rewardPool,
    createdAt: row.createdAt.getTime(),
  };
}

export async function getElections(): Promise<Election[]> {
  try {
    const readDb = getDbReadOnly();

    const electionRows = await readDb
      .select(getTableColumns(elections))
      .from(elections)
      .orderBy(desc(elections.startsAt));

    return electionRows.map(pgRowToElection);
  } catch (error) {
    console.error("Error fetching elections:", error);
    return [];
  }
}

export async function getElection(id: string): Promise<Election | null> {
  try {
    const readDb = getDbReadOnly();

    const [row] = await readDb
      .select(getTableColumns(elections))
      .from(elections)
      .where(eq(elections.id, id))
      .limit(1);

    if (!row) return null;
    return pgRowToElection(row);
  } catch (error) {
    console.error("Error fetching election:", error);
    return null;
  }
}

export async function getElectionResults(
  electionId: string,
): Promise<ElectionResult[]> {
  try {
    const readDb = getDbReadOnly();

    const rows = await readDb
      .select({
        partyId: votes.partyId,
        partyName: parties.name,
        voteCount: count(votes.id),
      })
      .from(votes)
      .innerJoin(parties, eq(votes.partyId, parties.id))
      .where(eq(votes.electionId, electionId))
      .groupBy(votes.partyId, parties.name)
      .orderBy(desc(count(votes.id)));

    return rows.map((row) => ({
      partyId: row.partyId,
      partyName: row.partyName,
      voteCount: row.voteCount,
    }));
  } catch (error) {
    console.error("Error fetching election results:", error);
    return [];
  }
}
