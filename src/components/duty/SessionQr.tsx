"use client";

import { motion } from "framer-motion";
import { RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { QrImage } from "@/components/qr/QrImage";
import { cn } from "@/lib/utils";

interface MintedToken {
  token: string;
  expiresAt: number;
  windowSeconds: number;
}

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * The coordinator's rotating check-in QR.
 *
 * Re-mints itself just after each 30-second window closes, so a photo of this
 * screen stops working almost immediately. The ring is not decoration — it
 * tells the coordinator how long the code on screen still has, which is what
 * they need when a volunteer says "it didn't work".
 */
export function SessionQr({
  sessionId,
  origin,
  className,
}: {
  sessionId: string;
  /** Absolute origin, resolved from the request on the server. */
  origin: string;
  className?: string;
}) {
  const [minted, setMinted] = useState<MintedToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function refresh() {
      try {
        const response = await fetch(
          `/api/duty/sessions/${sessionId}/token`,
          { cache: "no-store" },
        );

        if (cancelled) return;

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(body?.error ?? "Couldn't refresh the code.");
          // A closed session won't reopen; a transient failure might.
          if (response.status !== 410) timer = window.setTimeout(refresh, 5_000);
          return;
        }

        const data = (await response.json()) as MintedToken;
        if (cancelled) return;

        setMinted(data);
        setError(null);

        // Re-mint just past the boundary so the new window is already current.
        const delay = Math.max(1_000, data.expiresAt - Date.now() + 300);
        timer = window.setTimeout(refresh, delay);
      } catch {
        if (cancelled) return;
        setError("Lost connection to the server.");
        timer = window.setTimeout(refresh, 5_000);
      }
    }

    refresh();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [sessionId]);

  // Drives the ring. 250ms is smooth to the eye and cheap.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = minted ? Math.max(0, minted.expiresAt - now) : 0;
  const fraction = minted
    ? Math.min(1, remainingMs / (minted.windowSeconds * 1000))
    : 0;
  const secondsLeft = Math.ceil(remainingMs / 1000);

  const scanUrl = minted
    ? `${origin}/duty/scan?t=${encodeURIComponent(minted.token)}`
    : null;

  return (
    <div
      className={cn(
        "glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-muted">
          <ShieldCheck size={14} className="text-emerald-500" aria-hidden />
          Rotating code
        </div>

        {minted && !error && (
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 40 40"
              className="size-8 -rotate-90"
              aria-hidden
            >
              <circle
                cx="20"
                cy="20"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="3.5"
                className="stroke-ink/10"
              />
              <circle
                cx="20"
                cy="20"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
                className={cn(
                  "transition-[stroke-dashoffset] duration-200 ease-linear",
                  secondsLeft <= 5 ? "stroke-amber-500" : "stroke-violet-500",
                )}
              />
            </svg>
            <span className="text-[13px] font-semibold text-ink tabular-nums">
              {secondsLeft}s
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        {error ? (
          <div className="grid aspect-square place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-center">
            <div>
              <TriangleAlert
                size={26}
                className="mx-auto text-amber-500"
                aria-hidden
              />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
                {error}
              </p>
            </div>
          </div>
        ) : scanUrl ? (
          // Keying on the token replays the fade on every rotation, which
          // makes the change visible instead of a silent swap.
          <motion.div
            key={minted?.token}
            initial={{ opacity: 0.35, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <QrImage value={scanUrl} errorCorrectionLevel="Q" />
          </motion.div>
        ) : (
          <div className="grid aspect-square place-items-center rounded-2xl bg-white/40 dark:bg-white/5">
            <RefreshCw
              size={22}
              className="animate-spin text-ink-faint"
              aria-hidden
            />
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-[12.5px] leading-relaxed text-ink-muted">
        Volunteers scan this with their phone camera or the in-app scanner. The
        code changes every {minted?.windowSeconds ?? 30} seconds, so a
        screenshot won&apos;t work.
      </p>
    </div>
  );
}
