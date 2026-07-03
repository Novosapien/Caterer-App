-- Caterer Dubai prototype — schema (see spec.md § Data contract).
-- Prototype: RLS enabled with permissive policies; the app uses the service-role client
-- for writes. Do NOT treat this as production-hardened.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
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
  unique (job_id, candidate_profile_id)   -- accept/decline upserts on this target
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Single active thread per phone (newest-notification-wins); routes inbound WhatsApp.
create table if not exists whatsapp_threads (
  thread_key text primary key,            -- '{candidate_profile_id}:{job_id}'
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

-- ---------------------------------------------------------------------------
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
