import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { ScannerView } from "@/components/duty/ScannerView";
import { GlassButton } from "@/components/ui/GlassButton";
import { requireUser } from "@/server/auth/current-user";

export const metadata: Metadata = { title: "Scan to check in" };

export default async function ScanPage() {
  const user = await requireUser("/duty/scan");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <GlassButton href="/duty" variant="ghost" size="sm" icon={<ArrowLeft />} transitionTypes={["nav-back"]}>
        Duty groups
      </GlassButton>

      <header className="px-1">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
          Check in
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
          Point your camera at the coordinator&apos;s QR. You&apos;ll appear on
          their roster straight away.
        </p>
      </header>

      {/* ScannerView reads the `?t=` deep-link param, so it needs a boundary. */}
      <Suspense
        fallback={
          <div className="glass rounded-glass-lg p-6">
            <div className="h-4 w-40 animate-pulse rounded-pill bg-ink/10" />
          </div>
        }
      >
        <ScannerView user={user} />
      </Suspense>
    </div>
  );
}
