/**
 * Per-club / per-event colour identities.
 *
 * Class strings are written out in full and never composed at runtime —
 * Tailwind scans source text, so `from-${key}-500` would compile to nothing.
 */

/** Also the `accent` Postgres enum — keep the two in step via this constant. */
export const ACCENT_KEYS = [
  "violet",
  "cyan",
  "rose",
  "amber",
  "emerald",
  "indigo",
] as const;

export type AccentKey = (typeof ACCENT_KEYS)[number];

export interface AccentStyle {
  /** Gradient stops for hero panels and card headers. */
  gradient: string;
  /** Coloured drop shadow that makes a raised element feel lit. */
  glow: string;
  /** Small pill/tag treatment. */
  chip: string;
  /** Solid swatch for status dots and rails. */
  dot: string;
  /** Text-only accent, readable on glass in both themes. */
  text: string;
}

export const ACCENTS: Record<AccentKey, AccentStyle> = {
  violet: {
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glow: "shadow-violet-500/35",
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-400/30",
    dot: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-300",
  },
  cyan: {
    gradient: "from-sky-500 via-cyan-500 to-teal-400",
    glow: "shadow-cyan-500/35",
    chip: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 border-cyan-400/30",
    dot: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-300",
  },
  rose: {
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    glow: "shadow-rose-500/35",
    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-400/30",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-300",
  },
  amber: {
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    glow: "shadow-amber-500/35",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-400/30",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-300",
  },
  emerald: {
    gradient: "from-emerald-400 via-green-500 to-teal-500",
    glow: "shadow-emerald-500/35",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/30",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  indigo: {
    gradient: "from-indigo-500 via-blue-500 to-sky-500",
    glow: "shadow-indigo-500/35",
    chip: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border-indigo-400/30",
    dot: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-300",
  },
};

export const accent = (key: AccentKey) => ACCENTS[key];
