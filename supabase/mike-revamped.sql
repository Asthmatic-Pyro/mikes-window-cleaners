-- Paste in Supabase SQL Editor if the live project was not migrated via MCP.
-- Mike-revamped: immediate public pin, guestbook threads, reactions, testimonials.

create table if not exists public.location_public (
  id int primary key default 1 check (id = 1),
  city_label text not null default 'On the road',
  lat double precision not null default 39.1031,
  lng double precision not null default -84.5120,
  published_at timestamptz not null default now()
);

insert into public.location_public (id, city_label, lat, lng, published_at)
select 1, city_label, lat, lng, now() from public.location_current where id = 1
on conflict (id) do nothing;

alter table public.location_public enable row level security;

drop policy if exists "Public location is readable" on public.location_public;
create policy "Public location is readable"
  on public.location_public for select using (true);

drop policy if exists "Admins manage public location" on public.location_public;
create policy "Admins manage public location"
  on public.location_public for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.promote_public_location_now()
returns public.location_public
language plpgsql
security definer
set search_path = public
as $$
declare
  src public.location_current;
  dest public.location_public;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not allowed';
  end if;
  select * into strict src from public.location_current where id = 1;
  insert into public.location_public (id, city_label, lat, lng, published_at)
  values (1, src.city_label, src.lat, src.lng, now())
  on conflict (id) do update
    set city_label = excluded.city_label,
        lat = excluded.lat,
        lng = excluded.lng,
        published_at = excluded.published_at
  returning * into dest;
  return dest;
end;
$$;

grant execute on function public.promote_public_location_now() to authenticated;

alter table public.wall_posts
  add column if not exists parent_id uuid references public.wall_posts(id) on delete cascade;
alter table public.wall_posts
  add column if not exists thread_root_id uuid references public.wall_posts(id) on delete cascade;

create index if not exists wall_posts_parent_idx on public.wall_posts (parent_id);
create index if not exists wall_posts_thread_idx on public.wall_posts (thread_root_id);

create or replace function public.wall_post_set_thread()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent public.wall_posts;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;
  if new.parent_id is null then
    new.thread_root_id := new.id;
    return new;
  end if;
  select * into parent from public.wall_posts where id = new.parent_id;
  if parent is null then
    raise exception 'parent missing';
  end if;
  if parent.parent_id is not null then
    raise exception 'replies are only one level deep';
  end if;
  new.thread_root_id := coalesce(parent.thread_root_id, parent.id);
  return new;
end;
$$;

drop trigger if exists wall_posts_set_thread on public.wall_posts;
create trigger wall_posts_set_thread
  before insert on public.wall_posts
  for each row execute function public.wall_post_set_thread();

alter table public.reactions drop constraint if exists reactions_reaction_type_check;
alter table public.reactions add constraint reactions_reaction_type_check
  check (reaction_type in ('like', 'cheer', 'fire', 'laugh', 'sad', 'wave'));

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default '',
  city text,
  answers jsonb not null default '{}'::jsonb,
  draft_text text not null default '',
  final_text text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending_hitl', 'published', 'rejected')),
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.testimonials enable row level security;

drop policy if exists "Published testimonials are public" on public.testimonials;
create policy "Published testimonials are public"
  on public.testimonials for select
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins manage testimonials" on public.testimonials;
create policy "Admins manage testimonials"
  on public.testimonials for all
  using (public.is_admin())
  with check (public.is_admin());
