"use server";

import { revalidatePath } from "next/cache";

import { ACCENT_KEYS, type AccentKey } from "@/lib/accents";
import { parseCampusDateTime } from "@/lib/format";
import {
  DUTY_AREAS,
  type AnnouncementLevel,
  type CoordinatorRole,
  type DutyArea,
} from "@/lib/types";
import { requireCoordinator } from "@/server/auth/current-user";
import {
  createAnnouncement,
  createClub,
  deleteAnnouncement,
  deleteClub,
  updateClub,
} from "@/server/repositories/content";
import {
  createCoordinator,
  createEvent,
  deleteCoordinator,
  deleteEvent,
  updateEvent,
} from "@/server/repositories/events";

export interface AdminFormState {
  error?: string;
  success?: string;
}

/**
 * Every action re-checks the role.
 *
 * Server actions are reachable as HTTP endpoints by anyone who knows the id —
 * the page guard that hid the form does not protect them. Authorisation has to
 * live here too, not only on the screen that renders the button.
 */
async function guard() {
  return requireCoordinator("/admin");
}

const text = (form: FormData, key: string, max = 200) =>
  String(form.get(key) ?? "")
    .trim()
    .slice(0, max);

const number = (form: FormData, key: string) => {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const checked = (form: FormData, key: string) => form.get(key) === "on";

const accentOf = (form: FormData): AccentKey => {
  const value = text(form, "accent") as AccentKey;
  return ACCENT_KEYS.includes(value) ? value : "amber";
};

/** "Aurora Fest 2026" -> "aurora-fest-2026" */
function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Reads a datetime-local field as campus wall-clock time, not server time. */
function parseDateTime(form: FormData, key: string): Date | null {
  const raw = text(form, key, 40);
  return raw ? parseCampusDateTime(raw) : null;
}

/* --- Clubs --------------------------------------------------------------- */

export async function createClubAction(
  _previous: AdminFormState,
  form: FormData,
): Promise<AdminFormState> {
  await guard();

  const name = text(form, "name", 80);
  if (!name) return { error: "A club needs a name." };

  const created = await createClub({
    slug: slugify(text(form, "slug", 60) || name),
    name,
    tagline: text(form, "tagline", 160),
    category: text(form, "category", 40) || "General",
    memberCount: Math.max(0, number(form, "memberCount") ?? 0),
    accent: accentOf(form),
  });

  if (!created) return { error: "A club with that URL name already exists." };

  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { success: `${created.name} added.` };
}

export async function updateClubAction(
  _previous: AdminFormState,
  form: FormData,
): Promise<AdminFormState> {
  await guard();

  const id = text(form, "id", 40);
  if (!id) return { error: "Missing club id." };

  await updateClub(id, {
    name: text(form, "name", 80),
    tagline: text(form, "tagline", 160),
    category: text(form, "category", 40) || "General",
    memberCount: Math.max(0, number(form, "memberCount") ?? 0),
    accent: accentOf(form),
  });

  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { success: "Saved." };
}

export async function deleteClubAction(form: FormData) {
  await guard();
  await deleteClub(text(form, "id", 40));
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
}

/* --- Events -------------------------------------------------------------- */

function eventFieldsFrom(form: FormData) {
  const title = text(form, "title", 120);
  const startsAt = parseDateTime(form, "startsAt");
  const endsAt = parseDateTime(form, "endsAt");

  return {
    title,
    startsAt,
    endsAt,
    values: {
      subtitle: text(form, "subtitle", 240),
      clubId: text(form, "clubId", 40) || null,
      venue: text(form, "venue", 120),
      category: text(form, "category", 40) || "General",
      accent: accentOf(form),
      tags: text(form, "tags", 200)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 6),
      capacity: number(form, "capacity"),
      isFlagship: checked(form, "isFlagship"),
      published: checked(form, "published"),
    },
  };
}

export async function createEventAction(
  _previous: AdminFormState,
  form: FormData,
): Promise<AdminFormState> {
  await guard();

  const { title, startsAt, endsAt, values } = eventFieldsFrom(form);
  if (!title) return { error: "An event needs a title." };
  if (!startsAt || !endsAt) return { error: "Set both a start and end time." };
  if (endsAt < startsAt) return { error: "The end time is before the start." };

  const created = await createEvent({
    slug: slugify(text(form, "slug", 60) || title),
    title,
    startsAt,
    endsAt,
    ...values,
  });

  if (!created) return { error: "An event with that URL name already exists." };

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { success: `${created.title} saved.` };
}

export async function updateEventAction(
  _previous: AdminFormState,
  form: FormData,
): Promise<AdminFormState> {
  await guard();

  const id = text(form, "id", 40);
  if (!id) return { error: "Missing event id." };

  const { title, startsAt, endsAt, values } = eventFieldsFrom(form);
  if (!title) return { error: "An event needs a title." };
  if (!startsAt || !endsAt) return { error: "Set both a start and end time." };
  if (endsAt < startsAt) return { error: "The end time is before the start." };

  await updateEvent(id, { title, startsAt, endsAt, ...values });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { success: "Saved." };
}

export async function deleteEventAction(form: FormData) {
  await guard();
  await deleteEvent(text(form, "id", 40));
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}

/* --- Coordinators -------------------------------------------------------- */

export async function createCoordinatorAction(
  _previous: AdminFormState,
  form: FormData,
): Promise<AdminFormState> {
  await guard();

  const eventId = text(form, "eventId", 40);
  const name = text(form, "name", 80);
  if (!eventId) return { error: "Pick an event." };
  if (!name) return { error: "A coordinator needs a name." };

  const role = text(form, "role", 20) as CoordinatorRole;
  const dutyArea = text(form, "dutyArea", 40) as DutyArea;

  await createCoordinator({
    eventId,
    name,
    title: text(form, "title", 120),
    role: ["faculty", "main", "sub"].includes(role) ? role : "sub",
    // A duty area only means anything for a sub-coordinator.
    dutyArea: role === "sub" && DUTY_AREAS.includes(dutyArea) ? dutyArea : null,
    phone: text(form, "phone", 30) || null,
    email: text(form, "email", 120) || null,
    accent: accentOf(form),
    sortOrder: number(form, "sortOrder") ?? 0,
  });

  revalidatePath("/admin/coordinators");
  revalidatePath("/events");
  return { success: `${name} added.` };
}

export async function deleteCoordinatorAction(form: FormData) {
  await guard();
  await deleteCoordinator(text(form, "id", 40));
  revalidatePath("/admin/coordinators");
  revalidatePath("/events");
}

/* --- Announcements ------------------------------------------------------- */

export async function createAnnouncementAction(
  _previous: AdminFormState,
  form: FormData,
): Promise<AdminFormState> {
  await guard();

  const message = text(form, "message", 240);
  if (!message) return { error: "Write the announcement first." };

  const level = text(form, "level", 20) as AnnouncementLevel;

  await createAnnouncement({
    level: ["urgent", "info", "success"].includes(level) ? level : "info",
    message,
    expiresAt: parseDateTime(form, "expiresAt"),
    published: true,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: "Posted." };
}

export async function deleteAnnouncementAction(form: FormData) {
  await guard();
  await deleteAnnouncement(text(form, "id", 40));
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}
