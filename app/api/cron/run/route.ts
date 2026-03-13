import { NextResponse } from "next/server";

import { runScheduledWorkflows } from "@/lib/workflow-engine/run-scheduled-workflows";

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

export async function GET(request: Request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await runScheduledWorkflows(new Date());

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Cron execution failed."
      },
      { status: 500 }
    );
  }
}
