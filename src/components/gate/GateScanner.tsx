"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  CircleCheck,
  KeyRound,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { QrScanner } from "@/components/qr/QrScanner";
import { GlassButton } from "@/components/ui/GlassButton";
import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { formatTime } from "@/lib/format";
import { popSpring } from "@/lib/motion";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

type RedeemStatus = "admitted" | "already-used" | "revoked" | "invalid";

interface RedeemResponse {
  result:
    | { status: "invalid" }
    | { status: "admitted" | "already-used" | "revoked"; ticket: Ticket };
  event?: { id: string; title: string; venue: string } | null;
  counts: { total: number; admitted: number };
  error?: string;
}

interface Verdict {
  id: number;
  status: RedeemStatus;
  holderName?: string;
  eventTitle?: string;
  admittedAt?: string;
}

/**
 * A pass held steady in frame decodes ~10×/second. Ignore repeats of the same
 * code until it has been out of frame this long, otherwise one ticket fires a
 * burst of requests and the second one reports "already used".
 */
const REPEAT_COOLDOWN_MS = 4_000;

/** Success clears fast so a queue keeps moving; a refusal stays up to be read. */
const DISMISS_MS: Record<RedeemStatus, number> = {
  admitted: 1_800,
  "already-used": 3_500,
  revoked: 3_500,
  invalid: 3_500,
};

const PRESENTATION: Record<
  RedeemStatus,
  { Icon: typeof CircleCheck; tone: string; title: string; fallback: string }
> = {
  admitted: {
    Icon: CircleCheck,
    tone: "from-emerald-500/95 to-teal-600/95",
    title: "Admitted",
    fallback: "Let them through.",
  },
  "already-used": {
    Icon: TriangleAlert,
    tone: "from-amber-500/95 to-orange-600/95",
    title: "Already used",
    fallback: "This pass was scanned before.",
  },
  revoked: {
    Icon: Ban,
    tone: "from-rose-500/95 to-red-600/95",
    title: "Revoked",
    fallback: "This pass was cancelled.",
  },
  invalid: {
    Icon: Ban,
    tone: "from-rose-500/95 to-red-600/95",
    title: "Not a valid ticket",
    fallback: "The signature doesn't match.",
  },
};

/**
 * Gate scanner: verify a student's pass and burn it in one motion.
 *
 * Built for a queue, which drives every decision here — the camera is never
 * torn down between people, verdicts flash over the viewport and clear
 * themselves, and repeated decodes of the pass still in frame are swallowed.
 */
