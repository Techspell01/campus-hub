import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { signUpAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect(next ?? "/");

  return (
    <div className="mx-auto max-w-sm py-4">
      <AuthForm action={signUpAction} mode="sign-up" next={next} />

      <p className="mt-4 px-1 text-center text-[12px] leading-relaxed text-ink-faint">
        New accounts are students. Coordinator access is granted by listing an
        email in the <code className="font-mono">COORDINATOR_EMAILS</code>{" "}
        environment variable.
      </p>
    </div>
  );
}
