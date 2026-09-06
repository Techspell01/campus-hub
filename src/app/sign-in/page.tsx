import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { signInAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect(next ?? "/");

  return (
    <div className="mx-auto max-w-sm space-y-4 py-4">
      <AuthForm action={signInAction} mode="sign-in" next={next} />

    </div>
  );
}
