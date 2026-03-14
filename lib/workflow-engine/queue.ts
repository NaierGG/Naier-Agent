import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import type { WorkflowExecution, WorkflowTriggerType } from "@/types";

const WORKFLOW_QUEUE_KEY = "naier:workflow:jobs";
const DEFAULT_QUEUE_BATCH_SIZE = 10;

export type WorkflowQueueJobSource = "manual" | "schedule" | "webhook";

export type WorkflowQueueJob = {
  id: string;
  workflowId: string;
  userId: string;
  triggerType: WorkflowTriggerType;
  triggerPayload?: Record<string, unknown>;
  source: WorkflowQueueJobSource;
  enqueuedAt: string;
};

export type WorkflowQueueResult = {
  jobId: string;
  workflowId: string;
  source: WorkflowQueueJobSource;
  triggerType: WorkflowTriggerType;
  status: WorkflowExecution["status"] | "queued";
  executionId?: string;
  error?: string;
};

let redisClient: Redis | null | undefined;

function getQueueBatchSize() {
  const rawValue = Number.parseInt(String(process.env.WORKFLOW_QUEUE_BATCH_SIZE || ""), 10);

  if (Number.isNaN(rawValue) || rawValue < 1) {
    return DEFAULT_QUEUE_BATCH_SIZE;
  }

  return Math.min(rawValue, 50);
}

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url,
    token
  });

  return redisClient;
}

function requireRedisClient() {
  const client = getRedisClient();

  if (!client) {
    throw new Error("Upstash Redis 환경변수가 설정되지 않았습니다.");
  }

  return client;
}

function parseQueueJob(rawValue: unknown): WorkflowQueueJob | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<WorkflowQueueJob>;

    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.workflowId !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.triggerType !== "string" ||
      typeof parsed.source !== "string" ||
      typeof parsed.enqueuedAt !== "string"
    ) {
      return null;
    }

    return parsed as WorkflowQueueJob;
  } catch {
    return null;
  }
}

async function popQueuedJobs(limit: number) {
  const client = requireRedisClient();
  const jobs: WorkflowQueueJob[] = [];

  for (let index = 0; index < limit; index += 1) {
    const rawValue = await client.lpop<string | null>(WORKFLOW_QUEUE_KEY);

    if (!rawValue) {
      break;
    }

    const parsed = parseQueueJob(rawValue);

    if (!parsed) {
      jobs.push({
        id: randomUUID(),
        workflowId: "unknown",
        userId: "unknown",
        triggerType: "manual",
        source: "manual",
        enqueuedAt: new Date().toISOString(),
        triggerPayload: {
          __invalid_job: rawValue
        }
      });
      continue;
    }

    jobs.push(parsed);
  }

  return jobs;
}

export function isWorkflowQueueEnabled() {
  return getRedisClient() !== null;
}

export async function getWorkflowQueueSize() {
  const client = getRedisClient();

  if (!client) {
    return 0;
  }

  return client.llen(WORKFLOW_QUEUE_KEY);
}

export async function enqueueWorkflowRun(
  job: Omit<WorkflowQueueJob, "id" | "enqueuedAt">
) {
  const client = requireRedisClient();
  const queuedJob: WorkflowQueueJob = {
    id: randomUUID(),
    enqueuedAt: new Date().toISOString(),
    ...job
  };

  await client.rpush(WORKFLOW_QUEUE_KEY, JSON.stringify(queuedJob));

  return {
    job: queuedJob,
    queueSize: await client.llen(WORKFLOW_QUEUE_KEY)
  };
}

export async function processWorkflowQueue({
  limit = getQueueBatchSize()
}: {
  limit?: number;
} = {}) {
  if (!isWorkflowQueueEnabled()) {
    return {
      enabled: false,
      processed: 0,
      remaining: 0,
      results: [] as WorkflowQueueResult[]
    };
  }

  const client = requireRedisClient();
  const jobs = await popQueuedJobs(limit);
  const supabaseAdminClient = createSupabaseAdminClient();
  const results: WorkflowQueueResult[] = [];

  for (const job of jobs) {
    if (job.workflowId === "unknown") {
      results.push({
        jobId: job.id,
        workflowId: job.workflowId,
        source: job.source,
        triggerType: job.triggerType,
        status: "failed",
        error: "큐 작업을 파싱하지 못했습니다."
      });
      continue;
    }

    try {
      const execution = await executeWorkflow(
        job.workflowId,
        job.userId,
        job.triggerType,
        supabaseAdminClient,
        job.triggerPayload
          ? {
              triggerPayload: job.triggerPayload
            }
          : undefined
      );

      results.push({
        jobId: job.id,
        workflowId: job.workflowId,
        source: job.source,
        triggerType: job.triggerType,
        status: execution.status,
        executionId: execution.id
      });
    } catch (error) {
      results.push({
        jobId: job.id,
        workflowId: job.workflowId,
        source: job.source,
        triggerType: job.triggerType,
        status: "failed",
        error:
          error instanceof Error ? error.message : "큐 작업 실행에 실패했습니다."
      });
    }
  }

  return {
    enabled: true,
    processed: jobs.length,
    remaining: await client.llen(WORKFLOW_QUEUE_KEY),
    results
  };
}
