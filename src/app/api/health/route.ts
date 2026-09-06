import { NextResponse } from "next/server";

import { getDb } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Liveness check for uptime monitoring.
 *
 * Runs a trivial query rather than just returning 200, because the failure
 * that matters in production is "the app is up but cannot reach Postgres" —
 * a static response would report that as healthy.
 */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute("select 1");

    return NextResponse.json(
      { status: "ok", database: "reachable" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: error instanceof Error ? error.message : "unknown",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
