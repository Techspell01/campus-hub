"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { User } from "@/lib/types";

/** Compact header for phones; the sidebar carries this role on desktop. */
export function MobileTopBar({ user }: { user: User | null }) {
  return (
    <header
      style={{ viewTransitionName: "app-topbar" }}
      className="pt-safe sticky top-0 z-40 px-3 pb-1 lg:hidden"
    >
      <div className="glass-strong glass-shine relative flex items-center gap-3 rounded-glass px-3 py-2.5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-md shadow-amber-500/30 ring-1 ring-white/25">
            <Sparkles size={16} strokeWidth={2.4} className="text-white" />
          </div>
          <span className="truncate text-[15px] font-semibold text-ink">
            Campus Hub
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu user={user} variant="compact" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
