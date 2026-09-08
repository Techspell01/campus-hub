import { NextResponse } from "next/server";

import { getDb } from "@/db";

export const dynamic = "force-dynamic";

/** Strips anything that looks like a connection string out of a message. */
function redact(text: string) {
  return text.replace(/postgres(ql)?:\/\/[^\s"']+/gi, "postgres://<redacted>");
}

/**
 * Unwraps the driver error the ORM wrapped.
 *
 * Drizzle reports every failure as "Failed query: …", which says nothing about
 * whether the cause was a bad password, a missing database or a network
 * refusal — the three things a health check exists to tell apart.
 */
function describe(error: unknown): string[] {
  const chain: string[] = [];
  let current: unknown = error;

  for (let depth = 0; current instanceof Error && depth < 4; depth += 1) {
    chain.push(redact(`${current.name}: ${current.message}`.split("\n")[0]));
    current = (current as Error & { cause?: unknown }).cause;
  }

  return chain.length > 0 ? chain : ["unknown error"];
}

/**
 * Liveness check for uptime monitoring.
 *
 * Runs a trivial query rather than just returning 200, because the failure
 * that matters in production is "the app is up but cannot reach Postgres" —
 * a static response would report that as healthy.
 */
export async function GET() {
  const configured = Boolean(process.env.DATABASE_URL);

  // Which host it is trying, so a stale environment variable is obvious
  // without exposing the credentials in it.
  let host = "unset";
  if (configured) {
    try {
      host = new URL(process.env.DATABASE_URL!).host;
    } catch {
      host = "unparseable — check for stray quotes or whitespace";
    }
  }

  try {
    const db = await getDb();
    await db.execute("select 1");

    return NextResponse.json(
      { status: "ok", database: "reachable", host },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        host,
        configured,
        cause: describe(error),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
