import { NextResponse } from "next/server";

import {
  listDeadLetterJobs,
  requeueDeadLetterJobs
} from "@/lib/workflow-engine/queue";

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

function parseLimit(request: Request) {
  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "", 10);

  if (Number.isNaN(rawLimit) || rawLimit < 1) {
    return undefined;
  }

  return rawLimit;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await listDeadLetterJobs({
      limit: parseLimit(request)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Dead-letter queue lookup failed."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      jobIds?: string[];
      limit?: number;
    };
    const result = await requeueDeadLetterJobs({
      jobIds: Array.isArray(body.jobIds) ? body.jobIds : undefined,
      limit:
        typeof body.limit === "number" && body.limit > 0 ? body.limit : parseLimit(request)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Dead-letter queue requeue failed."
      },
      { status: 500 }
    );
  }
}
