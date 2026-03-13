const RELATIVE_TIME_DIVISIONS = [
  { amount: 60, unit: "second" as const },
  { amount: 60, unit: "minute" as const },
  { amount: 24, unit: "hour" as const },
  { amount: 7, unit: "day" as const },
  { amount: 4.34524, unit: "week" as const },
  { amount: 12, unit: "month" as const },
  { amount: Number.POSITIVE_INFINITY, unit: "year" as const }
];

function formatHourMinute(hour: number, minute: number, locale = "ko-KR") {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: minute === 0 ? undefined : "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(new Date(Date.UTC(2024, 0, 1, hour, minute)));
}

function getDayOfWeekLabel(dayOfWeek: string) {
  const normalized = dayOfWeek.trim();

  if (normalized === "*") {
    return "매일";
  }

  if (normalized === "1-5") {
    return "평일";
  }

  if (normalized === "0,6" || normalized === "6,0" || normalized === "0,6,7") {
    return "주말";
  }

  const dayMap: Record<string, string> = {
    "0": "일요일",
    "1": "월요일",
    "2": "화요일",
    "3": "수요일",
    "4": "목요일",
    "5": "금요일",
    "6": "토요일",
    "7": "일요일"
  };

  if (normalized.includes(",")) {
    const labels = normalized
      .split(",")
      .map((value) => dayMap[value.trim()])
      .filter(Boolean);

    if (labels.length > 0) {
      return `매주 ${labels.join(", ")}`;
    }
  }

  if (dayMap[normalized]) {
    return `매주 ${dayMap[normalized]}`;
  }

  return null;
}

export function maskSecret(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  if (value.length <= 4) {
    return value;
  }

  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function formatDateTime(
  value: string | Date,
  locale = "ko-KR",
  timeZone = "Asia/Seoul"
) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(date);
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale = "ko-KR"
) {
  if (!value) {
    return "아직 없음";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);

  if (Math.abs(diffInSeconds) < 45) {
    return "방금 전";
  }

  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto"
  });

  let duration = diffInSeconds;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }

    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), "year");
}

export function formatDurationMs(durationMs: number | null | undefined) {
  if (durationMs === null || durationMs === undefined) {
    return "-";
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60_000) {
    const seconds = durationMs / 1000;
    return `${seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1)}초`;
  }

  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);

  if (minutes < 60) {
    return `${minutes}분 ${seconds}초`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}시간 ${remainingMinutes}분`;
}

export function getDurationMs(
  startedAt: string | null | undefined,
  finishedAt: string | null | undefined
) {
  if (!startedAt || !finishedAt) {
    return null;
  }

  const duration = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

export function formatWorkflowSchedule(scheduleCron: string | null | undefined) {
  if (!scheduleCron) {
    return "🔘 수동 실행";
  }

  const cronParts = scheduleCron.trim().split(/\s+/);

  if (cronParts.length !== 5) {
    return `⏰ Cron ${scheduleCron}`;
  }

  const [minuteRaw, hourRaw, dayOfMonth, month, dayOfWeek] = cronParts;
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  const dayOfWeekLabel = getDayOfWeekLabel(dayOfWeek);

  if (
    !Number.isNaN(hour) &&
    !Number.isNaN(minute) &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeekLabel
  ) {
    return `⏰ ${dayOfWeekLabel} ${formatHourMinute(hour, minute)}`;
  }

  if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
    return `⏰ ${formatHourMinute(hour, minute)} · Cron ${scheduleCron}`;
  }

  return `⏰ Cron ${scheduleCron}`;
}
