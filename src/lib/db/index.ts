import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: any = null;

export function getDb() {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = {
  get query() { return getDb().query; },
  select: (...args: any[]) => getDb().select(...args),
  insert: (...args: any[]) => getDb().insert(...args),
  update: (...args: any[]) => getDb().update(...args),
  delete: (...args: any[]) => getDb().delete(...args),
};
