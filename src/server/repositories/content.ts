import "server-only";

import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import { getDb } from "@/db";
import { announcements, clubs } from "@/db/schema";
import type { AccentKey } from "@/lib/accents";
import type { Announcement, AnnouncementLevel, Club } from "@/lib/types";
import { newId } from "@/server/ids";

/* --- Clubs --------------------------------------------------------------- */

const toClub = (row: typeof clubs.$inferSelect): Club => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  tagline: row.tagline,
  category: row.category,
  memberCount: row.memberCount,
  accent: row.accent,
});

export async function listClubs(): Promise<Club[]> {
  const db = await getDb();
  const rows = await db.select().from(clubs).orderBy(clubs.name);
  return rows.map(toClub);
}

export async function findClubBySlug(slug: string): Promise<Club | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.slug, slug))
    .limit(1);
  return row ? toClub(row) : null;
}

export interface ClubInput {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  memberCount: number;
  accent: AccentKey;
}

export async function createClub(input: ClubInput): Promise<Club | null> {
  const db = await getDb();
  const [row] = await db
    .insert(clubs)
    .values({ id: newId("clb"), ...input })
    .onConflictDoNothing({ target: clubs.slug })
    .returning();

  return row ? toClub(row) : null;
}

export async function updateClub(
  id: string,
  input: Partial<ClubInput>,
): Promise<void> {
  const db = await getDb();
  await db.update(clubs).set(input).where(eq(clubs.id, id));
}

export async function deleteClub(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(clubs).where(eq(clubs.id, id));
}

/* --- Announcements ------------------------------------------------------- */

const toAnnouncement = (
  row: typeof announcements.$inferSelect,
): Announcement => ({
  id: row.id,
  level: row.level,
  message: row.message,
  postedAt: row.postedAt.toISOString(),
  expiresAt: row.expiresAt?.toISOString() ?? null,
  published: row.published,
});

/** Live announcements for the ticker: published, and not past their expiry. */
export async function listActiveAnnouncements(): Promise<Announcement[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.published, true),
        or(
          isNull(announcements.expiresAt),
          gt(announcements.expiresAt, new Date()),
        ),
      ),
    )
    .orderBy(desc(announcements.postedAt));

  return rows.map(toAnnouncement);
}

/** Everything, including drafts and expired — the admin view. */
export async function listAllAnnouncements(): Promise<Announcement[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.postedAt));
  return rows.map(toAnnouncement);
}

export interface AnnouncementInput {
  level: AnnouncementLevel;
  message: string;
  expiresAt: Date | null;
  published: boolean;
}

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<Announcement> {
  const db = await getDb();
  const [row] = await db
    .insert(announcements)
    .values({ id: newId("ann"), ...input })
    .returning();
  return toAnnouncement(row);
}

export async function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
): Promise<void> {
  const db = await getDb();
  await db.update(announcements).set(input).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(announcements).where(eq(announcements.id, id));
}
