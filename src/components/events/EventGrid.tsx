"use client";

import { motion } from "framer-motion";

import { EventCard } from "@/components/events/EventCard";
import { staggerContainer } from "@/lib/motion";
import type { CollegeEvent } from "@/lib/types";

export function EventGrid({ events }: { events: CollegeEvent[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </motion.div>
  );
}
