import type { ReactNode } from "react";
import Link from "next/link";

import { requireCoordinator } from "@/server/auth/current-user";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/coordinators", label: "Coordinators" },
  { href: "/admin/announcements", label: "Announcements" },
];

export const dynamic = "force-dynamic";

/**
 * Guards the whole admin area in one place.
 *
 * This is the screen-level check only — each server action re-checks the role
 * for itself, because an action is an HTTP endpoint that does not care which
 * page rendered the form.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireCoordinator("/admin");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">
          Admin
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-muted">
          Everything students see comes from here.
        </p>
      </header>

      <nav
        aria-label="Admin sections"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="glass glass-shine shrink-0 rounded-pill px-4 py-2 text-[13px] font-medium text-ink transition-opacity hover:opacity-80"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
