import { defineConfig } from "drizzle-kit";

/**
 * Used by `drizzle-kit generate` to diff the schema and emit SQL into
 * `drizzle/`. Applying those files is done by `scripts/migrate.mjs`, which
 * knows how to talk to both Neon and the local PGlite database.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  strict: true,
  verbose: true,
});
