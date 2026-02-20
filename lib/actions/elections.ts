"use server";

import { count, desc, eq, getTableColumns } from "drizzle-orm";
import { getParties } from "@/lib/actions/parties";
import { getDbReadOnly } from "@/lib/db/connection";
import { elections, parties, votes } from "@/lib/db/schema";
import type { Election, ElectionResult } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";

/**
 * Pick the most important election for the hero card/featured election.
 * Priority: active > soonest upcoming > most recently ended.
 */
const EXCLUDED_FEATURED_IDS = new Set([
  "b488f0f7-3e50-4f2d-bc29-ee6ab35a90a1",
]);

function pickFeaturedElection(elections: Election[]): Election | null {
  const candidates = elections.filter((e) => !EXCLUDED_FEATURED_IDS.has(e.id));
  if (candidates.length === 0) return null;

  const now = Date.now();

  const active = candidates.filter(
    (election) => now >= election.startsAt && now <= election.endsAt,
  );
  if (active.length > 0) {
    // Pick the one ending soonest
    return active.sort((a, b) => a.endsAt - b.endsAt)[0];
  }

  const upcoming = candidates.filter((election) => now < election.startsAt);
  if (upcoming.length > 0) {
    // Pick the one starting soonest
    return upcoming.sort((a, b) => a.startsAt - b.startsAt)[0];
  }

  // All ended — pick the most recently ended
  return candidates.sort((a, b) => b.endsAt - a.endsAt)[0];
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

async function getElection(id: string): Promise<Election | null> {
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

async function getElectionResults(
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

export type GetElectionDetailResult = {
  election: Election | null;
  parties: Party[] | null;
  results: ElectionResult[];
};

/**
 * Fetch election detail with parties and results in one parallel round trip.
 * Used by the election detail page (client calls this, then caches in localStorage).
 */
export async function getElectionDetail(
  id: string,
): Promise<GetElectionDetailResult> {
  const [election, results, partiesList] = await Promise.all([
    getElection(id),
    getElectionResults(id),
    getParties({ limit: 100, order: "random" }),
  ]);

  if (!election) {
    return { election: null, parties: null, results: [] };
  }

  const now = Date.now();
  const isEnded = now > election.endsAt;

  if (isEnded) {
    return { election, parties: null, results };
  }

  return {
    election,
    parties: partiesList ?? null,
    results: [],
  };
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
