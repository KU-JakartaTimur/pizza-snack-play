import "dotenv/config";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  /** Masa berlaku token dalam detik (opsional, default 7 hari). */
  JWT_EXPIRES_IN?: string;
}

export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}

/**
 * Tipe database yang dipakai bersama di seluruh layer
 * (repository, service, controller).
 */
export type Db = ReturnType<typeof getDb>;
