"use server";

import { and, asc, count, desc, eq, inArray, sum } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDbReadOnly } from "@/lib/db/connection";
import {
	parties,
	referrals,
	streams,
	transactions,
	userProfiles,
} from "@/lib/db/schema";

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

		const rewardMap = new Map<string, number>();

		const txRows = await readDb
			.select({
				userId: transactions.userId,
				totalAllocated: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.streamType, "AMBASSADOR"),
					inArray(transactions.type, ["STREAM_CREATED", "STREAM_UPDATED"]),
				),
			)
			.groupBy(transactions.userId);

		for (const tr of txRows) {
			rewardMap.set(tr.userId, Number.parseFloat(tr.totalAllocated ?? "0"));
		}

		const entries = rows.map((row) => ({
			username: row.username,
			totalInvited: Number(row.totalInvited),
			reward: rewardMap.get(row.userId) ?? 0,
		}));

		// Sort by reward descending (highest first), then by invited count, then username
		entries.sort((a, b) => {
			if (b.reward !== a.reward) return b.reward - a.reward;
			if (b.totalInvited !== a.totalInvited)
				return b.totalInvited - a.totalInvited;
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
	partyId: string;
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
				totalAllocated: sum(transactions.amount),
			})
			.from(transactions)
			.innerJoin(streams, eq(transactions.streamId, streams.id))
			.innerJoin(parties, eq(streams.partyId, parties.id))
			.where(
				and(
					eq(transactions.streamType, "SUBSIDY"),
					inArray(transactions.type, ["STREAM_CREATED", "STREAM_UPDATED"]),
				),
			)
			.groupBy(parties.id, parties.name, parties.leaderUsername);

		const entries: SubsidyLeaderboardEntry[] = rows.map((row) => ({
			partyId: row.partyId,
			leaderUsername: row.leaderUsername,
			partyName: row.partyName,
			totalSubsidy: Number.parseFloat(row.totalAllocated ?? "0"),
		}));
		entries.sort((a, b) => {
			if (b.totalSubsidy !== a.totalSubsidy)
				return b.totalSubsidy - a.totalSubsidy;
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
