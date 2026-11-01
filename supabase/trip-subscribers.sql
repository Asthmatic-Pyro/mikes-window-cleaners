-- Trip email updates list (confirm-only). Run in Supabase SQL editor.

create table if not exists public.trip_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token text not null unique,
  unsubscribe_token text not null unique,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trip_subscribers_email_idx
  on public.trip_subscribers (lower(email));

create index if not exists trip_subscribers_status_idx
  on public.trip_subscribers (status);

-- Giveaway fields on site_settings
alter table public.site_settings
  add column if not exists giveaway_ends_at date not null default '2026-12-31';

alter table public.site_settings
  add column if not exists giveaway_winner_email text not null default '';

alter table public.site_settings
  add column if not exists giveaway_winner_name text not null default '';

alter table public.site_settings
  add column if not exists giveaway_drawn_at timestamptz;

-- Service role writes only; no public insert/update/select for subscribers
alter table public.trip_subscribers enable row level security;

-- Create the policy only if missing (avoids DROP POLICY warnings in the SQL editor)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trip_subscribers'
      and policyname = 'Admins read trip subscribers'
  ) then
    create policy "Admins read trip subscribers"
      on public.trip_subscribers for select
      using (public.is_admin());
  end if;
end $$;
