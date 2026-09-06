import type { Metadata } from "next";
import { Settings, Users } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ACCENTS } from "@/lib/accents";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/current-user";
import { listClubs } from "@/server/repositories/content";

export const metadata: Metadata = { title: "Clubs" };
export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const [user, clubs] = await Promise.all([getCurrentUser(), listClubs()]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">
            Clubs
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            {clubs.length === 0
              ? "No clubs registered yet."
              : `${clubs.length} societies on campus.`}
          </p>
        </div>

        {user?.role === "coordinator" && (
          <GlassButton
            href="/admin/clubs"
            variant="glass"
            size="sm"
            icon={<Settings />}
          >
            Manage
          </GlassButton>
        )}
      </header>

      {clubs.length === 0 ? (
        <div className="glass glass-shine rounded-glass p-10 text-center">
          <Users size={26} className="mx-auto text-ink-faint" aria-hidden />
          <p className="mt-3 text-[15px] font-medium text-ink">
            Nothing here yet
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-ink-muted">
            {user?.role === "coordinator"
              ? "Add clubs from the admin area so events can be attributed to them."
              : "Clubs will appear once they're registered."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clubs.map((club) => {
            const palette = ACCENTS[club.accent];

            return (
              <GlassCard key={club.id} className="p-5">
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br",
                      "text-[14px] font-semibold text-white ring-1 ring-white/25 shadow-lg",
                      palette.gradient,
                      palette.glow,
                    )}
                    aria-hidden
                  >
                    {club.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-semibold text-ink">
                      {club.name}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      {club.category} · {club.memberCount} members
                    </p>
                  </div>
                </div>

                {club.tagline && (
                  <p className="mt-3.5 text-[13px] leading-relaxed text-ink-muted">
                    {club.tagline}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
