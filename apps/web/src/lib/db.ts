import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@schema";

export type AgriconnectDb = PostgresJsDatabase<typeof schema>;

let sql: postgres.Sql | undefined;
let singleton: AgriconnectDb | undefined;

/** True when Postgres can be dialed — use before calling `getDb()` on public/marketing surfaces. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Returns Drizzle DB or `null` when `DATABASE_URL` is unset (e.g. Vercel preview without env). Never throws for missing URL. */
export function tryGetDb(): AgriconnectDb | null {
  if (!isDatabaseConfigured()) return null;
  return getDb();
}

export function getDb(): AgriconnectDb {
  if (singleton) return singleton;

  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL is required to connect to the database.");
  }

  sql = postgres(url, { max: 10 });
  singleton = drizzle(sql, { schema });
  return singleton;
}
