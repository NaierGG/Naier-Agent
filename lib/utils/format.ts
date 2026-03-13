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
