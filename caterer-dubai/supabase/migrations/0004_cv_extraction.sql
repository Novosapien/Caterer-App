-- ===========================================================================
-- Caterer Dubai — migration 0004
-- CV extraction: store the structured fields parsed from an uploaded CV.
--   cv_extracted    — raw LLM extraction (audit + low-confidence extras) as jsonb
--   cv_extracted_at — when the last extraction ran
-- The normalised values are merged into the existing candidate_profiles columns
-- (specialisms, cuisines, certifications, languages, bio, years_experience, ...)
-- and candidate_experience rows. Safe to re-run.
-- ===========================================================================

alter table candidate_profiles
  add column if not exists cv_extracted jsonb,
  add column if not exists cv_extracted_at timestamptz;
