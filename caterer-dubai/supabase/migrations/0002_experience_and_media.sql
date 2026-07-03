-- ===========================================================================
-- Caterer Dubai — migration 0002
-- Adds: annual-salary pay unit, per-gig business image, richer LinkedIn-style
-- candidate profile (bio / desired work / experience), CV storage.
-- Safe to re-run. Paste into the Supabase SQL Editor and Run.
-- ===========================================================================

-- 1) Annual salary as a pay unit ------------------------------------------------
alter table jobs drop constraint if exists jobs_pay_unit_check;
alter table jobs add constraint jobs_pay_unit_check
  check (pay_unit in ('shift','hour','day','year'));

-- 2) Per-gig image (represents the business/venue) ------------------------------
alter table jobs add column if not exists image_url text;

-- 3) Richer candidate profile ---------------------------------------------------
alter table candidate_profiles
  add column if not exists bio text,
  add column if not exists years_experience int,
  add column if not exists desired_roles text[] not null default '{}',
  add column if not exists desired_areas text[] not null default '{}',
  add column if not exists desired_pay_aed numeric,
  add column if not exists desired_pay_unit text;

-- 4) LinkedIn-style experience entries -----------------------------------------
create table if not exists candidate_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references candidate_profiles(profile_id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  start_label text,          -- free text e.g. 'Jan 2021' (demo-grade, no date math)
  end_label text,            -- null/empty when current
  is_current boolean not null default false,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists candidate_experience_profile
  on candidate_experience (profile_id, sort_order);

-- RLS: enable + permissive read (writes go through the service-role client).
alter table candidate_experience enable row level security;
drop policy if exists candidate_experience_read on candidate_experience;
create policy candidate_experience_read on candidate_experience for select using (true);

-- 5) Storage buckets (public; uploads happen server-side via service role) -------
insert into storage.buckets (id, name, public)
values ('business-images','business-images', true),
       ('cvs','cvs', true)
on conflict (id) do nothing;

-- 6) Demo enrichment -----------------------------------------------------------
-- Give the hero chef (Yusuf) a full LinkedIn-style profile.
update candidate_profiles set
  bio = 'Chef de Partie with 8 years across fine-dining and luxury hospitality in Dubai and London. Calm under pressure, strong on French and Mediterranean sections, and happy to jump on urgent temp shifts at short notice.',
  years_experience = 8,
  desired_roles = '{"Chef de Partie","Sous Chef","Pastry Chef"}',
  desired_areas = '{"Palm Jumeirah","Downtown Dubai","DIFC"}',
  desired_pay_aed = 320,
  desired_pay_unit = 'shift'
where profile_id = '11111111-1111-1111-1111-111111111111';

insert into candidate_experience (id, profile_id, title, company, location, start_label, end_label, is_current, description, sort_order) values
 ('e1111111-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Chef de Partie','Atlantis The Palm','Palm Jumeirah','Mar 2021',null,true,'Run the fish and sauce sections for à la carte and banqueting up to 400 covers.',0),
 ('e1111111-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Demi Chef de Partie','Zuma Dubai','DIFC','Jun 2018','Feb 2021',false,'Fast-paced izakaya service; cross-trained on robata and cold sections.',1),
 ('e1111111-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Commis Chef','The Savoy','London, UK','Sep 2016','May 2018',false,'Classical French brigade; pastry and larder rotations.',2)
on conflict (id) do nothing;

-- Give each seeded gig a representative venue image (only where not already set).
update jobs set image_url = case
  when venue ilike '%Burj Al Arab%'   then 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70'
  when venue ilike '%Atlantis%'       then 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=70'
  when venue ilike '%Address%'        then 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=70'
  when venue ilike '%DIFC%'           then 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70'
  else 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=70'
end
where image_url is null;
