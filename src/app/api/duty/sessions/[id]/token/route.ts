import { NextResponse } from "next/server";

import { apiCoordinator } from "@/server/auth/api-guard";
import { mintToken } from "@/server/duty-token";
import { findSession, findSessionSecret } from "@/server/repositories/duty";

// Never cached: the whole point is that the value changes every 30 seconds.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Minting the QR is the coordinator's privilege: whoever can call this can
  // let anyone check in.
  const auth = await apiCoordinator();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const [session, secret] = await Promise.all([
    findSession(id),
    findSessionSecret(id),
  ]);

  if (!session || !secret) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (Date.now() > new Date(session.closesAt).getTime()) {
    return NextResponse.json(
      { error: "This duty session has closed." },
      { status: 410 },
    );
  }

  return NextResponse.json(mintToken(id, secret), {
    headers: { "Cache-Control": "no-store" },
  });
}
