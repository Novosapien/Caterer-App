"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { setSession, getSession } from "@/lib/session";
import { isVerifyConfigured, startVerification, checkVerification } from "@/lib/twilioVerify";
import { getCandidate, getGig } from "@/lib/queries";
import { reviewCvForJob } from "@/lib/cvReview";
import { extractCvFields } from "@/lib/cvExtract";
import type { PayUnit, WorkPref, CvRating } from "@/lib/types";

// Candidate server actions (progressive apply + profile edits).
// A "use server" module may export ONLY async functions — no constants here.

interface ApplyResult {
  ok: boolean;
  error?: string;
}

// Core: find-or-create the candidate account by phone, set the demo session
// (silently "logs in"), and upsert the application. Runs only AFTER the code is verified.
async function createProfileAndApply(
  jobId: string,
  rawName: string,
  rawPhone: string,
): Promise<ApplyResult> {
  const name = rawName.trim();
  const phone = rawPhone.trim();
  if (!jobId) return { ok: false, error: "Missing gig." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!phone) return { ok: false, error: "Please enter your mobile number." };

  const db = createServiceClient();

  const { data: existing } = await db
    .from("profiles")
    .select("id, role")
    .eq("phone", phone)
    .eq("role", "candidate")
    .maybeSingle();

  let profileId = existing?.id as string | undefined;

  if (!profileId) {
    const { data: created, error: pErr } = await db
      .from("profiles")
      .insert({ role: "candidate", name, phone })
      .select("id")
      .single();
    if (pErr || !created) return { ok: false, error: "Could not create your profile." };
    profileId = created.id as string;

    const { error: cErr } = await db.from("candidate_profiles").insert({
      profile_id: profileId,
      headline: null,
      open_to_urgent: true,
      available: true,
      location_area: "Dubai",
    });
    if (cErr) return { ok: false, error: "Could not set up your profile." };
  }

  await setSession({ profileId, role: "candidate" });

  const { error: aErr } = await db.from("applications").upsert(
    {
      job_id: jobId,
      candidate_profile_id: profileId,
      status: "applied",
      source: "app",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "job_id,candidate_profile_id" },
  );
  if (aErr) return { ok: false, error: "Could not record your application." };

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/profile");
  return { ok: true };
}

// Kept for compatibility (skips verification). The live apply flow uses
// startPhoneVerification + verifyPhoneAndApply.
export async function applyToGig(input: {
  jobId: string;
  name: string;
  phone: string;
}): Promise<ApplyResult> {
  return createProfileAndApply(input.jobId, input.name, input.phone);
}

// Step 1 of apply: send the SMS code via Twilio Verify. Falls back to demo mode when
// Twilio is not configured (demo=true → the client accepts any 6-digit code).
export async function startPhoneVerification(
  phone: string,
): Promise<{ ok: boolean; demo: boolean; error?: string }> {
  const p = phone.trim();
  if (p.replace(/\D/g, "").length < 8) {
    return { ok: false, demo: false, error: "Please enter a valid mobile number." };
  }
  if (!isVerifyConfigured()) return { ok: true, demo: true };
  const res = await startVerification(p);
  if (!res.ok) {
    return {
      ok: false,
      demo: false,
      error: "We couldn't send a code to that number. Check it and try again.",
    };
  }
  return { ok: true, demo: false };
}

// Step 2 of apply: verify the code, then create the account + application. In demo mode
// (Twilio unset) any 6-digit code passes.
export async function verifyPhoneAndApply(input: {
  jobId: string;
  name: string;
  phone: string;
  code: string;
}): Promise<ApplyResult> {
  const digits = input.code.replace(/\D/g, "");
  if (digits.length !== 6) return { ok: false, error: "Enter the 6-digit code." };

  if (isVerifyConfigured()) {
    const check = await checkVerification(input.phone.trim(), digits);
    if (!check.ok) {
      return { ok: false, error: "We couldn't verify that code. Please request a new one." };
    }
    if (!check.approved) {
      return { ok: false, error: "That code isn't right. Check the SMS and try again." };
    }
  }
  return createProfileAndApply(input.jobId, input.name, input.phone);
}

