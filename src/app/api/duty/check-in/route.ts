import { NextResponse } from "next/server";

import { apiUser } from "@/server/auth/api-guard";
import { verifyToken } from "@/server/duty-token";
import { findSession, recordCheckIn } from "@/server/repositories/duty";

export const dynamic = "force-dynamic";

interface CheckInBody {
  token?: unknown;
}

const REASON_MESSAGE = {
  malformed: "That QR code isn't a duty check-in code.",
  "unknown-session": "This duty session no longer exists.",
  expired: "That code has expired — ask for the current QR and scan again.",
} as const;

export async function POST(request: Request) {
  // Any signed-in user may check in — volunteers are ordinary students.
  const auth = await apiUser();
  if (auth instanceof NextResponse) return auth;

  let body: CheckInBody;
  try {
    body = (await request.json()) as CheckInBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const verified = await verifyToken(body.token);
  if (!verified.ok) {
    return NextResponse.json(
      { error: REASON_MESSAGE[verified.reason] },
      { status: 400 },
    );
  }

  const session = await findSession(verified.sessionId);
  if (!session) {
    return NextResponse.json(
      { error: REASON_MESSAGE["unknown-session"] },
      { status: 404 },
    );
  }

  if (Date.now() > new Date(session.closesAt).getTime()) {
    return NextResponse.json(
      { error: "This duty session has already closed." },
      { status: 410 },
    );
  }

  // Identity comes from the session, so nobody can check in as someone else.
  const result = await recordCheckIn({
    sessionId: session.id,
    volunteerId: auth.id,
    volunteerName: auth.name,
  });

  return NextResponse.json({
    status: result.status,
    checkIn: result.checkIn,
    session: {
      id: session.id,
      dutyArea: session.dutyArea,
      eventTitle: session.eventTitle,
    },
  });
}
