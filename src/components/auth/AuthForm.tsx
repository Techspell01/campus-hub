"use client";

import Link from "next/link";
import { LogIn, TriangleAlert, UserPlus } from "lucide-react";
import { useActionState } from "react";

import { GlassButton } from "@/components/ui/GlassButton";
import type { AuthFormState } from "@/server/auth/actions";

const FIELD =
  "w-full rounded-2xl border border-white/25 bg-white/45 px-3.5 py-2.5 text-[14px] " +
  "text-ink outline-none transition-colors placeholder:text-ink-faint " +
  "focus:border-white/45 dark:border-white/12 dark:bg-white/[0.07]";

const LABEL =
  "mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase";

export function AuthForm({
  action,
  mode,
  next,
}: {
  /** A server action; React passes it across the boundary as a reference. */
  action: (
    state: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
  mode: "sign-in" | "sign-up";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "sign-up";

  return (
    <form
      action={formAction}
      className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 -z-10 size-64 rounded-full bg-gradient-to-br from-white to-neutral-300 opacity-25 blur-3xl"
      />

      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
        {isSignUp ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        {isSignUp
          ? "Students get a ticket wallet and can check in to duties."
          : "Your tickets, duties and coordinator tools live behind this."}
      </p>

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="auth-name" className={LABEL}>
              Full name
            </label>
            <input
              id="auth-name"
              name="name"
              className={FIELD}
              placeholder="Riya Krishnan"
              autoComplete="name"
              maxLength={60}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className={LABEL}>
            College email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            className={FIELD}
            placeholder="you@college.edu"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="auth-password" className={LABEL}>
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            className={FIELD}
            placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 8 : undefined}
            required
          />
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-700 dark:text-rose-300"
        >
          <TriangleAlert size={15} className="shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <GlassButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={pending}
        icon={isSignUp ? <UserPlus /> : <LogIn />}
        className="mt-6"
      >
        {pending
          ? isSignUp
            ? "Creating account…"
            : "Signing in…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </GlassButton>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
