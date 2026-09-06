import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import {
  createAuthSession,
  deleteAuthSession,
  findUserBySessionToken,
} from "@/server/repositories/accounts";
import type { User } from "@/lib/types";

/**
 * Opaque session cookies.
 *
 * The cookie holds a 256-bit random token; the store keeps only its SHA-256.
 * That asymmetry is the point — someone who reads `store.json` (or a database
 * dump) gets hashes they cannot present as a session. Hashing here is plain
 * SHA-256 rather than scrypt because the input is already high-entropy random,
 * so there is nothing to brute-force.
 *
 * No JWT: a stateless token cannot be revoked, and signing out should actually
 * sign you out.
 */

export const SESSION_COOKIE = "campus_hub_session";

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("base64url");

/** Issues a session and writes the cookie. Call only from an action/handler. */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");

  await createAuthSession({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript can never read it, so XSS can't steal it.
    sameSite: "lax", // Blocks the cookie on cross-site POSTs, which is our CSRF defence.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Revokes the session server-side *and* clears the cookie. */
export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) await deleteAuthSession(hashToken(token));
  cookieStore.delete(SESSION_COOKIE);
}

export async function readSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return findUserBySessionToken(hashToken(token));
}
