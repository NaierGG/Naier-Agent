import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import {
  getActiveScheduledWorkflows,
  matchesCronExpression
} from "@/lib/workflow-engine/scheduler";
import type { WorkflowExecution } from "@/types";

export const runtime = "nodejs";

function isAuthorizedRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorizationHeader = request.headers.get("authorization");
  const bearerToken = authorizationHeader?.replace(/^Bearer\s+/i, "") || "";
  const xCronSecret = request.headers.get("x-cron-secret") || "";

  if (!cronSecret) {
    throw new Error("CRON_SECRET 환경변수가 설정되지 않았습니다.");
  }

  return bearerToken === cronSecret || xCronSecret === cronSecret;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json(
        { message: "Unauthorized cron request." },
        { status: 401 }
      );
    }

    const supabaseAdminClient = createSupabaseAdminClient();
    const activeWorkflows = await getActiveScheduledWorkflows(supabaseAdminClient);
    const now = new Date();
    const executionResults: Array<{
      workflowId: string;
      executionId?: string;
      status: WorkflowExecution["status"] | "skipped";
      error?: string;
    }> = [];

    for (const workflow of activeWorkflows) {
      if (!workflow.schedule_cron) {
        executionResults.push({
          workflowId: workflow.id,
          status: "skipped"
        });
        continue;
      }

      const isMatch = matchesCronExpression(
        workflow.schedule_cron,
        now,
        "Asia/Seoul"
      );

      if (!isMatch) {
        executionResults.push({
          workflowId: workflow.id,
          status: "skipped"
        });
        continue;
      }

      try {
        const execution = await executeWorkflow(
          workflow.id,
          workflow.user_id,
          "schedule",
          supabaseAdminClient
        );

        executionResults.push({
          workflowId: workflow.id,
          executionId: execution.id,
          status: execution.status
        });
      } catch (error) {
        executionResults.push({
          workflowId: workflow.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown execution error"
        });
      }
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      executed: executionResults.filter((result) => result.status !== "skipped"),
      skipped: executionResults.filter((result) => result.status === "skipped")
        .length
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Cron execution failed."
      },
      { status: 500 }
    );
  }
}
