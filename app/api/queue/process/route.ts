import { NextResponse } from "next/server";

import { processWorkflowQueue } from "@/lib/workflow-engine/queue";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorizedRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorizationHeader = request.headers.get("authorization");

  if (!cronSecret) {
    throw new Error("CRON_SECRET 환경변수가 설정되지 않았습니다.");
  }

  return authorizationHeader === `Bearer ${cronSecret}`;
}

async function handleProcessQueue(request: Request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await processWorkflowQueue();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  try {
    return await handleProcessQueue(request);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Queue processing failed."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handleProcessQueue(request);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Queue processing failed."
      },
      { status: 500 }
    );
  }
}
