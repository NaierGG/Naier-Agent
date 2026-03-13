import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { executeSingleNode } from "@/lib/workflow-engine/executor";
import type { WorkflowNode, WorkflowTriggerType } from "@/types";

export const runtime = "nodejs";

type NodeExecutePayload = {
  node?: Partial<WorkflowNode>;
  input?: unknown;
  triggerType?: WorkflowTriggerType;
};

function isValidNode(node: Partial<WorkflowNode> | undefined): node is WorkflowNode {
  return Boolean(
    node &&
      typeof node.id === "string" &&
      typeof node.type === "string" &&
      typeof node.label === "string" &&
      typeof node.config === "object" &&
      node.config !== null
  );
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

    const body = (await request.json()) as NodeExecutePayload;

    if (!isValidNode(body.node)) {
      return NextResponse.json(
        { message: "실행할 노드 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const result = await executeSingleNode({
      node: {
        ...body.node,
        position: body.node.position || { x: 0, y: 0 }
      },
      input: body.input,
      userId: user.id,
      supabaseServiceClient: createSupabaseAdminClient(),
      triggerType: body.triggerType || "manual"
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "단일 노드 실행에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