export function GateScanner({
  initialCounts,
}: {
  initialCounts: { total: number; admitted: number };
}) {
  const vibrate = useHaptics();

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [counts, setCounts] = useState(initialCounts);
  const [recent, setRecent] = useState<Verdict[]>([]);
  const [refused, setRefused] = useState(0);
  const [manualCode, setManualCode] = useState("");

  const inFlight = useRef(false);
  const lastSeen = useRef<{ code: string; at: number } | null>(null);
  const dismissTimer = useRef<number | undefined>(undefined);
  const verdictId = useRef(0);

  useEffect(
    () => () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    },
    [],
  );

  const show = useCallback((next: Verdict) => {
    setVerdict(next);
    setRecent((previous) => [next, ...previous].slice(0, 6));

    if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(
      () => setVerdict(null),
      DISMISS_MS[next.status],
    );
  }, []);

  const submit = useCallback(
    async (scanned: string) => {
      const now = Date.now();
      const previous = lastSeen.current;

      if (previous?.code === scanned && now - previous.at < REPEAT_COOLDOWN_MS) {
        // Still the same pass in frame — slide the window and stay quiet.
        previous.at = now;
        return;
      }
      if (inFlight.current) return;

      lastSeen.current = { code: scanned, at: now };
      inFlight.current = true;

      try {
        const response = await fetch("/api/tickets/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: scanned }),
        });

        const data = (await response.json()) as RedeemResponse;

        if (!response.ok || !data.result) {
          vibrate(HAPTIC.warning);
          show({
            id: ++verdictId.current,
            status: "invalid",
            eventTitle: data.error,
          });
          setRefused((n) => n + 1);
          return;
        }

        const { result } = data;
        setCounts(data.counts);

        if (result.status === "admitted") {
          vibrate(HAPTIC.success);
          show({
            id: ++verdictId.current,
            status: "admitted",
            holderName: result.ticket.holderName,
            eventTitle: data.event?.title,
            admittedAt: result.ticket.usedAt ?? undefined,
          });
          return;
        }

        vibrate(HAPTIC.warning);
        setRefused((n) => n + 1);
        show({
          id: ++verdictId.current,
          status: result.status,
          holderName: result.status === "invalid" ? undefined : result.ticket.holderName,
          eventTitle: data.event?.title,
          admittedAt:
            result.status === "already-used"
              ? (result.ticket.usedAt ?? undefined)
              : undefined,
        });
      } catch {
        vibrate(HAPTIC.warning);
        show({
          id: ++verdictId.current,
          status: "invalid",
          eventTitle: "Couldn't reach the server.",
        });
      } finally {
        inFlight.current = false;
      }
    },
    [show, vibrate],
  );

  const overlay = (
    <AnimatePresence>
      {verdict && (
        <motion.div
          key={verdict.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "absolute inset-0 grid place-items-center bg-gradient-to-br p-6 text-center",
            PRESENTATION[verdict.status].tone,
          )}
          role="status"
          aria-live="assertive"
        >
          <div>
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={popSpring}
              className="mx-auto grid size-16 place-items-center rounded-3xl bg-white/20 ring-1 ring-white/35"
            >
              {(() => {
                const { Icon } = PRESENTATION[verdict.status];
                return (
                  <Icon
                    size={32}
                    strokeWidth={2.3}
                    className="text-white"
                    aria-hidden
                  />
                );
              })()}
            </motion.div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white">
              {PRESENTATION[verdict.status].title}
            </p>

            {verdict.holderName && (
              <p className="mt-1.5 text-[15px] font-medium text-white/95">
                {verdict.holderName}
              </p>
            )}

            <p className="mx-auto mt-1 max-w-[16rem] text-[13px] leading-relaxed text-white/85">
              {verdict.status === "already-used" && verdict.admittedAt
                ? `Admitted at ${formatTime(verdict.admittedAt)}. Check their ID.`
                : (verdict.eventTitle ??
                  PRESENTATION[verdict.status].fallback)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass glass-shine rounded-glass p-4">
          <UserCheck size={16} className="text-emerald-500" aria-hidden />
          <p className="mt-2 text-2xl leading-none font-semibold text-ink tabular-nums">
            {counts.admitted}
            <span className="text-[13px] font-normal text-ink-faint">
              {" "}
              / {counts.total}
            </span>
          </p>
          <p className="mt-1.5 text-[12px] text-ink-muted">Admitted</p>
        </div>

        <div className="glass glass-shine rounded-glass p-4">
          <TriangleAlert size={16} className="text-amber-500" aria-hidden />
          <p className="mt-2 text-2xl leading-none font-semibold text-ink tabular-nums">
            {refused}
          </p>
          <p className="mt-1.5 text-[12px] text-ink-muted">Turned away</p>
        </div>
      </div>

      <QrScanner
        onDecode={submit}
        paused={Boolean(verdict)}
        overlay={overlay}
      />

      <details className="glass glass-shine group rounded-glass px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 text-[13.5px] font-medium text-ink">
          <KeyRound size={15} className="text-ink-faint" aria-hidden />
          Camera not working? Enter the code
        </summary>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            const value = manualCode.trim();
            if (!value) return;
            // Bypass the cooldown: typing it again is a deliberate retry.
            lastSeen.current = null;
            submit(value);
            setManualCode("");
          }}
        >
          <input
            className="w-full rounded-2xl border border-white/25 bg-white/45 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-amber-400/60 dark:border-white/12 dark:bg-white/[0.07]"
            value={manualCode}
            onChange={(changeEvent) => setManualCode(changeEvent.target.value)}
            placeholder="Paste the ticket link or code"
          />
          <GlassButton
            type="submit"
            variant="primary"
            size="md"
            disabled={!manualCode.trim()}
          >
            Check
          </GlassButton>
        </form>
      </details>

      {recent.length > 0 && (
        <section className="glass glass-shine rounded-glass p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Users size={14} className="text-ink-faint" aria-hidden />
            Recent scans
          </h2>

          <ul className="mt-3 space-y-1.5">
            <AnimatePresence initial={false}>
              {recent.map((entry) => (
                <motion.li
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={popSpring}
                  className="flex items-center gap-2.5 text-[13px]"
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      entry.status === "admitted"
                        ? "bg-emerald-500"
                        : entry.status === "already-used"
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {entry.holderName ?? PRESENTATION[entry.status].title}
                  </span>
                  <span className="shrink-0 text-[11.5px] text-ink-faint">
                    {entry.status === "admitted" ? "Admitted" : "Refused"}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
}
