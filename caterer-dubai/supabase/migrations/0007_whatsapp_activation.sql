-- WhatsApp session compliance + general (non-gig) conversations.
--
-- WhatsApp policy (and plain anti-ban sense for a real linked account): a
-- business may only message a user who has messaged it first. We record when
-- each candidate first messaged the assistant, and gate all proactive sends on
-- it (in whatsappRecipients). A user must also have flipped the green opt-in
-- toggle (whatsapp_opt_in, migration 0006).
alter table candidate_profiles
  add column if not exists whatsapp_activated_at timestamptz;

-- Allow a general thread (no specific gig) so a candidate can just message in
-- and ask "any jobs going?" before any gig has been sent to them.
alter table whatsapp_threads
  alter column job_id drop not null;
