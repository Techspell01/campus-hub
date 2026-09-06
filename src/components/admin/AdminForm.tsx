"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useActionState } from "react";

import { GlassButton } from "@/components/ui/GlassButton";
import type { AdminFormState } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

/**
 * Wraps admin fields in a server action.
 *
 * The fields themselves stay plain server-rendered markup — only this shell
 * needs to be a client component, to hold the pending flag and the result from
 * `useActionState`.
 */
export function AdminForm({
  action,
  submitLabel,
  pendingLabel,
  children,
  className,
  compact,
}: {
  action: (
    state: AdminFormState,
    formData: FormData,
  ) => Promise<AdminFormState>;
  submitLabel: string;
  pendingLabel?: string;
  children: ReactNode;
  className?: string;
  /** Inline variant used inside an expanded list row. */
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className={cn(
        !compact &&
          "glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-5",
        className,
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>

      {state.error && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-700 dark:text-rose-300"
        >
          <TriangleAlert size={15} className="shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2.5 text-[13px] text-emerald-700 dark:text-emerald-300"
        >
          <CircleCheck size={15} className="shrink-0" aria-hidden />
          {state.success}
        </p>
      )}

      <GlassButton
        type="submit"
        variant="primary"
        size={compact ? "md" : "lg"}
        disabled={pending}
        className="mt-5"
      >
        {pending ? (pendingLabel ?? "Saving…") : submitLabel}
      </GlassButton>
    </form>
  );
}