// AI "Rate my CV" (R-ai). Scores the signed-in chef's profile/CV against a specific gig
// spec (1-100) with strengths, gaps and concrete recommendations. Read-only: no writes.
export async function rateCvForJob(
  jobId: string,
): Promise<{ ok: boolean; rating?: CvRating; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Apply to any gig first to create your profile, then rate your CV." };
  }
  const [candidate, job] = await Promise.all([getCandidate(session.profileId), getGig(jobId)]);
  if (!candidate) return { ok: false, error: "We couldn't find your profile." };
  if (!job) return { ok: false, error: "We couldn't find that gig." };

  try {
    const rating = await reviewCvForJob(candidate, job);
    return { ok: true, rating };
  } catch (err) {
    console.error("rateCvForJob failed:", err);
    return { ok: false, error: "The CV rating service is unavailable right now. Please try again." };
  }
}

// One-tap auto-apply (R2 extension). For an already-signed-in chef with a saved profile
// — skips the phone/OTP step and applies using the existing profile (+ saved CV).
export async function autoApply(jobId: string): Promise<ApplyResult> {
  if (!jobId) return { ok: false, error: "Missing gig." };
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Sign in as a chef first." };
  }
  const db = createServiceClient();
  const { error } = await db.from("applications").upsert(
    {
      job_id: jobId,
      candidate_profile_id: session.profileId,
      status: "applied",
      source: "app",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "job_id,candidate_profile_id" },
  );
  if (error) return { ok: false, error: "Could not record your application." };
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

// Update candidate profile (R3, extended). Persists availability, prefs, and the
// LinkedIn-style fields (bio, desired work, years of experience).
export async function updateCandidateProfile(input: {
  name?: string;
  headline?: string;
  bio?: string;
  yearsExperience?: number | null;
  locationArea?: string;
  available: boolean;
  openToUrgent: boolean;
  interests: string[];
  languages: string[];
  workPref: WorkPref | null;
  desiredRoles: string[];
  desiredAreas: string[];
  desiredPayAed?: number | null;
  desiredPayUnit?: PayUnit | null;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Please apply to a gig first to create your profile." };
  }
  const db = createServiceClient();

  // The candidate's display name lives on the `profiles` row, not candidate_profiles.
  // Only write it when a non-empty name is supplied (never blank out an existing name).
  const trimmedName = input.name?.trim();
  if (trimmedName) {
    const { error: nameError } = await db
      .from("profiles")
      .update({ name: trimmedName })
      .eq("id", session.profileId);
    if (nameError) return { ok: false, error: "Could not save your name." };
  }

  const { error } = await db
    .from("candidate_profiles")
    .update({
      headline: input.headline?.trim() || null,
      bio: input.bio?.trim() || null,
      years_experience:
        input.yearsExperience === null || input.yearsExperience === undefined
          ? null
          : input.yearsExperience,
      location_area: input.locationArea?.trim() || null,
      available: input.available,
      open_to_urgent: input.openToUrgent,
      interests: input.interests,
      languages: input.languages,
      work_pref: input.workPref ?? null,
      desired_roles: input.desiredRoles,
      desired_areas: input.desiredAreas,
      desired_pay_aed:
        input.desiredPayAed === null || input.desiredPayAed === undefined
          ? null
          : input.desiredPayAed,
      desired_pay_unit: input.desiredPayUnit ?? null,
    })
    .eq("profile_id", session.profileId);
  if (error) return { ok: false, error: "Could not save your changes." };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true };
}

