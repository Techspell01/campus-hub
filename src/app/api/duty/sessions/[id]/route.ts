import { NextResponse } from "next/server";

import type { DutySessionWithRoster } from "@/lib/types";
import { apiCoordinator } from "@/server/auth/api-guard";
import {
  deleteSession,
  findSession,
  listCheckIns,
} from "@/server/repositories/duty";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Session plus roster. The coordinator screen polls this — there is no
 * long-lived connection to hold open on serverless.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await apiCoordinator();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const session = await findSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const payload: DutySessionWithRoster = {
    ...session,
    checkIns: await listCheckIns(id),
  };

  return NextResponse.json(
    { session: payload },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await apiCoordinator();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  if (!(await deleteSession(id))) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
