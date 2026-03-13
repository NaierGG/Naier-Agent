import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";

export const runtime = "nodejs";

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

    const execution = await executeWorkflow(
      params.id,
      user.id,
      "manual",
      createSupabaseAdminClient()
    );

    return NextResponse.json({
      executionId: execution.id,
      status: execution.status
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
