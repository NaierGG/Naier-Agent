import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { WorkflowList } from "@/components/workflow/WorkflowList";
import { buttonVariants } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Workflow } from "@/types";

export default async function WorkflowsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#00d4aa]">
            Workflows
          </p>
          <h1 className="mt-3 font-mono text-3xl font-semibold text-zinc-100">
            워크플로우
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            생성한 자동화를 관리하고, 직접 실행하거나 상태를 전환하세요.
          </p>
        </div>

        <Link
          href="/workflows/new"
          className={buttonVariants({
            className: "w-full lg:w-auto"
          })}
        >
          <Plus className="h-4 w-4" />워크플로우 만들기
        </Link>
      </div>

      <WorkflowList workflows={(data || []) as Workflow[]} />
    </section>
  );
}
