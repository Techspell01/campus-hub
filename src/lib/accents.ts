/**
 * Per-club / per-event colour identities.
 *
 * The interface itself is monochrome — white on black — so these exist only to
 * tell one club apart from another, not to colour the page. Each is a dark
 * tint fading into near-black: enough to distinguish at a glance, not enough
 * to compete with the content sitting on top of it.
 *
 * Class strings are written out in full and never composed at runtime —
 * Tailwind scans source text, so `from-${key}-500` would compile to nothing.
 *
 * The keys are also the `accent` Postgres enum, so they can't be renamed
 * without a migration — only their styling changes here.
 */

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
    gradient: "from-violet-800/55 to-neutral-950/85",
    glow: "shadow-black/50",
    chip: "bg-violet-500/18 text-violet-700 dark:text-violet-200 border-violet-400/35",
    dot: "bg-violet-400",
    text: "text-violet-600 dark:text-violet-300",
  },
  cyan: {
    gradient: "from-sky-800/55 to-neutral-950/85",
    glow: "shadow-black/50",
    chip: "bg-cyan-500/18 text-cyan-700 dark:text-cyan-200 border-cyan-400/35",
    dot: "bg-cyan-400",
    text: "text-cyan-600 dark:text-cyan-300",
  },
  rose: {
    gradient: "from-rose-800/55 to-neutral-950/85",
    glow: "shadow-black/50",
    chip: "bg-rose-500/18 text-rose-700 dark:text-rose-200 border-rose-400/35",
    dot: "bg-rose-400",
    text: "text-rose-600 dark:text-rose-300",
  },
  amber: {
    gradient: "from-amber-800/55 to-neutral-950/85",
    glow: "shadow-black/50",
    chip: "bg-amber-500/18 text-amber-700 dark:text-amber-200 border-amber-400/35",
    dot: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-300",
  },
  emerald: {
    gradient: "from-emerald-800/55 to-neutral-950/85",
    glow: "shadow-black/50",
    chip: "bg-emerald-500/18 text-emerald-700 dark:text-emerald-200 border-emerald-400/35",
    dot: "bg-emerald-400",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  indigo: {
    gradient: "from-indigo-800/55 to-neutral-950/85",
    glow: "shadow-black/50",
    chip: "bg-indigo-500/18 text-indigo-700 dark:text-indigo-200 border-indigo-400/35",
    dot: "bg-indigo-400",
    text: "text-indigo-600 dark:text-indigo-300",
  },
};

export const accent = (key: AccentKey) => ACCENTS[key];
