import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ExecutionLog } from "@/components/workflow/ExecutionLog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Workflow, WorkflowExecution } from "@/types";

type ExecutionSummary = Pick<
  WorkflowExecution,
  "id" | "status" | "trigger_type" | "started_at" | "finished_at" | "error_message"
>;

export default async function WorkflowLogsPage({
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

  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (workflowError || !workflow) {
    redirect("/workflows");
  }

  const { data: executions, error: executionsError } = await supabase
    .from("workflow_executions")
    .select("id, status, trigger_type, started_at, finished_at, error_message")
    .eq("workflow_id", params.id)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);

  if (executionsError) {
    throw new Error(executionsError.message);
  }

  const latestExecutionId = executions?.[0]?.id;
  let latestExecution: WorkflowExecution | null = null;

  if (latestExecutionId) {
    const { data: latestExecutionData, error: latestExecutionError } = await supabase
      .from("workflow_executions")
      .select("*")
      .eq("workflow_id", params.id)
      .eq("user_id", user.id)
      .eq("id", latestExecutionId)
      .single();

    if (latestExecutionError) {
      throw new Error(latestExecutionError.message);
    }

    latestExecution = latestExecutionData as WorkflowExecution;
  }

  const workflowRecord = workflow as Workflow;

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/workflows" className="transition hover:text-[#00d4aa]">
            워크플로우
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/workflows/${workflowRecord.id}`}
            className="transition hover:text-[#00d4aa]"
          >
            {workflowRecord.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-zinc-300">실행 로그</span>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#00d4aa]">
            Execution Logs
          </p>
          <h1 className="mt-3 font-mono text-3xl font-semibold text-zinc-100">
            {workflowRecord.name} 실행 로그
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            최근 실행 이력과 노드별 처리 결과를 단계별로 확인하세요.
          </p>
        </div>
      </div>

      <ExecutionLog
        workflowId={workflowRecord.id}
        workflowName={workflowRecord.name}
        workflowNodes={workflowRecord.nodes || []}
        initialExecutions={(executions || []) as ExecutionSummary[]}
        initialExecution={latestExecution}
      />
    </section>
  );
}
