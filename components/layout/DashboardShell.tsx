"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { createClientComponentClient } from "@/lib/supabase/client";

export function DashboardShell({
  children,
  userEmail
}: {
  children: ReactNode;
  userEmail: string;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setIsLoggingOut(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar
          className="hidden lg:flex"
          currentPath={pathname}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          onNavigate={() => setIsMobileOpen(false)}
          userEmail={userEmail}
        />

        {isMobileOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              aria-label="Close navigation"
              className="flex-1 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
              type="button"
            />
            <Sidebar
              className="flex w-[240px] max-w-[80vw]"
              currentPath={pathname}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
              onNavigate={() => setIsMobileOpen(false)}
              userEmail={userEmail}
            />
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            onOpenMenu={() => setIsMobileOpen(true)}
            userEmail={userEmail}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
