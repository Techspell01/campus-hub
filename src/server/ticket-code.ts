import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ticket code signing.
 *
 * A pass is `<ticketId>.<hmac>`. The id alone would be guessable and editable;
 * the signature is what makes an invented or altered code fail at the gate.
 *
 * The key comes from the environment rather than the database because it has
 * to be identical across every serverless instance, and because rotating it
 * should be a deploy-time decision — rotating invalidates every issued pass.
 */

const DEV_FALLBACK = "dev-only-insecure-ticket-secret";

function signingKey(): string {
  const configured = process.env.TICKET_SECRET;
  if (configured && configured.length >= 16) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TICKET_SECRET must be set to at least 16 characters in production.",
    );
  }

  return DEV_FALLBACK;
}

const signature = (ticketId: string) =>
  createHmac("sha256", signingKey())
    .update(`ticket:${ticketId}`)
    .digest("base64url")
    .slice(0, 20);

export const buildTicketCode = (ticketId: string) =>
  `${ticketId}.${signature(ticketId)}`;

/**
 * Returns the ticket id a code refers to, or null if the signature is wrong.
 * Comparison is constant-time so a near-miss can't be narrowed down by timing.
 */
export function verifyTicketCode(code: string): string | null {
  const separator = code.lastIndexOf(".");
  if (separator <= 0) return null;

  const ticketId = code.slice(0, separator);
  const provided = code.slice(separator + 1);
  if (!ticketId || !provided) return null;

  const expected = signature(ticketId);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return ticketId;
}
