import "server-only";
import type { Job, CandidateProfile } from "./types";

// Client for the separate WhatsApp agent service (FastAPI+LangGraph — see agent-spec/).
// Posts the matched candidate set to /notify; the agent service owns all Twilio I/O.

export interface NotifyResult {
  candidate_id: string;
  thread_key: string;
  status: "sent" | "pending";
}

export async function notifyAgentService(
  job: Job,
  candidates: CandidateProfile[],
): Promise<{ results: NotifyResult[]; ok: boolean; error?: string }> {
  const base = process.env.AGENT_SERVICE_URL;
  const secret = process.env.NOTIFY_SHARED_SECRET;
  if (!base || !secret) {
    return { results: [], ok: false, error: "agent service not configured" };
  }

  const payload = {
    gig: {
      gig_id: job.id,
      title: job.title,
      role_type: job.role_type,
      venue: job.venue,
      location_area: job.location_area,
      pay_aed: job.pay_aed,
      pay_unit: job.pay_unit,
      start_at: job.start_at,
      dress_code: job.dress_code,
      description: job.description,
    },
    candidates: candidates.map((c) => ({
      candidate_id: c.profile_id,
      name: c.profile?.name ?? "Chef",
      phone: c.profile?.phone ?? "",
    })),
  };

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Notify-Secret": secret },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) return { results: [], ok: false, error: `agent service ${res.status}` };
    const data = (await res.json()) as { results: NotifyResult[] };
    return { results: data.results ?? [], ok: true };
  } catch (e) {
    return { results: [], ok: false, error: (e as Error).message };
  }
}
