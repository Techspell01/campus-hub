"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, CircleX, Info, KeyRound, ScanLine, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { QrScanner } from "@/components/qr/QrScanner";
import { GlassButton } from "@/components/ui/GlassButton";
import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { formatTime } from "@/lib/format";
import { popSpring, surfaceSpring } from "@/lib/motion";
import type { DutyCheckIn, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-2xl border border-white/25 bg-white/45 px-3.5 py-2.5 text-[14px] " +
  "text-ink outline-none transition-colors placeholder:text-ink-faint " +
  "focus:border-sky-400/60 dark:border-white/12 dark:bg-white/[0.07]";

interface CheckedIn {
  checkIn: DutyCheckIn;
  dutyArea: string;
  eventTitle: string;
}

// Split rather than `kind: "recorded" | "duplicate"` so each variant carries a
// single literal discriminant and TypeScript can narrow to the error case.
type Outcome =
  | ({ kind: "recorded" } & CheckedIn)
  | ({ kind: "duplicate" } & CheckedIn)
  | { kind: "error"; message: string };

function OutcomeCard({
  outcome,
  onReset,
}: {
  outcome: Outcome;
  onReset: () => void;
}) {
  const presentation =
    outcome.kind === "recorded"
      ? {
          Icon: CircleCheck,
          tone: "from-emerald-500 to-teal-600",
          title: "Checked in",
          body: `${outcome.dutyArea} · ${outcome.eventTitle}`,
        }
      : outcome.kind === "duplicate"
        ? {
            Icon: Info,
            tone: "from-sky-500 to-indigo-600",
            title: "Already checked in",
            body: `You scanned in at ${formatTime(outcome.checkIn.checkedInAt)}. Nothing more to do.`,
          }
        : {
            Icon: CircleX,
            tone: "from-rose-500 to-red-600",
            title: "Couldn't check you in",
            body: outcome.message,
          };

  const { Icon } = presentation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={surfaceSpring}
      className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={popSpring}
        className={cn(
          "mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br shadow-lg ring-1 ring-white/25",
          presentation.tone,
        )}
      >
        <Icon size={30} strokeWidth={2.2} className="text-white" aria-hidden />
      </motion.div>

      <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink">
        {presentation.title}
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink-muted">
        {presentation.body}
      </p>

      <GlassButton
        variant="glass"
        size="md"
        icon={<ScanLine />}
        fullWidth
        onClick={onReset}
        className="mt-6"
      >
        Scan another
      </GlassButton>
    </motion.div>
  );
}

/**
 * Volunteer-side check-in.
 *
 * Identity is the signed-in account, not something typed on the device — the
 * server stamps the roster from the session cookie, so a volunteer cannot
 * check in under someone else's name.
 */
export function ScannerView({ user }: { user: User }) {
  const searchParams = useSearchParams();
  const vibrate = useHaptics();

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [manualCode, setManualCode] = useState("");
  const inFlight = useRef(false);

  const submit = useCallback(
    async (token: string) => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        const response = await fetch("/api/duty/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = (await response.json()) as {
          status?: "recorded" | "duplicate";
          checkIn?: DutyCheckIn;
          session?: { dutyArea: string; eventTitle: string };
          error?: string;
        };

        if (!response.ok || !data.status || !data.checkIn || !data.session) {
          vibrate(HAPTIC.warning);
          setOutcome({
            kind: "error",
            message: data.error ?? "Something went wrong.",
          });
          return;
        }

        vibrate(HAPTIC.success);
        setOutcome({
          kind: data.status,
          checkIn: data.checkIn,
          dutyArea: data.session.dutyArea,
          eventTitle: data.session.eventTitle,
        });
      } catch {
        vibrate(HAPTIC.warning);
        setOutcome({ kind: "error", message: "Couldn't reach the server." });
      } finally {
        inFlight.current = false;
      }
    },
    [vibrate],
  );

  // Landing here from a phone-camera scan of the coordinator's QR: the token is
  // already in the URL, so check in without making them scan a second time.
  const deepLinkToken = searchParams.get("t");
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    if (!deepLinkToken || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    submit(deepLinkToken);
  }, [deepLinkToken, submit]);

  return (
    <div className="space-y-4">
      <div className="glass glass-shine flex items-center gap-3 rounded-glass px-4 py-3">
        <UserRound size={16} className="shrink-0 text-ink-faint" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
          Checking in as <span className="font-semibold">{user.name}</span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        {outcome ? (
          <OutcomeCard
            key="outcome"
            outcome={outcome}
            onReset={() => {
              setOutcome(null);
              setManualCode("");
            }}
          />
        ) : (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <QrScanner onDecode={submit} />

            <details className="glass glass-shine group rounded-glass px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 text-[13.5px] font-medium text-ink">
                <KeyRound size={15} className="text-ink-faint" aria-hidden />
                Camera not working? Enter the code
              </summary>

              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (manualCode.trim()) submit(manualCode.trim());
                }}
              >
                <input
                  className={FIELD}
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="Paste the scan link or code"
                />
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!manualCode.trim()}
                >
                  Go
                </GlassButton>
              </form>
            </details>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
