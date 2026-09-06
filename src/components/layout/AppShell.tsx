import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/BottomNav";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentUser } from "@/server/auth/current-user";

/**
 * App chrome: mesh backdrop, sidebar on desktop, floating tab bar on mobile.
 *
 * Resolves the signed-in user once here and hands it to both navs — they are
 * client components and can't read the session cookie themselves.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <MeshBackground />
      <Sidebar user={user} />

      <div className="lg:pl-64">
        <MobileTopBar user={user} />
        {/* Bottom padding clears the floating tab bar on phones. */}
        <main className="mx-auto w-full max-w-6xl px-4 pt-3 pb-32 lg:px-8 lg:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
    </>
  );
}
