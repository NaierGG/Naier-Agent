import { NextResponse } from "next/server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient
} from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import {
  enqueueWorkflowRun,
  isWorkflowQueueEnabled
} from "@/lib/workflow-engine/queue";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !workflow) {
      return NextResponse.json(
        { message: "워크플로우를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (isWorkflowQueueEnabled()) {
      const queued = await enqueueWorkflowRun({
        workflowId: params.id,
        userId: user.id,
        triggerType: "manual",
        source: "manual"
      });

      return NextResponse.json(
        {
          queued: true,
          jobId: queued.job.id,
          status: "success"
        },
        { status: 202 }
      );
    }

    const execution = await executeWorkflow(
      params.id,
      user.id,
      "manual",
      createSupabaseAdminClient()
    );

    return NextResponse.json({
      executionId: execution.id,
      status: execution.status,
      queued: false
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 수동 실행에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
