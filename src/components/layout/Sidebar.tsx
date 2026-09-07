"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, Sparkles } from "lucide-react";

import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NAV_ITEMS, isActiveRoute } from "@/components/layout/nav-items";
import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { pressSpring, surfaceSpring } from "@/lib/motion";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Desktop navigation. Hidden below `lg`, where <BottomNav /> takes over. */
export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const vibrate = useHaptics();

  return (
    <aside
      style={{ viewTransitionName: "app-sidebar" }}
      className="fixed inset-y-0 left-0 z-40 hidden w-64 p-4 lg:block"
    >
      <div className="glass glass-shine relative flex h-full flex-col rounded-glass-lg p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl p-2 transition-opacity hover:opacity-80"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/35 ring-1 ring-white/25">
            <Sparkles size={18} strokeWidth={2.3} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] leading-tight font-semibold text-ink">
              Campus Hub
            </p>
            <p className="truncate text-[11px] text-ink-faint">
              Events · Clubs · Duty
            </p>
          </div>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {[
            ...NAV_ITEMS,
            // Coordinators get a way into the admin area; students never see it.
            ...(user?.role === "coordinator"
              ? [
                  {
                    href: "/admin",
                    label: "Admin",
                    icon: Settings,
                    hint: "Events, clubs, notices",
                  },
                ]
              : []),
          ].map(({ href, label, icon: Icon, hint }) => {
            const active = isActiveRoute(pathname, href);

            return (
              <motion.div key={href} whileTap={{ scale: 0.97 }} transition={pressSpring}>
                <Link
                  href={href}
                  onClick={() => vibrate(HAPTIC.select)}
                  transitionTypes={["nav-fade"]}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3 py-2.5",
                    "transition-colors duration-200",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      transition={surfaceSpring}
                      className="absolute inset-0 -z-10 rounded-2xl border border-white/25 bg-white/45 shadow-sm dark:border-white/12 dark:bg-white/10"
                    />
                  ) : null}

                  <Icon
                    size={18}
                    strokeWidth={active ? 2.4 : 2}
                    className={cn(
                      "shrink-0 transition-colors",
                      active && "text-blue-600 dark:text-sky-300",
                    )}
                    aria-hidden
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] leading-tight font-medium">
                      {label}
                    </span>
                    <span className="block truncate text-[11px] text-ink-faint">
                      {hint}
                    </span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 border-t border-white/20 pt-4 dark:border-white/10">
          <UserMenu user={user} />
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
