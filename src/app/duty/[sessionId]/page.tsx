import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";

import { LiveRoster } from "@/components/duty/LiveRoster";
import { SessionQr } from "@/components/duty/SessionQr";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatDateTime, formatTime, isPast } from "@/lib/format";
import { requireCoordinator } from "@/server/auth/current-user";
import { requestOrigin } from "@/server/origin";
import { findSession, listCheckIns } from "@/server/repositories/duty";

export const dynamic = "force-dynamic";

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({
  params,
}: SessionPageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await findSession(sessionId);

  return {
    title: session ? `${session.dutyArea} duty` : "Duty session",
  };
}

export default async function DutySessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  await requireCoordinator(`/duty/${sessionId}`);

  const session = await findSession(sessionId);
  if (!session) notFound();

  const checkIns = await listCheckIns(sessionId);
  const origin = await requestOrigin();
  const isOpen = !isPast(session.closesAt);

  return (
    <div className="space-y-6">
      <GlassButton href="/duty" variant="ghost" size="sm" icon={<ArrowLeft />}>
        All duty groups
      </GlassButton>

      <header className="px-1">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
          {session.eventTitle}
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] text-ink">
          {session.dutyArea}
        </h1>

        <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Opened</dt>
            <CalendarDays size={15} className="shrink-0" aria-hidden />
            <dd>{formatDateTime(session.opensAt)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Closes</dt>
            <Clock size={15} className="shrink-0" aria-hidden />
            <dd>
              {isOpen ? "Closes" : "Closed"} {formatTime(session.closesAt)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Coordinator</dt>
            <UserRound size={15} className="shrink-0" aria-hidden />
            <dd>{session.createdByName}</dd>
          </div>
        </dl>
      </header>

      {!isOpen && (
        <p
          role="status"
          className="rounded-glass border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13.5px] text-amber-800 dark:text-amber-200"
        >
          This session has closed — the QR no longer accepts check-ins. The
          roster below is final.
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        {isOpen ? (
          <SessionQr sessionId={session.id} origin={origin} />
        ) : (
          <div className="glass glass-shine rounded-glass-lg p-8 text-center text-[13.5px] text-ink-faint">
            Check-in closed.
          </div>
        )}

        <LiveRoster
          sessionId={session.id}
          initial={checkIns}
          expected={session.expectedVolunteers}
        />
      </div>
    </div>
  );
}
