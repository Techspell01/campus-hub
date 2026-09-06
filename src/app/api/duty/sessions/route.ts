import { NextResponse } from "next/server";

import { DUTY_AREAS, type DutyArea } from "@/lib/types";
import { apiCoordinator } from "@/server/auth/api-guard";
import { createSession, listSessionSummaries } from "@/server/repositories/duty";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await apiCoordinator();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ sessions: await listSessionSummaries() });
}

interface CreateBody {
  eventId?: unknown;
  dutyArea?: unknown;
  durationMinutes?: unknown;
  expectedVolunteers?: unknown;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export async function POST(request: Request) {
  const auth = await apiCoordinator();
  if (auth instanceof NextResponse) return auth;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.eventId !== "string" || !body.eventId) {
    return NextResponse.json({ error: "Pick an event." }, { status: 400 });
  }

  const dutyArea = body.dutyArea as DutyArea;
  if (!DUTY_AREAS.includes(dutyArea)) {
    return NextResponse.json({ error: "Unknown duty area." }, { status: 400 });
  }

  // Ownership comes from the session, never the request body — otherwise
  // anyone could open a duty group in another coordinator's name.
  const session = await createSession({
    eventId: body.eventId,
    dutyArea,
    createdBy: auth.id,
    createdByName: auth.name,
    durationMinutes: clamp(Number(body.durationMinutes) || 120, 5, 24 * 60),
    expectedVolunteers: clamp(Number(body.expectedVolunteers) || 10, 1, 500),
  });

  if (!session) {
    return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  }

  return NextResponse.json({ session }, { status: 201 });
}
