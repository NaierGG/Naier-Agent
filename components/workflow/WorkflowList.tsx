"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  FileText,
  LoaderCircle,
  Pencil,
  Play,
  Trash2
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import {
  formatRelativeTime,
  formatWorkflowSchedule
} from "@/lib/utils/format";
import type { Workflow } from "@/types";

type WorkflowListProps = {
  workflows: Workflow[];
};

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

type PendingActionState =
  | {
      workflowId: string;
      action: "toggle" | "execute" | "delete";
    }
  | null;

function getErrorMessage(result: any, fallbackMessage: string) {
  if (result && typeof result.message === "string" && result.message.trim()) {
    return result.message;
  }

  if (result && typeof result.error === "string" && result.error.trim()) {
    return result.error;
  }

  return fallbackMessage;
}

export function WorkflowList({ workflows }: WorkflowListProps) {
  const router = useRouter();
  const [items, setItems] = useState(workflows);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [pendingAction, setPendingAction] = useState<PendingActionState>(null);

  useEffect(() => {
    setItems(workflows);
  }, [workflows]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function handleToggle(workflow: Workflow) {
    const previousItems = items;

    setPendingAction({
      workflowId: workflow.id,
      action: "toggle"
    });
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === workflow.id
          ? {
              ...item,
              is_active: !workflow.is_active
            }
          : item
      )
    );

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          is_active: !workflow.is_active
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "워크플로우 상태를 변경하지 못했습니다.")
        );
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === workflow.id ? (result.workflow as Workflow) : item
        )
      );
      setNotice({
        type: "success",
        message: !workflow.is_active
          ? "워크플로우를 활성화했습니다."
          : "워크플로우를 비활성화했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setItems(previousItems);
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 상태를 변경하지 못했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleExecute(workflow: Workflow) {
    setPendingAction({
      workflowId: workflow.id,
      action: "execute"
    });

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "워크플로우 수동 실행에 실패했습니다.")
        );
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
            : "워크플로우 수동 실행에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(workflow: Workflow) {
    const shouldDelete = window.confirm(
      `'${workflow.name}' 워크플로우를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!shouldDelete) {
      return;
    }

    const previousItems = items;
    setPendingAction({
      workflowId: workflow.id,
      action: "delete"
    });
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== workflow.id)
    );

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "워크플로우 삭제에 실패했습니다.")
        );
      }

      setNotice({
        type: "success",
        message: "워크플로우를 삭제했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setItems(previousItems);
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "워크플로우 삭제에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-white/10 bg-[#111111] p-10 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-mono text-2xl text-zinc-100">
            아직 워크플로우가 없습니다.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            AI와 대화해서 첫 자동화를 만들어보세요!
          </p>
          <Link
            href="/workflows/new"
            className={buttonVariants({
              className: "mt-6"
            })}
          >
            워크플로우 만들기
          </Link>
        </div>
      </Card>
    );
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

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((workflow) => {
          const isBusy = pendingAction?.workflowId === workflow.id;
          const nodeCount = Array.isArray(workflow.nodes) ? workflow.nodes.length : 0;

          return (
            <Card
              key={workflow.id}
              className="border-white/10 bg-[#111111] p-6 transition hover:border-[#00d4aa]/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-mono text-xl text-zinc-100">
                    {workflow.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {workflow.description || "설명이 아직 없습니다."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      workflow.is_active
                        ? "bg-emerald-500/12 text-emerald-300"
                        : "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {workflow.is_active ? "활성" : "비활성"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={workflow.is_active}
                    aria-label={`${workflow.name} 상태 전환`}
                    disabled={isBusy}
                    onClick={() => void handleToggle(workflow)}
                    className={cn(
                      "relative h-7 w-14 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa] disabled:cursor-not-allowed disabled:opacity-60",
                      workflow.is_active ? "bg-[#00d4aa]" : "bg-zinc-700"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                        workflow.is_active ? "left-8" : "left-1"
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Schedule
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {formatWorkflowSchedule(workflow.schedule_cron)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Last Run
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {workflow.last_executed_at
                      ? formatRelativeTime(workflow.last_executed_at)
                      : "아직 없음"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Nodes
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">{nodeCount}개 노드</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="sm"
                  disabled={isBusy}
                  onClick={() => void handleExecute(workflow)}
                >
                  {pendingAction?.workflowId === workflow.id &&
                  pendingAction.action === "execute" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  실행
                </Button>

                <Link
                  href={`/workflows/${workflow.id}/logs`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm"
                  })}
                >
                  <FileText className="h-4 w-4" />
                  로그
                </Link>

                <Link
                  href={`/workflows/${workflow.id}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm"
                  })}
                >
                  <Pencil className="h-4 w-4" />
                  편집
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => void handleDelete(workflow)}
                >
                  {pendingAction?.workflowId === workflow.id &&
                  pendingAction.action === "delete" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  삭제
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Clock3 className="h-3.5 w-3.5" />
                최근 업데이트 {formatRelativeTime(workflow.updated_at)}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
