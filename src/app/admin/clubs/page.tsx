import type { Metadata } from "next";

import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  AccentField,
  TextArea,
  TextField,
} from "@/components/admin/fields";
import { ACCENTS } from "@/lib/accents";
import { cn } from "@/lib/utils";
import {
  createClubAction,
  deleteClubAction,
  updateClubAction,
} from "@/server/actions/admin";
import { listClubs } from "@/server/repositories/content";

export const metadata: Metadata = { title: "Clubs · Admin" };

export default async function AdminClubsPage() {
  const clubs = await listClubs();

  return (
    <div className="space-y-5">
      <AdminForm action={createClubAction} submitLabel="Add club">
        <TextField label="Name" name="name" required placeholder="Music Club" />
        <TextField
          label="Category"
          name="category"
          placeholder="Cultural"
          defaultValue="General"
        />
        <TextArea
          label="Tagline"
          name="tagline"
          placeholder="Bands, open mics and the annual battle of bands."
        />
        <TextField
          label="Members"
          name="memberCount"
          type="number"
          min={0}
          defaultValue={0}
        />
        <AccentField />
        <TextField
          label="URL name"
          name="slug"
          placeholder="left blank = from the name"
          hint="Used in links. Letters, numbers and dashes."
          span
        />
      </AdminForm>

      {clubs.length === 0 ? (
        <p className="glass glass-shine rounded-glass px-5 py-8 text-center text-[13.5px] text-ink-faint">
          No clubs yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {clubs.map((club) => (
            <li
              key={club.id}
              className="glass glass-shine overflow-hidden rounded-glass"
            >
              <div className="flex items-center gap-3.5 p-4">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br",
                    "text-[13px] font-semibold text-white ring-1 ring-white/25",
                    ACCENTS[club.accent].gradient,
                  )}
                  aria-hidden
                >
                  {club.name.slice(0, 2).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-ink">
                    {club.name}
                  </p>
                  <p className="truncate text-[12px] text-ink-faint">
                    {club.category} · {club.memberCount} members · /{club.slug}
                  </p>
                </div>

                <DeleteButton action={deleteClubAction} id={club.id} />
              </div>

              <details className="border-t border-white/20 dark:border-white/10">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-[12.5px] font-medium text-ink-muted">
                  Edit
                </summary>
                <div className="px-4 pb-4">
                  <AdminForm
                    action={updateClubAction}
                    submitLabel="Save changes"
                    compact
                  >
                    <input type="hidden" name="id" value={club.id} />
                    <TextField
                      label="Name"
                      name="name"
                      defaultValue={club.name}
                      required
                    />
                    <TextField
                      label="Category"
                      name="category"
                      defaultValue={club.category}
                    />
                    <TextArea
                      label="Tagline"
                      name="tagline"
                      defaultValue={club.tagline}
                    />
                    <TextField
                      label="Members"
                      name="memberCount"
                      type="number"
                      min={0}
                      defaultValue={club.memberCount}
                    />
                    <AccentField defaultValue={club.accent} />
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
