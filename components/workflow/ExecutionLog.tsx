"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  LoaderCircle,
  PlayCircle
} from "lucide-react";

import { NODE_DEFINITIONS } from "@/lib/nodes/registry";
import {
  formatDateTime,
  formatDurationMs,
  formatRelativeTime,
  getDurationMs
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type {
  ExecutionLog as ExecutionStep,
  WorkflowExecution,
  WorkflowNode
} from "@/types";

type ExecutionSummary = Pick<
  WorkflowExecution,
  "id" | "status" | "trigger_type" | "started_at" | "finished_at" | "error_message"
>;

type ExecutionLogProps = {
  workflowId: string;
  workflowName: string;
  workflowNodes: WorkflowNode[];
  initialExecutions: ExecutionSummary[];
  initialExecution: WorkflowExecution | null;
};

function getStatusLabel(status: WorkflowExecution["status"] | ExecutionStep["status"]) {
  switch (status) {
    case "success":
      return "성공";
    case "failed":
      return "실패";
    case "skipped":
      return "건너뜀";
    default:
      return "실행중";
  }
}

function getStatusClass(status: WorkflowExecution["status"] | ExecutionStep["status"]) {
  switch (status) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    case "skipped":
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
}

function getTriggerLabel(triggerType: WorkflowExecution["trigger_type"]) {
  switch (triggerType) {
    case "schedule":
      return "스케줄";
    case "webhook":
      return "웹훅";
    default:
      return "수동";
  }
}

function toExecutionSummary(execution: WorkflowExecution): ExecutionSummary {
  return {
    id: execution.id,
    status: execution.status,
    trigger_type: execution.trigger_type,
    started_at: execution.started_at,
    finished_at: execution.finished_at,
    error_message: execution.error_message
  };
}

function formatJsonPreview(value: unknown, maxLines = 20) {
  if (value === null || value === undefined) {
    return "null";
  }

  try {
    const text = JSON.stringify(value, null, 2);
    const lines = text.split("\n");

    if (lines.length <= maxLines) {
      return text;
    }

    return `${lines.slice(0, maxLines).join("\n")}\n...`;
  } catch {
    return String(value);
  }
}

function getElapsedDuration(startedAt: string, currentAt: string) {
  const duration = new Date(currentAt).getTime() - new Date(startedAt).getTime();
  return duration >= 0 ? formatDurationMs(duration) : "-";
}

export function ExecutionLog({
  workflowId,
  workflowName,
  workflowNodes,
  initialExecutions,
  initialExecution
}: ExecutionLogProps) {
  const [executions, setExecutions] = useState(initialExecutions);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    initialExecution?.id || initialExecutions[0]?.id || null
  );
  const [executionDetails, setExecutionDetails] = useState<Record<string, WorkflowExecution>>(
    initialExecution ? { [initialExecution.id]: initialExecution } : {}
  );
  const [loadingExecutionId, setLoadingExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedExecution = selectedExecutionId
    ? executionDetails[selectedExecutionId] || null
    : null;
  const selectedSummary = selectedExecutionId
    ? executions.find((execution) => execution.id === selectedExecutionId) || null
    : null;
  const latestExecutionSummary = executions[0] || null;
  const shouldPoll =
    latestExecutionSummary?.status === "running" ||
    selectedExecution?.status === "running";
  const nodeMap = Object.fromEntries(workflowNodes.map((node) => [node.id, node]));

  const loadExecutionDetail = useCallback(async (executionId: string) => {
    if (executionDetails[executionId]) {
      return;
    }

    setLoadingExecutionId(executionId);
    setError(null);

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/executions/${executionId}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "실행 로그를 불러오지 못했습니다.");
      }

      const execution = result.execution as WorkflowExecution;
      setExecutionDetails((current) => ({
        ...current,
        [execution.id]: execution
      }));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "실행 로그를 불러오지 못했습니다."
      );
    } finally {
      setLoadingExecutionId(null);
    }
  }, [executionDetails, workflowId]);

  async function handleSelectExecution(executionId: string) {
    setSelectedExecutionId(executionId);
    void loadExecutionDetail(executionId);
  }

  useEffect(() => {
    if (!selectedExecutionId && executions[0]) {
      setSelectedExecutionId(executions[0].id);
      void loadExecutionDetail(executions[0].id);
    }
  }, [executions, loadExecutionDetail, selectedExecutionId]);

  useEffect(() => {
    if (!shouldPoll) {
      return undefined;
    }

    let cancelled = false;

    const pollLatestExecution = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/executions/latest`, {
          cache: "no-store"
        });
        const result = await response.json();

        if (!response.ok || cancelled) {
          return;
        }

        const latestExecution = result.execution as WorkflowExecution | null;

        if (!latestExecution) {
          return;
        }

        const latestSummary = toExecutionSummary(latestExecution);

        setExecutions((currentExecutions) => {
          const nextExecutions = [
            latestSummary,
            ...currentExecutions.filter((execution) => execution.id !== latestSummary.id)
          ];

          return nextExecutions.slice(0, 20);
        });
        setExecutionDetails((current) => ({
          ...current,
          [latestExecution.id]: latestExecution
        }));

        if (!selectedExecutionId || selectedExecutionId === latestExecution.id) {
          setSelectedExecutionId(latestExecution.id);
        }
      } catch {
        // Ignore polling failures to avoid interrupting the detail view.
      }
    };

    void pollLatestExecution();
    const intervalId = window.setInterval(() => {
      void pollLatestExecution();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [workflowId, selectedExecutionId, shouldPoll]);

  if (executions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-[#111111] px-6 py-14 text-center">
        <PlayCircle className="mx-auto h-10 w-10 text-[#00d4aa]" />
        <h2 className="mt-4 font-mono text-2xl text-zinc-100">
          아직 실행 로그가 없습니다
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {workflowName} 워크플로우가 실행되면 이곳에 단계별 로그가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-white/10 bg-[#111111]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="font-mono text-xl text-zinc-100">최근 실행 20개</h2>
          <p className="mt-2 text-sm text-zinc-400">
            실행을 선택하면 상세 로그를 볼 수 있습니다.
          </p>
        </div>

        <div className="max-h-[840px] overflow-y-auto p-3">
          <div className="space-y-3">
            {executions.map((execution) => {
              const duration = getDurationMs(
                execution.started_at,
                execution.finished_at || null
              );
              const isSelected = execution.id === selectedExecutionId;

              return (
                <button
                  key={execution.id}
                  type="button"
                  onClick={() => void handleSelectExecution(execution.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition",
                    isSelected
                      ? "border-[#00d4aa]/35 bg-[#00d4aa]/10"
                      : "border-white/5 bg-black/10 hover:border-white/10 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                        getStatusClass(execution.status)
                      )}
                    >
                      {execution.status === "running" ? (
                        <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-current" />
                      ) : null}
                      {getStatusLabel(execution.status)}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition",
                        isSelected ? "text-[#00d4aa]" : "text-zinc-600"
                      )}
                    />
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-zinc-200">{getTriggerLabel(execution.trigger_type)}</p>
                    <p className="text-zinc-500">{formatDateTime(execution.started_at)}</p>
                    <p className="text-zinc-500">
                      {duration !== null ? formatDurationMs(duration) : "진행 중"}
                    </p>
                  </div>

                  {execution.error_message ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-rose-300">
                      {execution.error_message}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="rounded-3xl border border-white/10 bg-[#111111]">
        {error ? (
          <div className="border-b border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {selectedExecution || selectedSummary ? (
          <>
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00d4aa]">
                    Execution Detail
                  </p>
                  <h2 className="mt-3 font-mono text-2xl text-zinc-100">
                    {workflowName}
                  </h2>
                </div>

                {loadingExecutionId === selectedExecutionId ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    로그 불러오는 중
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    상태
                  </p>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                        getStatusClass(
                          selectedExecution?.status || selectedSummary?.status || "running"
                        )
                      )}
                    >
                      {selectedExecution?.status === "running" ||
                      selectedSummary?.status === "running" ? (
                        <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-current" />
                      ) : null}
                      {getStatusLabel(
                        selectedExecution?.status || selectedSummary?.status || "running"
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    트리거
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {getTriggerLabel(
                      selectedExecution?.trigger_type || selectedSummary?.trigger_type
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    시작
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {formatDateTime(
                      selectedExecution?.started_at || selectedSummary?.started_at || ""
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    소요시간
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {(() => {
                      const duration = getDurationMs(
                        selectedExecution?.started_at || selectedSummary?.started_at || null,
                        selectedExecution?.finished_at || selectedSummary?.finished_at || null
                      );

                      return duration !== null
                        ? formatDurationMs(duration)
                        : "진행 중";
                    })()}
                  </p>
                </div>
              </div>

              {selectedExecution?.error_message || selectedSummary?.error_message ? (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {selectedExecution?.error_message || selectedSummary?.error_message}
                </div>
              ) : null}
            </div>

            <div className="px-6 py-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
                <Clock3 className="h-4 w-4 text-[#00d4aa]" />
                <span>
                  {selectedSummary?.started_at
                    ? `${formatRelativeTime(selectedSummary.started_at)} 시작`
                    : "실행 기록"}
                </span>
              </div>

              {selectedExecution ? (
                <div className="space-y-5">
                  {selectedExecution.logs.map((log) => {
                    const workflowNode = nodeMap[log.node_id];
                    const nodeDefinition = workflowNode
                      ? NODE_DEFINITIONS[workflowNode.type]
                      : null;

                    return (
                      <div key={`${log.node_id}-${log.timestamp}`} className="relative pl-12">
                        <div className="absolute left-[18px] top-10 bottom-[-1.25rem] w-px bg-gradient-to-b from-white/15 to-transparent last:hidden" />
                        <div
                          className={cn(
                            "absolute left-0 top-2 flex h-9 w-9 items-center justify-center rounded-full border text-base",
                            log.status === "failed"
                              ? "border-rose-500/30 bg-rose-500/10"
                              : log.status === "success"
                                ? "border-emerald-500/30 bg-emerald-500/10"
                                : "border-amber-500/30 bg-amber-500/10"
                          )}
                        >
                          {nodeDefinition?.icon || "□"}
                        </div>

                        <details
                          className={cn(
                            "rounded-2xl border bg-black/10",
                            log.status === "failed"
                              ? "border-rose-500/20"
                              : "border-white/10"
                          )}
                          open={log.status === "failed"}
                        >
                          <summary className="cursor-pointer list-none px-5 py-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-medium text-zinc-100">
                                    {log.node_label}
                                  </p>
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                                      getStatusClass(log.status)
                                    )}
                                  >
                                    {getStatusLabel(log.status)}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-zinc-500">
                                  {workflowNode?.type || "unknown"} ·{" "}
                                  {getElapsedDuration(
                                    selectedExecution.started_at,
                                    log.timestamp
                                  )} 경과
                                </p>
                              </div>

                              <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <span>{formatDurationMs(log.duration_ms)}</span>
                                <ChevronRight className="h-4 w-4 text-zinc-500" />
                              </div>
                            </div>

                            {log.error ? (
                              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                                <span>{log.error}</span>
                              </div>
                            ) : null}
                          </summary>

                          <div className="space-y-4 border-t border-white/10 px-5 py-5">
                            <div>
                              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Input Data
                              </p>
                              <pre className="overflow-x-auto rounded-2xl border border-white/5 bg-black/30 p-4 text-xs leading-6 text-zinc-300">
                                {formatJsonPreview(log.input)}
                              </pre>
                            </div>

                            <div>
                              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Output Data
                              </p>
                              <pre className="overflow-x-auto rounded-2xl border border-white/5 bg-black/30 p-4 text-xs leading-6 text-zinc-300">
                                {formatJsonPreview(log.output)}
                              </pre>
                            </div>

                            {log.error ? (
                              <div>
                                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-rose-300">
                                  Error
                                </p>
                                <pre className="overflow-x-auto rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs leading-6 text-rose-200">
                                  {log.error}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-zinc-400">
                  실행 로그를 선택하면 상세 단계가 표시됩니다.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="px-6 py-10 text-sm text-zinc-400">
            실행 로그를 선택하면 상세 정보를 볼 수 있습니다.
          </div>
        )}
      </section>
    </div>
  );
}
