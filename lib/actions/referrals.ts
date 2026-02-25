"use server";

import { and, asc, count, desc, eq, gt, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDbReadOnly } from "@/lib/db/connection";
import { parties, referrals, userProfiles } from "@/lib/db/schema";

export type AmbassadorLeaderboardEntry = {
  username: string;
  leadersInvited: number;
  stipend: number;
};

const getCachedAmbassadorLeaderboard = unstable_cache(
  async (): Promise<AmbassadorLeaderboardEntry[]> => {
    const readDb = getDbReadOnly();

    const rows = await readDb
      .select({
        username: userProfiles.username,
        leadersInvited: count(parties.id),
      })
      .from(referrals)
      .innerJoin(userProfiles, eq(userProfiles.id, referrals.referrerId))
      .innerJoin(
        parties,
        and(
          eq(parties.foundedBy, referrals.referredId),
          isNull(parties.dissolvedAt),
        ),
      )
      .groupBy(userProfiles.id, userProfiles.username)
      .having(gt(count(parties.id), 0))
      .orderBy(desc(count(parties.id)), asc(userProfiles.username));

    return rows.map((row) => ({
      username: row.username,
      leadersInvited: Number(row.leadersInvited),
      stipend: 0,
    }));
  },
  ["ambassador-leaderboard"],
  { revalidate: 10, tags: ["ambassador-leaderboard"] },
);

export async function getAmbassadorLeaderboard(): Promise<
  AmbassadorLeaderboardEntry[]
> {
  try {
    return await getCachedAmbassadorLeaderboard();
  } catch (error) {
    console.error("[getAmbassadorLeaderboard] Error:", error);
    return [];
  }
}
