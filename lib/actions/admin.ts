import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type * as schemaImport from "../db/schema";
import {
	elections,
	parties,
	referrals,
	streams,
	transactions,
	votes,
} from "../db/schema";

const STREAM_DURATION_S = 365 * 24 * 3600;

type Schema = typeof schemaImport;
// biome-ignore lint/suspicious/noExplicitAny: Supports both postgres-js, neon-serverless, and neon-http drivers
type AnyDb = PgDatabase<any, Schema>;

export interface DistributionEntry {
	partyName: string;
	leaderUsername: string;
	leaderUserId: string;
	subsidy: string;
	streamAction: "CREATED" | "UPDATED";
	ambassadorUsername: string | null;
	ambassadorReward: string | null;
	ambassadorStreamAction: string | null;
}

export interface DistributionSummary {
	electionId: string;
	electionName: string;
	rewardPool: string;
	totalVotes: number;
	entries: DistributionEntry[];
}

interface PendingStreamWrite {
	freezeStreamId?: string;
	freezeEndsAt?: Date;
	insertStream: {
		userId: string;
		type: "SUBSIDY" | "AMBASSADOR";
		electionId: string;
		partyId: string;
		totalAmount: string;
		initialAmount: string;
		withdrawnAmount: string;
		ratePerSecond: string;
		startedAt: Date;
		endsAt: Date;
		sourceStreamId?: string;
	};
	insertTransaction: {
		userId: string;
		type: string;
		amount: string;
		streamType: "SUBSIDY" | "AMBASSADOR";
	};
}

export function computeRolledOverStreamState(
	existing: {
		totalAmount: number;
		initialAmount: number;
		withdrawnAmount: number;
		ratePerSecond: number;
		startedAt: number;
		endsAt: number;
	},
	nowMs: number,
	newAllocation: number,
): {
	newInitialAmount: number;
	newTotalAmount: number;
	newWithdrawnAmount: number;
	ratePerSecond: number;
} {
	const durationMs = existing.endsAt - existing.startedAt;
	const elapsedMs = Math.min(
		Math.max(0, nowMs - existing.startedAt),
		durationMs,
	);
	const accrued =
		existing.initialAmount + existing.ratePerSecond * (elapsedMs / 1000);
	const withdrawn = existing.withdrawnAmount;
	const availableNow = accrued - withdrawn;
	const unvested = existing.totalAmount - accrued;

	const newInitialAmount = Math.max(0, availableNow);
	const vestingPortion = Math.max(0, unvested) + newAllocation;
	const newTotalAmount = newInitialAmount + vestingPortion;

	return {
		newInitialAmount,
		newTotalAmount,
		// Keep withdrawals scoped to the current stream window.
		// Carrying historical withdrawals causes double-subtraction on the child stream.
		newWithdrawnAmount: 0,
		ratePerSecond: vestingPortion / STREAM_DURATION_S,
	};
}

