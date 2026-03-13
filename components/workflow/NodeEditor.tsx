"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LoaderCircle, Play, Power, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { NodeCard } from "@/components/workflow/NodeCard";
import { cn } from "@/lib/utils/cn";
import {
  formatDateTime,
  formatRelativeTime,
  formatWorkflowSchedule
} from "@/lib/utils/format";
import type { Workflow, WorkflowNode } from "@/types";

type NodeTestResult = {
  input: unknown;
  output?: unknown;
  error?: string;
  testedAt: string;
};

type WorkflowEditorProps = {
  workflow: Workflow;
};

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

type PendingAction = "execute" | "toggle" | "delete" | null;

function getErrorMessage(result: any, fallbackMessage: string) {
  if (result && typeof result.message === "string" && result.message.trim()) {
    return result.message;
  }

  if (result && typeof result.error === "string" && result.error.trim()) {
    return result.error;
  }

  return fallbackMessage;
}

function sortNodes(nodes: WorkflowNode[]) {
  return [...nodes].sort((left, right) => {
    if (left.position.x !== right.position.x) {
      return left.position.x - right.position.x;
    }

    return left.position.y - right.position.y;
  });
}

export function NodeEditor({ workflow }: WorkflowEditorProps) {
  const router = useRouter();
  const [currentWorkflow, setCurrentWorkflow] = useState(workflow);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [testingNodeId, setTestingNodeId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [testResults, setTestResults] = useState<Record<string, NodeTestResult>>({});

  const orderedNodes = useMemo(
    () => sortNodes(currentWorkflow.nodes || []),
    [currentWorkflow.nodes]
  );

  useEffect(() => {
    setCurrentWorkflow(workflow);
  }, [workflow]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function handleExecute() {
    setPendingAction("execute");

    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}/execute`, {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "워크플로우 실행에 실패했습니다."));
      }

      setNotice({
        type: result.status === "success" ? "success" : "error",
        message:
          result.status === "success"
            ? "워크플로우 실행이 완료되었습니다."
            : "워크플로우 실행 중 오류가 발생했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 실행에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToggle() {
    setPendingAction("toggle");

    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          is_active: !currentWorkflow.is_active
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "상태 변경에 실패했습니다."));
      }

      setCurrentWorkflow(result.workflow as Workflow);
      setNotice({
        type: "success",
        message: !currentWorkflow.is_active
          ? "워크플로우를 활성화했습니다."
          : "워크플로우를 비활성화했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    const shouldDelete = window.confirm(
      `'${currentWorkflow.name}' 워크플로우를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!shouldDelete) {
      return;
    }

    setPendingAction("delete");

    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "워크플로우 삭제에 실패했습니다."));
      }

      router.push("/workflows");
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "워크플로우 삭제에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleTestNode(node: WorkflowNode, input?: unknown) {
    setTestingNodeId(node.id);

    try {
      const response = await fetch("/api/nodes/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          node,
          input,
          triggerType: "manual"
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "단일 노드 실행에 실패했습니다."));
      }

      setTestResults((current) => ({
        ...current,
        [node.id]: {
          input: result.input,
          output: result.output,
          testedAt: new Date().toISOString()
        }
      }));
      setNotice({
        type: "success",
        message: `${node.label} 노드 실행이 완료되었습니다.`
      });
    } catch (error) {
      setTestResults((current) => ({
        ...current,
        [node.id]: {
          input,
          error:
            error instanceof Error ? error.message : "단일 노드 실행에 실패했습니다.",
          testedAt: new Date().toISOString()
        }
      }));
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "단일 노드 실행에 실패했습니다."
      });
    } finally {
      setTestingNodeId(null);
    }
  }

  return (
    <>
      {notice ? (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={cn(
              "min-w-[260px] rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-black/30",
              notice.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/12 text-rose-200"
            )}
          >
            {notice.message}
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-2xl text-zinc-100">
                  {currentWorkflow.name}
                </h2>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    currentWorkflow.is_active
                      ? "bg-emerald-500/12 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {currentWorkflow.is_active ? "활성" : "비활성"}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                {currentWorkflow.description || "설명이 아직 없습니다."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void handleExecute()} disabled={pendingAction !== null}>
                {pendingAction === "execute" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                워크플로우 실행
              </Button>

              <Button
                variant="outline"
                onClick={() => void handleToggle()}
                disabled={pendingAction !== null}
              >
                {pendingAction === "toggle" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                {currentWorkflow.is_active ? "비활성화" : "활성화"}
              </Button>

              <Link
                href={`/workflows/${currentWorkflow.id}/logs`}
                className={buttonVariants({ variant: "outline" })}
              >
                <FileText className="h-4 w-4" />
                실행 로그
              </Link>

              <Button
                variant="outline"
                onClick={() => void handleDelete()}
                disabled={pendingAction !== null}
              >
                {pendingAction === "delete" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                삭제
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Schedule
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {formatWorkflowSchedule(currentWorkflow.schedule_cron)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Last Run
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {currentWorkflow.last_executed_at
                  ? formatRelativeTime(currentWorkflow.last_executed_at)
                  : "아직 없음"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Updated
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {formatDateTime(currentWorkflow.updated_at)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Graph
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {currentWorkflow.nodes.length}개 노드 / {currentWorkflow.edges.length}개 연결
              </p>
            </div>
          </div>
        </div>

        {orderedNodes.length > 0 ? (
          <div className="space-y-5">
            {orderedNodes.map((node, index) => (
              <NodeCard
                key={node.id}
                node={node}
                isLast={index === orderedNodes.length - 1}
                isTesting={testingNodeId === node.id}
                testResult={testResults[node.id]}
                onTest={handleTestNode}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#111111] px-6 py-12 text-center text-sm text-zinc-400">
            아직 노드가 없습니다. AI 빌더에서 워크플로우를 다시 생성해보세요.
          </div>
        )}
      </div>
    </>
  );
}
