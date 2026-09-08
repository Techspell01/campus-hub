import "server-only";

import { and, asc, count, eq, gte } from "drizzle-orm";

import { getDb } from "@/db";
import { clubs, coordinators, events, tickets } from "@/db/schema";
import type { AccentKey } from "@/lib/accents";
import type {
  CollegeEvent,
  Coordinator,
  CoordinatorRole,
  DutyArea,
} from "@/lib/types";
import { newId } from "@/server/ids";

type EventRow = typeof events.$inferSelect;

function toEvent(
  row: EventRow,
  clubName: string | null,
  issued: number,
): CollegeEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    clubId: row.clubId,
    clubName,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    venue: row.venue,
    category: row.category,
    accent: row.accent,
    tags: row.tags,
    capacity: row.capacity,
    seatsLeft:
      row.capacity === null ? null : Math.max(0, row.capacity - issued),
    isFlagship: row.isFlagship,
    published: row.published,
  };
}

/**
 * Tickets issued per event, as a map.
 *
 * Fetched separately and merged in memory rather than joined: an aggregate
 * join would multiply rows against the club join, and the event catalogue is
 * small enough that two round trips beat the complexity.
 */
async function issuedCounts(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ eventId: tickets.eventId, issued: count() })
    .from(tickets)
    .groupBy(tickets.eventId);

  return new Map(rows.map((row) => [row.eventId, Number(row.issued)]));
}

export interface ListEventsOptions {
  /** Admin views pass true; student-facing pages must not. */
  includeDrafts?: boolean;
  /** Hides anything that has already finished. */
  upcomingOnly?: boolean;
}

export async function listEvents(
  options: ListEventsOptions = {},
): Promise<CollegeEvent[]> {
  const db = await getDb();

  const filters = [];
  if (!options.includeDrafts) filters.push(eq(events.published, true));
  if (options.upcomingOnly) filters.push(gte(events.endsAt, new Date()));

  // Independent of each other, so they go in one round trip rather than two.
  // With the database in a different region from the server, a needless
  // sequential await is pure added latency.
  const [rows, issued] = await Promise.all([
    db
      .select({ event: events, clubName: clubs.name })
      .from(events)
      .leftJoin(clubs, eq(clubs.id, events.clubId))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(events.startsAt)),
    issuedCounts(),
  ]);

  return rows.map((row) =>
    toEvent(row.event, row.clubName, issued.get(row.event.id) ?? 0),
  );
}

async function findEventBy(
  column: typeof events.slug | typeof events.id,
  value: string,
  includeDrafts: boolean,
): Promise<CollegeEvent | null> {
  const db = await getDb();

  const filters = [eq(column, value)];
  if (!includeDrafts) filters.push(eq(events.published, true));

  const [row] = await db
    .select({ event: events, clubName: clubs.name })
    .from(events)
    .leftJoin(clubs, eq(clubs.id, events.clubId))
    .where(and(...filters))
    .limit(1);

  if (!row) return null;

  const [issued] = await db
    .select({ n: count() })
    .from(tickets)
    .where(eq(tickets.eventId, row.event.id));

  return toEvent(row.event, row.clubName, Number(issued?.n ?? 0));
}

export const findEventBySlug = (slug: string, includeDrafts = false) =>
  findEventBy(events.slug, slug, includeDrafts);

export const findEventById = (id: string, includeDrafts = false) =>
  findEventBy(events.id, id, includeDrafts);

export interface EventInput {
  slug: string;
  title: string;
  subtitle: string;
  clubId: string | null;
  startsAt: Date;
  endsAt: Date;
  venue: string;
  category: string;
  accent: AccentKey;
  tags: string[];
  capacity: number | null;
  isFlagship: boolean;
  published: boolean;
}

/** Only one event may be flagship; promoting one demotes the rest. */
async function clearOtherFlagships(exceptId: string) {
  const db = await getDb();
  await db.update(events).set({ isFlagship: false });
  await db
    .update(events)
    .set({ isFlagship: true })
    .where(eq(events.id, exceptId));
}

export async function createEvent(
  input: EventInput,
): Promise<CollegeEvent | null> {
  const db = await getDb();

  const [row] = await db
    .insert(events)
    .values({ id: newId("evt"), ...input })
    .onConflictDoNothing({ target: events.slug })
    .returning();

  if (!row) return null;
  if (input.isFlagship) await clearOtherFlagships(row.id);

  return findEventById(row.id, true);
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>,
): Promise<void> {
  const db = await getDb();
  await db.update(events).set(input).where(eq(events.id, id));
  if (input.isFlagship) await clearOtherFlagships(id);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(events).where(eq(events.id, id));
}

/* --- Coordinators -------------------------------------------------------- */

const toCoordinator = (
  row: typeof coordinators.$inferSelect,
): Coordinator => ({
  id: row.id,
  eventId: row.eventId,
  name: row.name,
  title: row.title,
  role: row.role,
  dutyArea: row.dutyArea ?? undefined,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  accent: row.accent,
  sortOrder: row.sortOrder,
});

export async function listCoordinatorsForEvent(
  eventId: string,
): Promise<Coordinator[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(coordinators)
    .where(eq(coordinators.eventId, eventId))
    .orderBy(asc(coordinators.sortOrder), asc(coordinators.name));

  return rows.map(toCoordinator);
}

export interface CoordinatorInput {
  eventId: string;
  name: string;
  title: string;
  role: CoordinatorRole;
  dutyArea: DutyArea | null;
  phone: string | null;
  email: string | null;
  accent: AccentKey;
  sortOrder: number;
}

export async function createCoordinator(
  input: CoordinatorInput,
): Promise<Coordinator> {
  const db = await getDb();
  const [row] = await db
    .insert(coordinators)
    .values({ id: newId("crd"), ...input })
    .returning();
  return toCoordinator(row);
}

export async function updateCoordinator(
  id: string,
  input: Partial<CoordinatorInput>,
): Promise<void> {
  const db = await getDb();
  await db.update(coordinators).set(input).where(eq(coordinators.id, id));
}

export async function deleteCoordinator(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(coordinators).where(eq(coordinators.id, id));
}
