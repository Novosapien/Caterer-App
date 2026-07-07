import type { Job } from "./types";

// Pure, client-safe date helpers for the candidate feed's Today / Tomorrow / This Week
// filters. Kept out of any "server-only" module so the feed can filter in-memory on the
// client (no server round-trip per chip click).

// Dubai-local date key (YYYY-MM-DD) so date filters honour the venue's timezone.
export function dubaiDateKey(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

// Filter gigs to the selected window: "" (all), "today", "tomorrow", or "week".
export function filterByWhen(gigs: Job[], when: string): Job[] {
  if (!when) return gigs;
  const now = Date.now();
  const DAY = 86_400_000;
  const todayKey = dubaiDateKey(now);
  const tomorrowKey = dubaiDateKey(now + DAY);
  const weekEndKey = dubaiDateKey(now + 6 * DAY);
  return gigs.filter((g) => {
    const k = dubaiDateKey(new Date(g.start_at).getTime());
    if (when === "today") return k === todayKey;
    if (when === "tomorrow") return k === tomorrowKey;
    if (when === "week") return k >= todayKey && k <= weekEndKey;
    return true;
  });
}
