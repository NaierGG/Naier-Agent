import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkflowExecution } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; executionId: string } }
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
      .select("*")
      .eq("workflow_id", params.id)
      .eq("id", params.executionId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: "실행 로그를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      execution: data as WorkflowExecution
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "실행 로그를 불러오지 못했습니다."
      },
      { status: 500 }
    );
  }
}
