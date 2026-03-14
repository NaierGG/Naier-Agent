import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-engine/executor";
import type { WorkflowExecution, WorkflowTriggerType } from "@/types";

const WORKFLOW_QUEUE_KEY = "naier:workflow:jobs";
const WORKFLOW_DEAD_LETTER_KEY = "naier:workflow:jobs:dead-letter";
const DEFAULT_QUEUE_BATCH_SIZE = 10;
const DEFAULT_QUEUE_MAX_ATTEMPTS = 3;
const DEFAULT_QUEUE_RETRY_DELAY_SECONDS = 30;
const MAX_QUEUE_BATCH_SIZE = 50;
const MAX_QUEUE_RETRY_DELAY_SECONDS = 900;

export type WorkflowQueueJobSource = "manual" | "schedule" | "webhook";

export type WorkflowQueueJob = {
  id: string;
  workflowId: string;
  userId: string;
  triggerType: WorkflowTriggerType;
  triggerPayload?: Record<string, unknown>;
  source: WorkflowQueueJobSource;
  enqueuedAt: string;
  attempt: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  lastAttemptedAt: string | null;
  lastError: string | null;
};

export type WorkflowDeadLetterJob = WorkflowQueueJob & {
  deadLetteredAt: string;
};

export type WorkflowQueueResultStatus =
  | WorkflowExecution["status"]
  | "queued"
  | "retrying"
  | "deferred"
  | "dead_lettered";

export type WorkflowQueueResult = {
  jobId: string;
  workflowId: string;
  source: WorkflowQueueJobSource;
  triggerType: WorkflowTriggerType;
  status: WorkflowQueueResultStatus;
  attempt: number;
  maxAttempts: number;
  executionId?: string;
  error?: string;
  nextAttemptAt?: string | null;
  deadLetteredAt?: string;
};

type ParsedQueueValue<T> = {
  parsed: T | null;
  raw: string | null;
};

let redisClient: Redis | null | undefined;

function getIntegerEnv(
  envKey: string,
  defaultValue: number,
  {
    min = 1,
    max
  }: {
    min?: number;
    max?: number;
  } = {}
) {
  const rawValue = Number.parseInt(String(process.env[envKey] || ""), 10);

  if (Number.isNaN(rawValue)) {
    return defaultValue;
  }

  const boundedValue = Math.max(min, rawValue);
  return typeof max === "number" ? Math.min(boundedValue, max) : boundedValue;
}

function getQueueBatchSize() {
  return getIntegerEnv("WORKFLOW_QUEUE_BATCH_SIZE", DEFAULT_QUEUE_BATCH_SIZE, {
    min: 1,
    max: MAX_QUEUE_BATCH_SIZE
  });
}

function getQueueMaxAttempts() {
  return getIntegerEnv(
    "WORKFLOW_QUEUE_MAX_ATTEMPTS",
    DEFAULT_QUEUE_MAX_ATTEMPTS,
    {
      min: 1,
      max: 10
    }
  );
}

