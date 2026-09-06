import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { ACCENT_KEYS } from "@/lib/accents";
import { DUTY_AREAS } from "@/lib/types";

/**
 * Postgres schema. One source of truth for the database; `drizzle-kit generate`
 * turns changes here into versioned SQL under `drizzle/`.
 *
 * Timestamps are all `timestamptz`. The app deals in a single campus timezone
 * for display, but storing an absolute instant means a venue change or a
 * daylight-saving quirk can never shift an event by an hour.
 */

export const roleEnum = pgEnum("role", ["student", "coordinator"]);
export const coordinatorRoleEnum = pgEnum("coordinator_role", [
  "faculty",
  "main",
  "sub",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "valid",
  "used",
  "revoked",
]);
export const announcementLevelEnum = pgEnum("announcement_level", [
  "urgent",
  "info",
  "success",
]);
export const accentEnum = pgEnum("accent", ACCENT_KEYS);
export const dutyAreaEnum = pgEnum("duty_area", DUTY_AREAS);

const id = (name = "id") => text(name).primaryKey();
const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

/* --- Accounts ------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: id(),
    // Stored lowercased; the unique index is what actually prevents duplicates
    // under concurrent sign-ups, not the application check.
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: roleEnum("role").notNull().default("student"),
    passwordHash: text("password_hash").notNull(),
    createdAt,
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    // The SHA-256 of the cookie value — never the token itself.
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt,
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("auth_sessions_user_idx").on(table.userId),
    index("auth_sessions_expires_idx").on(table.expiresAt),
  ],
);

/* --- Content ------------------------------------------------------------- */

export const clubs = pgTable(
  "clubs",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    category: text("category").notNull().default("General"),
    memberCount: integer("member_count").notNull().default(0),
    accent: accentEnum("accent").notNull().default("violet"),
    createdAt,
  },
  (table) => [uniqueIndex("clubs_slug_idx").on(table.slug)],
);

export const events = pgTable(
  "events",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    // A club can be deleted without taking its events with it.
    clubId: text("club_id").references(() => clubs.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    venue: text("venue").notNull().default(""),
    category: text("category").notNull().default("General"),
    accent: accentEnum("accent").notNull().default("violet"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    /** Null means uncapped. Seats remaining is derived from issued tickets. */
    capacity: integer("capacity"),
    /** Exactly one published event should carry this; it drives the Hub hero. */
    isFlagship: boolean("is_flagship").notNull().default(false),
    /** Drafts stay invisible to students until a coordinator publishes. */
    published: boolean("published").notNull().default(false),
    createdAt,
  },
  (table) => [
    uniqueIndex("events_slug_idx").on(table.slug),
    index("events_starts_at_idx").on(table.startsAt),
  ],
);

export const coordinators = pgTable(
  "coordinators",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title").notNull().default(""),
    role: coordinatorRoleEnum("role").notNull().default("sub"),
    /** Only meaningful for `role = 'sub'`. */
    dutyArea: dutyAreaEnum("duty_area"),
    phone: text("phone"),
    email: text("email"),
    accent: accentEnum("accent").notNull().default("violet"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
  },
  (table) => [index("coordinators_event_idx").on(table.eventId)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: id(),
    level: announcementLevelEnum("level").notNull().default("info"),
    message: text("message").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Null never expires. Past announcements drop out of the ticker on their own. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    published: boolean("published").notNull().default(true),
  },
  (table) => [index("announcements_posted_idx").on(table.postedAt)],
);

/* --- Ticketing ----------------------------------------------------------- */

export const tickets = pgTable(
  "tickets",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** `<ticketId>.<hmac>` — the signature is what a forged code can't produce. */
    code: text("code").notNull(),
    holderName: text("holder_name").notNull(),
    status: ticketStatusEnum("status").notNull().default("valid"),
    issuedAt: createdAt,
    usedAt: timestamp("used_at", { withTimezone: true }),
    admittedBy: text("admitted_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("tickets_code_idx").on(table.code),
    // One pass per person per event, enforced by the database rather than by a
    // check-then-insert that two concurrent requests could both pass.
    uniqueIndex("tickets_event_user_idx").on(table.eventId, table.userId),
    index("tickets_user_idx").on(table.userId),
  ],
);

/* --- Duty roster --------------------------------------------------------- */

export const dutySessions = pgTable(
  "duty_sessions",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    dutyArea: dutyAreaEnum("duty_area").notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdByName: text("created_by_name").notNull(),
    /** HMAC key for this session's rotating QR. Never leaves the server. */
    secret: text("secret").notNull(),
    opensAt: timestamp("opens_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    expectedVolunteers: integer("expected_volunteers").notNull().default(10),
  },
  (table) => [index("duty_sessions_event_idx").on(table.eventId)],
);

export const dutyCheckIns = pgTable(
  "duty_check_ins",
  {
    id: id(),
    sessionId: text("session_id")
      .notNull()
      .references(() => dutySessions.id, { onDelete: "cascade" }),
    volunteerId: text("volunteer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    volunteerName: text("volunteer_name").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Makes a double scan a no-op at the database level, so two taps a
    // millisecond apart can't both insert.
    uniqueIndex("duty_check_ins_unique").on(table.sessionId, table.volunteerId),
    index("duty_check_ins_session_idx").on(table.sessionId),
  ],
);
