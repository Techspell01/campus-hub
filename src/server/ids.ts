import "server-only";

import { randomUUID } from "node:crypto";

/**
 * Prefixed, URL-safe ids.
 *
 * Application-generated rather than a database sequence so an insert doesn't
 * need a round-trip to learn its own id, and so a stray id in a log or a QR
 * payload says what it refers to at a glance.
 */
export const newId = (prefix: string) =>
  `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
