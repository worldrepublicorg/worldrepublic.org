import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { computeStreamAccrued, STREAM_DURATION_S } from "../streams";
import type * as schemaImport from "../db/schema";
import {
  elections,
  parties,
  referrals,
  streams,
  transactions,
  votes,
} from "../db/schema";

type Schema = typeof schemaImport;

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

export async function distributeElectionSubsidies(
  db: PostgresJsDatabase<Schema>,
  electionId: string,
  options: { dryRun?: boolean } = {},
): Promise<DistributionSummary> {
  const { dryRun = false } = options;

  const nowDate = new Date();
  const nowMs = nowDate.getTime();

  const summary = await db.transaction(async (tx) => {
    // 1. Load and validate election
    const [election] = await tx
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

    // 2. Compute vote shares per party
    const voteRows = await tx
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

    const entries: DistributionEntry[] = [];

    // 3. For each party with votes
    for (const row of voteRows) {
      const partySubsidy = (rewardPool * row.voteCount) / totalVotes;
      if (partySubsidy <= 0) continue;

      // Create/rollover SUBSIDY stream for the party leader
      const subsidyResult = await createOrRolloverStream(
        tx,
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

      const entry: DistributionEntry = {
        partyName: row.partyName,
        leaderUsername: row.leaderUsername,
        leaderUserId: row.leaderUserId,
        subsidy: partySubsidy.toFixed(18),
        streamAction: subsidyResult.action,
        ambassadorUsername: null,
        ambassadorReward: null,
        ambassadorStreamAction: null,
      };

      // 4. Ambassador rewards: look up referrer
      const [referral] = await tx
        .select({
          referrerId: referrals.referrerId,
        })
        .from(referrals)
        .where(eq(referrals.referredId, row.leaderUserId))
        .limit(1);

      if (referral) {
        const ambassadorReward = partySubsidy * 0.1;

        // Look up referrer username for the summary
        const referrerUsername = await tx
          .select({
            username: sql<string>`(SELECT username FROM user_profiles WHERE id = ${referral.referrerId})`,
          })
          .from(sql`(SELECT 1) AS _`)
          .then((rows) => rows[0]?.username ?? "unknown");

        const ambassadorResult = await createOrRolloverStream(
          tx,
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

        entry.ambassadorUsername = referrerUsername;
        entry.ambassadorReward = ambassadorReward.toFixed(18);
        entry.ambassadorStreamAction = ambassadorResult.action;
      }

      entries.push(entry);
    }

    // 5. Mark election as distributed
    await tx
      .update(elections)
      .set({ distributedAt: nowDate })
      .where(eq(elections.id, electionId));

    if (dryRun) {
      throw new DryRunRollback({
        electionId,
        electionName: election.name,
        rewardPool: election.rewardPool,
        totalVotes,
        entries,
      });
    }

    return {
      electionId,
      electionName: election.name,
      rewardPool: election.rewardPool,
      totalVotes,
      entries,
    };
  });

  return summary;
}

class DryRunRollback extends Error {
  summary: DistributionSummary;
  constructor(summary: DistributionSummary) {
    super("DRY_RUN_ROLLBACK");
    this.summary = summary;
  }
}

// Re-export so the script can catch it
export { DryRunRollback };

async function createOrRolloverStream(
  tx: Parameters<Parameters<PostgresJsDatabase<Schema>["transaction"]>[0]>[0],
  params: {
    userId: string;
    type: "SUBSIDY" | "AMBASSADOR";
    electionId: string;
    partyId: string;
    newAllocation: number;
  },
  nowDate: Date,
  nowMs: number,
): Promise<{ streamId: string; action: "CREATED" | "UPDATED" }> {
  const { userId, type, electionId, partyId, newAllocation } = params;
  const endsAt = new Date(nowMs + STREAM_DURATION_S * 1000);

  // Check for existing active stream
  const [existingStream] = await tx
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

  let streamId: string;
  let action: "CREATED" | "UPDATED";

  if (existingStream) {
    // Rollover: freeze old stream and create new one with carried-over balance
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

    const accrued = computeStreamAccrued(streamData, nowMs);
    const withdrawn = streamData.withdrawnAmount;
    const availableNow = accrued - withdrawn; // carry-over (already available)
    const unvested = streamData.totalAmount - accrued;

    // Freeze old stream
    await tx
      .update(streams)
      .set({ endsAt: nowDate })
      .where(eq(streams.id, existingStream.id));

    // New stream: initialAmount = available now, vesting portion = unvested + newAllocation
    const newInitialAmount = Math.max(0, availableNow);
    const vestingPortion = Math.max(0, unvested) + newAllocation;
    const newTotalAmount = newInitialAmount + vestingPortion;
    const ratePerSecond = vestingPortion / STREAM_DURATION_S;

    const [newStream] = await tx
      .insert(streams)
      .values({
        userId,
        type,
        electionId,
        partyId,
        totalAmount: newTotalAmount.toFixed(18),
        initialAmount: newInitialAmount.toFixed(18),
        withdrawnAmount: withdrawn.toFixed(18),
        ratePerSecond: ratePerSecond.toFixed(18),
        startedAt: nowDate,
        endsAt,
        sourceStreamId: existingStream.id,
      })
      .returning({ id: streams.id });

    streamId = newStream.id;
    action = "UPDATED";
  } else {
    // Brand new stream
    const ratePerSecond = newAllocation / STREAM_DURATION_S;

    const [newStream] = await tx
      .insert(streams)
      .values({
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
      })
      .returning({ id: streams.id });

    streamId = newStream.id;
    action = "CREATED";
  }

  // Insert transaction history row
  const txType = action === "CREATED" ? "STREAM_CREATED" : "STREAM_UPDATED";
  await tx.insert(transactions).values({
    userId,
    type: txType,
    amount: newAllocation.toFixed(18),
    streamId,
    streamType: type,
  });

  return { streamId, action };
}
