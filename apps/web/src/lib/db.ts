import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

export type AgriconnectDb = PostgresJsDatabase<typeof schema>;

let sql: postgres.Sql | undefined;
let singleton: AgriconnectDb | undefined;

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
