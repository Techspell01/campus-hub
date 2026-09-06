import type { Metadata } from "next";

import {
  TicketWallet,
  type WalletEntry,
} from "@/components/wallet/TicketWallet";
import { requireUser } from "@/server/auth/current-user";
import { requestOrigin } from "@/server/origin";
import { listEvents } from "@/server/repositories/events";
import { listTicketsForUser } from "@/server/repositories/tickets";

export const metadata: Metadata = { title: "Ticket Wallet" };

// Ticket status changes when a gate scans one, so this must not be prerendered.
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await requireUser("/wallet");
  const origin = await requestOrigin();

  // Scoped to the signed-in student — a wallet must never show anyone else's.
  const [tickets, catalogue] = await Promise.all([
    listTicketsForUser(user.id),
    listEvents({ includeDrafts: true }),
  ]);
  const byId = new Map(catalogue.map((event) => [event.id, event]));

  const entries = tickets.flatMap<WalletEntry>((ticket) => {
    const event = byId.get(ticket.eventId);
    if (!event) return [];

    return [
      {
        ticket,
        title: event.title,
        clubName: event.clubName ?? "Campus",
        venue: event.venue,
        startsAt: event.startsAt,
        accent: event.accent,
      },
    ];
  });

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">
          Ticket Wallet
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-muted">
          {entries.length} pass{entries.length === 1 ? "" : "es"}. Each QR is
          signed — an edited or invented code fails at the gate.
        </p>
      </header>

      <TicketWallet entries={entries} origin={origin} />
    </div>
  );
}
