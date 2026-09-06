import type { Metadata } from "next";

import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  AccentField,
  SelectField,
  TextField,
} from "@/components/admin/fields";
import { DUTY_AREAS } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  createCoordinatorAction,
  deleteCoordinatorAction,
} from "@/server/actions/admin";
import {
  listCoordinatorsForEvent,
  listEvents,
} from "@/server/repositories/events";

export const metadata: Metadata = { title: "Coordinators · Admin" };

const ROLE_LABEL = {
  faculty: "Faculty",
  main: "Main",
  sub: "Sub",
} as const;

export default async function AdminCoordinatorsPage() {
  const events = await listEvents({ includeDrafts: true });

  const directories = await Promise.all(
    events.map(async (event) => ({
      event,
      coordinators: await listCoordinatorsForEvent(event.id),
    })),
  );

  if (events.length === 0) {
    return (
      <p className="glass glass-shine rounded-glass px-5 py-8 text-center text-[13.5px] text-ink-faint">
        Create an event first — coordinators belong to one.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <AdminForm action={createCoordinatorAction} submitLabel="Add coordinator">
        <SelectField
          label="Event"
          name="eventId"
          span
          options={events.map((event) => ({
            value: event.id,
            label: event.title,
          }))}
        />
        <TextField
          label="Name"
          name="name"
          placeholder="Dr. Meera Nair"
          required
          hint="Honorifics are kept in the WhatsApp greeting."
        />
        <TextField
          label="Designation"
          name="title"
          placeholder="Faculty Convenor · Dept. of CSE"
        />
        <SelectField
          label="Level"
          name="role"
          defaultValue="sub"
          options={[
            { value: "faculty", label: "Faculty coordinator" },
            { value: "main", label: "Main student coordinator" },
            { value: "sub", label: "Sub-coordinator" },
          ]}
        />
        <SelectField
          label="Duty area"
          name="dutyArea"
          defaultValue={DUTY_AREAS[0]}
          hint="Used for sub-coordinators only."
          options={DUTY_AREAS.map((area) => ({ value: area, label: area }))}
        />
        <TextField
          label="Phone"
          name="phone"
          placeholder="+91 98765 43210"
          hint="Any format. Powers the WhatsApp button."
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          placeholder="meera.nair@college.edu"
        />
        <AccentField />
        <TextField
          label="Sort order"
          name="sortOrder"
          type="number"
          defaultValue={0}
          hint="Lower numbers appear first."
        />
      </AdminForm>

      {directories.map(({ event, coordinators }) => (
        <section key={event.id} className="glass glass-shine rounded-glass p-4">
          <h2 className="text-[14.5px] font-semibold text-ink">
            {event.title}
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            {coordinators.length === 0
              ? "No coordinators yet — the directory won't render on this event."
              : `${coordinators.length} in the directory`}
          </p>

          {coordinators.length > 0 && (
            <ul className="mt-3 space-y-2">
              {coordinators.map((coordinator) => {
                // Surfaces a bad number here rather than at the event itself.
                const reachable = coordinator.phone
                  ? Boolean(
                      buildWhatsAppUrl({
                        phone: coordinator.phone,
                        name: coordinator.name,
                      }),
                    )
                  : false;

                return (
                  <li
                    key={coordinator.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/30 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">
                        {coordinator.name}
                      </p>
                      <p className="truncate text-[11.5px] text-ink-faint">
                        {ROLE_LABEL[coordinator.role]}
                        {coordinator.dutyArea
                          ? ` · ${coordinator.dutyArea}`
                          : ""}
                        {coordinator.phone
                          ? reachable
                            ? " · WhatsApp ready"
                            : " · unusable number"
                          : " · no number"}
                      </p>
                    </div>

                    <DeleteButton
                      action={deleteCoordinatorAction}
                      id={coordinator.id}
                      label="Remove"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
