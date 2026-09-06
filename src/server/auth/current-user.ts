import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { User } from "@/lib/types";
import { readSessionUser } from "@/server/auth/session";

/**
 * The signed-in user for this request.
 *
 * Wrapped in React's `cache` so a page, its layout and any nested component
 * that asks all share one lookup per request instead of re-reading the cookie
 * and store each time.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  return readSessionUser();
});

/**
 * Guards are enforced per page rather than in middleware: the store is a
 * Node-only module (it touches the filesystem), and a guard that runs in the
 * same place as the data it protects can't drift out of sync with it.
 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (user) return user;

  redirect(
    returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in",
  );
}

export async function requireCoordinator(returnTo?: string): Promise<User> {
  const user = await requireUser(returnTo);
  if (user.role !== "coordinator") redirect("/not-authorised");

  return user;
}
