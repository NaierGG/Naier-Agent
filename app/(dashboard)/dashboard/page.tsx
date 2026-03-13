import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PlayCircle
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatDateTime,
  formatDurationMs,
  formatRelativeTime,
  getDurationMs
} from "@/lib/utils/format";
import type { WorkflowExecution } from "@/types";

type RecentExecutionRecord = Pick<
  WorkflowExecution,
  "id" | "workflow_id" | "status" | "trigger_type" | "started_at" | "finished_at"
>;

function getKstDayStart(referenceDate = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(referenceDate);

  return new Date(`${formatted}T00:00:00+09:00`);
}

function getStatusBadgeClasses(status: WorkflowExecution["status"]) {
  switch (status) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
}

function getStatusLabel(status: WorkflowExecution["status"]) {
  switch (status) {
    case "success":
      return "성공";
    case "failed":
      return "실패";
    default:
      return "실행중";
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

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayStart = getKstDayStart();
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    activeWorkflowResult,
    todayExecutionsResult,
    totalExecutionsResult,
    successfulExecutionsResult,
    recentExecutionsResult
  ] = await Promise.all([
    supabase
      .from("workflows")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("workflow_executions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .gte("started_at", todayStart.toISOString())
      .lt("started_at", tomorrowStart.toISOString()),
    supabase
      .from("workflow_executions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .gte("started_at", sevenDaysStart.toISOString()),
    supabase
      .from("workflow_executions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "success")
      .gte("started_at", sevenDaysStart.toISOString()),
    supabase
      .from("workflow_executions")
      .select("id, workflow_id, status, trigger_type, started_at, finished_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(8)
  ]);

  const recentExecutions = (recentExecutionsResult.data || []) as RecentExecutionRecord[];
  const workflowIds = Array.from(
    new Set(recentExecutions.map((execution) => execution.workflow_id))
  );
  const workflowNames = new Map<string, string>();

  if (workflowIds.length > 0) {
    const { data: workflowRecords } = await supabase
      .from("workflows")
      .select("id, name")
      .eq("user_id", user.id)
      .in("id", workflowIds);

    for (const workflow of workflowRecords || []) {
      workflowNames.set(String(workflow.id), String(workflow.name));
    }
  }

  const totalExecutions = totalExecutionsResult.count || 0;
  const successExecutions = successfulExecutionsResult.count || 0;
  const successRate =
    totalExecutions > 0 ? Math.round((successExecutions / totalExecutions) * 100) : 0;
  const latestExecution = recentExecutions[0] || null;

  const statCards = [
    {
      label: "활성 워크플로우",
      value: String(activeWorkflowResult.count || 0),
      hint: "현재 자동 실행 상태"
    },
    {
      label: "오늘 실행",
      value: String(todayExecutionsResult.count || 0),
      hint: "오늘 KST 기준 실행 횟수"
    },
    {
      label: "성공률",
      value: `${successRate}%`,
      hint: "최근 7일 기준"
    },
    {
      label: "마지막 실행",
      value: latestExecution ? formatRelativeTime(latestExecution.started_at) : "아직 없음",
      hint: latestExecution ? formatDateTime(latestExecution.started_at) : "실행 기록 없음"
    }
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#00d4aa]">
            Dashboard
          </p>
          <h1 className="mt-3 font-mono text-3xl font-semibold text-zinc-100">
            대시보드
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            최근 실행 현황과 자동화 상태를 한눈에 확인하세요.
          </p>
        </div>

        <Link
          href="/workflows/new"
          className={buttonVariants({
            className: "w-full lg:w-auto"
          })}
        >
          <PlayCircle className="h-4 w-4" />+ 새 워크플로우
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-white/10 bg-[#111111]">
            <CardHeader className="pb-3">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00d4aa]">
                {card.label}
              </p>
              <CardTitle className="text-3xl text-zinc-100">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <Card className="border-white/10 bg-[#111111]">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <CardTitle className="text-xl text-zinc-100">최근 실행</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">
                가장 최근에 실행된 워크플로우 기록입니다.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {recentExecutions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    <tr>
                      <th className="pb-3 font-medium">워크플로우명</th>
                      <th className="pb-3 font-medium">상태</th>
                      <th className="pb-3 font-medium">트리거</th>
                      <th className="pb-3 font-medium">실행시간</th>
                      <th className="pb-3 font-medium">소요시간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentExecutions.map((execution) => {
                      const duration = getDurationMs(
                        execution.started_at,
                        execution.finished_at || null
                      );

                      return (
                        <tr
                          key={execution.id}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="py-4 pr-4">
                            <Link
                              href={`/workflows/${execution.workflow_id}/logs`}
                              className="font-medium text-zinc-100 transition hover:text-[#00d4aa]"
                            >
                              {workflowNames.get(execution.workflow_id) || "이름 없는 워크플로우"}
                            </Link>
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                                getStatusBadgeClasses(execution.status)
                              )}
                            >
                              {execution.status === "running" ? (
                                <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-current" />
                              ) : null}
                              {getStatusLabel(execution.status)}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-zinc-300">
                            {getTriggerLabel(execution.trigger_type)}
                          </td>
                          <td className="py-4 pr-4 text-zinc-400">
                            {formatDateTime(execution.started_at)}
                          </td>
                          <td className="py-4 text-zinc-400">
                            {duration !== null ? formatDurationMs(duration) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
                <Activity className="mx-auto h-10 w-10 text-[#00d4aa]" />
                <h2 className="mt-4 font-mono text-xl text-zinc-100">
                  아직 실행 기록이 없습니다
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  워크플로우를 실행하면 이곳에 상태와 소요시간이 표시됩니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111]">
          <CardHeader className="border-b border-white/10 pb-5">
            <CardTitle className="flex items-center gap-2 text-xl text-zinc-100">
              <Clock3 className="h-5 w-5 text-[#00d4aa]" />
              빠른 실행
            </CardTitle>
            <p className="mt-2 text-sm text-zinc-400">
              새 자동화를 만들거나 기존 워크플로우 상태를 확인해보세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Link
              href="/workflows/new"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-[#00d4aa]/30 hover:bg-[#00d4aa]/5"
            >
              <div>
                <p className="font-medium text-zinc-100">AI로 새 워크플로우 만들기</p>
                <p className="mt-1 text-sm text-zinc-500">
                  자연어로 원하는 자동화를 설명해보세요.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#00d4aa]" />
            </Link>

            <Link
              href="/workflows"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-[#00d4aa]/30 hover:bg-[#00d4aa]/5"
            >
              <div>
                <p className="font-medium text-zinc-100">워크플로우 관리</p>
                <p className="mt-1 text-sm text-zinc-500">
                  활성화 상태를 바꾸고 수동 실행을 테스트할 수 있습니다.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#00d4aa]" />
            </Link>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">최근 7일 성공률</span>
              </div>
              <p className="mt-3 font-mono text-3xl text-zinc-100">{successRate}%</p>
              <p className="mt-2 text-sm text-zinc-500">
                성공 {successExecutions}회 / 총 {totalExecutions}회
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
