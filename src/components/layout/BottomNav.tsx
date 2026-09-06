"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { NAV_ITEMS, isActiveRoute } from "@/components/layout/nav-items";
import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { pressSpring, surfaceSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation — a floating frosted tab bar, iOS-style.
 *
 * Floating rather than edge-to-edge so the mesh stays visible around it; that
 * gap is what makes the bar read as a pane of glass laid over the page instead
 * of a chrome strip welded to the bottom.
 */
export function BottomNav() {
  const pathname = usePathname();
  const vibrate = useHaptics();

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 px-3 pt-2 lg:hidden"
    >
      <div className="glass-strong glass-shine relative mx-auto flex max-w-md items-stretch justify-around gap-1 rounded-glass p-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActiveRoute(pathname, href);

          return (
            <motion.div
              key={href}
              whileTap={{ scale: 0.9 }}
              transition={pressSpring}
              className="flex-1"
            >
              <Link
                href={href}
                onClick={() => vibrate(HAPTIC.select)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2",
                  "transition-colors duration-200",
                  active
                    ? "text-violet-600 dark:text-violet-300"
                    : "text-ink-faint",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="bottomnav-active-pill"
                    transition={surfaceSpring}
                    className="absolute inset-0 -z-10 rounded-2xl border border-white/25 bg-white/50 dark:border-white/12 dark:bg-white/10"
                  />
                ) : null}

                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden
                  className="shrink-0"
                />
                <span className="text-[10px] leading-none font-medium tracking-[0.01em]">
                  {label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
