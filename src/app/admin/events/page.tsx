import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  AccentField,
  CheckField,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/fields";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/format";
import type { Club, CollegeEvent } from "@/lib/types";
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from "@/server/actions/admin";
import { listClubs } from "@/server/repositories/content";
import { listEvents } from "@/server/repositories/events";

export const metadata: Metadata = { title: "Events · Admin" };

/** Shared between the create form and each row's edit form. */
function EventFields({
  clubs,
  event,
}: {
  clubs: Club[];
  event?: CollegeEvent;
}): ReactNode {
  const clubOptions = [
    { value: "", label: "No club" },
    ...clubs.map((club) => ({ value: club.id, label: club.name })),
  ];

  return (
    <>
      <TextField
        label="Title"
        name="title"
        defaultValue={event?.title}
        placeholder="Aurora Fest"
        required
        span
      />
      <TextArea
        label="Subtitle"
        name="subtitle"
        defaultValue={event?.subtitle}
        placeholder="Three days of music, art and everything in between."
      />
      <SelectField
        label="Club"
        name="clubId"
        options={clubOptions}
        defaultValue={event?.clubId ?? ""}
      />
      <TextField
        label="Category"
        name="category"
        defaultValue={event?.category ?? "General"}
        placeholder="Cultural"
      />
      <TextField
        label="Starts"
        name="startsAt"
        type="datetime-local"
        defaultValue={event ? toDateTimeLocalValue(event.startsAt) : undefined}
        required
      />
      <TextField
        label="Ends"
        name="endsAt"
        type="datetime-local"
        defaultValue={event ? toDateTimeLocalValue(event.endsAt) : undefined}
        required
      />
      <TextField
        label="Venue"
        name="venue"
        defaultValue={event?.venue}
        placeholder="MG Auditorium"
      />
      <TextField
        label="Capacity"
        name="capacity"
        type="number"
        min={1}
        defaultValue={event?.capacity ?? undefined}
        hint="Leave blank for unlimited seats."
      />
      <TextField
        label="Tags"
        name="tags"
        defaultValue={event?.tags.join(", ")}
        placeholder="Flagship, 3 Days, Open to all"
        hint="Comma separated, up to six."
      />
      <AccentField defaultValue={event?.accent} />
      <TextField
        label="URL name"
        name="slug"
        defaultValue={event?.slug}
        placeholder="left blank = from the title"
        hint="Only set on create; editing this doesn't change the link."
        disabled={Boolean(event)}
        span
      />
      <CheckField
        label="Published"
        name="published"
        hint="Students only see published events."
        defaultChecked={event?.published ?? false}
      />
      <CheckField
        label="Flagship"
        name="isFlagship"
        hint="Drives the Hub countdown. Only one event can hold it."
        defaultChecked={event?.isFlagship ?? false}
      />
    </>
  );
}

export default async function AdminEventsPage() {
  const [clubs, events] = await Promise.all([
    listClubs(),
    listEvents({ includeDrafts: true }),
  ]);

  return (
    <div className="space-y-5">
      <AdminForm action={createEventAction} submitLabel="Create event">
        <EventFields clubs={clubs} />
      </AdminForm>

      {events.length === 0 ? (
        <p className="glass glass-shine rounded-glass px-5 py-8 text-center text-[13.5px] text-ink-faint">
          No events yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="glass glass-shine overflow-hidden rounded-glass"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-ink">
                    {event.title}
                  </p>
                  <p className="truncate text-[12px] text-ink-faint">
                    {formatDateTime(event.startsAt)}
                    {event.clubName ? ` · ${event.clubName}` : ""}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={
                        event.published
                          ? "rounded-pill border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300"
                          : "rounded-pill border border-white/20 bg-neutral-500/15 px-2 py-0.5 text-[10.5px] font-medium text-ink-faint"
                      }
                    >
                      {event.published ? "Published" : "Draft"}
                    </span>
                    {event.isFlagship && (
                      <span className="rounded-pill border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-medium text-amber-700 dark:text-amber-300">
                        Flagship
                      </span>
                    )}
                    {event.capacity !== null && (
                      <span className="rounded-pill border border-white/20 bg-white/30 px-2 py-0.5 text-[10.5px] font-medium text-ink-muted dark:bg-white/[0.06]">
                        {event.seatsLeft}/{event.capacity} left
                      </span>
                    )}
                  </div>
                </div>

                <DeleteButton action={deleteEventAction} id={event.id} />
              </div>

              <details className="border-t border-white/20 dark:border-white/10">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-[12.5px] font-medium text-ink-muted">
                  Edit
                </summary>
                <div className="px-4 pb-4">
                  <AdminForm
                    action={updateEventAction}
                    submitLabel="Save changes"
                    compact
                  >
                    <input type="hidden" name="id" value={event.id} />
                    <EventFields clubs={clubs} event={event} />
                  </AdminForm>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
