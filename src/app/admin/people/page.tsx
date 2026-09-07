import type { Metadata } from "next";
import { Clock, ShieldCheck, ShieldMinus, UserRound, X } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { formatDateTime } from "@/lib/format";
import { cn, initialsOf } from "@/lib/utils";
import { dismissRequestAction, setRoleAction } from "@/server/actions/access";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  countCoordinators,
  listAccounts,
} from "@/server/repositories/accounts";

export const metadata: Metadata = { title: "People · Admin" };

export default async function AdminPeoplePage() {
  const [me, accounts, coordinatorCount] = await Promise.all([
    getCurrentUser(),
    listAccounts(),
    countCoordinators(),
  ]);

  const pending = accounts.filter(
    (account) => account.requestedAt !== null && account.role === "student",
  );

  return (
    <div className="space-y-5">
      <div className="glass glass-shine rounded-glass p-5">
        <h2 className="text-[15px] font-semibold text-ink">Access</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
          Coordinators can reach the admin area, duty groups and the gate
          scanner. Students can register for events, hold tickets and check in
          to duties they&apos;ve been given a QR for.
        </p>
        <p className="mt-2 text-[13px] text-ink-faint">
          {coordinatorCount}{" "}
          {coordinatorCount === 1 ? "coordinator" : "coordinators"} ·{" "}
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          {pending.length > 0 && (
            <span className="font-medium text-amber-600 dark:text-amber-300">
              {" "}
              · {pending.length} waiting
            </span>
          )}
        </p>
      </div>

      {accounts.length === 0 ? (
        <p className="glass glass-shine rounded-glass px-5 py-8 text-center text-[13.5px] text-ink-faint">
          No accounts yet.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {accounts.map((account) => {
            const isMe = account.id === me?.id;
            const isCoordinator = account.role === "coordinator";
            const isPending = account.requestedAt !== null && !isCoordinator;

            // Mirrors the guards in the action, so the UI never offers a
            // button that the server would silently refuse.
            const lastCoordinator = isCoordinator && coordinatorCount <= 1;
            const locked = isMe || lastCoordinator;

            return (
              <li
                key={account.id}
                className={cn(
                  "glass glass-shine flex flex-wrap items-center gap-3 rounded-glass p-4",
                  isPending && "ring-1 ring-amber-400/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br",
                    "text-[13px] font-semibold text-white ring-1 ring-white/25",
                    isCoordinator
                      ? "from-sky-400 to-indigo-600"
                      : "from-slate-400 to-slate-500",
                  )}
                  aria-hidden
                >
                  {initialsOf(account.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[14.5px] font-semibold text-ink">
                    {account.name}
                    {isMe && (
                      <span className="rounded-pill border border-white/25 bg-white/30 px-2 py-0.5 text-[10px] font-medium text-ink-faint dark:bg-white/[0.08]">
                        you
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[12px] text-ink-faint">
                    {account.email}
                  </p>

                  {isPending && account.requestedAt && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-300">
                      <Clock size={12} aria-hidden />
                      Asked for access · {formatDateTime(account.requestedAt)}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-pill border px-2.5 py-1 text-[10.5px] font-medium",
                    isCoordinator
                      ? "border-sky-400/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : "border-white/20 bg-neutral-500/15 text-ink-faint",
                  )}
                >
                  {isCoordinator ? "Coordinator" : "Student"}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  {isPending && (
                    <form action={dismissRequestAction}>
                      <input
                        type="hidden"
                        name="userId"
                        value={account.id}
                      />
                      <GlassButton
                        type="submit"
                        variant="ghost"
                        size="sm"
                        icon={<X />}
                      >
                        Dismiss
                      </GlassButton>
                    </form>
                  )}

                  {locked ? (
                    <span className="text-[11.5px] text-ink-faint">
                      {isMe
                        ? "Can't change your own role"
                        : "Last coordinator"}
                    </span>
                  ) : (
                    <form action={setRoleAction}>
                      <input type="hidden" name="userId" value={account.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={isCoordinator ? "student" : "coordinator"}
                      />
                      <GlassButton
                        type="submit"
                        variant={isCoordinator ? "glass" : "primary"}
                        size="sm"
                        icon={
                          isCoordinator ? <ShieldMinus /> : <ShieldCheck />
                        }
                      >
                        {isCoordinator ? "Make student" : "Make coordinator"}
                      </GlassButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-start gap-2.5 px-1 text-[12px] leading-relaxed text-ink-faint">
        <UserRound size={14} className="mt-0.5 shrink-0" aria-hidden />
        Changes apply the next time that person loads a page — they don&apos;t
        need to sign out and back in.
      </p>
    </div>
  );
}