// Upload a profile photo (avatars bucket) and set it on the profiles row.
export async function uploadAvatar(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Apply to a gig first to create your profile." };
  }
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
  const path = `${session.profileId}/${randomUUID()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await db.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

  const { data: pub } = db.storage.from("avatars").getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updErr } = await db
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", session.profileId);
  if (updErr) return { ok: false, error: "Uploaded, but could not save to your profile." };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true, url };
}

// Upload a CV to the profile (R7). Server-side upload via the service-role client to the
// public `cvs` bucket; returns the public URL and stores it on candidate_profiles.
export async function uploadCv(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Apply to a gig first to create your profile." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a file." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "File too large (max 8 MB)." };
  }

  const db = createServiceClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${session.profileId}/${randomUUID()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await db.storage
    .from("cvs")
    .upload(path, bytes, { contentType: file.type || "application/pdf", upsert: true });
  if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

  const { data: pub } = db.storage.from("cvs").getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updErr } = await db
    .from("candidate_profiles")
    .update({ cv_url: url })
    .eq("profile_id", session.profileId);
  if (updErr) return { ok: false, error: "Uploaded, but could not save to your profile." };

  revalidatePath("/profile");
  return { ok: true, url };
}

// Autofill the profile from the saved CV (the extraction seam). Reads the uploaded CV,
// pulls out structured fields with Claude, and merges them into the profile: arrays are
// unioned (never lose existing tags), scalars fill blanks (a typed name is never
// clobbered), and work history is inserted only when the profile has none yet. The raw
// extraction is stored to candidate_profiles.cv_extracted (best-effort). Returns the
// applied values so the open edit form can reflect them instantly.
export async function importProfileFromCv(): Promise<{
  ok: boolean;
  error?: string;
  summary?: string[];
  applied?: {
    name: string | null;
    headline: string | null;
    bio: string | null;
    years: number | null;
    languages: string[];
    desiredRoles: string[];
  };
}> {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Apply to a gig first to create your profile." };
  }
  const candidate = await getCandidate(session.profileId);
  if (!candidate) return { ok: false, error: "We couldn't find your profile." };
  if (!candidate.cv_url) return { ok: false, error: "Upload a CV first, then autofill." };

  // Pull the CV bytes back from the public bucket.
  let bytes: Uint8Array;
  let contentType: string;
  try {
    const resp = await fetch(candidate.cv_url);
    if (!resp.ok) throw new Error(`fetch status ${resp.status}`);
    contentType = resp.headers.get("content-type") || "application/pdf";
    bytes = new Uint8Array(await resp.arrayBuffer());
  } catch (err) {
    console.error("CV fetch failed:", err);
    return { ok: false, error: "We couldn't read your uploaded CV. Try re-uploading it." };
  }

  let extracted;
  try {
    extracted = await extractCvFields(bytes, contentType);
  } catch (err) {
    console.error("CV extraction failed:", err);
    return { ok: false, error: "We couldn't read that CV. A text-based PDF works best." };
  }

  // Case-insensitive union that preserves existing order and adds new tags.
  const union = (existing: string[] = [], found: string[] = []): string[] => {
    const seen = new Set(existing.map((s) => s.toLowerCase()));
    const out = [...existing];
    for (const raw of found) {
      const t = raw.trim();
      if (t && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        out.push(t);
      }
    }
    return out;
  };

  const specialisms = union(candidate.specialisms, extracted.specialisms);
  const cuisines = union(candidate.cuisines, extracted.cuisines);
  const certifications = union(candidate.certifications, extracted.certifications);
  const languages = union(candidate.languages, extracted.languages);
  const desiredRoles = union(candidate.desired_roles, extracted.desired_roles);
  const headline = candidate.headline || extracted.headline || null;
  const bio = candidate.bio || extracted.bio || null;
  const years = candidate.years_experience ?? extracted.years_experience ?? null;

  const db = createServiceClient();

  const { error: updErr } = await db
    .from("candidate_profiles")
    .update({
      headline,
      bio,
      years_experience: years,
      specialisms,
      cuisines,
      certifications,
      languages,
      desired_roles: desiredRoles,
    })
    .eq("profile_id", session.profileId);
  if (updErr) return { ok: false, error: "Could not save the imported details." };

  // Name lives on the profiles row. Fill only when there isn't one already.
  let appliedName = candidate.profile?.name?.trim() || null;
  if (extracted.name && !appliedName) {
    await db.from("profiles").update({ name: extracted.name }).eq("id", session.profileId);
    appliedName = extracted.name;
  }

  // Work history: insert only if the profile has none yet (avoids duplicates on re-run).
  let addedExperience = 0;
  if (!(candidate.experience?.length) && extracted.experience.length) {
    const rows = extracted.experience
      .slice(0, 12)
      .filter((x) => x.company || x.title)
      .map((x, i) => ({
        profile_id: session.profileId,
        title: x.title || "Role",
        company: x.company || "",
        location: x.location,
        start_label: x.start_label,
        end_label: x.is_current ? null : x.end_label,
        is_current: x.is_current,
        description: x.description,
        sort_order: i,
      }));
    if (rows.length) {
      const { error: expErr } = await db.from("candidate_experience").insert(rows);
      if (!expErr) addedExperience = rows.length;
    }
  }

  // Store the raw extraction for audit. Best-effort: no-ops cleanly if migration 0004
  // (cv_extracted / cv_extracted_at) has not been applied yet.
  try {
    await db
      .from("candidate_profiles")
      .update({
        cv_extracted: extracted as unknown as Record<string, unknown>,
        cv_extracted_at: new Date().toISOString(),
      })
      .eq("profile_id", session.profileId);
  } catch {
    /* columns may not exist yet */
  }

  const summary: string[] = [];
  if (extracted.headline) summary.push("headline");
  if (extracted.bio) summary.push("summary");
  if (extracted.years_experience != null) summary.push("years of experience");
  if (extracted.specialisms.length) summary.push(`${extracted.specialisms.length} skills`);
  if (extracted.cuisines.length) summary.push(`${extracted.cuisines.length} cuisines`);
  if (extracted.certifications.length)
    summary.push(`${extracted.certifications.length} certifications`);
  if (extracted.languages.length) summary.push(`${extracted.languages.length} languages`);
  if (addedExperience) summary.push(`${addedExperience} work history entries`);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return {
    ok: true,
    summary,
    applied: { name: appliedName, headline, bio, years, languages, desiredRoles },
  };
}

// --- Experience CRUD (R7 — LinkedIn-style work history) ---------------------
export async function addExperience(input: {
  title: string;
  company: string;
  location?: string;
  startLabel?: string;
  endLabel?: string;
  isCurrent: boolean;
  description?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    return { ok: false, error: "Apply to a gig first to create your profile." };
  }
  const title = input.title.trim();
  const company = input.company.trim();
  if (!title || !company) return { ok: false, error: "Add a role title and company." };

  const db = createServiceClient();
  // Append at the end of the current list.
  const { count } = await db
    .from("candidate_experience")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", session.profileId);

  const { error } = await db.from("candidate_experience").insert({
    profile_id: session.profileId,
    title,
    company,
    location: input.location?.trim() || null,
    start_label: input.startLabel?.trim() || null,
    end_label: input.isCurrent ? null : input.endLabel?.trim() || null,
    is_current: input.isCurrent,
    description: input.description?.trim() || null,
    sort_order: count ?? 0,
  });
  if (error) return { ok: false, error: "Could not add experience." };

  revalidatePath("/profile");
  return { ok: true };
}

export async function deleteExperience(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "candidate") return { ok: false, error: "Not authorised." };
  const db = createServiceClient();
  const { error } = await db
    .from("candidate_experience")
    .delete()
    .eq("id", id)
    .eq("profile_id", session.profileId);
  if (error) return { ok: false, error: "Could not remove experience." };
  revalidatePath("/profile");
  return { ok: true };
}
