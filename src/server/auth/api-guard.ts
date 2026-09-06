import "server-only";

import { NextResponse } from "next/server";

import type { User } from "@/lib/types";
import { getCurrentUser } from "@/server/auth/current-user";

/**
 * Route-handler guards.
 *
 * Return either the user or the response to send instead, so a handler reads:
 *
 *   const auth = await apiCoordinator();
 *   if (auth instanceof NextResponse) return auth;
 *
 * The `instanceof` check narrows `auth` to `User` for the rest of the handler,
 * so it is impossible to forget the guard and still compile.
 *
 * CSRF needs no token here: the session cookie is `sameSite: "lax"`, so a
 * cross-site POST never carries it and these guards reject it as signed-out.
 */
export async function apiUser(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  return (
    user ??
    NextResponse.json({ error: "Sign in to continue." }, { status: 401 })
  );
}

export async function apiCoordinator(): Promise<User | NextResponse> {
  const result = await apiUser();
  if (result instanceof NextResponse) return result;

  if (result.role !== "coordinator") {
    return NextResponse.json(
      { error: "Coordinator access required." },
      { status: 403 },
    );
  }

  return result;
}
