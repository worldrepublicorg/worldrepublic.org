import "server-only";
import "dotenv/config";
import { neon, Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prioritize LOCAL_DATABASE_URL if set (Neon Local Connect)
// Otherwise use DATABASE_URL (remote connection)
const connectionString =
  process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or LOCAL_DATABASE_URL environment variable is required",
  );
}

// Check if connection string is actually localhost (check content, not just env var name)
// This ensures we only use postgres.js for actual localhost connections
const isLocalhost =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

type DbType =
  | ReturnType<typeof drizzlePostgres>
  | ReturnType<typeof drizzle>
  | ReturnType<typeof drizzleHttp>;
let db: DbType;
let dbReadOnly:
  | ReturnType<typeof drizzleHttp>
  | ReturnType<typeof drizzlePostgres>
  | null = null;

declare global {
  var __neonPool: Pool | undefined;
  var __postgresClient: ReturnType<typeof postgres> | undefined;
}

let pool: Pool;
let postgresClient: ReturnType<typeof postgres> | null = null;

if (isLocalhost) {
  // Use postgres.js for Neon Local Connect (localhost:5432)
  // This works reliably in WSL2 and avoids WebSocket/HTTP timeout issues
  if (global.__postgresClient) {
    postgresClient = global.__postgresClient;
  } else {
    postgresClient = postgres(connectionString, {
      max: 10,
      idle_timeout: 60,
      connect_timeout: 20,
      prepare: false,
    });
    if (process.env.NODE_ENV !== "production") {
      global.__postgresClient = postgresClient;
    }
  }
  db = drizzlePostgres(postgresClient, { schema });
  dbReadOnly = db;

  // For NextAuth adapter, pass null (adapter will use postgres.js via createPostgresAdapter)
  pool = null as unknown as Pool;
} else {
  // Remote connection: HTTP driver for reads (faster), Pool for writes (when not localhost)
  const sql = neon(connectionString);
  dbReadOnly = drizzleHttp(sql, { schema });

  // Pool for writes (LOCAL_DATABASE_URL not set = Vercel/deployed)
  // Supports transactions, recommended for production
  if (global.__neonPool) {
    pool = global.__neonPool;
  } else {
    pool = new Pool({ connectionString });
    // Cache the pool in global scope to reuse connections in warm lambda instances
    // This is crucial for performance in serverless environments
    global.__neonPool = pool;
  }

  // Use Pool for writes when deployed (no LOCAL_DATABASE_URL), HTTP for local dev
  if (!process.env.LOCAL_DATABASE_URL) {
    db = drizzle(pool, { schema });
  } else {
    db = dbReadOnly;
  }
}

// Export read-only DB for queries that don't need transactions (faster)
export const getDbReadOnly = () => dbReadOnly || db;

// Export connection info for debugging
export function getConnectionInfo() {
  return {
    isLocalhost,
    hasLocalDb: !!process.env.LOCAL_DATABASE_URL,
    hasRemoteDb: !!process.env.DATABASE_URL,
    connectionType: isLocalhost ? "postgres.js" : "neon-http",
    poolCached: !!global.__neonPool || !!global.__postgresClient,
  };
}

// Add connection health check function
export async function checkConnectionHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = performance.now();
  try {
    const readDb = getDbReadOnly();
    // Simple query to check connection
    await readDb.execute(sql`SELECT 1`);
    const latency = performance.now() - startTime;
    return { healthy: true, latency };
  } catch (error) {
    const latency = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      latency,
      error: errorMessage,
    };
  }
}

export { db, pool };
export const getIsLocalhost = () => isLocalhost;
