"use client";

import { Check, LogIn, Ticket, TriangleAlert } from "lucide-react";
import { useActionState } from "react";

import type { GlassButtonSize } from "@/components/ui/GlassButton";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import { registerForEventAction } from "@/server/actions/registration";

export function RegisterButton({
  eventId,
  slug,
  signedIn,
  registered,
  soldOut,
  size = "lg",
  className,
}: {
  eventId: string;
  slug: string;
  signedIn: boolean;
  registered: boolean;
  soldOut: boolean;
  size?: GlassButtonSize;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(registerForEventAction, {
    ok: true,
    registered,
    message: "",
  });

  // Signed-out visitors get sent to sign-in and returned to this event.
  if (!signedIn) {
    return (
      <GlassButton
        href={`/sign-in?next=${encodeURIComponent(`/events/${slug}`)}`}
        variant="primary"
        size={size}
        icon={<LogIn />}
        className={className}
      >
        Sign in to register
      </GlassButton>
    );
  }

  if (state.registered) {
    return (
      <div className={cn("space-y-2", className)}>
        <GlassButton href="/wallet" variant="glass" size={size} icon={<Check />}>
          Registered — view pass
        </GlassButton>
        {state.message && (
          <p className="text-[12.5px] text-ink-muted">{state.message}</p>
        )}
      </div>
    );
  }

  if (soldOut) {
    return (
      <GlassButton
        variant="ghost"
        size={size}
        disabled
        className={className}
        icon={<Ticket />}
      >
        Fully booked
      </GlassButton>
    );
  }

  return (
    <form action={formAction} className={cn("space-y-2", className)}>
      <input type="hidden" name="eventId" value={eventId} />

      {/* The one action the whole page exists for — so it gets the pulse. */}
      <GlassButton
        type="submit"
        variant="primary"
        size={size}
        icon={<Ticket />}
        disabled={pending}
        pulse
      >
        {pending ? "Registering…" : "Register"}
      </GlassButton>

      {state.message && !state.ok && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-rose-600 dark:text-rose-300">
          <TriangleAlert size={13} className="shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
    </form>
  );
}
