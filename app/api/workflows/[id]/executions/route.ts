import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkflowExecution } from "@/types";

export const runtime = "nodejs";

type ExecutionSummary = Pick<
  WorkflowExecution,
  "id" | "status" | "trigger_type" | "started_at" | "finished_at" | "error_message"
>;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("workflow_executions")
      .select("id, status, trigger_type, started_at, finished_at, error_message")
      .eq("workflow_id", params.id)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      executions: (data || []) as ExecutionSummary[]
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "실행 이력을 불러오지 못했습니다."
      },
      { status: 500 }
    );
  }
}
