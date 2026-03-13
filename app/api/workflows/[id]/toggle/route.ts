import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Workflow } from "@/types";

export const runtime = "nodejs";

type TogglePayload = {
  is_active?: unknown;
};

export async function PATCH(
  request: Request,
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

    const { data: currentWorkflow, error: fetchError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !currentWorkflow) {
      return NextResponse.json(
        { message: "워크플로우를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = ((await request.json().catch(() => ({}))) || {}) as TogglePayload;
    const nextIsActive =
      typeof body.is_active === "boolean"
        ? body.is_active
        : !Boolean(currentWorkflow.is_active);

    const { data, error } = await supabase
      .from("workflows")
      .update({
        is_active: nextIsActive
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      throw error || new Error("워크플로우 상태를 변경하지 못했습니다.");
    }

    return NextResponse.json({
      workflow: data as Workflow
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 상태 변경 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
