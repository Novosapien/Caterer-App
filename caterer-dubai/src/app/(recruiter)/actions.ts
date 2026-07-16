"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { matchCandidatesForGig, whatsappRecipients } from "@/lib/matching";
import { notifyAgentService } from "@/lib/agentClient";
import { getSession } from "@/lib/session";
import { ensurePosterBusiness } from "@/lib/posting";
import type { Job } from "@/lib/types";

// --- Credit gating helper ---------------------------------------------------
// Remaining credits = sum(job_credits from the business's purchases) − count(jobs).
export async function getRemainingCredits(businessId: string): Promise<number> {
  const db = createServiceClient();
  const { data: purchases } = await db
    .from("purchases")
    .select("package:packages(job_credits)")
    .eq("business_id", businessId);
  const granted = (purchases ?? []).reduce((sum: number, p: { package?: unknown }) => {
    const rel = Array.isArray(p.package) ? p.package[0] : p.package;
    const credits = (rel as { job_credits?: number } | null)?.job_credits ?? 0;
    return sum + credits;
  }, 0);
  const { count } = await db
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  return granted - (count ?? 0);
}

// --- Buy a package (mock checkout, no payment processor) --------------------
export async function buyPackage(packageId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authorised" };
  const businessId = await ensurePosterBusiness(session.profileId);
  if (!businessId) return { ok: false, error: "No business found for your account." };
  const db = createServiceClient();
  const { error } = await db
    .from("purchases")
    .insert({ business_id: businessId, package_id: packageId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/packages");
  revalidatePath("/recruiter");
  revalidatePath("/post");
  return { ok: true };
}

// --- Result surfaced to the post form after publish ------------------------
export interface CreateJobResult {
  ok: boolean;
  error?: string;
  jobId?: string;
  isUrgent?: boolean;
  matchCount?: number;
  notifiedCount?: number;
  whatsappPending?: boolean; // agent service offline / blocked send
}

// --- Create (post) a gig ----------------------------------------------------
export async function createJob(form: FormData): Promise<CreateJobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authorised" };
  // Provision a poster identity on first post (chef or business alike), so there is never
  // a re-login or a separate "create a business" step in the way.
  const businessId = await ensurePosterBusiness(session.profileId);
  if (!businessId) return { ok: false, error: "Could not set up posting for your account." };

  // Credit gating (R5 / EC5): block if 0 remaining.
  const remaining = await getRemainingCredits(businessId);
  if (remaining <= 0) {
    return { ok: false, error: "no-credits" };
  }

  const title = String(form.get("title") ?? "").trim();
  const roleType = String(form.get("role_type") ?? "").trim();
  const venue = String(form.get("venue") ?? "").trim();
  const locationArea = String(form.get("location_area") ?? "").trim();
  const payAedRaw = String(form.get("pay_aed") ?? "").trim();
  const payUnit = String(form.get("pay_unit") ?? "shift").trim();
  const startAtRaw = String(form.get("start_at") ?? "").trim();
  const dressCode = String(form.get("dress_code") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const imageUrl = String(form.get("image_url") ?? "").trim();
  const isUrgent = form.get("is_urgent") === "on" || form.get("is_urgent") === "true";
  const isTemp = form.get("is_temp") === "on" || form.get("is_temp") === "true";

  if (!title || !roleType || !venue || !locationArea || !payAedRaw || !startAtRaw) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const payAed = Number(payAedRaw);
  if (!Number.isFinite(payAed) || payAed <= 0) {
    return { ok: false, error: "Enter a valid pay amount." };
  }

  const db = createServiceClient();
  // Only include image_url when an image was actually attached — keeps the gig image
  // optional and avoids referencing the column at all if it isn't set.
  const payload: Record<string, unknown> = {
    business_id: businessId,
    title,
    role_type: roleType,
    description: description || null,
    venue,
    location_area: locationArea,
    pay_aed: payAed,
    pay_unit: payUnit,
    start_at: new Date(startAtRaw).toISOString(),
    dress_code: dressCode || null,
    is_urgent: isUrgent,
    is_temp: isTemp,
    status: "open",
  };
  if (imageUrl) payload.image_url = imageUrl;

  const { data: inserted, error } = await db.from("jobs").insert(payload).select("*").single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Could not post the gig." };
  }

  const job = inserted as unknown as Job;
  const result: CreateJobResult = { ok: true, jobId: job.id, isUrgent };

  // Proactive matching runs for every gig; matchCandidatesForGig self-limits to gigs that
  // warrant an alert (urgent, or an evening/dinner shift). Matched chefs get an in-app
  // alert; those who explicitly opted in to WhatsApp (and have a number) also get messaged.
  {
    const matches = await matchCandidatesForGig(job);
    result.matchCount = matches.length;

    if (matches.length > 0) {
      const notif = matches.map((c) => ({
        profile_id: c.profile_id,
        type: isUrgent ? "urgent_gig" : "gig_match",
        payload: {
          job_id: job.id,
          title: job.title,
          role_type: job.role_type,
          venue: job.venue,
          pay_aed: job.pay_aed,
          pay_unit: job.pay_unit,
          start_at: job.start_at,
          is_urgent: isUrgent,
        },
      }));
      await db.from("notifications").insert(notif);

      // Only WhatsApp the chefs who gave explicit consent (whatsapp_opt_in) and have a phone.
      const recipients = whatsappRecipients(matches);
      if (recipients.length > 0) {
        const agent = await notifyAgentService(job, recipients);
        if (agent.ok) {
          result.notifiedCount = agent.results.length || recipients.length;
        } else {
          // Agent service offline/blocked — still report the matches; WhatsApp pending.
          result.notifiedCount = 0;
          result.whatsappPending = true;
        }
      } else {
        result.notifiedCount = 0;
      }
    } else {
      result.notifiedCount = 0;
    }
  }

  revalidatePath("/recruiter");
  revalidatePath("/post");
  return result;
}

// --- Business/gig image upload ---------------------------------------------
// Server-side upload via the service-role client to the public `business-images`
// bucket; returns the public URL for the post form to attach to the gig.
export async function uploadBusinessImage(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authorised" };
  const businessId = await ensurePosterBusiness(session.profileId);
  if (!businessId) return { ok: false, error: "No business found for your account." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose an image." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Image too large (max 8 MB)." };
  }

  const db = createServiceClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${businessId}/${randomUUID()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await db.storage
    .from("business-images")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

  const { data: pub } = db.storage.from("business-images").getPublicUrl(path);
  return { ok: true, url: pub.publicUrl };
}

// --- Tier-3 progressive-profiling trigger (R3/R7) --------------------------
// When a recruiter opens a candidate's profile, write a notification prompting
// the candidate to add their CV. Idempotent-ish: one prompt per (candidate, job/view).
export async function notifyRecruiterViewedProfile(candidateProfileId: string): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "recruiter") return;
  const db = createServiceClient();
  await db.from("notifications").insert({
    profile_id: candidateProfileId,
    type: "profile_viewed",
    payload: {
      message: "A recruiter viewed your profile — add your CV to stand out.",
      viewed_by: session.profileId,
    },
  });
}
