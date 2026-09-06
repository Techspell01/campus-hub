"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, MapPin, Users } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { ACCENTS } from "@/lib/accents";
import { formatDay, formatMonth, formatTime } from "@/lib/format";
import { riseIn } from "@/lib/motion";
import type { CollegeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Event tile used by the Hub carousel and (later) the events grid. */
export function EventCard({
  event,
  className,
}: {
  event: CollegeEvent;
  className?: string;
}) {
  const palette = ACCENTS[event.accent];

  return (
    <motion.div variants={riseIn} className={cn("h-full", className)}>
      <GlassCard
        href={`/events/${event.slug}`}
        ariaLabel={`${event.title}${event.clubName ? `, hosted by ${event.clubName}` : ""}`}
        className="group flex h-full flex-col"
      >
        {/* Coloured cap: date block left, club identity right. */}
        <div
          className={cn(
            "relative flex items-start justify-between gap-3 bg-gradient-to-br p-4",
            palette.gradient,
          )}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
          />

          <div className="relative rounded-2xl bg-white/20 px-3 py-2 text-center ring-1 ring-white/30 backdrop-blur-sm">
            <p className="text-xl leading-none font-semibold text-white tabular-nums">
              {formatDay(event.startsAt)}
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-white/80">
              {formatMonth(event.startsAt)}
            </p>
          </div>

          <div className="relative min-w-0 flex-1 text-right">
            <p className="truncate text-[11px] font-medium tracking-[0.06em] text-white/80 uppercase">
              {event.category}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-white">
              {event.clubName ?? "Campus"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-[17px] leading-tight font-semibold tracking-[-0.01em] text-ink">
            {event.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
            {event.subtitle}
          </p>

          <div className="mt-3.5 space-y-1.5 text-[12.5px] text-ink-muted">
            <p className="flex items-center gap-2">
              <Clock size={14} className="shrink-0 text-ink-faint" aria-hidden />
              <span>{formatTime(event.startsAt)} onwards</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-ink-faint" aria-hidden />
              <span className="truncate">{event.venue}</span>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-pill border px-2 py-0.5 text-[10.5px] font-medium",
                  palette.chip,
                )}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            {event.seatsLeft !== null ? (
              <span className="flex items-center gap-1.5 text-[12px] text-ink-faint">
                <Users size={13} aria-hidden />
                {event.seatsLeft} seats left
              </span>
            ) : (
              <span />
            )}

            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                "bg-white/45 ring-1 ring-white/40 dark:bg-white/10 dark:ring-white/12",
                "transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                palette.text,
              )}
              aria-hidden
            >
              <ArrowUpRight size={15} strokeWidth={2.4} />
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
