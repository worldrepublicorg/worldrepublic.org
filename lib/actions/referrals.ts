"use server";

import { asc, count, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDbReadOnly } from "@/lib/db/connection";
import { parties, referrals, streams, userProfiles } from "@/lib/db/schema";

export type AmbassadorLeaderboardEntry = {
  username: string;
  totalInvited: number;
  reward: number;
};

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

    // For each referrer, total ever earned = current AMBASSADOR stream (latest endsAt):
    // rollover stream → totalAmount + withdrawnAmount; single stream → totalAmount
    const referrerIds = rows.map((r) => r.userId);
    const rewardMap = new Map<string, number>();

    if (referrerIds.length > 0) {
      const streamRows = await readDb
        .select({
          userId: streams.userId,
          totalAmount: streams.totalAmount,
          withdrawnAmount: streams.withdrawnAmount,
          sourceStreamId: streams.sourceStreamId,
          endsAt: streams.endsAt,
        })
        .from(streams)
        .where(eq(streams.type, "AMBASSADOR"))
        .orderBy(asc(streams.userId), desc(streams.endsAt));

      const seen = new Set<string>();
      for (const sr of streamRows) {
        if (seen.has(sr.userId)) continue;
        seen.add(sr.userId);
        const totalNum = Number.parseFloat(sr.totalAmount ?? "0");
        const withdrawnNum = Number.parseFloat(sr.withdrawnAmount ?? "0");
        const total = sr.sourceStreamId ? totalNum + withdrawnNum : totalNum;
        rewardMap.set(sr.userId, total);
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
  { revalidate: 60, tags: ["ambassador-leaderboard"] },
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

    // For each party, use the current stream (latest endsAt). Total ever earned:
    // - Rollover stream (sourceStreamId set): totalAmount is "remaining + new", so add withdrawnAmount.
    // - Single stream (no sourceStreamId): totalAmount is already the full earned amount.
    const rows = await readDb
      .select({
        partyId: parties.id,
        partyName: parties.name,
        leaderUsername: parties.leaderUsername,
        totalAmount: streams.totalAmount,
        withdrawnAmount: streams.withdrawnAmount,
        sourceStreamId: streams.sourceStreamId,
        endsAt: streams.endsAt,
      })
      .from(streams)
      .innerJoin(parties, eq(streams.partyId, parties.id))
      .where(eq(streams.type, "SUBSIDY"))
      .orderBy(asc(parties.id), desc(streams.endsAt));

    const byParty = new Map<
      string,
      { leaderUsername: string; partyName: string; totalSubsidy: number }
    >();
    for (const row of rows) {
      if (byParty.has(row.partyId)) continue;
      const totalNum = Number.parseFloat(row.totalAmount ?? "0");
      const withdrawnNum = Number.parseFloat(row.withdrawnAmount ?? "0");
      const total = row.sourceStreamId
        ? totalNum + withdrawnNum
        : totalNum;
      byParty.set(row.partyId, {
        leaderUsername: row.leaderUsername,
        partyName: row.partyName,
        totalSubsidy: total,
      });
    }
    const entries = Array.from(byParty.values());
    entries.sort((a, b) => {
      if (b.totalSubsidy !== a.totalSubsidy) return b.totalSubsidy - a.totalSubsidy;
      return a.leaderUsername.localeCompare(b.leaderUsername);
    });
    return entries;
  },
  ["subsidy-leaderboard"],
  { revalidate: 60, tags: ["subsidy-leaderboard"] },
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
