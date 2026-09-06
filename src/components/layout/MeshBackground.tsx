"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Slow drift so the mesh feels alive without ever pulling focus. */
const BLOBS = [
  {
    className:
      "-top-[18%] -left-[12%] size-[62vmax] bg-mesh-1 [animation-delay:0s]",
    animate: { x: [0, 90, -40, 0], y: [0, 60, 110, 0], scale: [1, 1.12, 0.95, 1] },
    duration: 26,
  },
  {
    className: "-top-[10%] right-[-16%] size-[54vmax] bg-mesh-2",
    animate: { x: [0, -80, 40, 0], y: [0, 90, 30, 0], scale: [1, 0.92, 1.08, 1] },
    duration: 31,
  },
  {
    className: "bottom-[-22%] right-[-8%] size-[58vmax] bg-mesh-3",
    animate: { x: [0, -60, 70, 0], y: [0, -70, -20, 0], scale: [1, 1.1, 0.94, 1] },
    duration: 29,
  },
  {
    className: "bottom-[-18%] left-[-14%] size-[46vmax] bg-mesh-4",
    animate: { x: [0, 70, -30, 0], y: [0, -50, -100, 0], scale: [1, 1.06, 0.9, 1] },
    duration: 34,
  },
];

/** Film grain — a single feTurbulence tile. Kills the banding that large, soft
 *  gradients show on 8-bit displays and adds a bit of tactility. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * The fixed gradient-mesh backdrop every glass surface refracts.
 *
 * Fixed rather than scrolled: `backdrop-filter` samples whatever sits behind
 * the element, so a stationary backdrop keeps the frost consistent as content
 * moves over it.
 */
export function MeshBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="bg-aurora-mesh pointer-events-none fixed inset-0 -z-50 overflow-hidden"
    >
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[90px] will-change-transform ${blob.className}`}
          animate={reduceMotion ? undefined : blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.33, 0.66, 1],
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay dark:opacity-[0.09]"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Vignette — pushes the corners back so foreground glass sits forward. */}
      <div className="absolute inset-0 bg-radial-[at_50%_40%] from-transparent to-black/25 dark:to-black/45" />
    </div>
  );
}
