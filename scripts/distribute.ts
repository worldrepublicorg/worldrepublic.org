import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { WebSocket } from "ws";
import { distributeElectionSubsidies } from "../lib/actions/admin";
import * as schema from "../lib/db/schema";

neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error("DATABASE_URL environment variable is required");
	process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const electionIdArg = args.find((a) => !a.startsWith("--"));

if (!electionIdArg) {
	console.error(
		"Usage: pnpm tsx scripts/distribute.ts <electionId> [--dry-run]",
	);
	process.exit(1);
}

const electionId: string = electionIdArg;

function printSummary(summary: {
	electionName: string;
	rewardPool: string;
	totalVotes: number;
	entries: Array<{
		partyName: string;
		leaderUsername: string;
		subsidy: string;
		streamAction: string;
		ambassadorUsername: string | null;
		ambassadorReward: string | null;
		ambassadorStreamAction: string | null;
	}>;
}) {
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
}

async function main() {
	const pool = new Pool({ connectionString });
	const db = drizzle(pool, { schema });

	try {
		console.log("Connecting via Neon WebSocket pool...");
		const summary = await distributeElectionSubsidies(db, electionId, {
			dryRun,
		});
		printSummary(summary);
		if (dryRun) {
			console.log("\nDRY RUN — no changes committed.");
		} else {
			console.log("\nDistribution complete.");
		}
	} catch (error) {
		console.error("Distribution failed:");
		console.error(error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

main();
