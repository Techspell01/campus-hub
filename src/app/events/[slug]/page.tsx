import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, QrCode, Users } from "lucide-react";

import { CoordinatorDirectory } from "@/components/events/CoordinatorDirectory";
import { RegisterButton } from "@/components/events/RegisterButton";
import { GlassButton } from "@/components/ui/GlassButton";
import { ACCENTS } from "@/lib/accents";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  findEventBySlug,
  listCoordinatorsForEvent,
} from "@/server/repositories/events";
import { findTicketForUserAndEvent } from "@/server/repositories/tickets";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await findEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  return { title: event.title, description: event.subtitle };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  // Coordinators can preview a draft; everyone else only sees published.
  const event = await findEventBySlug(slug, user?.role === "coordinator");
  if (!event) notFound();

  const [coordinators, ticket] = await Promise.all([
    listCoordinatorsForEvent(event.id),
    user
      ? findTicketForUserAndEvent(user.id, event.id)
      : Promise.resolve(null),
  ]);

  const palette = ACCENTS[event.accent];

  return (
    <div className="space-y-9">
      <GlassButton href="/events" variant="ghost" size="sm" icon={<ArrowLeft />}>
        All events
      </GlassButton>

      <header className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg">
        <div
          className={cn(
            "relative bg-gradient-to-br px-5 py-8 sm:px-8 sm:py-10",
            palette.gradient,
          )}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
          />

          <div className="relative">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/80 uppercase">
              {event.category}
              {event.clubName ? ` · ${event.clubName}` : ""}
              {!event.published ? " · Draft" : ""}
            </p>
            <h1 className="mt-2.5 text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-white sm:text-5xl">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/85">
                {event.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <dl className="space-y-2 text-[13.5px] text-ink-muted">
            <div className="flex items-center gap-2.5">
              <dt className="sr-only">When</dt>
              <CalendarDays size={16} className="shrink-0" aria-hidden />
              <dd>{formatDateTime(event.startsAt)}</dd>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2.5">
                <dt className="sr-only">Where</dt>
                <MapPin size={16} className="shrink-0" aria-hidden />
                <dd>{event.venue}</dd>
              </div>
            )}
            {event.seatsLeft !== null && (
              <div className="flex items-center gap-2.5">
                <dt className="sr-only">Seats</dt>
                <Users size={16} className="shrink-0" aria-hidden />
                <dd>{event.seatsLeft} of {event.capacity} seats left</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            <RegisterButton
              eventId={event.id}
              slug={event.slug}
              signedIn={Boolean(user)}
              registered={Boolean(ticket)}
              soldOut={event.seatsLeft === 0}
            />
            {user?.role === "coordinator" && (
              <GlassButton href="/duty" variant="glass" size="lg" icon={<QrCode />}>
                Duty groups
              </GlassButton>
            )}
          </div>
        </div>
      </header>

      {coordinators.length > 0 && (
        <section aria-labelledby="team-heading">
          <div className="mb-5 px-1">
            <h2
              id="team-heading"
              className="text-xl font-semibold tracking-[-0.02em] text-ink"
            >
              Who to contact
            </h2>
            <p className="mt-1 text-[13.5px] text-ink-muted">
              Tap WhatsApp on any card — the chat opens with your question
              already written, naming the duty and this event.
            </p>
          </div>

          <CoordinatorDirectory
            coordinators={coordinators}
            eventName={event.title}
          />
        </section>
      )}
    </div>
  );
}
