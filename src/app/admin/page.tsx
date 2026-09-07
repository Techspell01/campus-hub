import type { Metadata } from "next";
import {
  CalendarDays,
  Megaphone,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { listAllAnnouncements, listClubs } from "@/server/repositories/content";
import { listEvents } from "@/server/repositories/events";
import { ticketCounts } from "@/server/repositories/tickets";
import { listAccounts } from "@/server/repositories/accounts";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const [events, clubs, announcements, tickets, users] = await Promise.all([
    listEvents({ includeDrafts: true }),
    listClubs(),
    listAllAnnouncements(),
    ticketCounts(),
    listAccounts(),
  ]);

  const published = events.filter((event) => event.published).length;
  const pendingRequests = users.filter(
    (account) => account.requestedAt !== null && account.role === "student",
  ).length;

  const cards = [
    {
      href: "/admin/events",
      icon: CalendarDays,
      value: `${published}/${events.length}`,
      label: "Events published",
      hint: events.length === 0 ? "Start here" : undefined,
    },
    {
      href: "/admin/clubs",
      icon: Users,
      value: String(clubs.length),
      label: "Clubs",
    },
    {
      href: "/admin/coordinators",
      icon: UserRound,
      value: String(events.length),
      label: "Events with a directory",
    },
    {
      href: "/admin/announcements",
      icon: Megaphone,
      value: String(announcements.length),
      label: "Announcements",
    },
    {
      href: "/admin/people",
      icon: UserRound,
      value: String(users.length),
      label: "Accounts",
      hint: pendingRequests > 0
        ? `${pendingRequests} waiting for access`
        : undefined,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <GlassCard key={card.href} href={card.href} className="p-5">
            <card.icon size={18} className="text-ink-faint" aria-hidden />
            <p className="mt-3 text-2xl leading-none font-semibold text-ink tabular-nums">
              {card.value}
            </p>
            <p className="mt-1.5 text-[13px] text-ink-muted">{card.label}</p>
            {card.hint && (
              <p className="mt-1 text-[11.5px] font-medium text-blue-600 dark:text-sky-300">
                {card.hint}
              </p>
            )}
          </GlassCard>
        ))}
      </div>

      <div className="glass glass-shine rounded-glass p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Ticket size={16} className="text-ink-faint" aria-hidden />
          Tickets
        </h2>
        <p className="mt-2 text-[13.5px] text-ink-muted">
          <span className="font-semibold text-ink tabular-nums">
            {tickets.admitted}
          </span>{" "}
          of {tickets.total} issued passes admitted · {users.length}{" "}
          {users.length === 1 ? "account" : "accounts"}
        </p>
      </div>

      {events.length === 0 && (
        <div className="glass glass-shine rounded-glass p-5">
          <h2 className="text-[15px] font-semibold text-ink">
            Getting started
          </h2>
          <ol className="mt-3 space-y-2 text-[13.5px] text-ink-muted">
            {[
              "Add the clubs that run events.",
              "Create an event and tick Published so students can see it.",
              "Add its coordinators so the WhatsApp directory works.",
              "Post an announcement if there's something urgent.",
            ].map((step, index) => (
              <li key={step} className="flex gap-2.5">
                <span className="font-semibold text-ink tabular-nums">
                  {index + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
