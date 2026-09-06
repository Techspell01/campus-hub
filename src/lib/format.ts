/**
 * Date formatting pinned to the campus timezone.
 *
 * Every formatter names an explicit `timeZone`. Without it the server renders
 * in UTC and the browser renders in the visitor's zone, and React throws a
 * hydration mismatch on any date that straddles midnight.
 */

export const CAMPUS_TIME_ZONE = "Asia/Kolkata";
export const CAMPUS_LOCALE = "en-IN";

/**
 * Fixed UTC offset for the campus zone.
 *
 * A `datetime-local` input submits a wall-clock string with no zone. Parsing it
 * with `new Date(...)` uses the *server's* zone — UTC on Vercel — which would
 * silently shift every event a coordinator schedules. Pinning the offset makes
 * "6:30 pm" mean 6:30 pm on campus wherever the code runs.
 *
 * India has no daylight saving, so a constant is correct here. A campus in a
 * DST zone would need a real zoned-time library instead.
 */
export const CAMPUS_UTC_OFFSET = "+05:30";

/** ISO instant -> the "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
export function toDateTimeLocalValue(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** The inverse: a datetime-local value read as campus wall-clock time. */
export function parseCampusDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;

  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const parsed = new Date(`${withSeconds}${CAMPUS_UTC_OFFSET}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const dayMonth = new Intl.DateTimeFormat(CAMPUS_LOCALE, {
  timeZone: CAMPUS_TIME_ZONE,
  day: "numeric",
  month: "short",
});

const fullDate = new Intl.DateTimeFormat(CAMPUS_LOCALE, {
  timeZone: CAMPUS_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeOnly = new Intl.DateTimeFormat(CAMPUS_LOCALE, {
  timeZone: CAMPUS_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dayOfMonth = new Intl.DateTimeFormat(CAMPUS_LOCALE, {
  timeZone: CAMPUS_TIME_ZONE,
  day: "2-digit",
});

const monthShort = new Intl.DateTimeFormat(CAMPUS_LOCALE, {
  timeZone: CAMPUS_TIME_ZONE,
  month: "short",
});

export const formatDayMonth = (iso: string) => dayMonth.format(new Date(iso));
export const formatFullDate = (iso: string) => fullDate.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));
export const formatDay = (iso: string) => dayOfMonth.format(new Date(iso));
export const formatMonth = (iso: string) =>
  monthShort.format(new Date(iso)).toUpperCase();

/** "Fri, 16 Oct · 6:30 pm" */
export const formatDateTime = (iso: string) =>
  `${fullDate.format(new Date(iso))} · ${timeOnly.format(new Date(iso))}`;

/**
 * True when `iso` has already passed.
 *
 * Reads the clock, so it belongs in a server component (which renders once per
 * request) or an event handler — never in a client render, where the result
 * would change between passes.
 */
export const isPast = (iso: string) => Date.now() > new Date(iso).getTime();

/** Whole days from `from` until `iso`, floored at 0. */
export function daysUntil(iso: string, from: Date = new Date()) {
  const diff = new Date(iso).getTime() - from.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}
