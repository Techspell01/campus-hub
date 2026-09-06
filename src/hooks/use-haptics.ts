"use client";

import { useCallback } from "react";

/**
 * Fires a real vibration alongside the visual press.
 *
 * Android/Chrome supports the Vibration API; iOS Safari does not, so there the
 * `whileTap` scale is the whole effect. Both paths are fine — this is additive,
 * never load-bearing.
 */
export function useHaptics() {
  return useCallback((pattern: number | readonly number[] = 8) => {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try {
      // The `HAPTIC` presets are `as const`, so copy readonly tuples into the
      // mutable array the DOM signature asks for.
      navigator.vibrate(typeof pattern === "number" ? pattern : [...pattern]);
    } catch {
      // Blocked outside a user gesture, or by a permissions policy. Ignore.
    }
  }, []);
}

/** Distinct patterns so different actions feel different in the hand. */
export const HAPTIC = {
  tap: 8,
  select: 12,
  success: [12, 40, 18],
  warning: [20, 60, 20],
} as const;
