"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { RegisterButton } from "@/components/events/RegisterButton";
import { GlassButton } from "@/components/ui/GlassButton";
import { ACCENTS } from "@/lib/accents";
import { formatDateTime } from "@/lib/format";
import { popSpring } from "@/lib/motion";
import type { CollegeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
  isOver: boolean;
}

const ZERO: Remaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isLive: false,
  isOver: false,
};

function computeRemaining(startsAt: string, endsAt: string): Remaining {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  if (now >= end) return { ...ZERO, isOver: true };
  if (now >= start) return { ...ZERO, isLive: true };

  let delta = Math.floor((start - now) / 1000);
  const days = Math.floor(delta / 86_400);
  delta -= days * 86_400;
  const hours = Math.floor(delta / 3_600);
  delta -= hours * 3_600;
  const minutes = Math.floor(delta / 60);
  const seconds = delta - minutes * 60;

  return { days, hours, minutes, seconds, isLive: false, isOver: false };
}

/**
 * Ticks once a second on the client only.
 *
 * Returns `null` until mounted so the server and first client render agree —
 * a live clock rendered on the server is a guaranteed hydration mismatch.
 */
function useCountdown(startsAt: string, endsAt: string) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(startsAt, endsAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startsAt, endsAt]);

  return remaining;
}

const pad = (n: number) => String(n).padStart(2, "0");

function CountdownUnit({
  value,
  label,
  pending,
}: {
  value: number;
  label: string;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="glass glass-shine relative grid h-16 w-[4.25rem] place-items-center overflow-hidden rounded-2xl sm:h-20 sm:w-20">
        {pending ? (
          <span className="animate-shimmer text-2xl font-semibold text-ink-faint tabular-nums sm:text-3xl">
            --
          </span>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: "-70%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "70%", opacity: 0 }}
              transition={popSpring}
              className="text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl"
            >
              {pad(value)}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
      <span className="text-[10px] font-medium tracking-[0.14em] text-ink-faint uppercase">
        {label}
      </span>
    </div>
  );
}

/** Hero for the next flagship event, with a live countdown. */
export function CountdownHero({
  event,
  signedIn,
  registered,
}: {
  event: CollegeEvent;
  signedIn: boolean;
  registered: boolean;
}) {
  const remaining = useCountdown(event.startsAt, event.endsAt);
  const palette = ACCENTS[event.accent];
  const pending = remaining === null;
  const value = remaining ?? ZERO;

  const status = value.isOver
    ? "Wrapped"
    : value.isLive
      ? "Happening now"
      : "Next major event";

  return (
    <section className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-5 sm:p-8">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-28 -right-24 -z-10 size-80 rounded-full",
          "bg-gradient-to-br opacity-35 blur-3xl",
          palette.gradient,
        )}
      />

      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-pill border px-3 py-1",
              "text-[11px] font-semibold tracking-[0.08em] uppercase",
              palette.chip,
            )}
          >
            <span
              className={cn(
                "size-1.5 animate-pulse-dot rounded-full",
                value.isLive ? "bg-emerald-500" : palette.dot,
              )}
            />
            {status}
          </span>

          <h1 className="mt-4 text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink sm:text-5xl">
            {event.title}
          </h1>

          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-muted">
            {event.subtitle}
          </p>

          <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-muted">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Starts</dt>
              <CalendarDays size={15} className="shrink-0" aria-hidden />
              <dd>{formatDateTime(event.startsAt)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Venue</dt>
              <MapPin size={15} className="shrink-0" aria-hidden />
              <dd className="truncate">{event.venue}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <RegisterButton
              eventId={event.id}
              slug={event.slug}
              signedIn={signedIn}
              registered={registered}
              soldOut={event.seatsLeft === 0}
            />
            <GlassButton
              href={`/events/${event.slug}`}
              variant="glass"
              size="lg"
              iconRight={<ArrowRight />}
            >
              Event details
            </GlassButton>
          </div>
        </div>

        <div
          className="flex shrink-0 gap-2.5 sm:gap-3"
          role="timer"
          aria-live="off"
          aria-label={`Time until ${event.title}`}
        >
          <CountdownUnit value={value.days} label="Days" pending={pending} />
          <CountdownUnit value={value.hours} label="Hrs" pending={pending} />
          <CountdownUnit value={value.minutes} label="Min" pending={pending} />
          <CountdownUnit value={value.seconds} label="Sec" pending={pending} />
        </div>
      </div>
    </section>
  );
}
