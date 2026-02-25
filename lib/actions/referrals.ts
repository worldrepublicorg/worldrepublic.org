"use server";

import { asc, count, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDbReadOnly } from "@/lib/db/connection";
import { referrals, userProfiles } from "@/lib/db/schema";

export type AmbassadorLeaderboardEntry = {
  username: string;
  totalInvited: number;
  stipend: number;
};

const getCachedAmbassadorLeaderboard = unstable_cache(
  async (): Promise<AmbassadorLeaderboardEntry[]> => {
    const readDb = getDbReadOnly();

    const rows = await readDb
      .select({
        username: userProfiles.username,
        totalInvited: count(referrals.referredId),
      })
      .from(referrals)
      .innerJoin(userProfiles, eq(userProfiles.id, referrals.referrerId))
      .groupBy(userProfiles.id, userProfiles.username)
      .orderBy(desc(count(referrals.referredId)), asc(userProfiles.username));

    return rows.map((row) => ({
      username: row.username,
      totalInvited: Number(row.totalInvited),
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
