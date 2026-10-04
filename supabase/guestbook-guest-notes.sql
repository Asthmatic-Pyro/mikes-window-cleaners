-- Additive: guestbook notes without an account (paste in Supabase SQL Editor).
-- Logged-in notes still use author_id. Guests send display_name through /api/wall-note.

alter table public.wall_posts alter column author_id drop not null;

alter table public.wall_posts
  add column if not exists display_name text;

alter table public.wall_posts drop constraint if exists wall_posts_display_name_len;
alter table public.wall_posts
  add constraint wall_posts_display_name_len
  check (display_name is null or (char_length(display_name) > 0 and char_length(display_name) <= 40));
