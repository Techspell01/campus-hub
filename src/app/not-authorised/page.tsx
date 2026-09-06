import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = { title: "Not authorised" };
export const dynamic = "force-dynamic";

export default async function NotAuthorisedPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-7 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 -z-10 size-64 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 opacity-25 blur-3xl"
        />

        <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg ring-1 ring-white/25">
          <Lock size={26} strokeWidth={2.2} className="text-white" aria-hidden />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-ink">
          Coordinators only
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-ink-muted">
          {user
            ? `You're signed in as ${user.name}, which is a student account. Duty groups and the gate scanner need coordinator access.`
            : "This area needs a coordinator account."}
        </p>

        <GlassButton href="/" variant="glass" size="md" className="mt-6">
          Back to the Hub
        </GlassButton>
      </div>
    </div>
  );
}
