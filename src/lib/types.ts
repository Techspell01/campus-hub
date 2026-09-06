import type { AccentKey } from "./accents";

/**
 * Domain types shared by the server and the browser.
 *
 * Every timestamp is an ISO-8601 string rather than a `Date`. Repositories
 * convert at the boundary, because a `Date` sent from a server component to a
 * client one is serialised anyway — doing it explicitly keeps one representation
 * everywhere and keeps the formatters in `lib/format.ts` honest.
 */

/**
 * Two roles is all the app needs. Faculty are coordinators as far as
 * permissions go — the faculty/main/sub distinction in the directory is
 * profile data, not authorisation.
 */
export type Role = "student" | "coordinator";

/** The client-safe shape of an account. Never carries the password hash. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** Sub-coordinator duty buckets used across the directory and roster. */
export const DUTY_AREAS = [
  "Stage Management",
  "Discipline",
  "Refreshment",
  "Technical",
  "Hospitality",
  "Registration",
  "Media & Coverage",
] as const;

export type DutyArea = (typeof DUTY_AREAS)[number];

export type CoordinatorRole = "faculty" | "main" | "sub";

export interface Coordinator {
  id: string;
  eventId: string;
  name: string;
  /** Designation line — "Faculty Convenor · Dept. of CSE", "4th Year · CSE". */
  title: string;
  role: CoordinatorRole;
  /** Only meaningful for `role: "sub"`. */
  dutyArea?: DutyArea;
  /** Any human format; normalised by `toWhatsAppNumber` before use. */
  phone?: string;
  email?: string;
  accent: AccentKey;
  sortOrder: number;
}

export interface Club {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  memberCount: number;
  accent: AccentKey;
}

export interface CollegeEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  clubId: string | null;
  /** Denormalised for display; null when the club was deleted. */
  clubName: string | null;
  startsAt: string;
  endsAt: string;
  venue: string;
  category: string;
  accent: AccentKey;
  tags: string[];
  /** Null means uncapped. */
  capacity: number | null;
  /** Derived from issued tickets; null when uncapped. */
  seatsLeft: number | null;
  /** Drives the Hub hero countdown. */
  isFlagship: boolean;
  /** Drafts are invisible to students. */
  published: boolean;
}

export type AnnouncementLevel = "urgent" | "info" | "success";

export interface Announcement {
  id: string;
  level: AnnouncementLevel;
  message: string;
  postedAt: string;
  expiresAt: string | null;
  published: boolean;
}

/* --- Ticketing ----------------------------------------------------------- */

export type TicketStatus = "valid" | "used" | "revoked";

export interface Ticket {
  id: string;
  eventId: string;
  /** Owner. The wallet only ever returns the signed-in user's tickets. */
  userId: string;
  holderName: string;
  /** Payload encoded into the QR — verified server-side at the gate. */
  code: string;
  issuedAt: string;
  status: TicketStatus;
  /** Set the moment a gate admits this pass. */
  usedAt: string | null;
}

/* --- Duty roster --------------------------------------------------------- */

/**
 * A duty group a coordinator opens for volunteers to scan into.
 *
 * The signing secret deliberately has no field here — it lives only in the
 * database, so a session object can be sent to the browser as-is.
 */
export interface DutySession {
  id: string;
  eventId: string;
  eventTitle: string;
  dutyArea: DutyArea;
  createdByName: string;
  opensAt: string;
  closesAt: string;
  expectedVolunteers: number;
}

export interface DutyCheckIn {
  id: string;
  sessionId: string;
  volunteerId: string;
  volunteerName: string;
  checkedInAt: string;
}

/** A session plus its roster — what the coordinator screen renders. */
export interface DutySessionWithRoster extends DutySession {
  checkIns: DutyCheckIn[];
}

/** List-view shape: the roster reduced to a count. */
export interface DutySessionSummary extends DutySession {
  checkedInCount: number;
}
