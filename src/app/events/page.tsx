import type { Metadata } from "next";
import { CalendarDays, Settings } from "lucide-react";

import { EventGrid } from "@/components/events/EventGrid";
import { GlassButton } from "@/components/ui/GlassButton";
import { getCurrentUser } from "@/server/auth/current-user";
import { listEvents } from "@/server/repositories/events";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [user, upcoming] = await Promise.all([
    getCurrentUser(),
    listEvents({ upcomingOnly: true }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">
            Events
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            {upcoming.length === 0
              ? "Nothing scheduled right now."
              : `${upcoming.length} upcoming across campus.`}
          </p>
        </div>

        {user?.role === "coordinator" && (
          <GlassButton
            href="/admin/events"
            variant="glass"
            size="sm"
            icon={<Settings />}
          >
            Manage
          </GlassButton>
        )}
      </header>

      {upcoming.length === 0 ? (
        <div className="glass glass-shine rounded-glass p-10 text-center">
          <CalendarDays
            size={26}
            className="mx-auto text-ink-faint"
            aria-hidden
          />
          <p className="mt-3 text-[15px] font-medium text-ink">
            No upcoming events
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-ink-muted">
            {user?.role === "coordinator"
              ? "Publish an event from the admin area and it appears here."
              : "Check back once your clubs publish their schedule."}
          </p>
        </div>
      ) : (
        <EventGrid events={upcoming} />
      )}
    </div>
  );
}
