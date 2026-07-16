-- Explicit consent for the WhatsApp agent to proactively message a chef about matching
-- gigs. Kept separate from `available` / `open_to_urgent` so it is an unambiguous, single-
-- purpose opt-in ("Approve WhatsApp agent to message me"). Additive + non-destructive.
alter table candidate_profiles
  add column if not exists whatsapp_opt_in boolean not null default false;
