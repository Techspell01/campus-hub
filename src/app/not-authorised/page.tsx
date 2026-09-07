import type { Metadata } from "next";
import { Clock, Lock, ShieldQuestion } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { requestAccessAction } from "@/server/actions/access";
import { getCurrentUser } from "@/server/auth/current-user";
import { hasPendingRequest } from "@/server/repositories/accounts";

export const metadata: Metadata = { title: "Not authorised" };
export const dynamic = "force-dynamic";

/**
 * Where a student lands after trying the gate scanner or a duty group.
 *
 * It also carries the request button, because this is the moment someone
 * actually discovers they need access — sending them off to find a coordinator
 * out-of-band is where the trail would go cold.
 */
export default async function NotAuthorisedPage() {
  const user = await getCurrentUser();
  const pending = user ? await hasPendingRequest(user.id) : false;

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

        {user?.role === "student" &&
          (pending ? (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3.5">
              <p className="flex items-center justify-center gap-2 text-[13.5px] font-medium text-amber-700 dark:text-amber-200">
                <Clock size={15} aria-hidden />
                Request sent
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                A coordinator will see it in the admin area. You&apos;ll get
                access as soon as one approves it — no need to ask again.
              </p>
            </div>
          ) : (
            <form action={requestAccessAction} className="mt-6">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                icon={<ShieldQuestion />}
              >
                Request coordinator access
              </GlassButton>
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
                This puts your name in front of the existing coordinators. They
                decide.
              </p>
            </form>
          ))}

        <GlassButton
          href="/"
          variant="glass"
          size="md"
          fullWidth
          className="mt-4"
          transitionTypes={["nav-back"]}
        >
          Back to the Hub
        </GlassButton>
      </div>
    </div>
  );
}
