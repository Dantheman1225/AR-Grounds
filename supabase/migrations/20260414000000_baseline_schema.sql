-- Baseline schema for the Argrounds Supabase project (ref eldlzdyqntbymmoxykff).
--
-- This file was reconstructed from the live database on 2026-08-17. The tables
-- were originally created by hand in the SQL editor, so the project had no
-- migration history and no way to rebuild the schema from source. It is dated
-- 2026-04-14 to match the day the project and its tables were created.
--
-- Every statement is idempotent, so applying this against the existing project
-- is a no-op and applying it to an empty project reproduces the schema.

create extension if not exists pgcrypto;

-- Leads captured by the public quote form on argrounds.com. The utm_/gclid/
-- fbclid/client_id columns carry attribution for the ad campaigns that produced
-- the lead.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  service text,
  size text,
  timing text,
  message text,
  status text not null default 'new',
  source text default 'quote_form',
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  client_id text,
  session_id text,
  user_agent text,
  page_path text,
  created_at timestamptz default now()
);

-- A lead becomes a customer once the work is agreed. lead_id is nullable and
-- ON DELETE SET NULL so deleting a lead never destroys customer history.
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete cascade,
  service text,
  status text default 'scheduled',
  price numeric,
  scheduled_at timestamptz,
  completed_at timestamptz,
  notes text,
  stripe_link text,
  created_at timestamptz default now()
);

-- storage_path points at an object in Supabase Storage rather than holding the
-- image, so the row stays small.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs (id) on delete cascade,
  storage_path text not null,
  label text,
  type text,
  uploaded_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs (id) on delete cascade,
  amount numeric,
  stripe_link text,
  status text default 'sent',
  sent_at timestamptz default now(),
  paid_at timestamptz
);

create index if not exists leads_status_idx on public.leads using btree (status);
create index if not exists leads_created_idx on public.leads using btree (created_at desc);
create index if not exists jobs_customer_idx on public.jobs using btree (customer_id);
create index if not exists photos_job_idx on public.photos using btree (job_id);
create index if not exists payments_job_idx on public.payments using btree (job_id);

alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.photos enable row level security;
alter table public.payments enable row level security;

-- Only `leads` carries policies, because it is the only table an untrusted
-- client touches: the public quote form inserts with the anon key.
--
-- customers, jobs, photos and payments are intentionally left with RLS enabled
-- and no policies, which denies anon and authenticated outright. The site's
-- Pages Functions reach them with the service-role key, which bypasses RLS, so
-- deny-all costs nothing and keeps customer contact details, job prices and
-- payment records unreachable from a browser-side key. The Supabase linter
-- reports this as `rls_enabled_no_policy` at INFO level; that finding is the
-- intended state, not a gap. Add a policy only when a table genuinely has to be
-- read with a user session.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads'
      and policyname = 'Public can insert leads'
  ) then
    create policy "Public can insert leads" on public.leads
      for insert to anon with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads'
      and policyname = 'Authenticated full access'
  ) then
    create policy "Authenticated full access" on public.leads
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads'
      and policyname = 'Service role full access'
  ) then
    create policy "Service role full access" on public.leads
      for all to service_role using (true) with check (true);
  end if;
end $$;
