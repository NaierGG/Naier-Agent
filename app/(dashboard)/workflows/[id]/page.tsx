import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { NodeEditor } from "@/components/workflow/NodeEditor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Workflow } from "@/types";

export default async function WorkflowDetailPage({
  params
}: {
  params: { id: string };
}) {
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
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    redirect("/workflows");
  }

  const workflow = data as Workflow;

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/workflows" className="transition hover:text-[#00d4aa]">
            워크플로우
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-zinc-300">{workflow.name}</span>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#00d4aa]">
            Workflow Detail
          </p>
          <h1 className="mt-3 font-mono text-3xl font-semibold text-zinc-100">
            워크플로우 편집기
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            노드를 직접 배치하고 연결을 조정하면서 실행 흐름을 빠르게 검증해보세요.
          </p>
        </div>
      </div>

      <NodeEditor workflow={workflow} />
    </section>
  );
}
