import type { WorkflowExecution } from "@/types";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import {
  enqueueWorkflowRun,
  isWorkflowQueueEnabled
} from "@/lib/workflow-engine/queue";
import {
  getActiveScheduledWorkflows,
  matchesCronExpression
} from "@/lib/workflow-engine/scheduler";

export type ScheduledWorkflowResult = {
  workflowId: string;
  jobId?: string;
  executionId?: string;
  status: WorkflowExecution["status"] | "queued";
  error?: string;
};

function getKstTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return formatter.format(date).replace(" ", "T");
}

export async function runScheduledWorkflows(now = new Date()) {
  const supabaseAdminClient = createSupabaseAdminClient();
  const activeWorkflows = await getActiveScheduledWorkflows(supabaseAdminClient);
  const queueEnabled = isWorkflowQueueEnabled();
  const matchingWorkflows = activeWorkflows.filter((workflow) =>
    workflow.schedule_cron
      ? matchesCronExpression(workflow.schedule_cron, now, "Asia/Seoul")
      : false
  );

  const settledResults = await Promise.allSettled(
    matchingWorkflows.map(async (workflow) => {
      if (queueEnabled) {
        const queued = await enqueueWorkflowRun({
          workflowId: workflow.id,
          userId: workflow.user_id,
          triggerType: "schedule",
          source: "schedule"
        });

        return {
          workflowId: workflow.id,
          jobId: queued.job.id,
          status: "queued"
        } satisfies ScheduledWorkflowResult;
      }

      const execution = await executeWorkflow(
        workflow.id,
        workflow.user_id,
        "schedule",
        supabaseAdminClient
      );

      return {
        workflowId: workflow.id,
        executionId: execution.id,
        status: execution.status
      } satisfies ScheduledWorkflowResult;
    })
  );

  const results: ScheduledWorkflowResult[] = settledResults.map((result, index) => {
    const workflow = matchingWorkflows[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      workflowId: workflow.id,
      status: "failed",
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown execution error"
    };
  });

  return {
    executed: results
      .filter((result) => result.status !== "queued")
      .map((result) => result.workflowId),
    enqueued: results
      .filter((result) => result.status === "queued")
      .map((result) => result.workflowId),
    skipped: activeWorkflows.length - matchingWorkflows.length,
    timestamp: getKstTimestamp(now),
    results
  };
}
