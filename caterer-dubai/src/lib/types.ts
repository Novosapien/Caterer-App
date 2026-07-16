// Domain types — mirror the Supabase schema (see supabase/migrations/0001_schema.sql
// and spec.md § Data contract). Kept deliberately close to the DB row shapes.

export type Role = "candidate" | "recruiter";

export type PayUnit = "shift" | "hour" | "day" | "year";
export type JobStatus = "open" | "filled" | "closed";
export type BusinessType = "hotel" | "eventing" | "recruiter";
export type ApplicationStatus = "applied" | "accepted" | "declined";
export type ApplicationSource = "app" | "whatsapp";

export interface Profile {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface CandidateProfile {
  profile_id: string;
  headline: string | null;
  specialisms: string[];
  cuisines: string[];
  interests: string[];
  open_to_urgent: boolean;
  available: boolean;
  // Explicit consent for proactive WhatsApp gig alerts (migration 0006). May be undefined
  // on rows read before the column exists — treat missing as not opted in.
  whatsapp_opt_in?: boolean;
  // When the candidate first messaged the WhatsApp assistant (migration 0007). Set, it means
  // a WhatsApp session is open, so we may proactively message them. Missing/undefined before
  // the migration (or before they message in) means no proactive send.
  whatsapp_activated_at?: string | null;
  available_from: string | null;
  location_area: string | null;
  radius_km: number | null;
  right_to_work: boolean;
  cv_url: string | null;
  certifications: string[];
  // richer LinkedIn-style fields (migration 0002)
  bio: string | null;
  years_experience: number | null;
  desired_roles: string[];
  desired_areas: string[];
  desired_pay_aed: number | null;
  desired_pay_unit: PayUnit | null;
  // full-profile fields (migration 0003)
  languages: string[];
  work_pref: WorkPref | null;
  // CV extraction (migration 0004)
  cv_extracted?: Record<string, unknown> | null;
  cv_extracted_at?: string | null;
  // convenience joins + computed
  profile?: Profile;
  experience?: CandidateExperience[];
  reviews?: CandidateReview[];
  rating_avg?: number | null;
  rating_count?: number;
}

export type WorkPref = "shift" | "permanent" | "both";

export interface CandidateReview {
  id: string;
  profile_id: string;
  author_name: string;
  author_role: string | null;
  rating: number;
  body: string | null;
  created_at: string;
}

export interface CandidateExperience {
  id: string;
  profile_id: string;
  title: string;
  company: string;
  location: string | null;
  start_label: string | null;
  end_label: string | null;
  is_current: boolean;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  logo_url: string | null;
  owner_profile_id: string | null;
}

export interface Package {
  id: string;
  name: string;
  price_aed: number;
  job_credits: number;
  cv_view_credits: number;
  features: string[];
}

export interface Purchase {
  id: string;
  business_id: string;
  package_id: string;
  created_at: string;
}

export interface Job {
  id: string;
  business_id: string;
  title: string;
  role_type: string;
  description: string | null;
  venue: string;
  location_area: string;
  pay_aed: number;
  pay_unit: PayUnit;
  start_at: string; // ISO
  dress_code: string | null;
  image_url: string | null;
  is_urgent: boolean;
  is_temp: boolean;
  status: JobStatus;
  created_at: string;
  // convenience join
  business?: Business;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_profile_id: string;
  status: ApplicationStatus;
  source: ApplicationSource;
  created_at: string;
  updated_at: string;
  // convenience joins
  job?: Job;
  candidate?: CandidateProfile;
}

// Minimal gig shape used by the search type-ahead (passed from server pages to the
// client search boxes on the landing page and the gig feed).
export interface JobSuggestion {
  id: string;
  title: string;
  role_type: string;
  venue: string;
  location_area: string;
  pay_aed: number;
  pay_unit: PayUnit;
  is_urgent: boolean;
}

// AI "Rate my CV" result — a candidate's profile scored against one job spec.
export interface CvRating {
  score: number; // 1-100 fit score
  verdict: string; // short overall label, e.g. "Strong fit"
  summary: string; // 2-3 sentence explanation
  strengths: string[]; // where the CV matches the role
  gaps: string[]; // what's missing or weak for this role
  recommendations: string[]; // concrete CV changes to improve fit
}

// Structured fields extracted from an uploaded CV (see lib/cvExtract.ts). These map onto
// the candidate_profiles columns + candidate_experience rows during import.
export interface ExtractedCvExperience {
  title: string;
  company: string;
  location: string | null;
  start_label: string | null;
  end_label: string | null;
  is_current: boolean;
  description: string | null;
}

export interface ExtractedCv {
  name: string | null;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  specialisms: string[];
  cuisines: string[];
  certifications: string[];
  languages: string[];
  desired_roles: string[];
  experience: ExtractedCvExperience[];
}

export interface AppNotification {
  id: string;
  profile_id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}
