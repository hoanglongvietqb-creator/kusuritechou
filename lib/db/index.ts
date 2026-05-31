import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

/** @deprecated use getDb() — kept for shorter imports */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof Db];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
