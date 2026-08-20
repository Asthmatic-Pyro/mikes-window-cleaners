-- /Follow schema for Mike's Window Cleaners
-- Run in Supabase SQL Editor, then set Storage policies for post-images.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default '',
  notify_opt_in boolean not null default false,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Current city/area location (single row)
create table if not exists public.location_current (
  id int primary key default 1 check (id = 1),
  city_label text not null default 'On the road',
  lat double precision not null default 39.1031,
  lng double precision not null default -84.5120,
  updated_at timestamptz not null default now()
);

insert into public.location_current (id, city_label, lat, lng)
values (1, 'Cincinnati, OH', 39.1031, -84.5120)
on conflict (id) do nothing;

-- Destinations
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'current', 'done')),
  sort_order int not null default 0,
  city_label text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- Mike's updates / blog posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Community wall
create table if not exists public.wall_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 280),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wall_posts_created_at_idx on public.wall_posts (created_at desc);
create index if not exists wall_posts_author_created_idx on public.wall_posts (author_id, created_at desc);

-- Reactions (like / cheer) on posts or wall posts
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'wall')),
  target_id uuid not null,
  reaction_type text not null check (reaction_type in ('like', 'cheer')),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id, reaction_type)
);

create index if not exists reactions_target_idx on public.reactions (target_type, target_id);

-- Name-on-car claims
create table if not exists public.name_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  amount numeric(10, 2) not null check (amount > 0),
  tier text not null check (tier in ('car', 'windshield')),
  payment_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Site settings (support links + mailbox copy)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  streamelements_url text not null default '',
  buy_me_a_coffee_url text not null default '',
  cash_app_url text not null default '',
  cash_app_tag text not null default '',
  venmo_url text not null default '',
  venmo_tag text not null default '',
  amazon_wishlist_url text not null default '',
  mailbox_address text not null default '',
  mailbox_notes text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

-- Notification dedupe log
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_key text not null,
  sent_at timestamptz not null default now(),
  unique (event_type, event_key)
);

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text := lower(trim(coalesce(current_setting('app.admin_email', true), '')));
  user_email text := lower(trim(coalesce(new.email, '')));
  initial_role text := 'member';
begin
  -- Optional: set app.admin_email in DB, or promote manually after signup:
  --   update profiles set role = 'admin' where email = 'you@example.com';
  if admin_email <> '' and user_email = admin_email then
    initial_role := 'admin';
  end if;

  insert into public.profiles (id, email, display_name, notify_opt_in, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'friend'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'notify_opt_in', 'false') = 'true',
    initial_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Auto tier from amount on insert/update if client sends wrong tier
create or replace function public.name_claim_set_tier()
returns trigger
language plpgsql
as $$
begin
  if new.amount >= 100 then
    new.tier := 'windshield';
  else
    new.tier := 'car';
  end if;
  return new;
end;
$$;

drop trigger if exists name_claims_tier on public.name_claims;
create trigger name_claims_tier
  before insert or update of amount on public.name_claims
  for each row execute function public.name_claim_set_tier();

-- Prevent non-admins from changing their own role
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- RLS
alter table public.profiles enable row level security;
alter table public.location_current enable row level security;
alter table public.destinations enable row level security;
alter table public.posts enable row level security;
alter table public.wall_posts enable row level security;
alter table public.reactions enable row level security;
alter table public.name_claims enable row level security;
alter table public.site_settings enable row level security;
alter table public.notification_log enable row level security;

-- Profiles
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins update any profile"
  on public.profiles for update
  using (public.is_admin());

-- Location
create policy "Location is public"
  on public.location_current for select using (true);

create policy "Admins manage location"
  on public.location_current for all
  using (public.is_admin())
  with check (public.is_admin());

-- Destinations
create policy "Destinations are public"
  on public.destinations for select using (true);

create policy "Admins manage destinations"
  on public.destinations for all
  using (public.is_admin())
  with check (public.is_admin());

-- Posts
create policy "Posts are public"
  on public.posts for select using (true);

create policy "Admins manage posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- Wall
create policy "Visible wall posts are public"
  on public.wall_posts for select
  using (hidden = false or auth.uid() = author_id or public.is_admin());

create policy "Members insert wall posts"
  on public.wall_posts for insert
  with check (
    auth.uid() = author_id
    and not exists (
      select 1 from public.wall_posts w
      where w.author_id = auth.uid()
        and w.created_at > now() - interval '60 seconds'
    )
  );

create policy "Authors delete own wall posts"
  on public.wall_posts for delete
  using (auth.uid() = author_id or public.is_admin());

create policy "Admins update wall posts"
  on public.wall_posts for update
  using (public.is_admin())
  with check (public.is_admin());

-- Reactions
create policy "Reactions are public"
  on public.reactions for select using (true);

