/**
 * Applies everything in `drizzle/` to whichever database is configured.
 *
 *   npm run db:migrate                      -> local PGlite
 *   DATABASE_URL=postgres://... npm run db:migrate  -> Neon (or any Postgres)
 *
 * Plain .mjs on purpose: it runs on bare Node with no TypeScript loader, which
 * is what makes it usable from a CI step or a one-off shell on a deploy box.
 */

import { mkdirSync } from "node:fs";

const MIGRATIONS_FOLDER = "drizzle";
const LOCAL_DB_DIR = ".data/pg";

const url = process.env.DATABASE_URL;

try {
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");

    const host = new URL(url).host;
    console.log(`Migrating remote Postgres at ${host} …`);

    await migrate(drizzle(neon(url)), {
      migrationsFolder: MIGRATIONS_FOLDER,
    });
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");

    console.log(`No DATABASE_URL set — migrating local PGlite at ${LOCAL_DB_DIR} …`);

    // PGlite won't create intermediate directories itself.
    mkdirSync(LOCAL_DB_DIR, { recursive: true });

    const client = new PGlite(LOCAL_DB_DIR);
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
    await client.close();
  }

  console.log("Migrations applied.");
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
