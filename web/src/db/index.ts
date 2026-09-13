import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return (
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    })
  );
}

// Lazy pool creation: importing this module must never throw, so `next build`
// page-data collection works without a DATABASE_URL. The error moves to the
// first actual query (runtime), where a missing database is a real failure.
export const pool = new Proxy({} as Pool, {
  get(_t, prop, receiver) {
    if (!globalForDb.__arenaNextJsPostgresqlPool) {
      globalForDb.__arenaNextJsPostgresqlPool = getPool();
    }
    return Reflect.get(globalForDb.__arenaNextJsPostgresqlPool, prop, receiver);
  },
});

// Lazy `db` as well: drizzle() itself touches pool properties at construction,
// so it must also defer until the first query against it.
type Db = NodePgDatabase;
let cachedDb: Db | undefined;
export const db: Db = new Proxy({} as Db, {
  get(_t, prop, receiver) {
    cachedDb ??= drizzle(pool);
    const value = Reflect.get(cachedDb, prop, receiver);
    return typeof value === "function" ? value.bind(cachedDb) : value;
  },
});
