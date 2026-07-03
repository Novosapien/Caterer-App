import "server-only";
import { createServiceClient } from "./supabase/server";
import type { Job, CandidateProfile } from "./types";

// Rules-based matching (spec R9). For an urgent gig a candidate matches iff:
//   available AND open_to_urgent AND role/interest overlap AND same location_area.
// Area match is a plain string comparison (no geocoding); radius_km is decorative for v1.
export async function matchCandidatesForGig(job: Job): Promise<CandidateProfile[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("candidate_profiles")
    .select("*, profile:profiles(*)")
    .eq("available", true);
  let candidates = (data ?? []) as unknown as CandidateProfile[];

  candidates = candidates.filter((c) => {
    if (job.is_urgent && !c.open_to_urgent) return false;
    if (job.location_area && c.location_area && c.location_area !== job.location_area) return false;
    const roleTokens = [job.role_type.toLowerCase(), job.title.toLowerCase()];
    const cand = [...c.specialisms, ...c.interests].map((x) => x.toLowerCase());
    const overlap =
      cand.length === 0 ||
      cand.some((x) => roleTokens.some((r) => r.includes(x) || x.includes(r)));
    return overlap;
  });
  return candidates;
}
