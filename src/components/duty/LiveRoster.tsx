"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UserCheck, Users, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { formatTime } from "@/lib/format";
import { popSpring, surfaceSpring } from "@/lib/motion";
import type { DutyCheckIn } from "@/lib/types";
import { cn, initialsOf } from "@/lib/utils";

/**
 * How often the roster asks the server for changes.
 *
 * This used to be a Server-Sent Events stream, which pushed instantly. That
 * relied on the coordinator's browser and the volunteer's phone reaching the
 * same long-lived Node process — true on one server, false on Vercel, where
 * every request may land on a different short-lived function. Polling is the
 * honest version of the same feature there: three seconds reads as immediate
 * to someone watching a queue, and it survives sleep, tab switches and flaky
 * campus wifi without any reconnection logic.
 */
const POLL_INTERVAL_MS = 3_000;

export function LiveRoster({
  sessionId,
  initial,
  expected,
}: {
  sessionId: string;
  initial: DutyCheckIn[];
  expected: number;
}) {
  const [checkIns, setCheckIns] = useState(initial);
  const [connected, setConnected] = useState(true);
  const vibrate = useHaptics();

  // Lets the poll compare against the latest list without being re-created
  // (and thus restarting the interval) on every change.
  const knownIds = useRef(new Set(initial.map((c) => c.id)));

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/duty/sessions/${sessionId}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as {
          session?: { checkIns?: DutyCheckIn[] };
        };
        if (cancelled) return;

        const next = data.session?.checkIns ?? [];
        const arrived = next.filter((c) => !knownIds.current.has(c.id));

        if (arrived.length > 0) {
          for (const c of next) knownIds.current.add(c.id);
          vibrate(HAPTIC.success);
        }

        setCheckIns(next);
        setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    // Catch up immediately when the coordinator returns to the tab.
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionId, vibrate]);

  const percent =
    expected > 0
      ? Math.min(100, Math.round((checkIns.length / expected) * 100))
      : 0;

  return (
    <section className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Users size={16} className="text-ink-faint" aria-hidden />
            Live roster
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            <span className="font-semibold text-ink tabular-nums">
              {checkIns.length}
            </span>{" "}
            of {expected} checked in
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-medium",
            connected
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "border-amber-400/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          {connected ? (
            <>
              <Wifi size={12} aria-hidden />
              Live
            </>
          ) : (
            <>
              <WifiOff size={12} aria-hidden />
              Reconnecting
            </>
          )}
        </span>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-pill bg-ink/10"
        role="progressbar"
        aria-valuenow={checkIns.length}
        aria-valuemin={0}
        aria-valuemax={expected}
        aria-label="Volunteers checked in"
      >
        <motion.div
          className="h-full rounded-pill bg-gradient-to-r from-violet-500 to-fuchsia-500"
          animate={{ width: `${percent}%` }}
          transition={surfaceSpring}
        />
      </div>

      <ul className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {checkIns.map((checkIn) => (
            <motion.li
              key={checkIn.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={popSpring}
              className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/35 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.06]"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-[12px] font-semibold text-white ring-1 ring-white/25"
                aria-hidden
              >
                {initialsOf(checkIn.volunteerName)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">
                  {checkIn.volunteerName}
                </span>
                <span className="block text-[11.5px] text-ink-faint">
                  {formatTime(checkIn.checkedInAt)}
                </span>
              </span>

              <UserCheck
                size={16}
                className="shrink-0 text-emerald-500"
                aria-hidden
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {checkIns.length === 0 && (
        <p className="mt-5 rounded-2xl border border-dashed border-white/25 py-8 text-center text-[13px] text-ink-faint dark:border-white/12">
          Nobody has scanned yet.
        </p>
      )}
    </section>
  );
}
