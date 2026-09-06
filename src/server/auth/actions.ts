"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Role } from "@/lib/types";
import {
  hashPassword,
  hashPasswordSync,
  verifyPassword,
} from "@/server/auth/password";
import { endSession, startSession } from "@/server/auth/session";
import {
  countUsers,
  createUser,
  findUserRecordByEmail,
} from "@/server/repositories/accounts";

export interface AuthFormState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Only same-site paths are accepted as a post-login destination. Without this,
 * `/sign-in?next=https://evil.example` would hand an attacker a credible
 * phishing hop off our own domain.
 */
function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/**
 * A throwaway hash to verify against when no account matches, so a wrong email
 * and a wrong password take the same time. Otherwise the response latency
 * alone tells an attacker which emails are registered.
 */
let decoyHash: string | undefined;
const getDecoyHash = () => (decoyHash ??= hashPasswordSync("decoy-password"));

/**
 * Failed-login throttle. In-memory and per-instance — enough to stop online
 * password guessing, not a substitute for a shared rate limiter if this ever
 * runs on more than one server.
 */
const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; firstAt: number }>();

function recordFailure(key: string) {
  const now = Date.now();
  const entry = failures.get(key);

  if (!entry || now - entry.firstAt > FAILURE_WINDOW_MS) {
    failures.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

function isThrottled(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;

  if (Date.now() - entry.firstAt > FAILURE_WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

/**
 * Who gets coordinator rights at sign-up.
 *
 * The first account on an empty database becomes a coordinator — otherwise a
 * fresh deployment has nobody who can reach /admin, and the only way in would
 * be editing the database by hand. After that, `COORDINATOR_EMAILS` is the
 * only route.
 */
async function roleForNewUser(email: string): Promise<Role> {
  if ((await countUsers()) === 0) return "coordinator";

  const allowed = (process.env.COORDINATOR_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.trim().toLowerCase())
    ? "coordinator"
    : "student";
}

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const throttleKey = email.toLowerCase();
  if (isThrottled(throttleKey)) {
    return {
      error: "Too many failed attempts. Wait a few minutes and try again.",
    };
  }

  const record = await findUserRecordByEmail(email);
  const matches = await verifyPassword(
    password,
    record?.passwordHash ?? getDecoyHash(),
  );

  if (!record || !matches) {
    recordFailure(throttleKey);
    // One message for both cases — saying "no such account" would confirm
    // which emails exist.
    return { error: "That email and password don't match." };
  }

  failures.delete(throttleKey);
  await startSession(record.id);

  // The nav renders the signed-in user, so the cached shell has to go.
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!name || !email || !password) {
    return { error: "Fill in every field." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That doesn't look like a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
    };
  }

  const created = await createUser({
    email,
    name,
    role: await roleForNewUser(email),
    passwordHash: await hashPassword(password),
  });

  if (!created.ok) {
    return { error: "An account with that email already exists." };
  }

  await startSession(created.user.id);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOutAction() {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/");
}
