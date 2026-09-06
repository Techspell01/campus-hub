import "server-only";

import crypto from "node:crypto";

import { extractDutyToken } from "@/lib/scan-payload";
import { findSessionSecret } from "@/server/repositories/duty";

/**
 * Rotating check-in tokens (a TOTP, essentially).
 *
 * A static QR taped to a wall — or screenshotted and forwarded to a friend at
 * home — would let anyone mark attendance. So the coordinator's QR encodes a
 * token bound to a 30-second window and signed with that session's secret. A
 * screenshot stops working about a minute after it is taken, and nothing the
 * volunteer's phone sends can be forged without the server-side secret.
 */

export const WINDOW_SECONDS = 30;

/** Windows either side of the current one are accepted, covering clock skew
 *  and the second or two between rendering a QR and someone scanning it. */
const SKEW_WINDOWS = 1;

const windowAt = (at: number) => Math.floor(at / 1000 / WINDOW_SECONDS);

function sign(sessionId: string, window: number, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${sessionId}.${window}`)
    .digest("base64url")
    .slice(0, 16);
}

export interface MintedToken {
  token: string;
  /** Epoch ms at which this window closes — drives the countdown ring. */
  expiresAt: number;
  windowSeconds: number;
}

export function mintToken(
  sessionId: string,
  secret: string,
  at: number = Date.now(),
): MintedToken {
  const window = windowAt(at);
  return {
    token: `${sessionId}.${window}.${sign(sessionId, window, secret)}`,
    expiresAt: (window + 1) * WINDOW_SECONDS * 1000,
    windowSeconds: WINDOW_SECONDS,
  };
}

export type VerifyResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "malformed" | "unknown-session" | "expired" };

/** Accepts either a bare token or the full scan URL the QR encodes. */
export async function verifyToken(
  raw: string,
  at: number = Date.now(),
): Promise<VerifyResult> {
  const token = extractDutyToken(raw);
  if (!token) return { ok: false, reason: "malformed" };

  const [sessionId, windowText, signature] = token.split(".");
  if (!sessionId || !windowText || !signature) {
    return { ok: false, reason: "malformed" };
  }

  const window = Number(windowText);
  if (!Number.isInteger(window)) return { ok: false, reason: "malformed" };

  const secret = await findSessionSecret(sessionId);
  if (!secret) return { ok: false, reason: "unknown-session" };

  const current = windowAt(at);
  if (Math.abs(current - window) > SKEW_WINDOWS) {
    return { ok: false, reason: "expired" };
  }

  const expected = sign(sessionId, window, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    // A bad signature on a well-formed token means a forgery attempt, not an
    // old code — but reporting it as "expired" leaks the least.
    return { ok: false, reason: "expired" };
  }

  return { ok: true, sessionId };
}
