import { NextResponse } from "next/server";
import { z } from "zod";

import { generateWorkflowFromChat } from "@/lib/gemini/workflow-generator";
import { getStoredUserApiKeys } from "@/lib/settings/user-api-keys";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConversationMessage } from "@/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.union([z.literal("user"), z.literal("assistant")]),
        content: z.string().min(1)
      })
    )
    .default([]),
  geminiApiKey: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const storedKeys = await getStoredUserApiKeys(adminClient, user.id);
    const geminiApiKey =
      storedKeys?.gemini_api_key || payload.geminiApiKey?.trim() || "";

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error: "Gemini API 키를 먼저 설정해주세요",
          needsSetup: true
        },
        { status: 400 }
      );
    }

    const generationResult = await generateWorkflowFromChat(
      payload.message,
      payload.history as ConversationMessage[],
      geminiApiKey
    );

    if (generationResult.needsMoreInfo || !generationResult.workflow) {
      return NextResponse.json({
        message: generationResult.assistantMessage,
        questions: generationResult.questions,
        needsMoreInfo: true
      });
    }

    const { data: insertedWorkflow, error: insertError } = await adminClient
      .from("workflows")
      .insert({
        user_id: user.id,
        name: generationResult.workflow.name || "새 워크플로우",
        description: generationResult.workflow.description || null,
        is_active: false,
        schedule_cron: generationResult.workflow.schedule_cron || null,
        nodes: generationResult.workflow.nodes || [],
        edges: generationResult.workflow.edges || []
      })
      .select()
      .single();

    if (insertError || !insertedWorkflow) {
      throw new Error(insertError?.message || "워크플로우 저장에 실패했습니다.");
    }

    return NextResponse.json({
      workflow: insertedWorkflow,
      message: generationResult.assistantMessage,
      workflowId: insertedWorkflow.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "요청 형식이 올바르지 않습니다."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "워크플로우 생성 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
