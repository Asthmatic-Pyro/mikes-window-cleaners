-- Additive: allow nested guestbook replies (paste in Supabase SQL Editor).
-- Replaces the one-level-deep guard; thread_root_id still points at the root note.

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
  new.thread_root_id := coalesce(parent.thread_root_id, parent.id);
  return new;
end;
$$;
