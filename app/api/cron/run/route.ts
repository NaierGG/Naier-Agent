import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import {
  getActiveScheduledWorkflows,
  matchesCronExpression
} from "@/lib/workflow-engine/scheduler";
import type { WorkflowExecution } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

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

function isAuthorizedRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorizationHeader = request.headers.get("authorization");

  if (!cronSecret) {
    throw new Error("CRON_SECRET 환경변수가 설정되지 않았습니다.");
  }

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const supabaseAdminClient = createSupabaseAdminClient();
    const activeWorkflows = await getActiveScheduledWorkflows(supabaseAdminClient);
    const matchingWorkflows = activeWorkflows.filter((workflow) =>
      workflow.schedule_cron
        ? matchesCronExpression(workflow.schedule_cron, now, "Asia/Seoul")
        : false
    );

    const settledResults = await Promise.allSettled(
      matchingWorkflows.map(async (workflow) => {
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
        };
      })
    );

    const results: Array<{
      workflowId: string;
      executionId?: string;
      status: WorkflowExecution["status"];
      error?: string;
    }> = settledResults.map((result, index) => {
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

    return NextResponse.json({
      executed: results.map((result) => result.workflowId),
      skipped: activeWorkflows.length - matchingWorkflows.length,
      timestamp: getKstTimestamp(now),
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Cron execution failed."
      },
      { status: 500 }
    );
  }
}
