/** Returns an ISO 8601 string with IST offset (+05:30), e.g. "2026-05-22T10:15:30.000+05:30" */
export function getISTNowISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}.000+05:30`;
}

/** Returns a formatted IST date string, e.g. "22 May 2026, 10:15 AM IST" */
export function getISTFormatted(): string {
  return (
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST"
  );
}

/** Returns IST date-only string "YYYY-MM-DD" for date inputs */
export function getISTDateOnly(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
