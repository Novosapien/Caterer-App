import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { matchCandidatesForGig, whatsappRecipients } from "@/lib/matching";
import { notifyAgentService } from "@/lib/agentClient";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Safety-net sweep for proactive gig alerts. The real-time path (createJob) fires on post,
// but this catches anything that slipped through (a failed send, a gig created out-of-band).
// It looks at gigs posted in the recent window, re-runs matching, and alerts only chefs who
// haven't already been notified for that gig (dedup via the notifications table). Scheduled
// in vercel.json; Vercel adds an `Authorization: Bearer $CRON_SECRET` header on cron runs.
const LOOKBACK_MINUTES = 90;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const db = createServiceClient();
  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60_000).toISOString();

  const { data: recent } = await db
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .gte("created_at", since);
  const gigs = (recent ?? []) as unknown as Job[];

  let alerted = 0;
  let messaged = 0;

  for (const job of gigs) {
    const matches = await matchCandidatesForGig(job);
    if (matches.length === 0) continue;

    // Who has already been notified for this gig? Skip them.
    const { data: existing } = await db
      .from("notifications")
      .select("profile_id")
      .eq("payload->>job_id", job.id);
    const notified = new Set((existing ?? []).map((n) => (n as { profile_id: string }).profile_id));

    const fresh = matches.filter((c) => !notified.has(c.profile_id));
    if (fresh.length === 0) continue;

    const notif = fresh.map((c) => ({
      profile_id: c.profile_id,
      type: job.is_urgent ? "urgent_gig" : "gig_match",
      payload: {
        job_id: job.id,
        title: job.title,
        role_type: job.role_type,
        venue: job.venue,
        pay_aed: job.pay_aed,
        pay_unit: job.pay_unit,
        start_at: job.start_at,
        is_urgent: job.is_urgent,
      },
    }));
    await db.from("notifications").insert(notif);
    alerted += fresh.length;

    const recipients = whatsappRecipients(fresh);
    if (recipients.length > 0) {
      const agent = await notifyAgentService(job, recipients);
      if (agent.ok) messaged += agent.results.length || recipients.length;
    }
  }

  return NextResponse.json({ ok: true, gigs: gigs.length, alerted, messaged });
}
