import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-[#e5e5e5]">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#111111] p-8">
          <p className="font-mono text-sm text-[#00d4aa]">Supabase Required</p>
          <h1 className="mt-3 font-mono text-2xl font-semibold">
            {
              "\uB300\uC2DC\uBCF4\uB4DC\uB97C \uC0AC\uC6A9\uD558\uB824\uBA74 Supabase \uD658\uACBD\uBCC0\uC218\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
            }
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {
              ".env.local\uC5D0 NEXT_PUBLIC_SUPABASE_URL\uACFC NEXT_PUBLIC_SUPABASE_ANON_KEY\uB97C \uBA3C\uC800 \uC124\uC815\uD574\uC8FC\uC138\uC694."
            }
          </p>
        </div>
      </main>
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell userEmail={user.email || "unknown@example.com"}>
      {children}
    </DashboardShell>
  );
}
