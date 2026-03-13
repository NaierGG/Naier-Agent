import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types";

export const runtime = "nodejs";

type WorkflowPayload = {
  name?: unknown;
  description?: unknown;
  is_active?: unknown;
  schedule_cron?: unknown;
  nodes?: unknown;
  edges?: unknown;
};

function parseWorkflowNodes(value: unknown) {
  return Array.isArray(value) ? (value as WorkflowNode[]) : [];
}

function parseWorkflowEdges(value: unknown) {
  return Array.isArray(value) ? (value as WorkflowEdge[]) : [];
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      workflows: (data || []) as Workflow[]
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 목록을 불러오지 못했습니다."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as WorkflowPayload;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "워크플로우 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const scheduleCron =
      typeof body.schedule_cron === "string" && body.schedule_cron.trim()
        ? body.schedule_cron.trim()
        : null;

    const { data, error } = await supabase
      .from("workflows")
      .insert({
        user_id: user.id,
        name,
        description,
        is_active: Boolean(body.is_active),
        schedule_cron: scheduleCron,
        nodes: parseWorkflowNodes(body.nodes),
        edges: parseWorkflowEdges(body.edges)
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error || new Error("워크플로우를 생성하지 못했습니다.");
    }

    return NextResponse.json(
      {
        workflow: data as Workflow
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 생성 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
