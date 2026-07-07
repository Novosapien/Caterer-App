-- ===========================================================================
-- Caterer Dubai — migration 0005
-- Real accounts: link a profile to a Supabase Auth user.
--   auth_user_id — the auth.users id for accounts created via email+password.
-- Demo personas and guest quick-apply profiles keep this null, so they still work.
-- Safe to re-run.
-- ===========================================================================

alter table profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create index if not exists profiles_auth_user_id_idx on profiles (auth_user_id);
