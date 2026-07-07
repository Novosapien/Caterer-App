// Refreshes every open gig's start_at relative to the real current time so the
// candidate feed's date chips (Today / Tomorrow / This Week) always have options.
//
// Why this exists: seed.sql sets start_at with now()+interval offsets, but those are
// evaluated once at seed time and then frozen. As real time moves on, every gig drifts
// into the past and the date filters match nothing. Run this before a demo to re-spread
// the catalogue across the current week.
//
// Run: node --env-file=.env.local scripts/refresh-gig-dates.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// Dubai is a fixed UTC+4 (no DST), matching the feed's "Asia/Dubai" date-key filter.
const DUBAI_OFFSET_H = 4;

// The Dubai calendar day (Y, M, D) that is `daysAhead` days from now.
function dubaiDay(daysAhead) {
  const key = new Date(Date.now() + daysAhead * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Dubai",
  });
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

// A UTC instant for `daysAhead` Dubai days out, at the given Dubai local hour.
// Never returns a time in the past for the "today" bucket — nudges it forward instead.
function gigInstant(daysAhead, dubaiHour) {
  const { y, m, d } = dubaiDay(daysAhead);
  let ms = Date.UTC(y, m - 1, d, dubaiHour - DUBAI_OFFSET_H, 0, 0);
  if (ms < Date.now() + 90 * 60_000) ms = Date.now() + 2 * 3600_000; // keep it comfortably future
  return new Date(ms).toISOString();
}

// Distribution plan: plenty today, plenty tomorrow, the rest spread across the week.
// Urgent gigs are pulled to the front (today), matching the "tonight" demo narrative.
// Each entry is [daysAhead, dubaiHour]; the pool is cycled across all open gigs.
const TODAY = [
  [0, 17], [0, 18], [0, 19], [0, 20], [0, 21], [0, 22],
];
const TOMORROW = [
  [1, 11], [1, 13], [1, 15], [1, 18], [1, 20], [1, 22],
];
const LATER = [
  [2, 12], [2, 18], [3, 13], [3, 19], [4, 12], [4, 20], [5, 17], [6, 14],
];

async function main() {
  const { data: jobs, error } = await db
    .from("jobs")
    .select("id, is_urgent, start_at")
    .eq("status", "open")
    .order("is_urgent", { ascending: false }) // urgent first -> land on today
    .order("id", { ascending: true });
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  if (!jobs?.length) {
    console.log("No open gigs to refresh.");
    return;
  }

  // Build a schedule: roughly 35% today, 30% tomorrow, rest later this week.
  const n = jobs.length;
  const nToday = Math.max(4, Math.round(n * 0.35));
  const nTomorrow = Math.max(4, Math.round(n * 0.3));

  let today = 0;
  let tomorrow = 0;
  const counts = { today: 0, tomorrow: 0, later: 0 };

  for (let i = 0; i < n; i++) {
    let slot;
    if (i < nToday) {
      slot = TODAY[today++ % TODAY.length];
      counts.today++;
    } else if (i < nToday + nTomorrow) {
      slot = TOMORROW[tomorrow++ % TOMORROW.length];
      counts.tomorrow++;
    } else {
      slot = LATER[(i - nToday - nTomorrow) % LATER.length];
      counts.later++;
    }
    const start_at = gigInstant(slot[0], slot[1]);
    const { error: upErr } = await db.from("jobs").update({ start_at }).eq("id", jobs[i].id);
    if (upErr) {
      console.error(`Update failed for ${jobs[i].id}:`, upErr.message);
      process.exit(1);
    }
  }

  console.log(
    `Refreshed ${n} gigs — today: ${counts.today}, tomorrow: ${counts.tomorrow}, this week: ${counts.later}`,
  );
}

main();
