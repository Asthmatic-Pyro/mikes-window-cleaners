-- Additive: photo on a name-on-car claim (paste in Supabase SQL Editor).
-- Supporters can request a name. Only an admin (or the server) can attach a photo.

alter table public.name_claims
  add column if not exists image_url text;

create or replace function public.name_claim_admin_photos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.image_url := null;
  if new.payment_note is not null then
    new.payment_note := regexp_replace(new.payment_note, '(^|\n)image:https?://\S+', '', 'g');
    new.payment_note := nullif(btrim(new.payment_note), '');
  end if;
  return new;
end;
$$;

drop trigger if exists name_claims_admin_photos on public.name_claims;
create trigger name_claims_admin_photos
  before insert or update of image_url, payment_note on public.name_claims
  for each row execute function public.name_claim_admin_photos();
