-- Additive: let a supporter pick windshield or hatch, including without an account.
-- Paste in the Supabase SQL Editor.

alter table public.name_claims alter column user_id drop not null;

create or replace function public.name_claim_set_tier()
returns trigger
language plpgsql
as $$
begin
  if new.tier in ('car', 'windshield') then
    return new;
  end if;
  if new.amount >= 100 then
    new.tier := 'windshield';
  else
    new.tier := 'car';
  end if;
  return new;
end;
$$;
