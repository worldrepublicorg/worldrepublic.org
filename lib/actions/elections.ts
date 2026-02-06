"use server";

import { count, desc, eq, getTableColumns } from "drizzle-orm";
import { getDbReadOnly } from "@/lib/db/connection";
import { elections, parties, votes } from "@/lib/db/schema";
import type { Election, ElectionResult } from "@/lib/types/elections";

/**
 * Pick the most important election for the hero card/featured election.
 * Priority: active > soonest upcoming > most recently ended.
 */
function pickFeaturedElection(elections: Election[]): Election | null {
  if (elections.length === 0) return null;

  const now = Date.now();

  const active = elections.filter(
    (election) => now >= election.startsAt && now <= election.endsAt,
  );
  if (active.length > 0) {
    // Pick the one ending soonest
    return active.sort((a, b) => a.endsAt - b.endsAt)[0];
  }

  const upcoming = elections.filter((election) => now < election.startsAt);
  if (upcoming.length > 0) {
    // Pick the one starting soonest
    return upcoming.sort((a, b) => a.startsAt - b.startsAt)[0];
  }

  // All ended — pick the most recently ended
  return elections.sort((a, b) => b.endsAt - a.endsAt)[0];
}

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

/**
 * Get the ID of the featured election (most important one).
 * Priority: active > soonest upcoming > most recently ended.
 */
export async function getFeaturedElectionId(): Promise<string | null> {
  try {
    const elections = await getElections();
    const featured = pickFeaturedElection(elections);
    return featured?.id ?? null;
  } catch (error) {
    console.error("Error fetching featured election ID:", error);
    return null;
  }
}
