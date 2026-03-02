import "dotenv/config";
import https from "node:https";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { distributeElectionSubsidies } from "../lib/actions/admin";
import * as schema from "../lib/db/schema";

// WSL2 workaround: Node.js fetch fails due to broken IPv6 happy eyeballs.
// Use https.request with family:4 to force IPv4.
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });
neonConfig.fetchFunction = (
  url: string | URL,
  init?: RequestInit,
): Promise<Response> =>
  new Promise((resolve, reject) => {
    const parsed = new URL(String(url));
    const body =
      init?.body != null
        ? typeof init.body === "string"
          ? init.body
          : JSON.stringify(init.body)
        : undefined;
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = init.headers;
      if (h instanceof Headers) {
        h.forEach((v, k) => {
          headers[k] = v;
        });
      } else if (Array.isArray(h)) {
        for (const [k, v] of h) headers[k] = v;
      } else {
        Object.assign(headers, h);
      }
    }

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: init?.method ?? (body ? "POST" : "GET"),
        headers,
        agent: ipv4Agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve(
            new Response(buf, {
              status: res.statusCode ?? 200,
              statusText: res.statusMessage ?? "",
              headers: res.headers as Record<string, string>,
            }),
          );
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });

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

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

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
  try {
    console.log("Connecting via Neon HTTP (IPv4)...");
    const summary = await distributeElectionSubsidies(db, electionId!, {
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
  }
}

main();