create policy "Members manage own reactions"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "Members delete own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- Name claims
create policy "Approved claims are public; own + admin see all"
  on public.name_claims for select
  using (status = 'approved' or auth.uid() = user_id or public.is_admin());

create policy "Members insert own claims"
  on public.name_claims for insert
  with check (auth.uid() = user_id);

create policy "Admins update claims"
  on public.name_claims for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Members or admins delete claims"
  on public.name_claims for delete
  using (auth.uid() = user_id or public.is_admin());

-- Settings
create policy "Settings are public"
  on public.site_settings for select using (true);

create policy "Admins manage settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Notification log: service role only (no public policies)

-- Event log + Telegram alerts
create table if not exists public.event_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  summary text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.event_log enable row level security;

create policy "Admins read event log"
  on public.event_log for select
  using (public.is_admin());

create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.site_secrets (
  key text primary key,
  value text not null
);

insert into private.site_secrets (key, value)
values
  ('telegram_webhook_url', 'https://mikeswindowcleaners.com/api/telegram-event'),
  ('telegram_webhook_secret', 'mwc_tg_wh_k9Qm2Px7Ln4Rv8Wb3Hy')
on conflict (key) do update set value = excluded.value;

create or replace function public.queue_site_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_type text;
  summary text;
  payload jsonb := '{}'::jsonb;
  hook_url text;
  hook_secret text;
begin
  if TG_TABLE_NAME = 'profiles' and TG_OP = 'INSERT' then
    event_type := 'user';
    summary := format('New user: %s (%s)', coalesce(NEW.display_name, 'unnamed'), coalesce(NEW.email, NEW.id::text));
    payload := jsonb_build_object('id', NEW.id, 'email', NEW.email, 'display_name', NEW.display_name);
  elsif TG_TABLE_NAME = 'name_claims' and TG_OP = 'INSERT' then
    event_type := 'name';
    summary := format('Name request: "%s" · $%s · %s', NEW.display_name, NEW.amount::text, NEW.tier);
    payload := jsonb_build_object('id', NEW.id, 'display_name', NEW.display_name, 'amount', NEW.amount, 'tier', NEW.tier);
  elsif TG_TABLE_NAME = 'wall_posts' and TG_OP = 'INSERT' then
    event_type := 'wall';
    summary := format('Guestbook: %s', left(NEW.body, 200));
    payload := jsonb_build_object('id', NEW.id, 'author_id', NEW.author_id, 'body', NEW.body);
  elsif TG_TABLE_NAME = 'posts' and TG_OP = 'INSERT' then
    event_type := 'post';
    summary := format('Road note: %s', NEW.title);
    payload := jsonb_build_object('id', NEW.id, 'title', NEW.title);
  elsif TG_TABLE_NAME = 'location_current' and TG_OP = 'UPDATE' then
    if NEW.city_label is not distinct from OLD.city_label
       and NEW.lat is not distinct from OLD.lat
       and NEW.lng is not distinct from OLD.lng then
      return NEW;
    end if;
    event_type := 'location';
    summary := format('Location saved: %s', NEW.city_label);
    payload := jsonb_build_object('city_label', NEW.city_label, 'lat', NEW.lat, 'lng', NEW.lng);
  else
    return coalesce(NEW, OLD);
  end if;

  select value into hook_url from private.site_secrets where key = 'telegram_webhook_url';
  select value into hook_secret from private.site_secrets where key = 'telegram_webhook_secret';
  if hook_url is null or hook_secret is null then
    return NEW;
  end if;

  perform net.http_post(
    url := hook_url,
    body := jsonb_build_object('eventType', event_type, 'summary', summary, 'payload', payload),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-telegram-secret', hook_secret)
  );
  return NEW;
exception when others then
  raise warning 'queue_site_alert: %', SQLERRM;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists profiles_site_alert on public.profiles;
create trigger profiles_site_alert
  after insert on public.profiles
  for each row execute function public.queue_site_alert();

drop trigger if exists name_claims_site_alert on public.name_claims;
create trigger name_claims_site_alert
  after insert on public.name_claims
  for each row execute function public.queue_site_alert();

drop trigger if exists wall_posts_site_alert on public.wall_posts;
create trigger wall_posts_site_alert
  after insert on public.wall_posts
  for each row execute function public.queue_site_alert();

drop trigger if exists posts_site_alert on public.posts;
create trigger posts_site_alert
  after insert on public.posts
  for each row execute function public.queue_site_alert();

drop trigger if exists location_current_site_alert on public.location_current;
create trigger location_current_site_alert
  after update on public.location_current
  for each row execute function public.queue_site_alert();

-- Storage bucket (run in dashboard or via API): post-images, public read
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Public read post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Admins upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and public.is_admin());

create policy "Admins update post images"
  on storage.objects for update
  using (bucket_id = 'post-images' and public.is_admin());

create policy "Admins delete post images"
  on storage.objects for delete
  using (bucket_id = 'post-images' and public.is_admin());
