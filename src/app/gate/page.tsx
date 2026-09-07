import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { GateScanner } from "@/components/gate/GateScanner";
import { GlassButton } from "@/components/ui/GlassButton";
import { requireCoordinator } from "@/server/auth/current-user";
import { ticketCounts } from "@/server/repositories/tickets";

export const metadata: Metadata = { title: "Gate Scanner" };

// Counts change with every admission.
export const dynamic = "force-dynamic";

export default async function GatePage() {
  const coordinator = await requireCoordinator("/gate");

  const counts = await ticketCounts();

  return (
    <div className="mx-auto max-w-md space-y-5">
      <GlassButton href="/duty" variant="ghost" size="sm" icon={<ArrowLeft />} transitionTypes={["nav-back"]}>
        Coordinator tools
      </GlassButton>

      <header className="px-1">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
          Gate Scanner
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
          Scan each student&apos;s pass as they arrive. A valid pass is admitted
          and burned in the same motion, so it can&apos;t be reused.
        </p>
      </header>

      <GateScanner initialCounts={counts} />

      <p className="flex items-start gap-2.5 px-1 text-[12px] leading-relaxed text-ink-faint">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
        Admitting as {coordinator.name}. Every admission is stamped against
        this account.
      </p>
    </div>
  );
}
