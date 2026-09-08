import type { Metadata } from "next";

import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { SelectField, TextArea, TextField } from "@/components/admin/fields";
import { formatDateTime, isPast } from "@/lib/format";
import type { AnnouncementLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
} from "@/server/actions/admin";
import { listAllAnnouncements } from "@/server/repositories/content";

export const metadata: Metadata = { title: "Announcements · Admin" };

const LEVEL_DOT: Record<AnnouncementLevel, string> = {
  urgent: "bg-rose-500",
  info: "bg-stone-300",
  success: "bg-emerald-500",
};

export default async function AdminAnnouncementsPage() {
  const announcements = await listAllAnnouncements();

  return (
    <div className="space-y-5">
      <AdminForm action={createAnnouncementAction} submitLabel="Post">
        <TextArea
          label="Message"
          name="message"
          placeholder="Registrations close 20 Sep, 11:59 pm."
          required
        />
        <SelectField
          label="Level"
          name="level"
          defaultValue="info"
          options={[
            { value: "urgent", label: "Urgent" },
            { value: "info", label: "Info" },
            { value: "success", label: "Good news" },
          ]}
        />
        <TextField
          label="Expires"
          name="expiresAt"
          type="datetime-local"
          hint="Leave blank to keep it up until you delete it."
        />
      </AdminForm>

      {announcements.length === 0 ? (
        <p className="glass glass-shine rounded-glass px-5 py-8 text-center text-[13.5px] text-ink-faint">
          Nothing posted.
        </p>
      ) : (
        <ul className="space-y-2">
          {announcements.map((announcement) => {
            const expired =
              announcement.expiresAt !== null &&
              isPast(announcement.expiresAt);

            return (
              <li
                key={announcement.id}
                className="glass glass-shine flex items-start gap-3 rounded-glass p-4"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    LEVEL_DOT[announcement.level],
                    expired && "opacity-40",
                  )}
                  aria-hidden
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13.5px] text-ink",
                      expired && "line-through opacity-60",
                    )}
                  >
                    {announcement.message}
                  </p>
                  <p className="mt-1 text-[11.5px] text-ink-faint">
                    {formatDateTime(announcement.postedAt)}
                    {announcement.expiresAt
                      ? expired
                        ? " · expired"
                        : ` · until ${formatDateTime(announcement.expiresAt)}`
                      : ""}
                  </p>
                </div>

                <DeleteButton
                  action={deleteAnnouncementAction}
                  id={announcement.id}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
