"use client";

import { useRouter } from "next/navigation";
import { TriangleAlert, UserCheck } from "lucide-react";
import { useState } from "react";

import { GlassButton } from "@/components/ui/GlassButton";
import { HAPTIC, useHaptics } from "@/hooks/use-haptics";

/**
 * Admit action for the `/verify` landing page.
 *
 * A phone-camera scan lands on a page, not a scanner loop, so admission is an
 * explicit tap rather than automatic. That matters: a QR read by accident —
 * pointing the camera at a student's screen while chatting — must not silently
 * burn their pass.
 */
export function AdmitTicket({ code }: { code: string }) {
  const router = useRouter();
  const vibrate = useHaptics();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function admit() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/tickets/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = (await response.json()) as {
        result?: { status: string };
        error?: string;
      };

      if (!response.ok || !data.result) {
        setError(data.error ?? "Couldn't admit this ticket.");
        vibrate(HAPTIC.warning);
        return;
      }

      vibrate(
        data.result.status === "admitted" ? HAPTIC.success : HAPTIC.warning,
      );
      // Re-runs the server component so the verdict above reflects the new
      // status without a full reload.
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      vibrate(HAPTIC.warning);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <GlassButton
        variant="primary"
        size="lg"
        icon={<UserCheck />}
        fullWidth
        disabled={pending}
        onClick={admit}
      >
        {pending ? "Admitting…" : "Admit and mark used"}
      </GlassButton>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-center justify-center gap-2 text-[12.5px] text-rose-600 dark:text-rose-300"
        >
          <TriangleAlert size={14} className="shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
