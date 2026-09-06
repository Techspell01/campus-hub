"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/server/auth/current-user";
import { registerForEvent } from "@/server/repositories/tickets";

export interface RegistrationResult {
  ok: boolean;
  message: string;
  /** True once the student holds a pass, however they got there. */
  registered: boolean;
}

/**
 * Claims a pass for the signed-in student.
 *
 * Driven by a real `<form action>` rather than an onClick handler, so it still
 * works if the page's JavaScript hasn't loaded — students hit this on patchy
 * campus wifi. Returns a result rather than throwing, so the outcome renders
 * inline instead of throwing the student out of the list they were browsing.
 */
export async function registerForEventAction(
  _previous: RegistrationResult,
  formData: FormData,
): Promise<RegistrationResult> {
  const eventId = String(formData.get("eventId") ?? "");
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      registered: false,
      message: "Sign in to register for events.",
    };
  }

  const result = await registerForEvent(user, eventId);

  switch (result.status) {
    case "issued":
      // The wallet and the event's seat count both change.
      revalidatePath("/wallet");
      revalidatePath("/events");
      revalidatePath("/");
      return {
        ok: true,
        registered: true,
        message: "You're in — your pass is in your wallet.",
      };

    case "already-registered":
      return {
        ok: true,
        registered: true,
        message: "You already have a pass for this event.",
      };

    case "sold-out":
      return {
        ok: false,
        registered: false,
        message: "This event is full.",
      };

    default:
      return {
        ok: false,
        registered: false,
        message: "That event isn't open for registration.",
      };
  }
}
