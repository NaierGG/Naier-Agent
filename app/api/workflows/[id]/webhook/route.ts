import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import type { Workflow, WorkflowNode } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function getWebhookNode(workflow: Workflow) {
  return (workflow.nodes || []).find(
    (node): node is WorkflowNode => node.type === "trigger_webhook"
  );
}

function normalizeMethod(value: unknown) {
  const method = String(value || "POST").trim().toUpperCase();
  return method === "GET" || method === "POST" || method === "ANY"
    ? method
    : "POST";
}

function getIncomingSecret(request: NextRequest, url: URL) {
  const authorization = request.headers.get("authorization");
  const bearerSecret =
    authorization && authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : null;

  return (
    url.searchParams.get("secret") ||
    request.headers.get("x-naier-webhook-secret") ||
    bearerSecret
  );
}

function sanitizeHeaders(request: NextRequest) {
  return Object.fromEntries(
    Array.from(request.headers.entries()).filter(([key]) => {
      const normalized = key.toLowerCase();
      return (
        normalized !== "authorization" &&
        normalized !== "cookie" &&
        normalized !== "x-naier-webhook-secret"
      );
    })
  );
}

async function readWebhookBody(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => null)) as unknown;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return await request.text().catch(() => null);
}

async function handleWebhook(request: NextRequest, workflowId: string) {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { message: "워크플로우를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const workflow = data as Workflow;
  const webhookNode = getWebhookNode(workflow);

  if (!webhookNode) {
    return NextResponse.json(
      { message: "이 워크플로우에는 웹훅 트리거가 설정되어 있지 않습니다." },
      { status: 400 }
    );
  }

  if (!workflow.is_active) {
    return NextResponse.json(
      { message: "비활성화된 워크플로우는 웹훅으로 실행할 수 없습니다." },
      { status: 409 }
    );
  }

  const configuredSecret = String(webhookNode.config?.webhook_secret || "").trim();

  if (!configuredSecret) {
    return NextResponse.json(
      { message: "웹훅 시크릿이 설정되지 않아 실행할 수 없습니다." },
      { status: 400 }
    );
  }

  const requestUrl = new URL(request.url);
  const incomingSecret = getIncomingSecret(request, requestUrl);

  if (!incomingSecret || incomingSecret !== configuredSecret) {
    return NextResponse.json(
      { message: "웹훅 시크릿이 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const acceptedMethod = normalizeMethod(webhookNode.config?.accept_method);
  const requestMethod = request.method.toUpperCase();

  if (acceptedMethod !== "ANY" && acceptedMethod !== requestMethod) {
    return NextResponse.json(
      { message: `${acceptedMethod} 요청만 허용되는 웹훅입니다.` },
      { status: 405 }
    );
  }

  requestUrl.searchParams.delete("secret");

  const execution = await executeWorkflow(
    workflow.id,
    workflow.user_id,
    "webhook",
    adminClient,
    {
      triggerPayload: {
        webhook: {
          method: requestMethod,
          query: Object.fromEntries(requestUrl.searchParams.entries()),
          headers: sanitizeHeaders(request),
          body: await readWebhookBody(request),
          received_at: new Date().toISOString()
        }
      }
    }
  );

  return NextResponse.json({
    success: execution.status === "success",
    executionId: execution.id,
    status: execution.status
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleWebhook(request, params.id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleWebhook(request, params.id);
}
