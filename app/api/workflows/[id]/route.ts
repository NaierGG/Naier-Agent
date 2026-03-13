import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types";

export const runtime = "nodejs";

type WorkflowPatchPayload = {
  name?: unknown;
  description?: unknown;
  is_active?: unknown;
  schedule_cron?: unknown;
  nodes?: unknown;
  edges?: unknown;
};

function parseWorkflowNodes(value: unknown) {
  return Array.isArray(value) ? (value as WorkflowNode[]) : undefined;
}

function parseWorkflowEdges(value: unknown) {
  return Array.isArray(value) ? (value as WorkflowEdge[]) : undefined;
}

async function getAuthenticatedSupabase() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: "워크플로우를 찾을 수 없습니다." },
        { status: 404 }
      );
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
            : "워크플로우 정보를 불러오지 못했습니다."
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as WorkflowPatchPayload;
    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          { message: "워크플로우 이름을 입력해주세요." },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.description !== undefined) {
      updates.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }

    if (body.schedule_cron !== undefined) {
      updates.schedule_cron =
        typeof body.schedule_cron === "string" && body.schedule_cron.trim()
          ? body.schedule_cron.trim()
          : null;
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    const parsedNodes = parseWorkflowNodes(body.nodes);
    if (parsedNodes !== undefined) {
      updates.nodes = parsedNodes;
    }

    const parsedEdges = parseWorkflowEdges(body.edges);
    if (parsedEdges !== undefined) {
      updates.edges = parsedEdges;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "변경할 내용이 없습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("workflows")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: "워크플로우를 수정하지 못했습니다." },
        { status: 404 }
      );
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
            : "워크플로우 수정 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 삭제 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
