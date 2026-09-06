import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion vocabulary. Every interactive surface pulls from here so the
 * whole app presses back with the same weight — the thing that makes a web app
 * read as "native" is consistency, not amplitude.
 */

/** Snappy, slightly overshooting — the press/release of an iOS control. */
export const pressSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 26,
  mass: 0.7,
};

/** Softer and heavier, for cards and sheets that carry more visual mass. */
export const surfaceSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};

/** Bouncier still — badges, toggles, counters. */
export const popSpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 18,
  mass: 0.5,
};

/** The canonical "haptic" tap. Applied via `whileTap` on every control. */
export const hapticTap = { scale: 0.96 } as const;

/** Slightly deeper press for large cards, which need more travel to register. */
export const hapticTapCard = { scale: 0.975 } as const;

export const hapticHover = { scale: 1.015 } as const;

/** Stagger children into view. Pair with `whileInView` or `animate`. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28, mass: 0.8 },
  },
};
