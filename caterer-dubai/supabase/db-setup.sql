-- ===========================================================================
-- Caterer Dubai prototype — ONE-PASTE DB SETUP
-- Combines 0001_schema.sql + seed.sql. Paste the whole file into the
-- Supabase SQL Editor and click Run. Safe to re-run (seed truncates first).
-- ===========================================================================

-- ------------------------------- SCHEMA ------------------------------------
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('candidate','recruiter')),
  name text not null,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists candidate_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  headline text,
  specialisms text[] not null default '{}',
  cuisines text[] not null default '{}',
  interests text[] not null default '{}',
  open_to_urgent boolean not null default false,
  available boolean not null default false,
  available_from timestamptz,
  location_area text,
  radius_km int,
  right_to_work boolean not null default true,
  cv_url text,
  certifications text[] not null default '{}'
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('hotel','eventing','recruiter')),
  logo_url text,
  owner_profile_id uuid references profiles(id) on delete set null
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_aed numeric not null,
  job_credits int not null,
  cv_view_credits int not null,
  features text[] not null default '{}'
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  package_id uuid not null references packages(id),
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  role_type text not null,
  description text,
  venue text not null,
  location_area text not null,
  pay_aed numeric not null,
  pay_unit text not null check (pay_unit in ('shift','hour','day')),
  start_at timestamptz not null,
  dress_code text,
  is_urgent boolean not null default false,
  is_temp boolean not null default false,
  status text not null default 'open' check (status in ('open','filled','closed')),
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_profile_id uuid not null references candidate_profiles(profile_id) on delete cascade,
  status text not null default 'applied' check (status in ('applied','accepted','declined')),
  source text not null default 'app' check (source in ('app','whatsapp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_profile_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists whatsapp_threads (
  thread_key text primary key,
  phone text not null,
  candidate_profile_id uuid not null references candidate_profiles(profile_id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'active' check (status in ('active','closed')),
  last_activity_at timestamptz not null default now()
);
create index if not exists whatsapp_threads_phone_active
  on whatsapp_threads (phone) where status = 'active';

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null references whatsapp_threads(thread_key) on delete cascade,
  direction text not null check (direction in ('in','out')),
  body text not null,
  created_at timestamptz not null default now()
);

-- Prototype RLS: enable + permissive read; writes go through the service-role client.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','candidate_profiles','businesses','packages','purchases',
    'jobs','applications','notifications','whatsapp_threads','whatsapp_messages'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format('create policy %I on %I for select using (true)', t || '_read', t);
  end loop;
end $$;

-- -------------------------------- SEED -------------------------------------
truncate whatsapp_messages, whatsapp_threads, notifications, applications, jobs,
         purchases, packages, candidate_profiles, businesses, profiles restart identity cascade;

insert into packages (id, name, price_aed, job_credits, cv_view_credits, features) values
 ('cccccccc-0000-0000-0000-000000000001','Starter',    499,  3,  10,  '{"3 job posts","10 CV views","Email support"}'),
 ('cccccccc-0000-0000-0000-000000000002','Caterer Pro',1499, 15, 100, '{"15 job posts","100 CV views","Urgent boosts","Priority support"}'),
 ('cccccccc-0000-0000-0000-000000000003','Enterprise', 3999, 999, 999, '{"Unlimited posts","Unlimited CV views","Urgent boosts","Dedicated manager"}');

insert into profiles (id, role, name, email) values
 ('22222222-2222-2222-2222-222222222222','recruiter','Sofia Haddad','sofia@atlantisevents.ae');

insert into businesses (id, name, type, owner_profile_id) values
 ('aaaaaaaa-0000-0000-0000-000000000001','Atlantis Events','eventing','22222222-2222-2222-2222-222222222222'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Burj Al Arab','hotel',null),
 ('aaaaaaaa-0000-0000-0000-000000000003','Address Downtown','hotel',null),
 ('aaaaaaaa-0000-0000-0000-000000000004','DIFC Fine Dining Group','eventing',null),
 ('aaaaaaaa-0000-0000-0000-000000000005','Palm Catering Co','recruiter',null);

insert into purchases (business_id, package_id) values
 ('aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002');

insert into profiles (id, role, name, phone) values
 ('11111111-1111-1111-1111-111111111111','candidate','Yusuf Rahman','+971500000001'),
 ('c0000000-0000-0000-0000-000000000002','candidate','Amara Okafor','+971500000002'),
 ('c0000000-0000-0000-0000-000000000003','candidate','Liam Walsh','+971500000003'),
 ('c0000000-0000-0000-0000-000000000004','candidate','Priya Nair','+971500000004'),
 ('c0000000-0000-0000-0000-000000000005','candidate','Marco Rossi','+971500000005'),
 ('c0000000-0000-0000-0000-000000000006','candidate','Fatima Al Zahra','+971500000006'),
 ('c0000000-0000-0000-0000-000000000007','candidate','Chen Wei','+971500000007'),
 ('c0000000-0000-0000-0000-000000000008','candidate','Sofia Mendes','+971500000008'),
 ('c0000000-0000-0000-0000-000000000009','candidate','Omar Farouk','+971500000009'),
 ('c0000000-0000-0000-0000-000000000010','candidate','Grace Kim','+971500000010'),
 ('c0000000-0000-0000-0000-000000000011','candidate','Diego Santos','+971500000011'),
 ('c0000000-0000-0000-0000-000000000012','candidate','Aisha Bello','+971500000012'),
 ('c0000000-0000-0000-0000-000000000013','candidate','Tom Fletcher','+971500000013'),
 ('c0000000-0000-0000-0000-000000000014','candidate','Nadia Petrova','+971500000014'),
 ('c0000000-0000-0000-0000-000000000015','candidate','Kwame Mensah','+971500000015');

insert into candidate_profiles
 (profile_id, headline, specialisms, cuisines, interests, open_to_urgent, available, location_area, radius_km, right_to_work, certifications) values
 ('11111111-1111-1111-1111-111111111111','Chef de Partie · 8 yrs fine dining','{"Chef de Partie","Pastry"}','{"French","Mediterranean"}','{"urgent temp","pastry"}',true,true,'Palm Jumeirah',25,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000002','Head Waiter · events specialist','{"Waiter","Head Waiter"}','{}','{"urgent temp","events"}',true,true,'Downtown Dubai',20,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000003','Sous Chef · hotel banquets','{"Sous Chef"}','{"European"}','{"banquets"}',false,true,'Deira',30,true,'{"Food Hygiene L3"}'),
 ('c0000000-0000-0000-0000-000000000004','Pastry Chef · patisserie','{"Pastry"}','{"French"}','{"urgent temp","pastry"}',true,true,'Palm Jumeirah',15,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000005','Pizzaiolo · Italian','{"Chef de Partie"}','{"Italian"}','{"urgent temp"}',true,true,'JBR',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000006','Barista & floor · cafes','{"Barista","Waiter"}','{}','{"urgent temp"}',true,true,'Business Bay',15,true,'{}'),
 ('c0000000-0000-0000-0000-000000000007','Wok chef · Asian cuisine','{"Chef de Partie"}','{"Chinese","Thai"}','{}',false,true,'Deira',25,true,'{}'),
 ('c0000000-0000-0000-0000-000000000008','Event server · banqueting','{"Waiter"}','{}','{"urgent temp","events"}',true,false,'Downtown Dubai',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000009','Commis chef · learning fast','{"Commis Chef"}','{"Mediterranean"}','{"urgent temp"}',true,true,'Al Barsha',30,true,'{}'),
 ('c0000000-0000-0000-0000-000000000010','Bartender & mixologist','{"Bartender"}','{}','{"events"}',false,true,'Downtown Dubai',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000011','Grill chef · steakhouse','{"Chef de Partie","Grill"}','{"American"}','{"urgent temp"}',true,true,'JBR',25,true,'{"Food Hygiene L2"}'),
 ('c0000000-0000-0000-0000-000000000012','Banquet supervisor','{"Supervisor","Waiter"}','{}','{"events"}',false,true,'Downtown Dubai',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000013','Kitchen porter · reliable','{"Kitchen Porter"}','{}','{"urgent temp"}',true,true,'Deira',30,true,'{}'),
 ('c0000000-0000-0000-0000-000000000014','Cold kitchen / garde manger','{"Chef de Partie","Garde Manger"}','{"French"}','{"urgent temp"}',true,true,'Palm Jumeirah',20,true,'{}'),
 ('c0000000-0000-0000-0000-000000000015','Head chef · high volume','{"Head Chef","Sous Chef"}','{"African","Mediterranean"}','{"banquets"}',false,true,'Business Bay',30,true,'{"Food Hygiene L3"}');

insert into jobs (business_id, title, role_type, description, venue, location_area, pay_aed, pay_unit, start_at, dress_code, is_urgent, is_temp, status) values
 ('aaaaaaaa-0000-0000-0000-000000000002','Chef de Partie','Chef de Partie','Fine-dining service at an iconic Dubai hotel. Strong section experience required.','Burj Al Arab','Umm Suqeim',340,'shift',now()+interval '5 hours','Chef whites',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Pastry Chef','Pastry','Afternoon tea + plated desserts. Patisserie background preferred.','Burj Al Arab','Umm Suqeim',360,'shift',now()+interval '1 day 3 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Banquet Waiter','Waiter','Large gala dinner, 300 covers. Silver service a plus.','Address Downtown','Downtown Dubai',180,'shift',now()+interval '6 hours','Black tie',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Sous Chef','Sous Chef','Support the exec chef across banqueting operations.','Address Downtown','Downtown Dubai',520,'day',now()+interval '2 days','Chef whites',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Event Server','Waiter','Rooftop cocktail reception, 150 guests. Trays + canapes.','Atlantis The Palm','Palm Jumeirah',200,'shift',now()+interval '7 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Grill Chef','Grill','Beach BBQ event. High-volume grilling.','Atlantis The Palm','Palm Jumeirah',300,'shift',now()+interval '1 day 5 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Commis Chef','Commis Chef','Prep + service support for a private DIFC dinner.','DIFC Fine Dining','DIFC',160,'shift',now()+interval '8 hours','Chef whites',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Head Waiter','Head Waiter','Lead a section at a high-profile corporate dinner.','DIFC Fine Dining','DIFC',260,'shift',now()+interval '2 days 2 hours','Black tie',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Bartender','Bartender','Cocktail bar for a brand launch party.','Palm Catering event','JBR',240,'shift',now()+interval '1 day','All black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Kitchen Porter','Kitchen Porter','Wash-up + prep support for a busy service.','Palm Catering event','JBR',120,'shift',now()+interval '9 hours','Kitchen kit',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Barista','Barista','Specialty coffee for a morning conference.','Burj Al Arab','Umm Suqeim',150,'shift',now()+interval '1 day 12 hours','Cafe uniform',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Wok Chef','Chef de Partie','Live Asian station for a buffet dinner.','Address Downtown','Downtown Dubai',280,'shift',now()+interval '1 day 4 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Pastry Commis','Pastry','Dessert plating for a wedding, 200 covers.','Atlantis The Palm','Palm Jumeirah',190,'shift',now()+interval '10 hours','Chef whites',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Banquet Supervisor','Supervisor','Oversee floor team at a corporate gala.','DIFC Fine Dining','DIFC',320,'shift',now()+interval '3 days','Black tie',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Garde Manger','Chef de Partie','Cold kitchen for a garden party.','Palm Catering event','Palm Jumeirah',270,'shift',now()+interval '1 day 6 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Head Chef (relief)','Head Chef','Cover a busy weekend brunch service.','Burj Al Arab','Umm Suqeim',700,'day',now()+interval '4 days','Chef whites',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Cocktail Server','Waiter','Evening lounge service.','Address Downtown','Downtown Dubai',170,'shift',now()+interval '2 days 5 hours','All black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Demi Chef de Partie','Chef de Partie','Support the hot section for a beach club event.','Atlantis The Palm','Palm Jumeirah',230,'shift',now()+interval '1 day 8 hours','Chef whites',false,true,'open');

-- =============================== MIGRATION 0002 =============================
-- Annual salary, per-gig image, LinkedIn-style profile, CV storage.

alter table jobs drop constraint if exists jobs_pay_unit_check;
alter table jobs add constraint jobs_pay_unit_check
  check (pay_unit in ('shift','hour','day','year'));

alter table jobs add column if not exists image_url text;

alter table candidate_profiles
  add column if not exists bio text,
  add column if not exists years_experience int,
  add column if not exists desired_roles text[] not null default '{}',
  add column if not exists desired_areas text[] not null default '{}',
  add column if not exists desired_pay_aed numeric,
  add column if not exists desired_pay_unit text;

create table if not exists candidate_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references candidate_profiles(profile_id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  start_label text,
  end_label text,
  is_current boolean not null default false,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists candidate_experience_profile
  on candidate_experience (profile_id, sort_order);

alter table candidate_experience enable row level security;
drop policy if exists candidate_experience_read on candidate_experience;
create policy candidate_experience_read on candidate_experience for select using (true);

insert into storage.buckets (id, name, public)
values ('business-images','business-images', true),
       ('cvs','cvs', true)
on conflict (id) do nothing;

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

update jobs set image_url = case
  when venue ilike '%Burj Al Arab%'   then 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70'
  when venue ilike '%Atlantis%'       then 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=70'
  when venue ilike '%Address%'        then 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=70'
  when venue ilike '%DIFC%'           then 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70'
  else 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=70'
end
where image_url is null;

-- =============================== MIGRATION 0003 =============================
-- Full candidate profile: languages, work preference, ratings & reviews, avatars.

alter table candidate_profiles
  add column if not exists languages text[] not null default '{}',
  add column if not exists work_pref text;

create table if not exists candidate_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references candidate_profiles(profile_id) on delete cascade,
  author_name text not null,
  author_role text,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);
create index if not exists candidate_reviews_profile on candidate_reviews (profile_id);
alter table candidate_reviews enable row level security;
drop policy if exists candidate_reviews_read on candidate_reviews;
create policy candidate_reviews_read on candidate_reviews for select using (true);

insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

update candidate_profiles set languages = '{"English","Arabic","Hindi"}', work_pref = 'both'
  where profile_id = '11111111-1111-1111-1111-111111111111';
update profiles set avatar_url = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=70'
  where id = '11111111-1111-1111-1111-111111111111';

insert into candidate_reviews (id, profile_id, author_name, author_role, rating, body) values
 ('d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Sofia Haddad','Events Manager, Atlantis Events',5,'Yusuf jumped on a last-minute banquet shift and ran the fish section flawlessly. Booked him again the next week.'),
 ('d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Marco Bianchi','Head Chef, Address Downtown',5,'Calm, fast and clean under pressure. Exactly what you want on a busy Saturday service.'),
 ('d0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Aisha Karim','Sous Chef, Burj Al Arab',4,'Strong on pastry and larder rotations. Reliable, professional, turns up early.')
on conflict (id) do nothing;

update candidate_profiles set languages = '{"English","Tagalog"}', work_pref = 'shift'
  where profile_id = 'c0000000-0000-0000-0000-000000000002';
update candidate_profiles set languages = '{"English","French"}', work_pref = 'permanent'
  where profile_id = 'c0000000-0000-0000-0000-000000000003';
update candidate_profiles set languages = '{"English","Arabic"}', work_pref = 'both'
  where profile_id = 'c0000000-0000-0000-0000-000000000004';
-- Broader hospitality roles (FOH, bar/mixology, management, wider kitchen) — added 2026-07-03
insert into jobs (business_id, title, role_type, description, venue, location_area, pay_aed, pay_unit, start_at, dress_code, is_urgent, is_temp, status) values
 ('aaaaaaaa-0000-0000-0000-000000000003','Restaurant Host','Host','Greet, seat and manage guest flow at a waterfront fine-dining venue.','Bluewaters Island','Bluewaters',190,'shift',now()+interval '6 hours','Smart black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Food Runner','Runner','Expedite dishes from pass to floor during a high-volume brunch.','Atlantis The Palm','Palm Jumeirah',150,'shift',now()+interval '9 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Maitre d''','Maitre d''','Lead front of house for a high-profile private dinner in DIFC.','DIFC Fine Dining','DIFC',380,'shift',now()+interval '30 hours','Black tie',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Waiter / Waitress (fine dining)','Waiter','Silver-service a la carte at a Michelin-style restaurant.','Address Downtown','Downtown Dubai',210,'shift',now()+interval '26 hours','Black tie',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Mixologist','Mixologist','Craft signature cocktails at a rooftop brand-launch party.','Atlantis The Palm','Palm Jumeirah',300,'shift',now()+interval '7 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Head Bartender','Bartender','Run the bar team across a busy beach-club weekend.','Nikki Beach','JBR',320,'shift',now()+interval '28 hours','All black',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Bar Back','Bar Back','Keep the bar stocked, iced and running during a festival.','Palm Catering event','JBR',130,'shift',now()+interval '10 hours','All black',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000004','Sommelier','Sommelier','Wine pairing and service for a six-course degustation dinner.','DIFC Fine Dining','DIFC',420,'shift',now()+interval '50 hours','Business formal',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Restaurant Manager','Manager','Cover a 120-cover restaurant for a relief week: floor leadership and service standards.','Address Downtown','Business Bay',850,'day',now()+interval '48 hours','Business formal',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Bar Manager','Manager','Own bar operations for a two-week pop-up concept.','City Walk pop-up','City Walk',780,'day',now()+interval '72 hours','Smart casual',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000002','Events Manager','Manager','Run a 400-guest corporate gala end to end.','Madinat Jumeirah','Umm Suqeim',920,'day',now()+interval '60 hours','Business formal',false,false,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','F&B Supervisor','Supervisor','Supervise floor and bar teams for a hotel banquet.','Address Downtown','Downtown Dubai',300,'shift',now()+interval '12 hours','Black tie',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000005','Tandoor Chef','Chef de Partie','Live tandoor station for a 300-guest Indian wedding.','Al Barsha Banqueting','Al Barsha',290,'shift',now()+interval '33 hours','Chef whites',false,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000003','Kitchen Steward','Steward','Wash-up, hygiene and pot-wash for a large banquet service.','Address Downtown','Downtown Dubai',120,'shift',now()+interval '8 hours','Kitchen kit',true,true,'open'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Pizza Chef','Chef de Partie','Wood-fired pizza station at a family beach festival.','Atlantis The Palm','Palm Jumeirah',240,'shift',now()+interval '34 hours','Chef whites',false,true,'open');
