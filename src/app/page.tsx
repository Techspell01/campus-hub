import { CalendarRange, Settings, Sparkles, Ticket, Users } from "lucide-react";

import { CoordinatorGrid } from "@/components/events/CoordinatorGrid";
import { AnnouncementTicker } from "@/components/hub/AnnouncementTicker";
import { CountdownHero } from "@/components/hub/CountdownHero";
import { FeaturedCarousel } from "@/components/hub/FeaturedCarousel";
import { GlassButton } from "@/components/ui/GlassButton";
import { getCurrentUser } from "@/server/auth/current-user";
import { listActiveAnnouncements, listClubs } from "@/server/repositories/content";
import {
  listCoordinatorsForEvent,
  listEvents,
} from "@/server/repositories/events";
import { listTicketsForUser } from "@/server/repositories/tickets";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Bento tile. `wide` gives one stat more weight than the others — three
 * identical boxes in a row is the layout every generated dashboard reaches
 * for, and varying the rhythm is most of what stops it looking that way.
 */
function StatTile({
  icon: Icon,
  value,
  label,
  wide,
  className,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass glass-shine relative isolate flex flex-col overflow-hidden rounded-glass p-4",
        wide && "col-span-2 justify-between sm:p-5",
        className,
      )}
    >
      {wide && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-10 -z-10 size-36 rounded-full bg-gradient-to-br from-white to-neutral-300 opacity-25 blur-2xl"
        />
      )}

      <Icon
        size={wide ? 19 : 17}
        strokeWidth={2.2}
        className="text-ink-faint"
        aria-hidden
      />
      <p
        className={cn(
          "mt-2.5 font-display leading-none font-semibold tracking-tight text-ink tabular-nums",
          wide ? "text-4xl sm:text-5xl" : "text-2xl",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-ink-muted">{label}</p>
    </div>
  );
}

export default async function HubPage() {
  const user = await getCurrentUser();

  // One parallel round of independent queries. A separate flagship lookup used
  // to sit in here too, but it just re-fetched the upcoming list — so the Hub
  // pulled the whole event catalogue twice per load. Picking the flagship out
  // of the list we already have costs nothing.
  const [announcements, upcoming, clubs, tickets] = await Promise.all([
    listActiveAnnouncements(),
    listEvents({ upcomingOnly: true }),
    listClubs(),
    user ? listTicketsForUser(user.id) : Promise.resolve([]),
  ]);

  const flagship =
    upcoming.find((event) => event.isFlagship) ?? upcoming[0] ?? null;

  // Only this one has to wait, because it needs the flagship's id.
  const leads = flagship ? await listCoordinatorsForEvent(flagship.id) : [];

  const registeredEventIds = new Set(tickets.map((ticket) => ticket.eventId));

  // Faculty and main coordinators — the contacts a student on the Hub is most
  // likely to need without digging into the event page.
  const quickContacts = leads.filter((c) => c.role !== "sub").slice(0, 3);

  // A brand-new deployment has no content at all. Say so plainly, and point a
  // coordinator at the place that fixes it.
  if (!flagship) {
    return (
      <div className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-8 text-center sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 -z-10 size-72 rounded-full bg-gradient-to-br from-white to-neutral-300 opacity-25 blur-3xl"
        />

        <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-white via-neutral-100 to-neutral-300 shadow-lg shadow-black/50 ring-1 ring-white/25">
          <Sparkles size={26} strokeWidth={2.2} className="text-neutral-900" aria-hidden />
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-ink">
          Nothing scheduled yet
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
          {user?.role === "coordinator"
            ? "Create your first club and event, and the Hub fills in."
            : "Once coordinators publish events, they'll show up here."}
        </p>

        {user?.role === "coordinator" && (
          <GlassButton
            href="/admin"
            variant="primary"
            size="lg"
            icon={<Settings />}
            className="mt-6"
          >
            Open admin
          </GlassButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      {announcements.length > 0 && <AnnouncementTicker items={announcements} />}

      <CountdownHero
        event={flagship}
        signedIn={Boolean(user)}
        registered={registeredEventIds.has(flagship.id)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={CalendarRange}
          value={String(upcoming.length)}
          label="Events coming up"
          wide
        />
        <StatTile icon={Users} value={String(clubs.length)} label="Active clubs" />
        <StatTile
          icon={Ticket}
          value={String(tickets.length)}
          label="Your tickets"
        />
      </div>

      {upcoming.length > 0 && <FeaturedCarousel events={upcoming} />}

      {quickContacts.length > 0 && (
        <section aria-labelledby="contacts-heading">
          <div className="mb-3.5 px-1">
            <h2
              id="contacts-heading"
              className="text-lg font-semibold tracking-[-0.02em] text-ink"
            >
              Quick contacts
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Leads for {flagship.title} — messages open pre-filled.
            </p>
          </div>

          <CoordinatorGrid
            coordinators={quickContacts}
            eventName={flagship.title}
          />
        </section>
      )}
    </div>
  );
}
