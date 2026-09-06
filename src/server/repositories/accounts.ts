import "server-only";

import { and, eq, gt, lt } from "drizzle-orm";

import { getDb } from "@/db";
import { authSessions, users } from "@/db/schema";
import type { Role, User } from "@/lib/types";
import { newId } from "@/server/ids";

const toUser = (row: typeof users.$inferSelect): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
});

const normaliseEmail = (email: string) => email.trim().toLowerCase();

/**
 * Server-only: returns the row *including* the password hash. Only the sign-in
 * path should call this; everything else wants `findUserById`.
 */
export async function findUserRecordByEmail(email: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normaliseEmail(email)))
    .limit(1);

  return row ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? toUser(row) : null;
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  const rows = await db.select({ id: users.id }).from(users);
  return rows.length;
}

export type CreateUserResult =
  | { ok: true; user: User }
  | { ok: false; reason: "email-taken" };

export async function createUser(input: {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}): Promise<CreateUserResult> {
  const db = await getDb();

  const rows = await db
    .insert(users)
    .values({
      id: newId("usr"),
      email: normaliseEmail(input.email),
      name: input.name.trim().slice(0, 60),
      role: input.role,
      passwordHash: input.passwordHash,
    })
    // The unique index is the real guard: two simultaneous sign-ups with the
    // same email would both pass a check-then-insert, but only one can land.
    .onConflictDoNothing({ target: users.email })
    .returning();

  const created = rows[0];
  return created
    ? { ok: true, user: toUser(created) }
    : { ok: false, reason: "email-taken" };
}

export async function setUserRole(userId: string, role: Role) {
  const db = await getDb();
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function listUsers(): Promise<User[]> {
  const db = await getDb();
  const rows = await db.select().from(users).orderBy(users.createdAt);
  return rows.map(toUser);
}

/* --- Login sessions ------------------------------------------------------ */

export async function createAuthSession(input: {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}) {
  const db = await getDb();

  // Opportunistic cleanup of anything already expired — cheap, indexed, and
  // saves needing a scheduled job.
  await db.delete(authSessions).where(lt(authSessions.expiresAt, new Date()));

  await db.insert(authSessions).values(input);
}

/** Resolves a session token hash to its user, or null if unknown or expired. */
export async function findUserBySessionToken(
  tokenHash: string,
): Promise<User | null> {
  const db = await getDb();

  const [row] = await db
    .select({ user: users })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(
      and(
        eq(authSessions.tokenHash, tokenHash),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ? toUser(row.user) : null;
}

export async function deleteAuthSession(tokenHash: string) {
  const db = await getDb();
  await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}