export async function distributeElectionSubsidies(
	db: AnyDb,
	electionId: string,
	options: { dryRun?: boolean } = {},
): Promise<DistributionSummary> {
	const { dryRun = false } = options;

	const nowDate = new Date();
	const nowMs = nowDate.getTime();

	// ── Phase 1: Read & validate ──────────────────────────────────

	const [election] = await db
		.select()
		.from(elections)
		.where(eq(elections.id, electionId))
		.limit(1);

	if (!election) {
		throw new Error(`Election ${electionId} not found`);
	}
	if (election.distributedAt) {
		throw new Error(
			`Election ${electionId} was already distributed at ${election.distributedAt.toISOString()}`,
		);
	}
	if (election.endsAt > nowDate) {
		throw new Error(
			`Election ${electionId} has not ended yet (ends ${election.endsAt.toISOString()})`,
		);
	}

	const rewardPool = Number.parseFloat(election.rewardPool);
	if (rewardPool <= 0) {
		throw new Error(`Election ${electionId} has no reward pool`);
	}

	const voteRows = await db
		.select({
			partyId: votes.partyId,
			partyName: parties.name,
			leaderUserId: parties.foundedBy,
			leaderUsername: parties.leaderUsername,
			voteCount: count(votes.id),
		})
		.from(votes)
		.innerJoin(parties, eq(votes.partyId, parties.id))
		.where(eq(votes.electionId, electionId))
		.groupBy(
			votes.partyId,
			parties.name,
			parties.foundedBy,
			parties.leaderUsername,
		)
		.orderBy(desc(count(votes.id)));

	const totalVotes = voteRows.reduce((sum, r) => sum + r.voteCount, 0);
	if (totalVotes === 0) {
		throw new Error(`Election ${electionId} has no votes`);
	}

	// ── Phase 2: Compute allocations ──────────────────────────────

	const entries: DistributionEntry[] = [];
	const pendingWrites: PendingStreamWrite[] = [];

	for (const row of voteRows) {
		const partySubsidy = (rewardPool * row.voteCount) / totalVotes;
		if (partySubsidy <= 0) continue;

		const subsidyWrite = await computeStreamWrite(
			db,
			{
				userId: row.leaderUserId,
				type: "SUBSIDY",
				electionId,
				partyId: row.partyId,
				newAllocation: partySubsidy,
			},
			nowDate,
			nowMs,
		);
		pendingWrites.push(subsidyWrite);

		const entry: DistributionEntry = {
			partyName: row.partyName,
			leaderUsername: row.leaderUsername,
			leaderUserId: row.leaderUserId,
			subsidy: partySubsidy.toFixed(18),
			streamAction:
				subsidyWrite.insertTransaction.type === "STREAM_CREATED"
					? "CREATED"
					: "UPDATED",
			ambassadorUsername: null,
			ambassadorReward: null,
			ambassadorStreamAction: null,
		};

		// Ambassador rewards: look up referrer
		const [referral] = await db
			.select({ referrerId: referrals.referrerId })
			.from(referrals)
			.where(eq(referrals.referredId, row.leaderUserId))
			.limit(1);

		if (referral) {
			const ambassadorReward = partySubsidy * 0.1;

			const referrerUsername = await db
				.select({
					username: sql<string>`(SELECT username FROM user_profiles WHERE id = ${referral.referrerId})`,
				})
				.from(sql`(SELECT 1) AS _`)
				.then((rows) => rows[0]?.username ?? "unknown");

			const ambassadorWrite = await computeStreamWrite(
				db,
				{
					userId: referral.referrerId,
					type: "AMBASSADOR",
					electionId,
					partyId: row.partyId,
					newAllocation: ambassadorReward,
				},
				nowDate,
				nowMs,
			);
			pendingWrites.push(ambassadorWrite);

			entry.ambassadorUsername = referrerUsername;
			entry.ambassadorReward = ambassadorReward.toFixed(18);
			entry.ambassadorStreamAction =
				ambassadorWrite.insertTransaction.type === "STREAM_CREATED"
					? "CREATED"
					: "UPDATED";
		}

		entries.push(entry);
	}

	const summary: DistributionSummary = {
		electionId,
		electionName: election.name,
		rewardPool: election.rewardPool,
		totalVotes,
		entries,
	};

	if (dryRun) {
		return summary;
	}

	// ── Phase 3: Write (only if not dry run) ──────────────────────

	await db.transaction(async (tx) => {
		const claimed = await tx
			.update(elections)
			.set({ distributedAt: nowDate })
			.where(and(eq(elections.id, electionId), isNull(elections.distributedAt)))
			.returning({ id: elections.id });

		if (claimed.length === 0) {
			throw new Error(
				`Election ${electionId} was already distributed by another process`,
			);
		}

		for (const write of pendingWrites) {
			if (write.freezeStreamId) {
				if (!write.freezeEndsAt) {
					throw new Error(
						`Missing freezeEndsAt for stream ${write.freezeStreamId}`,
					);
				}
				await tx
					.update(streams)
					.set({ endsAt: write.freezeEndsAt })
					.where(eq(streams.id, write.freezeStreamId));
			}

			const [newStream] = await tx
				.insert(streams)
				.values(write.insertStream)
				.returning({ id: streams.id });

			await tx.insert(transactions).values({
				...write.insertTransaction,
				streamId: newStream.id,
			});
		}
	});

	return summary;
}

/**
 * Reads existing stream state and computes the write operations needed,
 * without actually executing them. Phase 3 commits via db.transaction().
 */
async function computeStreamWrite(
	db: AnyDb,
	params: {
		userId: string;
		type: "SUBSIDY" | "AMBASSADOR";
		electionId: string;
		partyId: string;
		newAllocation: number;
	},
	nowDate: Date,
	nowMs: number,
): Promise<PendingStreamWrite> {
	const { userId, type, electionId, partyId, newAllocation } = params;
	const endsAt = new Date(nowMs + STREAM_DURATION_S * 1000);

	const [existingStream] = await db
		.select()
		.from(streams)
		.where(
			and(
				eq(streams.userId, userId),
				eq(streams.type, type),
				gt(streams.endsAt, nowDate),
			),
		)
		.limit(1);

	if (existingStream) {
		const streamData = {
			id: existingStream.id,
			type: existingStream.type as "SUBSIDY" | "AMBASSADOR",
			totalAmount: Number.parseFloat(existingStream.totalAmount),
			initialAmount: Number.parseFloat(existingStream.initialAmount),
			withdrawnAmount: Number.parseFloat(existingStream.withdrawnAmount),
			ratePerSecond: Number.parseFloat(existingStream.ratePerSecond),
			startedAt: existingStream.startedAt.getTime(),
			endsAt: existingStream.endsAt.getTime(),
			partyId: existingStream.partyId,
			electionId: existingStream.electionId,
		};

		const rolledOver = computeRolledOverStreamState(
			streamData,
			nowMs,
			newAllocation,
		);

		return {
			freezeStreamId: existingStream.id,
			freezeEndsAt: nowDate,
			insertStream: {
				userId,
				type,
				electionId,
				partyId,
				totalAmount: rolledOver.newTotalAmount.toFixed(18),
				initialAmount: rolledOver.newInitialAmount.toFixed(18),
				withdrawnAmount: rolledOver.newWithdrawnAmount.toFixed(18),
				ratePerSecond: rolledOver.ratePerSecond.toFixed(18),
				startedAt: nowDate,
				endsAt,
				sourceStreamId: existingStream.id,
			},
			insertTransaction: {
				userId,
				type: "STREAM_UPDATED",
				amount: newAllocation.toFixed(18),
				streamType: type,
			},
		};
	}

	const ratePerSecond = newAllocation / STREAM_DURATION_S;

	return {
		insertStream: {
			userId,
			type,
			electionId,
			partyId,
			totalAmount: newAllocation.toFixed(18),
			initialAmount: "0",
			withdrawnAmount: "0",
			ratePerSecond: ratePerSecond.toFixed(18),
			startedAt: nowDate,
			endsAt,
		},
		insertTransaction: {
			userId,
			type: "STREAM_CREATED",
			amount: newAllocation.toFixed(18),
			streamType: type,
		},
	};
}
