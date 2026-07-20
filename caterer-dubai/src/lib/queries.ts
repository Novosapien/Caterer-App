import "server-only";
import { createServiceClient } from "./supabase/server";
import type {
  Job,
  CandidateProfile,
  CandidateExperience,
  CandidateReview,
  Package,
  Application,
} from "./types";

// Server-side read helpers (service-role; RLS bypassed — demo grade). Feature streams
// import these for gig/candidate/package reads. Writes live in feature server actions.

// Resolve the business a recruiter owns from their profile id. Works for both real
// business accounts and the demo recruiter persona (which owns the seeded business).
export async function getOwnedBusinessId(profileId: string): Promise<string | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("businesses")
    .select("id")
    .eq("owner_profile_id", profileId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function listOpenGigs(opts?: { search?: string; urgentOnly?: boolean }): Promise<Job[]> {
  const db = createServiceClient();
  let q = db.from("jobs").select("*, business:businesses(*)").eq("status", "open");
  if (opts?.urgentOnly) q = q.eq("is_urgent", true);
  q = q.order("is_urgent", { ascending: false }).order("start_at", { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  let jobs = (data ?? []) as unknown as Job[];
  if (opts?.search?.trim()) {
    const s = opts.search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(s) ||
        j.venue.toLowerCase().includes(s) ||
        j.location_area.toLowerCase().includes(s) ||
        j.role_type.toLowerCase().includes(s),
    );
  }
  return jobs;
}

export async function countOpenGigs(): Promise<number> {
  const db = createServiceClient();
  const { count } = await db
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  return count ?? 0;
}

// Real engagement metrics for the candidate's own "dashboard" strip (private to them).
// profile_viewed notifications are written when a recruiter opens their profile.
export async function getCandidateInsights(
  profileId: string
): Promise<{ profileViews: number; applications: number; gigsWon: number }> {
  const db = createServiceClient();
  const [views, apps, won] = await Promise.all([
    db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", "profile_viewed"),
    db
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("candidate_profile_id", profileId),
    db
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("candidate_profile_id", profileId)
      .eq("status", "accepted"),
  ]);
  return {
    profileViews: views.count ?? 0,
    applications: apps.count ?? 0,
    gigsWon: won.count ?? 0,
  };
}

export async function getGig(id: string): Promise<Job | null> {
  const db = createServiceClient();
  const { data } = await db.from("jobs").select("*, business:businesses(*)").eq("id", id).maybeSingle();
  return (data as unknown as Job) ?? null;
}

export async function getCandidate(profileId: string): Promise<CandidateProfile | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("candidate_profiles")
    .select("*, profile:profiles(*)")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) return null;
  const candidate = data as unknown as CandidateProfile;

  // Defaults so views can rely on arrays even before 0002/0003 are migrated.
  candidate.specialisms = candidate.specialisms ?? [];
  candidate.cuisines = candidate.cuisines ?? [];
  candidate.interests = candidate.interests ?? [];
  candidate.certifications = candidate.certifications ?? [];
  candidate.languages = candidate.languages ?? [];
  candidate.desired_roles = candidate.desired_roles ?? [];
  candidate.desired_areas = candidate.desired_areas ?? [];

  // Experience + reviews fetched independently — a table missing (un-migrated) yields []
  // rather than dropping the whole profile.
  const exp = await db
    .from("candidate_experience")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_current", { ascending: false })
    .order("sort_order", { ascending: true });
  candidate.experience = (exp.data ?? []) as CandidateExperience[];

  const rev = await db
    .from("candidate_reviews")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  const reviews = (rev.data ?? []) as CandidateReview[];
  candidate.reviews = reviews;
  candidate.rating_count = reviews.length;
  candidate.rating_avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;
  return candidate;
}

export async function listExperience(profileId: string): Promise<CandidateExperience[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("candidate_experience")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_current", { ascending: false })
    .order("sort_order", { ascending: true });
  return (data ?? []) as CandidateExperience[];
}

export async function listPackages(): Promise<Package[]> {
  const db = createServiceClient();
  const { data } = await db.from("packages").select("*").order("price_aed", { ascending: true });
  return (data ?? []) as Package[];
}

export async function listApplicationsForJob(jobId: string): Promise<Application[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("applications")
    .select("*, candidate:candidate_profiles(*, profile:profiles(*))")
    .eq("job_id", jobId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as Application[];
}

// A candidate's own applications, newest first, with the job joined so the profile
// can show which jobs they've applied to (whether via the app or the WhatsApp agent).
export async function listApplicationsForCandidate(profileId: string): Promise<Application[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("applications")
    .select("*, job:jobs(*, business:businesses(*))")
    .eq("candidate_profile_id", profileId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as Application[];
}
