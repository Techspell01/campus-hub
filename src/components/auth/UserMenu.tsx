"use client";

import { LogIn, LogOut } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import type { User } from "@/lib/types";
import { cn, initialsOf } from "@/lib/utils";
import { signOutAction } from "@/server/auth/actions";

const ROLE_LABEL: Record<User["role"], string> = {
  student: "Student",
  coordinator: "Coordinator",
};

/**
 * Signed-in identity plus sign-out.
 *
 * Sign-out is a plain `<form action={serverAction}>` rather than a fetch: the
 * session cookie can only be cleared server-side, and a form keeps working
 * even if the page's JavaScript hasn't loaded.
 */
export function UserMenu({
  user,
  variant = "sidebar",
}: {
  user: User | null;
  variant?: "sidebar" | "compact";
}) {
  if (!user) {
    return (
      <GlassButton
        href="/sign-in"
        variant="glass"
        size="sm"
        icon={<LogIn />}
        className={variant === "compact" ? "h-10" : undefined}
      >
        Sign in
      </GlassButton>
    );
  }

  const avatar = (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br",
        "from-white to-neutral-300 font-semibold text-neutral-900 ring-1 ring-white/25",
        variant === "compact" ? "size-10 text-[12px]" : "size-9 text-[12px]",
      )}
      aria-hidden
    >
      {initialsOf(user.name)}
    </span>
  );

  const signOut = (
    <form action={signOutAction}>
      <GlassButton
        type="submit"
        variant="glass"
        size="icon"
        icon={<LogOut />}
        aria-label={`Sign out of ${user.name}'s account`}
        title="Sign out"
        className={variant === "compact" ? "size-10" : "size-9"}
      />
    </form>
  );

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        {avatar}
        {signOut}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-tight font-medium text-ink">
          {user.name}
        </span>
        <span className="block text-[11px] text-ink-faint">
          {ROLE_LABEL[user.role]}
        </span>
      </span>
      {signOut}
    </div>
  );
}
