"use server";

import { and, asc, count, desc, eq, gt, sql, sum } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDbReadOnly } from "@/lib/db/connection";
import { parties, referrals, streams, userProfiles } from "@/lib/db/schema";
import { STREAM_DURATION_S } from "@/lib/streams";

export type AmbassadorLeaderboardEntry = {
  username: string;
  totalInvited: number;
  reward: number;
};

const YEAR_S = 365 * 24 * 3600;

const getCachedAmbassadorLeaderboard = unstable_cache(
  async (): Promise<AmbassadorLeaderboardEntry[]> => {
    const readDb = getDbReadOnly();

    const rows = await readDb
      .select({
        userId: userProfiles.id,
        username: userProfiles.username,
        totalInvited: count(referrals.referredId),
      })
      .from(referrals)
      .innerJoin(userProfiles, eq(userProfiles.id, referrals.referrerId))
      .groupBy(userProfiles.id, userProfiles.username)
      .orderBy(desc(count(referrals.referredId)), asc(userProfiles.username));

    const now = new Date();

    // Batch-fetch active AMBASSADOR streams for all referrers
    const referrerIds = rows.map((r) => r.userId);
    const rewardMap = new Map<string, number>();

    if (referrerIds.length > 0) {
      const streamRows = await readDb
        .select({
          userId: streams.userId,
          totalRate: sum(streams.ratePerSecond),
        })
        .from(streams)
        .where(
          and(
            eq(streams.type, "AMBASSADOR"),
            gt(streams.endsAt, now),
          ),
        )
        .groupBy(streams.userId);

      for (const sr of streamRows) {
        const annualRate =
          Number.parseFloat(sr.totalRate ?? "0") * YEAR_S;
        rewardMap.set(sr.userId, annualRate);
      }
    }

    const entries = rows.map((row) => ({
      username: row.username,
      totalInvited: Number(row.totalInvited),
      reward: rewardMap.get(row.userId) ?? 0,
    }));

    // Sort by reward descending (highest first), then by invited count, then username
    entries.sort((a, b) => {
      if (b.reward !== a.reward) return b.reward - a.reward;
      if (b.totalInvited !== a.totalInvited) return b.totalInvited - a.totalInvited;
      return a.username.localeCompare(b.username);
    });

    return entries;
  },
  ["ambassador-leaderboard"],
  { revalidate: 86400, tags: ["ambassador-leaderboard"] },
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

// ── Subsidy leaderboard ─────────────────────────────────────────

export type SubsidyLeaderboardEntry = {
  leaderUsername: string;
  partyName: string;
  totalSubsidy: number;
};

const getCachedSubsidyLeaderboard = unstable_cache(
  async (): Promise<SubsidyLeaderboardEntry[]> => {
    const readDb = getDbReadOnly();

    const rows = await readDb
      .select({
        partyId: parties.id,
        partyName: parties.name,
        leaderUsername: parties.leaderUsername,
        totalSubsidy: sum(streams.totalAmount),
      })
      .from(streams)
      .innerJoin(parties, eq(streams.partyId, parties.id))
      .where(eq(streams.type, "SUBSIDY"))
      .groupBy(parties.id, parties.name, parties.leaderUsername)
      .orderBy(desc(sum(streams.totalAmount)), asc(parties.leaderUsername));

    return rows.map((row) => ({
      leaderUsername: row.leaderUsername,
      partyName: row.partyName,
      totalSubsidy: Number.parseFloat(row.totalSubsidy ?? "0"),
    }));
  },
  ["subsidy-leaderboard"],
  { revalidate: 86400, tags: ["subsidy-leaderboard"] },
);

export async function getSubsidyLeaderboard(): Promise<
  SubsidyLeaderboardEntry[]
> {
  try {
    return await getCachedSubsidyLeaderboard();
  } catch (error) {
    console.error("[getSubsidyLeaderboard] Error:", error);
    return [];
  }
}
