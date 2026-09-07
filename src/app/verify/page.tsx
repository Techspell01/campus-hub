import type { Metadata } from "next";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";

import { AdmitTicket } from "@/components/gate/AdmitTicket";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatDateTime, formatTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current-user";
import { findEventById } from "@/server/repositories/events";
import { findTicketByCode } from "@/server/repositories/tickets";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verify Ticket" };
export const dynamic = "force-dynamic";

/**
 * Where a ticket QR lands.
 *
 * Rendered as a page rather than a JSON endpoint so a coordinator can scan a
 * pass with the phone camera they already have and get a verdict they can read
 * at arm's length — no scanner app to install.
 *
 * Viewing needs an account (the record names its holder); admitting needs a
 * coordinator.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;

  // A ticket record names its holder, so reading one requires an account.
  const viewer = await requireUser(
    c ? `/verify?c=${encodeURIComponent(c)}` : "/verify",
  );

  const ticket = c ? await findTicketByCode(c) : null;
  const event = ticket ? await findEventById(ticket.eventId, true) : null;

  const state = !c
    ? ("missing" as const)
    : !ticket
      ? ("invalid" as const)
      : ticket.status === "valid"
        ? ("valid" as const)
        : ("spent" as const);

  const PRESENTATION = {
    missing: {
      Icon: ShieldQuestion,
      tone: "from-slate-500 to-slate-600",
      title: "No code scanned",
      body: "Point the camera at a ticket QR to check it.",
    },
    invalid: {
      Icon: CircleX,
      tone: "from-rose-500 to-red-600",
      title: "Not a valid ticket",
      body: "The signature doesn't match. This pass was edited, invented, or belongs to another system.",
    },
    spent: {
      Icon: CircleX,
      tone: "from-amber-500 to-orange-600",
      title: "Already used",
      body: ticket?.usedAt
        ? `Admitted at ${formatTime(ticket.usedAt)}. Check the holder's ID before letting them through.`
        : "This pass has been scanned before. Check the holder's ID before letting them through.",
    },
    valid: {
      Icon: CircleCheck,
      tone: "from-emerald-500 to-teal-600",
      title: "Valid ticket",
      body: "Signature checks out. Let them in.",
    },
  }[state];

  const { Icon } = PRESENTATION;

  return (
    <div className="mx-auto max-w-md space-y-5 py-4">
      <div className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-7 text-center">
        <div
          className={cn(
            "mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br shadow-lg ring-1 ring-white/25",
            PRESENTATION.tone,
          )}
        >
          <Icon size={30} strokeWidth={2.2} className="text-white" aria-hidden />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-ink">
          {PRESENTATION.title}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-ink-muted">
          {PRESENTATION.body}
        </p>

        {ticket && event && (
          <dl className="mt-6 space-y-2.5 border-t border-white/20 pt-5 text-left text-[13px] dark:border-white/10">
            {[
              ["Holder", ticket.holderName],
              ["Event", event.title],
              ["When", formatDateTime(event.startsAt)],
              ["Venue", event.venue],
              ["Ticket", ticket.id],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="shrink-0 text-ink-faint">{label}</dt>
                <dd className="truncate text-right font-medium text-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Admitting is a coordinator action, and only for an unspent pass. */}
        {state === "valid" && c && viewer.role === "coordinator" && (
          <AdmitTicket code={c} />
        )}

        {state === "valid" && viewer.role !== "coordinator" && (
          <p className="mt-6 text-[12.5px] text-ink-faint">
            Only a coordinator can admit this pass.
          </p>
        )}
      </div>

      <GlassButton
        href="/"
        variant="glass"
        size="md"
        fullWidth
        transitionTypes={["nav-back"]}
      >
        Back to the Hub
      </GlassButton>
    </div>
  );
}
