import "server-only";
import { createServiceClient } from "./supabase/server";
import type { Job, CandidateProfile } from "./types";

// Rules-based matching (spec R9), tightened so proactive alerts only reach the right people.
//
// A candidate matches a job when ALL hold:
//   1. available
//   2. role FAMILY overlap (kitchen vs front-of-house vs bar vs barista vs events) — so a
//      waiter never gets a head-chef ping and a chef never gets a waiter ping
//   3. same location_area (plain string; radius_km is decorative for v1)
//   4. eligibility: urgent job + open_to_urgent, OR evening job (dinner/night shift)
//
// WhatsApp consent (whatsapp_opt_in) is applied by the caller on top of this, so in-app
// alerts and WhatsApp sends can differ (WhatsApp needs the explicit opt-in).

// --- Role families ----------------------------------------------------------
export type RoleFamily = "kitchen" | "front" | "bar" | "barista" | "events";

// Keyword → family. Checked as word-ish substrings against a lowercased haystack.
const FAMILY_KEYWORDS: Record<RoleFamily, string[]> = {
  kitchen: [
    "chef", "cook", "commis", "sous", "cdp", "chef de partie", "pastry", "grill",
    "larder", "kitchen", "culinary", "prep", "demi", "kitchen porter", " kp",
  ],
  front: [
    "waiter", "waitress", "server", "waiting", "host", "hostess", "runner", "busser",
    "front of house", "foh", "service staff", "floor",
  ],
  bar: ["bartender", "barback", "mixologist", "bar staff", "bar "],
  barista: ["barista", "coffee"],
  events: ["events crew", "event staff", "banquet", "catering crew", "steward", "usher", "hospitality crew"],
};

// Classify a set of free-text role/skill strings into the families they imply.
export function familiesFrom(values: string[]): Set<RoleFamily> {
  const hay = ` ${values.join(" ").toLowerCase()} `;
  const out = new Set<RoleFamily>();
  (Object.keys(FAMILY_KEYWORDS) as RoleFamily[]).forEach((fam) => {
    if (FAMILY_KEYWORDS[fam].some((kw) => hay.includes(kw))) out.add(fam);
  });
  return out;
}

// The job's family, from its role_type + title.
export function gigFamilies(job: Job): Set<RoleFamily> {
  return familiesFrom([job.role_type, job.title]);
}

// A candidate's families, from what they actually do / want.
export function candidateFamilies(c: CandidateProfile): Set<RoleFamily> {
  return familiesFrom([...(c.specialisms ?? []), ...(c.desired_roles ?? []), ...(c.interests ?? [])]);
}

// Role match = at least one shared family. If the job has no derivable family we can't be
// sure, so fall back to allowing it; if the candidate has no derivable family we do NOT
// proactively message them (avoids spamming a blank profile).
export function rolesMatch(job: Job, c: CandidateProfile): boolean {
  const g = gigFamilies(job);
  if (g.size === 0) return true;
  const cand = candidateFamilies(c);
  if (cand.size === 0) return false;
  for (const fam of cand) if (g.has(fam)) return true;
  return false;
}

// --- Evening detection ------------------------------------------------------
// Dubai is UTC+4 (no DST). "Evening" covers dinner service through late-night shifts:
// a start time between 16:00 and 04:59 Dubai time.
export function isEveningGig(job: Job): boolean {
  if (!job.start_at) return false;
  const d = new Date(job.start_at);
  if (Number.isNaN(d.getTime())) return false;
  const dubaiHour = (d.getUTCHours() + 4) % 24;
  return dubaiHour >= 16 || dubaiHour < 5;
}

// A candidate is eligible for a proactive alert about this job when the job is urgent and
// they take urgent work, or the job is an evening shift (the opt-in they signed up for).
function isEligible(job: Job, c: CandidateProfile): boolean {
  if (job.is_urgent && c.open_to_urgent) return true;
  if (isEveningGig(job)) return true;
  return false;
}

// Candidates who should see an in-app alert for this job (WhatsApp consent applied by the
// caller on top). Returns [] for a job that is neither urgent nor an evening shift.
export async function matchCandidatesForGig(job: Job): Promise<CandidateProfile[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("candidate_profiles")
    .select("*, profile:profiles(*)")
    .eq("available", true);
  const candidates = (data ?? []) as unknown as CandidateProfile[];

  return candidates.filter((c) => {
    if (job.location_area && c.location_area && c.location_area !== job.location_area) return false;
    if (!rolesMatch(job, c)) return false;
    return isEligible(job, c);
  });
}

// Of a matched set, those the agent may PROACTIVELY message on WhatsApp. All three must hold:
//   1. whatsapp_opt_in — they flipped the green "message me" toggle (consent)
//   2. whatsapp_activated_at — they have messaged the assistant first, so a WhatsApp session
//      is open. WhatsApp only lets a business message a user who contacted it first, and cold
//      messaging strangers is what gets a number banned, so this gate is mandatory.
//   3. a phone number to reach
// Fail-closed: a missing whatsapp_activated_at (e.g. before migration 0007) means no send.
export function whatsappRecipients(matches: CandidateProfile[]): CandidateProfile[] {
  return matches.filter(
    (c) =>
      c.whatsapp_opt_in === true &&
      Boolean(c.whatsapp_activated_at) &&
      Boolean(c.profile?.phone),
  );
}
