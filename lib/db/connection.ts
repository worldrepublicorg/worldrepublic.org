import "server-only";
import "dotenv/config";
import { neon, Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-serverless";
import { applyIpv4Fetch } from "./ipv4-fetch";
import * as schema from "./schema";

// DATABASE_URL_LOCAL_DEV: direct (non-pooled) endpoint, used when developing locally
// DATABASE_URL: pooler endpoint, used in production (Vercel)
const connectionString =
	process.env.DATABASE_URL_LOCAL_DEV || process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"DATABASE_URL or DATABASE_URL_LOCAL_DEV environment variable is required",
	);
}

if (process.env.FORCE_IPV4_FETCH === "true") {
	applyIpv4Fetch();
}

declare global {
	var __neonPool: Pool | undefined;
}

const sqlClient = neon(connectionString);
const dbReadOnly = drizzleHttp(sqlClient, { schema });

let pool: Pool;
if (global.__neonPool) {
	pool = global.__neonPool;
} else {
	pool = new Pool({ connectionString });
	// Cache pool in global scope to reuse across hot reloads and warm lambda instances
	global.__neonPool = pool;
}

// Use WebSocket Pool for writes in production (supports transactions)
// Use HTTP driver for local dev — simpler, no WebSocket needed
const db = process.env.DATABASE_URL_LOCAL_DEV
	? dbReadOnly
	: drizzle(pool, { schema });

export const getDbReadOnly = () => dbReadOnly;

export function getConnectionInfo() {
	return {
		hasLocalDb: !!process.env.DATABASE_URL_LOCAL_DEV,
		hasRemoteDb: !!process.env.DATABASE_URL,
		connectionType: "neon-http",
		poolCached: !!global.__neonPool,
	};
}

export async function checkConnectionHealth(): Promise<{
	healthy: boolean;
	latency?: number;
	error?: string;
}> {
	const startTime = performance.now();
	try {
		await dbReadOnly.execute(sql`SELECT 1`);
		const latency = performance.now() - startTime;
		return { healthy: true, latency };
	} catch (error) {
		const latency = performance.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : String(error);
		return { healthy: false, latency, error: errorMessage };
	}
}

export { db, pool };
