import "server-only";

import { randomBytes } from "node:crypto";
import { and, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { dutyCheckIns, dutySessions, events } from "@/db/schema";
import type {
  DutyArea,
  DutyCheckIn,
  DutySession,
  DutySessionSummary,
} from "@/lib/types";
import { newId } from "@/server/ids";

type SessionRow = typeof dutySessions.$inferSelect;

/**
 * Projects a stored session to the shape that may reach a browser.
 *
 * An explicit allowlist rather than a spread: `secret` is on the row, and with
 * `{ secret, ...rest }` any server-only column added later would start leaking
 * to the client by default.
 */
const toSession = (row: SessionRow, eventTitle: string): DutySession => ({
  id: row.id,
  eventId: row.eventId,
  eventTitle,
  dutyArea: row.dutyArea,
  createdByName: row.createdByName,
  opensAt: row.opensAt.toISOString(),
  closesAt: row.closesAt.toISOString(),
  expectedVolunteers: row.expectedVolunteers,
});

const toCheckIn = (row: typeof dutyCheckIns.$inferSelect): DutyCheckIn => ({
  id: row.id,
  sessionId: row.sessionId,
  volunteerId: row.volunteerId,
  volunteerName: row.volunteerName,
  checkedInAt: row.checkedInAt.toISOString(),
});

export async function listSessionSummaries(): Promise<DutySessionSummary[]> {
  const db = await getDb();

  const rows = await db
    .select({ session: dutySessions, eventTitle: events.title })
    .from(dutySessions)
    .innerJoin(events, eq(events.id, dutySessions.eventId))
    .orderBy(desc(dutySessions.opensAt));

  const counts = await db
    .select({ sessionId: dutyCheckIns.sessionId, n: count() })
    .from(dutyCheckIns)
    .groupBy(dutyCheckIns.sessionId);

  const bySession = new Map(
    counts.map((row) => [row.sessionId, Number(row.n)]),
  );

  return rows.map((row) => ({
    ...toSession(row.session, row.eventTitle),
    checkedInCount: bySession.get(row.session.id) ?? 0,
  }));
}

export async function findSession(id: string): Promise<DutySession | null> {
  const db = await getDb();
  const [row] = await db
    .select({ session: dutySessions, eventTitle: events.title })
    .from(dutySessions)
    .innerJoin(events, eq(events.id, dutySessions.eventId))
    .where(eq(dutySessions.id, id))
    .limit(1);

  return row ? toSession(row.session, row.eventTitle) : null;
}

/** Server-only: the HMAC key behind this session's rotating QR. */
export async function findSessionSecret(id: string): Promise<string | null> {
  const db = await getDb();
  const [row] = await db
    .select({ secret: dutySessions.secret })
    .from(dutySessions)
    .where(eq(dutySessions.id, id))
    .limit(1);

  return row?.secret ?? null;
}

export async function createSession(input: {
  eventId: string;
  dutyArea: DutyArea;
  createdBy: string;
  createdByName: string;
  durationMinutes: number;
  expectedVolunteers: number;
}): Promise<DutySession | null> {
  const db = await getDb();

  const [event] = await db
    .select({ title: events.title })
    .from(events)
    .where(eq(events.id, input.eventId))
    .limit(1);

  if (!event) return null;

  const now = new Date();
  const [row] = await db
    .insert(dutySessions)
    .values({
      id: newId("duty"),
      eventId: input.eventId,
      dutyArea: input.dutyArea,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      // Per-session key: compromising one QR can't forge check-ins for another.
      secret: randomBytes(32).toString("base64url"),
      opensAt: now,
      closesAt: new Date(now.getTime() + input.durationMinutes * 60_000),
      expectedVolunteers: input.expectedVolunteers,
    })
    .returning();

  return toSession(row, event.title);
}

export async function deleteSession(id: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .delete(dutySessions)
    .where(eq(dutySessions.id, id))
    .returning({ id: dutySessions.id });

  return rows.length > 0;
}

export async function listCheckIns(sessionId: string): Promise<DutyCheckIn[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(dutyCheckIns)
    .where(eq(dutyCheckIns.sessionId, sessionId))
    .orderBy(desc(dutyCheckIns.checkedInAt));

  return rows.map(toCheckIn);
}

export type CheckInResult =
  | { status: "recorded"; checkIn: DutyCheckIn }
  | { status: "duplicate"; checkIn: DutyCheckIn };

/**
 * Idempotent per volunteer: a second scan reports the original time.
 *
 * The unique index on (session, volunteer) does the work — two taps a
 * millisecond apart both reach the insert, but only one row lands and the
 * other falls through to the lookup.
 */
export async function recordCheckIn(input: {
  sessionId: string;
  volunteerId: string;
  volunteerName: string;
}): Promise<CheckInResult> {
  const db = await getDb();

  const rows = await db
    .insert(dutyCheckIns)
    .values({ id: newId("chk"), ...input })
    .onConflictDoNothing({
      target: [dutyCheckIns.sessionId, dutyCheckIns.volunteerId],
    })
    .returning();

  if (rows[0]) return { status: "recorded", checkIn: toCheckIn(rows[0]) };

  const [existing] = await db
    .select()
    .from(dutyCheckIns)
    .where(
      and(
        eq(dutyCheckIns.sessionId, input.sessionId),
        eq(dutyCheckIns.volunteerId, input.volunteerId),
      ),
    )
    .limit(1);

  return { status: "duplicate", checkIn: toCheckIn(existing) };
}
