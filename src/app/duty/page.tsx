import type { Metadata } from "next";
import { ArrowUpRight, ScanLine, TicketCheck, Users } from "lucide-react";

import { CreateSessionForm } from "@/components/duty/CreateSessionForm";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatTime, isPast } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireCoordinator } from "@/server/auth/current-user";
import { listSessionSummaries } from "@/server/repositories/duty";
import { listEvents } from "@/server/repositories/events";

export const metadata: Metadata = { title: "Duty & Roster" };

// Rosters change constantly; never serve a cached copy of this list.
export const dynamic = "force-dynamic";

export default async function DutyPage() {
  await requireCoordinator("/duty");

  const [summaries, catalogue] = await Promise.all([
    listSessionSummaries(),
    listEvents({ includeDrafts: true }),
  ]);

  const sessions = summaries.map((session) => ({
    ...session,
    isOpen: !isPast(session.closesAt),
  }));

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">
          Duty &amp; Roster
        </h1>
        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-ink-muted">
          Coordinators open a duty group and show its QR. Volunteers scan it
          from their own phone and appear on the roster instantly.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <GlassButton
          href="/duty/scan"
          variant="primary"
          size="lg"
          icon={<ScanLine />}
        >
          I&apos;m a volunteer — scan to check in
        </GlassButton>
        <GlassButton href="/gate" variant="glass" size="lg" icon={<TicketCheck />}>
          Gate scanner
        </GlassButton>
      </div>

      {catalogue.length === 0 ? (
        <p className="glass glass-shine rounded-glass px-5 py-8 text-center text-[13.5px] text-ink-faint">
          Create an event first — a duty group has to belong to one.
        </p>
      ) : (
        <CreateSessionForm
          events={catalogue.map((event) => ({
            id: event.id,
            title: event.title,
          }))}
        />
      )}

      <section aria-labelledby="sessions-heading">
        <h2
          id="sessions-heading"
          className="mb-3.5 px-1 text-lg font-semibold tracking-[-0.02em] text-ink"
        >
          Duty groups
        </h2>

        {sessions.length === 0 ? (
          <p className="glass glass-shine rounded-glass px-5 py-10 text-center text-[13.5px] text-ink-faint">
            No duty groups yet. Create one above to get a QR.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map((session) => (
              <GlassCard
                key={session.id}
                href={`/duty/${session.id}`}
                ariaLabel={`${session.dutyArea} duty for ${session.eventTitle}`}
                className="group p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-ink">
                      {session.dutyArea}
                    </h3>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                      {session.eventTitle}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 rounded-pill border px-2.5 py-1 text-[10.5px] font-medium",
                      session.isOpen
                        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "border-white/20 bg-neutral-500/15 text-ink-faint",
                    )}
                  >
                    {session.isOpen ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="flex items-baseline gap-1.5 text-ink">
                      <Users size={14} className="text-ink-faint" aria-hidden />
                      <span className="text-lg font-semibold tabular-nums">
                        {session.checkedInCount}
                      </span>
                      <span className="text-[12.5px] text-ink-faint">
                        / {session.expectedVolunteers}
                      </span>
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-faint">
                      {session.isOpen ? "Closes" : "Closed"}{" "}
                      {formatTime(session.closesAt)} · {session.createdByName}
                    </p>
                  </div>

                  <span
                    aria-hidden
                    className="flex size-7 items-center justify-center rounded-full bg-white/45 text-amber-700 ring-1 ring-white/40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-white/10 dark:text-amber-300 dark:ring-white/12"
                  >
                    <ArrowUpRight size={15} strokeWidth={2.4} />
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
