import type { SupabaseClient } from "@supabase/supabase-js";

import type { Workflow } from "@/types";

const CRON_FIELD_RANGES = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 7 }
] as const;

function normalizeDayOfWeek(value: number) {
  return value === 7 ? 0 : value;
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short"
  });

  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    minute: Number.parseInt(partMap.minute || "0", 10),
    hour: Number.parseInt(partMap.hour || "0", 10),
    dayOfMonth: Number.parseInt(partMap.day || "1", 10),
    month: Number.parseInt(partMap.month || "1", 10),
    dayOfWeek: weekdayMap[partMap.weekday || "Sun"] ?? 0
  };
}

function matchCronSegment(
  segment: string,
  value: number,
  range: { min: number; max: number },
  isDayOfWeek = false
) {
  if (segment === "*") {
    return true;
  }

  return segment.split(",").some((part) => {
    const [base, stepValue] = part.split("/");
    const step = stepValue ? Number.parseInt(stepValue, 10) : 1;

    if (Number.isNaN(step) || step < 1) {
      throw new Error(`Invalid cron step: ${part}`);
    }

    const normalizedValue = isDayOfWeek ? normalizeDayOfWeek(value) : value;

    if (base === "*") {
      return (normalizedValue - range.min) % step === 0;
    }

    if (base.includes("-")) {
      const [rawStart, rawEnd] = base.split("-");
      const start = Number.parseInt(rawStart, 10);
      const end = Number.parseInt(rawEnd, 10);
      const normalizedStart = isDayOfWeek ? normalizeDayOfWeek(start) : start;
      const normalizedEnd = isDayOfWeek ? normalizeDayOfWeek(end) : end;

      if (
        Number.isNaN(normalizedStart) ||
        Number.isNaN(normalizedEnd) ||
        normalizedStart < range.min ||
        normalizedEnd > range.max ||
        normalizedStart > normalizedEnd
      ) {
        throw new Error(`Invalid cron range: ${part}`);
      }

      return (
        normalizedValue >= normalizedStart &&
        normalizedValue <= normalizedEnd &&
        (normalizedValue - normalizedStart) % step === 0
      );
    }

    const parsed = Number.parseInt(base, 10);
    const normalizedParsed = isDayOfWeek ? normalizeDayOfWeek(parsed) : parsed;

    if (
      Number.isNaN(normalizedParsed) ||
      normalizedParsed < range.min ||
      normalizedParsed > range.max
    ) {
      throw new Error(`Invalid cron value: ${part}`);
    }

    return normalizedParsed === normalizedValue;
  });
}

export function parseCronToVercelSchedule(cronExpression: string): string {
  const normalized = cronExpression.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ");

  if (parts.length !== 5) {
    throw new Error("Cron 식은 반드시 5개 필드여야 합니다.");
  }

  parts.forEach((part, index) => {
    matchCronSegment(
      part,
      CRON_FIELD_RANGES[index].min,
      CRON_FIELD_RANGES[index],
      index === 4
    );
  });

  return normalized;
}

export function matchesCronExpression(
  cronExpression: string,
  date = new Date(),
  timeZone = "Asia/Seoul"
) {
  const normalized = parseCronToVercelSchedule(cronExpression);
  const [minuteField, hourField, dayField, monthField, weekField] =
    normalized.split(" ");
  const parts = getDatePartsInTimeZone(date, timeZone);

  return (
    matchCronSegment(minuteField, parts.minute, CRON_FIELD_RANGES[0]) &&
    matchCronSegment(hourField, parts.hour, CRON_FIELD_RANGES[1]) &&
    matchCronSegment(dayField, parts.dayOfMonth, CRON_FIELD_RANGES[2]) &&
    matchCronSegment(monthField, parts.month, CRON_FIELD_RANGES[3]) &&
    matchCronSegment(weekField, parts.dayOfWeek, CRON_FIELD_RANGES[4], true)
  );
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
