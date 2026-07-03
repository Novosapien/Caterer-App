-- ===========================================================================
-- Caterer Dubai — migration 0003
-- Full candidate profile: languages, work preference (shift/permanent/both),
-- ratings & reviews, profile photo (avatars bucket). Safe to re-run.
-- ===========================================================================

-- 1) New profile fields ---------------------------------------------------------
alter table candidate_profiles
  add column if not exists languages text[] not null default '{}',
  add column if not exists work_pref text;   -- 'shift' | 'permanent' | 'both'

-- 2) Ratings & reviews (from past employers) -----------------------------------
create table if not exists candidate_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references candidate_profiles(profile_id) on delete cascade,
  author_name text not null,
  author_role text,            -- e.g. 'Events Manager, Atlantis'
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);
create index if not exists candidate_reviews_profile on candidate_reviews (profile_id);
alter table candidate_reviews enable row level security;
drop policy if exists candidate_reviews_read on candidate_reviews;
create policy candidate_reviews_read on candidate_reviews for select using (true);

-- 3) Avatars bucket (public; server-side upload via service role) ---------------
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

-- 4) Demo enrichment — the hero chef (Yusuf) ------------------------------------
update candidate_profiles set
  languages = '{"English","Arabic","Hindi"}',
  work_pref = 'both'
where profile_id = '11111111-1111-1111-1111-111111111111';

update profiles set
  avatar_url = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=70'
where id = '11111111-1111-1111-1111-111111111111';

insert into candidate_reviews (id, profile_id, author_name, author_role, rating, body) values
 ('d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Sofia Haddad','Events Manager, Atlantis Events',5,'Yusuf jumped on a last-minute banquet shift and ran the fish section flawlessly. Booked him again the next week.'),
 ('d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Marco Bianchi','Head Chef, Address Downtown',5,'Calm, fast and clean under pressure. Exactly what you want on a busy Saturday service.'),
 ('d0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Aisha Karim','Sous Chef, Burj Al Arab',4,'Strong on pastry and larder rotations. Reliable, professional, turns up early.')
on conflict (id) do nothing;

-- A few other seeded candidates get languages + a work preference so the feed feels real.
update candidate_profiles set languages = '{"English","Tagalog"}', work_pref = 'shift'
  where profile_id = 'c0000000-0000-0000-0000-000000000002';
update candidate_profiles set languages = '{"English","French"}', work_pref = 'permanent'
  where profile_id = 'c0000000-0000-0000-0000-000000000003';
update candidate_profiles set languages = '{"English","Arabic"}', work_pref = 'both'
  where profile_id = 'c0000000-0000-0000-0000-000000000004';
