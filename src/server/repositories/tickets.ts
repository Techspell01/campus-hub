import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { events, tickets } from "@/db/schema";
import type { Ticket, User } from "@/lib/types";
import { newId } from "@/server/ids";
import { buildTicketCode, verifyTicketCode } from "@/server/ticket-code";

const toTicket = (row: typeof tickets.$inferSelect): Ticket => ({
  id: row.id,
  eventId: row.eventId,
  userId: row.userId,
  holderName: row.holderName,
  code: row.code,
  issuedAt: row.issuedAt.toISOString(),
  status: row.status,
  usedAt: row.usedAt?.toISOString() ?? null,
});

export async function listTicketsForUser(userId: string): Promise<Ticket[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, userId))
    .orderBy(desc(tickets.issuedAt));

  return rows.map(toTicket);
}

export async function findTicketForUserAndEvent(
  userId: string,
  eventId: string,
): Promise<Ticket | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.userId, userId), eq(tickets.eventId, eventId)))
    .limit(1);

  return row ? toTicket(row) : null;
}

export type RegisterResult =
  | { status: "issued"; ticket: Ticket }
  | { status: "already-registered"; ticket: Ticket }
  | { status: "sold-out" }
  | { status: "unavailable" };

/**
 * Issues a pass for an event.
 *
 * The id is generated first so the code can be signed before insert, keeping
 * it a single statement. A repeat registration is not an error — the unique
 * index on (event, user) turns it into a no-op and the existing pass comes
 * back, which is what a student double-tapping "Register" should see.
 */
export async function registerForEvent(
  user: User,
  eventId: string,
): Promise<RegisterResult> {
  const db = await getDb();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.published, true)))
    .limit(1);

  if (!event) return { status: "unavailable" };

  const existing = await findTicketForUserAndEvent(user.id, eventId);
  if (existing) return { status: "already-registered", ticket: existing };

  if (event.capacity !== null) {
    const [issued] = await db
      .select({ n: count() })
      .from(tickets)
      .where(eq(tickets.eventId, eventId));

    if (Number(issued?.n ?? 0) >= event.capacity) return { status: "sold-out" };
  }

  const id = newId("tkt");
  const rows = await db
    .insert(tickets)
    .values({
      id,
      eventId,
      userId: user.id,
      holderName: user.name,
      code: buildTicketCode(id),
    })
    .onConflictDoNothing({
      target: [tickets.eventId, tickets.userId],
    })
    .returning();

  if (rows[0]) return { status: "issued", ticket: toTicket(rows[0]) };

  // Lost a race with another tab; the other insert won.
  const raced = await findTicketForUserAndEvent(user.id, eventId);
  return raced
    ? { status: "already-registered", ticket: raced }
    : { status: "unavailable" };
}

/** Signature-checked lookup. Returns null for forged or unknown codes. */
export async function findTicketByCode(code: string): Promise<Ticket | null> {
  const ticketId = verifyTicketCode(code);
  if (!ticketId) return null;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  return row ? toTicket(row) : null;
}

export type RedeemResult =
  | { status: "admitted"; ticket: Ticket }
  | { status: "already-used"; ticket: Ticket }
  | { status: "revoked"; ticket: Ticket }
  | { status: "invalid" };

/**
 * Verify a pass and burn it in one step.
 *
 * Deliberately not idempotent: the second scan of the same pass must report
 * `already-used`, because at a gate that is the signal that someone is trying
 * to get two people in on one ticket.
 *
 * The update is conditional on the row still being `valid`, so two gates
 * scanning the same pass at the same moment can't both see "admitted" — only
 * the statement that actually changed a row returns one.
 */
export async function redeemTicket(
  code: string,
  admittedBy: string,
): Promise<RedeemResult> {
  const ticketId = verifyTicketCode(code);
  if (!ticketId) return { status: "invalid" };

  const db = await getDb();

  const updated = await db
    .update(tickets)
    .set({ status: "used", usedAt: new Date(), admittedBy })
    .where(and(eq(tickets.id, ticketId), eq(tickets.status, "valid")))
    .returning();

  if (updated[0]) return { status: "admitted", ticket: toTicket(updated[0]) };

  const [row] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!row) return { status: "invalid" };

  return row.status === "revoked"
    ? { status: "revoked", ticket: toTicket(row) }
    : { status: "already-used", ticket: toTicket(row) };
}

/** Gate progress across every issued pass. */
export async function ticketCounts() {
  const db = await getDb();

  const [total] = await db.select({ n: count() }).from(tickets);
  const [admitted] = await db
    .select({ n: count() })
    .from(tickets)
    .where(eq(tickets.status, "used"));

  return {
    total: Number(total?.n ?? 0),
    admitted: Number(admitted?.n ?? 0),
  };
}
