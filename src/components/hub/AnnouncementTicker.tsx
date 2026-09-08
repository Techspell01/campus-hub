"use client";

import { Megaphone } from "lucide-react";

import type { Announcement, AnnouncementLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL_DOT: Record<AnnouncementLevel, string> = {
  urgent: "bg-rose-500",
  info: "bg-stone-300",
  success: "bg-emerald-500",
};

/**
 * Scrolling strip of college-wide notices.
 *
 * The list is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless: at the end of the animation the second copy sits
 * precisely where the first started. Pauses on hover and focus so a notice can
 * actually be read.
 */
export function AnnouncementTicker({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;

  const track = [...items, ...items];

  return (
    <section
      aria-label="College announcements"
      className="glass glass-shine group relative isolate flex items-stretch overflow-hidden rounded-glass"
    >
      <div className="relative z-10 flex shrink-0 items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-700 px-3.5 py-3 text-white sm:px-4">
        <Megaphone size={15} strokeWidth={2.4} aria-hidden />
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase">
          Live
        </span>
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden py-3">
        <div
          className={cn(
            "flex w-max animate-marquee items-center gap-10 pl-6",
            "group-hover:[animation-play-state:paused]",
            "group-focus-within:[animation-play-state:paused]",
          )}
        >
          {track.map((item, index) => (
            <span
              key={`${item.id}-${index}`}
              // The duplicate half is decoration; only the first is announced.
              aria-hidden={index >= items.length}
              className="flex shrink-0 items-center gap-2.5 text-[13px] text-ink-muted"
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  LEVEL_DOT[item.level],
                )}
              />
              {item.message}
            </span>
          ))}
        </div>

        {/* Fade the text out at the right edge instead of hard-clipping it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--page)] to-transparent opacity-70"
        />
      </div>
    </section>
  );
}
