import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  DryRunRollback,
  distributeElectionSubsidies,
} from "../lib/actions/admin";
import * as schema from "../lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const electionId = args.find((a) => !a.startsWith("--"));

if (!electionId) {
  console.error(
    "Usage: npx tsx scripts/distribute.ts <electionId> [--dry-run]",
  );
  process.exit(1);
}

const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
  ssl: "require",
});

const db = drizzle(client, { schema });

try {
  const summary = await distributeElectionSubsidies(db, electionId, { dryRun });

  console.log(`\nElection: ${summary.electionName}`);
  console.log(`Reward Pool: ${summary.rewardPool} WDD`);
  console.log(`Total Votes: ${summary.totalVotes}\n`);
  console.table(
    summary.entries.map((e) => ({
      Party: e.partyName,
      Leader: e.leaderUsername,
      Subsidy: `${Number.parseFloat(e.subsidy).toFixed(4)} WDD`,
      Action: e.streamAction,
      Ambassador: e.ambassadorUsername ?? "—",
      "Amb. Reward": e.ambassadorReward
        ? `${Number.parseFloat(e.ambassadorReward).toFixed(4)} WDD`
        : "—",
      "Amb. Action": e.ambassadorStreamAction ?? "—",
    })),
  );

  if (dryRun) {
    console.log("\nDRY RUN — no changes committed.");
  } else {
    console.log("\nDistribution complete.");
  }
} catch (error) {
  if (error instanceof DryRunRollback) {
    const summary = error.summary;
    console.log(`\nElection: ${summary.electionName}`);
    console.log(`Reward Pool: ${summary.rewardPool} WDD`);
    console.log(`Total Votes: ${summary.totalVotes}\n`);
    console.table(
      summary.entries.map((e) => ({
        Party: e.partyName,
        Leader: e.leaderUsername,
        Subsidy: `${Number.parseFloat(e.subsidy).toFixed(4)} WDD`,
        Action: e.streamAction,
        Ambassador: e.ambassadorUsername ?? "—",
        "Amb. Reward": e.ambassadorReward
          ? `${Number.parseFloat(e.ambassadorReward).toFixed(4)} WDD`
          : "—",
        "Amb. Action": e.ambassadorStreamAction ?? "—",
      })),
    );
    console.log("\nDRY RUN — no changes committed.");
  } else {
    console.error(
      "Distribution failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

await client.end();
