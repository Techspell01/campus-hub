import "server-only";

import { mkdirSync } from "node:fs";

import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import * as schema from "@/db/schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Where PGlite keeps its files when no `DATABASE_URL` is configured. */
export const LOCAL_DB_DIR = ".data/pg";

/**
 * Database connection.
 *
 * Two drivers, chosen by whether `DATABASE_URL` is set:
 *
 * - **Neon** (`@neondatabase/serverless`) in production. It speaks HTTP rather
 *   than holding a TCP connection, which is what makes it safe on Vercel —
 *   serverless functions come and go too fast for a normal connection pool and
 *   would exhaust Postgres' connection limit.
 *
 * - **PGlite** locally: real Postgres compiled to WebAssembly, running
 *   in-process against a folder. It means `npm run dev` works on a fresh clone
 *   with no database to install and no account to create. Same SQL, same
 *   migrations, so what passes locally is what runs in production.
 *
 * Both are loaded with `await import` so only the one in use gets pulled into
 * the serverless bundle.
 */
async function create(): Promise<Database> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(url), { schema }) as unknown as Database;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is not set. Production requires a Postgres connection string.",
    );
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");

  // PGlite won't create intermediate directories itself.
  mkdirSync(LOCAL_DB_DIR, { recursive: true });

  return drizzle(new PGlite(LOCAL_DB_DIR), { schema }) as unknown as Database;
}

declare global {
  var __campusHubDb: Promise<Database> | undefined;
}

/**
 * Cached on `globalThis` because Next re-evaluates modules on hot reload —
 * without it, every edit would open another PGlite handle on the same folder.
 */
export function getDb(): Promise<Database> {
  return (globalThis.__campusHubDb ??= create());
}
