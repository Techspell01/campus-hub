import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Route transitions.
 *
 * Replaces a Framer entrance animation, which could only ever fade the *new*
 * page in — the old one was already gone by the time it mounted. The browser's
 * View Transitions API snapshots both, so content can leave and arrive
 * together, which is what makes a navigation feel continuous rather than like
 * a cut.
 *
 * Direction comes from the `transitionTypes` on each `<Link>`: drilling into a
 * detail page slides left, a back button slides right, and switching tabs just
 * crossfades — a tab bar is lateral movement, so a directional slide there
 * would imply a hierarchy that isn't real.
 *
 * `default: "none"` means anything untyped — browser back/forward,
 * `router.refresh()`, a Suspense reveal — passes through unanimated instead of
 * picking a direction at random.
 */
const BY_TYPE = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-fade": "nav-fade",
  default: "none",
};

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      {children}
    </ViewTransition>
  );
}
