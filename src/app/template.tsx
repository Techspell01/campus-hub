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
 * detail page slides left and a back button slides right.
 *
 * Tab-bar links deliberately carry no type. A view transition replaces the
 * live page with a static snapshot for its whole duration, which froze the
 * bottom bar mid-navigation and made its sliding indicator look stuck. Tabs
 * therefore swap instantly and the moving indicator carries the continuity —
 * the same thing Instagram does between Home, Reels and DMs.
 *
 * `default: "none"` means anything untyped — browser back/forward,
 * `router.refresh()`, a Suspense reveal — passes through unanimated instead of
 * picking a direction at random.
 */
const BY_TYPE = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      {children}
    </ViewTransition>
  );
}
