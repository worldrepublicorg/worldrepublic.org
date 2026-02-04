"use server";

import { desc, getTableColumns } from "drizzle-orm";
import { getDbReadOnly } from "@/lib/db/connection";
import { elections } from "@/lib/db/schema";
import type { Election } from "@/lib/types/elections";

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
