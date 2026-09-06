"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MapPin, Maximize2, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

import { QrImage } from "@/components/qr/QrImage";
import { GlassButton } from "@/components/ui/GlassButton";
import { ACCENTS, type AccentKey } from "@/lib/accents";
import { formatDateTime } from "@/lib/format";
import { riseIn, staggerContainer, surfaceSpring } from "@/lib/motion";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface WalletEntry {
  ticket: Ticket;
  title: string;
  clubName: string;
  venue: string;
  startsAt: string;
  accent: AccentKey;
}

const STATUS_CHIP: Record<Ticket["status"], string> = {
  valid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30",
  used: "bg-neutral-500/15 text-ink-faint border-white/20",
  revoked: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30",
};

/**
 * The QR encodes a verify URL rather than a bare code, so a coordinator can
 * check a ticket with any phone's built-in camera — no second app to install.
 * The origin is resolved from the request on the server, so the code is right
 * in the first paint instead of appearing a frame later.
 */
const verifyUrl = (origin: string, code: string) =>
  `${origin}/verify?c=${encodeURIComponent(code)}`;

function TicketPane({
  entry,
  origin,
  onExpand,
}: {
  entry: WalletEntry;
  origin: string;
  onExpand: () => void;
}) {
  const { ticket, title, clubName, venue, startsAt, accent } = entry;
  const palette = ACCENTS[accent];
  const url = verifyUrl(origin, ticket.code);

  return (
    <motion.article
      variants={riseIn}
      className="glass glass-shine relative isolate overflow-hidden rounded-glass"
    >
      <div className={cn("relative bg-gradient-to-br p-5", palette.gradient)}>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
        />
        <div className="relative">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-white/80 uppercase">
            {clubName}
          </p>
          <h2 className="mt-1 text-xl leading-tight font-semibold tracking-[-0.02em] text-white">
            {title}
          </h2>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0 space-y-2.5">
          <p className="flex items-center gap-2 text-[13px] text-ink-muted">
            <CalendarDays size={15} className="shrink-0" aria-hidden />
            {formatDateTime(startsAt)}
          </p>
          <p className="flex items-center gap-2 text-[13px] text-ink-muted">
            <MapPin size={15} className="shrink-0" aria-hidden />
            <span className="truncate">{venue}</span>
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <span
              className={cn(
                "rounded-pill border px-2.5 py-1 text-[11px] font-medium capitalize",
                STATUS_CHIP[ticket.status],
              )}
            >
              {ticket.status}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">
              {ticket.id}
            </span>
          </div>

          <p className="pt-1 text-[13px] text-ink">
            <span className="text-ink-faint">Holder · </span>
            {ticket.holderName}
          </p>
        </div>

        <div className="sm:w-44">
          <QrImage value={url} />
          <GlassButton
            variant="glass"
            size="sm"
            icon={<Maximize2 />}
            fullWidth
            onClick={onExpand}
            className="mt-2.5"
          >
            Show larger
          </GlassButton>
        </div>
      </div>
    </motion.article>
  );
}

function FullscreenTicket({
  entry,
  origin,
  onClose,
}: {
  entry: WalletEntry;
  origin: string;
  onClose: () => void;
}) {
  const url = verifyUrl(origin, entry.ticket.code);

  // Escape to dismiss, and lock the page behind the overlay.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Ticket for ${entry.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-5 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={surfaceSpring}
        onClick={(event) => event.stopPropagation()}
        className="glass-strong glass-shine relative w-full max-w-sm rounded-glass-lg p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-ink">
              {entry.title}
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {entry.ticket.holderName}
            </p>
          </div>
          <GlassButton
            variant="glass"
            size="icon"
            icon={<X />}
            onClick={onClose}
            aria-label="Close ticket"
            className="size-9 shrink-0"
          />
        </div>

        <div className="mt-5">
          <QrImage value={url} errorCorrectionLevel="Q" />
        </div>

        <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
          <Sun size={14} className="mt-0.5 shrink-0" aria-hidden />
          Turn your screen brightness up before you reach the gate — glass
          screens under sunlight are the usual reason a scan fails.
        </p>
      </motion.div>
    </motion.div>
  );
}

export function TicketWallet({
  entries,
  origin,
}: {
  entries: WalletEntry[];
  origin: string;
}) {
  const [expanded, setExpanded] = useState<WalletEntry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="glass glass-shine rounded-glass p-8 text-center">
        <p className="text-[15px] font-medium text-ink">No tickets yet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-ink-muted">
          Register for an event and its pass will appear here.
        </p>
        <GlassButton href="/events" variant="primary" size="md" className="mt-5">
          Browse events
        </GlassButton>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {entries.map((entry) => (
          <TicketPane
            key={entry.ticket.id}
            entry={entry}
            origin={origin}
            onExpand={() => setExpanded(entry)}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <FullscreenTicket
            entry={expanded}
            origin={origin}
            onClose={() => setExpanded(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
