"use server";

import { and, gt, lte } from "drizzle-orm";
import { getDbReadOnly } from "@/lib/db/connection";
import { elections } from "@/lib/db/schema";

export type Election = {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
};

/**
 * Get the currently active election (if any).
 * An election is active when: startsAt <= now AND endsAt > now
 * Returns null if no election is currently active.
 */
export async function getActiveElection(): Promise<Election | null> {
  const now = new Date();
  const db = getDbReadOnly();

  const [election] = await db
    .select()
    .from(elections)
    .where(
      and(
        lte(elections.startsAt, now), // startsAt <= now
        gt(elections.endsAt, now), // endsAt > now
      ),
    )
    .limit(1);

  return election || null;
}
