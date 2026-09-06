"use client";

import { motion } from "framer-motion";

import { GlassProfileCard } from "@/components/ui/GlassProfileCard";
import { staggerContainer } from "@/lib/motion";
import type { Coordinator } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Staggered grid of profile mini-cards. Client-side purely to own the
 * `staggerContainer` variants that the cards' `riseIn` hooks into.
 */
export function CoordinatorGrid({
  coordinators,
  eventName,
  showCall,
  className,
}: {
  coordinators: Coordinator[];
  eventName?: string;
  showCall?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {coordinators.map((coordinator) => (
        <GlassProfileCard
          key={coordinator.id}
          coordinator={coordinator}
          eventName={eventName}
          showCall={showCall}
        />
      ))}
    </motion.div>
  );
}
