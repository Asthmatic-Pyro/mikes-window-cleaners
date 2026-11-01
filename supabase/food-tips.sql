-- Foodies: tip / meal suggestions near Mike's current stop.
-- Run in Supabase SQL editor.

create table if not exists public.food_tips (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  place_name text not null,
  note text not null default '',
  city_label text not null,
  lat double precision,
  lng double precision,
  tip_amount numeric(10, 2),
  pay_method text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists food_tips_city_created_idx
  on public.food_tips (city_label, created_at desc);

create index if not exists food_tips_created_idx
  on public.food_tips (created_at desc);

alter table public.food_tips enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'food_tips'
      and policyname = 'Public read visible food tips'
  ) then
    create policy "Public read visible food tips"
      on public.food_tips for select
      using (hidden = false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'food_tips'
      and policyname = 'Admins read all food tips'
  ) then
    create policy "Admins read all food tips"
      on public.food_tips for select
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'food_tips'
      and policyname = 'Admins update food tips'
  ) then
    create policy "Admins update food tips"
      on public.food_tips for update
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'food_tips'
      and policyname = 'Admins delete food tips'
  ) then
    create policy "Admins delete food tips"
      on public.food_tips for delete
      using (public.is_admin());
  end if;
end $$;
