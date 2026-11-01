-- Hide emails from public (anon) HTML / API reads.
-- Run in Supabase SQL editor.

-- 1) Profiles: only the signed-in user or an admin can read rows (includes email).
--    Public pages already store display names on wall posts / claims.
drop policy if exists "Profiles are publicly readable" on public.profiles;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users read own profile'
  ) then
    create policy "Users read own profile"
      on public.profiles for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Admins read all profiles'
  ) then
    create policy "Admins read all profiles"
      on public.profiles for select
      using (public.is_admin());
  end if;
end $$;

-- 2) Site settings: public view omits giveaway_winner_email.
create or replace view public.site_settings_public
with (security_invoker = false)
as
select
  id,
  streamelements_url,
  buy_me_a_coffee_url,
  cash_app_url,
  cash_app_tag,
  venmo_url,
  venmo_tag,
  amazon_wishlist_url,
  mailbox_address,
  mailbox_notes,
  giveaway_ends_at,
  giveaway_winner_name,
  giveaway_drawn_at,
  updated_at
from public.site_settings
where id = 1;

grant select on public.site_settings_public to anon, authenticated, service_role;

drop policy if exists "Settings are public" on public.site_settings;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'site_settings'
      and policyname = 'Admins read site settings'
  ) then
    create policy "Admins read site settings"
      on public.site_settings for select
      using (public.is_admin());
  end if;
end $$;

-- Keep existing "Admins manage settings" / update policies as-is.
