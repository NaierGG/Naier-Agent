import { CronExpressionParser } from "cron-parser";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Workflow } from "@/types";

function normalizeCronExpression(cronExpression: string) {
  return cronExpression.trim().replace(/\s+/g, " ");
}

export function parseCronToVercelSchedule(cronExpression: string): string {
  const normalized = normalizeCronExpression(cronExpression);

  if (normalized.split(" ").length !== 5) {
    throw new Error("Cron 식은 5개 필드로 입력해주세요.");
  }

  try {
    CronExpressionParser.parse(normalized);
  } catch {
    throw new Error("Cron 식이 올바르지 않습니다.");
  }

  return normalized;
}

export function matchesCronExpression(
  cronExpression: string,
  date = new Date(),
  timeZone = "Asia/Seoul"
) {
  const normalized = parseCronToVercelSchedule(cronExpression);
  const currentMinute = new Date(date);
  currentMinute.setSeconds(0, 0);
  const previousSecond = new Date(currentMinute.getTime() - 1000);

  try {
    const interval = CronExpressionParser.parse(normalized, {
      currentDate: previousSecond,
      tz: timeZone
    });
    const nextRun = interval.next().toDate();

    return nextRun.getTime() === currentMinute.getTime();
  } catch {
    return false;
  }
}

export async function getActiveScheduledWorkflows(
  supabase: SupabaseClient
): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("is_active", true)
    .not("schedule_cron", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Workflow[];
}
