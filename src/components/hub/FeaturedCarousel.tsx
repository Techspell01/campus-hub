"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { EventCard } from "@/components/events/EventCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { staggerContainer } from "@/lib/motion";
import type { CollegeEvent } from "@/lib/types";

/**
 * Horizontally swipeable rail of upcoming events.
 *
 * Uses native scroll-snap rather than a Framer `drag` container: it gives
 * momentum, snapping and keyboard/trackpad scrolling for free on touch devices,
 * and doesn't fight the browser's own gesture handling. The arrows are a
 * desktop affordance layered on top.
 */
export function FeaturedCarousel({ events }: { events: CollegeEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    // One card plus its gap, so a click always lands on a snap point.
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="featured-heading">
      <div className="mb-3.5 flex items-end justify-between gap-4 px-1">
        <div>
          <h2
            id="featured-heading"
            className="text-lg font-semibold tracking-[-0.02em] text-ink"
          >
            Featured upcoming
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {events.length} events across {new Set(events.map((e) => e.clubName)).size}{" "}
            clubs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="glass"
            size="icon"
            icon={<ChevronLeft />}
            onClick={() => page(-1)}
            aria-label="Previous events"
            className="hidden size-10 sm:inline-flex"
          />
          <GlassButton
            variant="glass"
            size="icon"
            icon={<ChevronRight />}
            onClick={() => page(1)}
            aria-label="More events"
            className="hidden size-10 sm:inline-flex"
          />
          <GlassButton
            href="/events"
            variant="ghost"
            size="sm"
            iconRight={<ArrowRight />}
          >
            All
          </GlassButton>
        </div>
      </div>

      <motion.div
        ref={scroller}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:-mx-2 lg:px-2"
      >
        {events.map((event) => (
          <div
            key={event.id}
            data-card
            className="w-[278px] shrink-0 snap-start sm:w-[310px]"
          >
            <EventCard event={event} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