function getQueueRetryDelaySeconds() {
  return getIntegerEnv(
    "WORKFLOW_QUEUE_RETRY_DELAY_SECONDS",
    DEFAULT_QUEUE_RETRY_DELAY_SECONDS,
    {
      min: 5,
      max: MAX_QUEUE_RETRY_DELAY_SECONDS
    }
  );
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

function normalizeQueueJob(
  parsed: Partial<WorkflowQueueJob>
): WorkflowQueueJob | null {
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

  const attempt =
    typeof parsed.attempt === "number" && parsed.attempt > 0 ? parsed.attempt : 1;
  const maxAttempts =
    typeof parsed.maxAttempts === "number" && parsed.maxAttempts > 0
      ? parsed.maxAttempts
      : getQueueMaxAttempts();

  return {
    id: parsed.id,
    workflowId: parsed.workflowId,
    userId: parsed.userId,
    triggerType: parsed.triggerType as WorkflowTriggerType,
    source: parsed.source as WorkflowQueueJobSource,
    enqueuedAt: parsed.enqueuedAt,
    triggerPayload:
      parsed.triggerPayload &&
      typeof parsed.triggerPayload === "object" &&
      !Array.isArray(parsed.triggerPayload)
        ? (parsed.triggerPayload as Record<string, unknown>)
        : undefined,
    attempt,
    maxAttempts,
    nextAttemptAt:
      typeof parsed.nextAttemptAt === "string" ? parsed.nextAttemptAt : null,
    lastAttemptedAt:
      typeof parsed.lastAttemptedAt === "string" ? parsed.lastAttemptedAt : null,
    lastError: typeof parsed.lastError === "string" ? parsed.lastError : null
  };
}

function normalizeDeadLetterJob(
  parsed: Partial<WorkflowDeadLetterJob>
): WorkflowDeadLetterJob | null {
  const queueJob = normalizeQueueJob(parsed);

  if (!queueJob || typeof parsed.deadLetteredAt !== "string") {
    return null;
  }

  return {
    ...queueJob,
    deadLetteredAt: parsed.deadLetteredAt
  };
}

function parseSerializedValue<T>(
  rawValue: unknown,
  normalizer: (value: Record<string, unknown>) => T | null
): ParsedQueueValue<T> {
  if (typeof rawValue !== "string") {
    return {
      parsed: null,
      raw: null
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;

    return {
      parsed: normalizer(parsed),
      raw: rawValue
    };
  } catch {
    return {
      parsed: null,
      raw: rawValue
    };
  }
}

function getRetryDelayMs(attempt: number) {
  const delaySeconds = getQueueRetryDelaySeconds();
  const multiplier = Math.min(Math.max(attempt, 1), 5);

  return Math.min(
    delaySeconds * 1000 * multiplier,
    MAX_QUEUE_RETRY_DELAY_SECONDS * 1000
  );
}

async function pushQueueJob(job: WorkflowQueueJob) {
  const client = requireRedisClient();
  await client.rpush(WORKFLOW_QUEUE_KEY, JSON.stringify(job));
}

async function pushDeadLetterJob(job: WorkflowDeadLetterJob) {
  const client = requireRedisClient();
  await client.rpush(WORKFLOW_DEAD_LETTER_KEY, JSON.stringify(job));
}

async function popQueuedJobs(limit: number) {
  const client = requireRedisClient();
  const jobs: Array<{
    job: WorkflowQueueJob | null;
    raw: string | null;
  }> = [];

  for (let index = 0; index < limit; index += 1) {
    const rawValue = await client.lpop<string | null>(WORKFLOW_QUEUE_KEY);

    if (!rawValue) {
      break;
    }

    const parsed = parseSerializedValue(rawValue, (value) =>
      normalizeQueueJob(value as Partial<WorkflowQueueJob>)
    );

    jobs.push({
      job: parsed.parsed,
      raw: parsed.raw
    });
  }

  return jobs;
}

async function deadLetterJob(job: WorkflowQueueJob, error: string) {
  const deadLetterJobRecord: WorkflowDeadLetterJob = {
    ...job,
    lastError: error,
    deadLetteredAt: new Date().toISOString()
  };

  await pushDeadLetterJob(deadLetterJobRecord);
  return deadLetterJobRecord;
}

function buildInvalidJobRecord(rawValue: string | null) {
  return {
    id: randomUUID(),
    workflowId: "unknown",
    userId: "unknown",
    triggerType: "manual" as const,
    source: "manual" as const,
    enqueuedAt: new Date().toISOString(),
    attempt: 1,
    maxAttempts: 1,
    nextAttemptAt: null,
    lastAttemptedAt: new Date().toISOString(),
    lastError: rawValue ? `Invalid queue payload: ${rawValue}` : "Invalid queue payload"
  } satisfies WorkflowQueueJob;
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

export async function getWorkflowDeadLetterSize() {
  const client = getRedisClient();

  if (!client) {
    return 0;
  }

  return client.llen(WORKFLOW_DEAD_LETTER_KEY);
}

export async function enqueueWorkflowRun(
  job: Omit<
    WorkflowQueueJob,
    | "id"
    | "enqueuedAt"
    | "attempt"
    | "nextAttemptAt"
    | "lastAttemptedAt"
    | "lastError"
    | "maxAttempts"
  > & {
    maxAttempts?: number;
  }
) {
  const client = requireRedisClient();
  const queuedJob: WorkflowQueueJob = {
    id: randomUUID(),
    enqueuedAt: new Date().toISOString(),
    attempt: 1,
    maxAttempts: job.maxAttempts ?? getQueueMaxAttempts(),
    nextAttemptAt: null,
    lastAttemptedAt: null,
    lastError: null,
    ...job
  };

  await pushQueueJob(queuedJob);

  return {
    job: queuedJob,
    queueSize: await client.llen(WORKFLOW_QUEUE_KEY)
  };
}

export async function listDeadLetterJobs({
  limit = 20
}: {
  limit?: number;
} = {}) {
  if (!isWorkflowQueueEnabled()) {
    return {
      enabled: false,
      total: 0,
      jobs: [] as WorkflowDeadLetterJob[]
    };
  }

  const client = requireRedisClient();
  const normalizedLimit = Math.max(1, Math.min(limit, 100));
  const rawValues = await client.lrange<string[]>(
    WORKFLOW_DEAD_LETTER_KEY,
    0,
    normalizedLimit - 1
  );
  const jobs = rawValues
    .map((rawValue) =>
      parseSerializedValue(rawValue, (value) =>
        normalizeDeadLetterJob(value as Partial<WorkflowDeadLetterJob>)
      ).parsed
    )
    .filter((job): job is WorkflowDeadLetterJob => Boolean(job));

  return {
    enabled: true,
    total: await client.llen(WORKFLOW_DEAD_LETTER_KEY),
    jobs
  };
}

export async function requeueDeadLetterJobs({
  jobIds,
  limit = 20
}: {
  jobIds?: string[];
  limit?: number;
} = {}) {
  if (!isWorkflowQueueEnabled()) {
    return {
      enabled: false,
      requeued: 0,
      remaining: 0,
      queueSize: 0,
      jobs: [] as WorkflowQueueJob[]
    };
  }

  const client = requireRedisClient();
  const totalDeadLetters = await client.llen(WORKFLOW_DEAD_LETTER_KEY);

  if (totalDeadLetters === 0) {
    return {
      enabled: true,
      requeued: 0,
      remaining: 0,
      queueSize: await client.llen(WORKFLOW_QUEUE_KEY),
      jobs: [] as WorkflowQueueJob[]
    };
  }

  const rawValues = await client.lrange<string[]>(
    WORKFLOW_DEAD_LETTER_KEY,
    0,
    totalDeadLetters - 1
  );
  const allJobs = rawValues
    .map((rawValue) =>
      parseSerializedValue(rawValue, (value) =>
        normalizeDeadLetterJob(value as Partial<WorkflowDeadLetterJob>)
      ).parsed
    )
    .filter((job): job is WorkflowDeadLetterJob => Boolean(job));

  const normalizedJobIds = new Set(
    (jobIds || []).filter(
      (jobId): jobId is string => typeof jobId === "string" && jobId.trim().length > 0
    )
  );
  const selectedJobs =
    normalizedJobIds.size > 0
      ? allJobs.filter((job) => normalizedJobIds.has(job.id))
      : allJobs.slice(0, Math.max(1, Math.min(limit, allJobs.length)));
  const selectedJobIdSet = new Set(selectedJobs.map((job) => job.id));
  const remainingJobs = allJobs.filter((job) => !selectedJobIdSet.has(job.id));
  const requeuedJobs: WorkflowQueueJob[] = selectedJobs.map((job) => ({
    ...job,
    enqueuedAt: new Date().toISOString(),
    attempt: 1,
    nextAttemptAt: null,
    lastAttemptedAt: null,
    lastError: null
  }));

  await client.del(WORKFLOW_DEAD_LETTER_KEY);

  for (const remainingJob of remainingJobs) {
    await pushDeadLetterJob(remainingJob);
  }

  for (const requeuedJob of requeuedJobs) {
    await pushQueueJob(requeuedJob);
  }

  return {
    enabled: true,
    requeued: requeuedJobs.length,
    remaining: remainingJobs.length,
    queueSize: await client.llen(WORKFLOW_QUEUE_KEY),
    jobs: requeuedJobs
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
      retried: 0,
      deferred: 0,
      deadLettered: 0,
      remaining: 0,
      deadLetters: 0,
      results: [] as WorkflowQueueResult[]
    };
  }

  const client = requireRedisClient();
  const jobs = await popQueuedJobs(Math.max(1, Math.min(limit, MAX_QUEUE_BATCH_SIZE)));
  const supabaseAdminClient = createSupabaseAdminClient();
  const now = Date.now();
  const results: WorkflowQueueResult[] = [];
  let retried = 0;
  let deferred = 0;
  let deadLettered = 0;

  for (const queuedEntry of jobs) {
    const job = queuedEntry.job;

    if (!job) {
      const invalidJob = buildInvalidJobRecord(queuedEntry.raw);
      const deadLetterRecord = await deadLetterJob(
        invalidJob,
        invalidJob.lastError || "Invalid queue payload"
      );

      deadLettered += 1;
      results.push({
        jobId: deadLetterRecord.id,
        workflowId: deadLetterRecord.workflowId,
        source: deadLetterRecord.source,
        triggerType: deadLetterRecord.triggerType,
        status: "dead_lettered",
        attempt: deadLetterRecord.attempt,
        maxAttempts: deadLetterRecord.maxAttempts,
        error: deadLetterRecord.lastError || "Invalid queue payload",
        deadLetteredAt: deadLetterRecord.deadLetteredAt
      });
      continue;
    }

    if (job.nextAttemptAt && new Date(job.nextAttemptAt).getTime() > now) {
      await pushQueueJob(job);
      deferred += 1;
      results.push({
        jobId: job.id,
        workflowId: job.workflowId,
        source: job.source,
        triggerType: job.triggerType,
        status: "deferred",
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        nextAttemptAt: job.nextAttemptAt
      });
      continue;
    }

    if (job.workflowId === "unknown") {
      const deadLetterRecord = await deadLetterJob(
        job,
        job.lastError || "Invalid queued workflow identifier"
      );

      deadLettered += 1;
      results.push({
        jobId: deadLetterRecord.id,
        workflowId: deadLetterRecord.workflowId,
        source: deadLetterRecord.source,
        triggerType: deadLetterRecord.triggerType,
        status: "dead_lettered",
        attempt: deadLetterRecord.attempt,
        maxAttempts: deadLetterRecord.maxAttempts,
        error: deadLetterRecord.lastError || "Invalid queued workflow identifier",
        deadLetteredAt: deadLetterRecord.deadLetteredAt
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
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        executionId: execution.id
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "워크플로우 실행에 실패했습니다.";
      const attemptedAt = new Date().toISOString();

      if (job.attempt < job.maxAttempts) {
        const retryJob: WorkflowQueueJob = {
          ...job,
          attempt: job.attempt + 1,
          nextAttemptAt: new Date(now + getRetryDelayMs(job.attempt)).toISOString(),
          lastAttemptedAt: attemptedAt,
          lastError: errorMessage
        };

        await pushQueueJob(retryJob);
        retried += 1;
        results.push({
          jobId: retryJob.id,
          workflowId: retryJob.workflowId,
          source: retryJob.source,
          triggerType: retryJob.triggerType,
          status: "retrying",
          attempt: retryJob.attempt,
          maxAttempts: retryJob.maxAttempts,
          error: errorMessage,
          nextAttemptAt: retryJob.nextAttemptAt
        });
        continue;
      }

      const deadLetterRecord = await deadLetterJob(
        {
          ...job,
          lastAttemptedAt: attemptedAt,
          lastError: errorMessage
        },
        errorMessage
      );

      deadLettered += 1;
      results.push({
        jobId: deadLetterRecord.id,
        workflowId: deadLetterRecord.workflowId,
        source: deadLetterRecord.source,
        triggerType: deadLetterRecord.triggerType,
        status: "dead_lettered",
        attempt: deadLetterRecord.attempt,
        maxAttempts: deadLetterRecord.maxAttempts,
        error: errorMessage,
        deadLetteredAt: deadLetterRecord.deadLetteredAt
      });
    }
  }

  return {
    enabled: true,
    processed: jobs.length,
    retried,
    deferred,
    deadLettered,
    remaining: await client.llen(WORKFLOW_QUEUE_KEY),
    deadLetters: await client.llen(WORKFLOW_DEAD_LETTER_KEY),
    results
  };
}
