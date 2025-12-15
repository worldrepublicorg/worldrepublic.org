import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Single WebSocket-based Pool for all operations (reads and writes)
// Neon serverless driver manages pooling; keep timeouts modest to surface issues fast.
const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10_000,
});

// Drizzle instance using the Pool driver
export const db = drizzle(pool, { schema });

export { pool };
