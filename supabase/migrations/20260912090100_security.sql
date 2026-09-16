-- DEW — Row-Level Security. Companion to 20260912090000_init_schema.sql.
--
-- Model: the app is login-gated, so `anon` gets nothing; `authenticated` gets table privileges
-- but every row is still gated by the policies below.
--   • You always have full control of your own rows.
--   • Followers can READ your shelf / feed / routines (the social graph) but never write them.
--   • Skin profiles, daily logs, and trials are PRIVATE (owner-only) — sensitive skin data.
--   • The product catalog is readable by everyone signed in; community adds are owner-editable
--     and start life as 'pending' for moderation.

-- ------------------------------------------------------------------ visibility helper
-- SECURITY DEFINER so it can read follows without tripping that table's own RLS (and to avoid
-- recursive policy evaluation). Returns true if the current user follows `target`.
create or replace function public.is_following(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows
    where follower_id = auth.uid() and followee_id = target
  );
$$;

-- ------------------------------------------------------------------ table privileges (RLS still applies)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ------------------------------------------------------------------ enable RLS everywhere
alter table public.profiles       enable row level security;
alter table public.skin_profiles  enable row level security;
alter table public.products       enable row level security;
alter table public.rankings       enable row level security;
alter table public.rank_events    enable row level security;
alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.post_likes     enable row level security;
alter table public.daily_logs     enable row level security;
alter table public.routine_items  enable row level security;
alter table public.trials         enable row level security;
alter table public.trial_checkins enable row level security;
alter table public.follows        enable row level security;

-- ------------------------------------------------------------------ profiles (public identity)
create policy profiles_read   on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------------ skin profiles (PRIVATE)
create policy skin_owner on public.skin_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------ products (catalog + community adds)
create policy products_read on public.products for select to authenticated
  using (status = 'approved' or created_by = auth.uid());
create policy products_insert on public.products for insert to authenticated
  with check (created_by = auth.uid() and is_custom = true);
create policy products_update on public.products for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy products_delete on public.products for delete to authenticated
  using (created_by = auth.uid());

-- ------------------------------------------------------------------ rankings (you + people you follow)
create policy rankings_read on public.rankings for select to authenticated
  using (user_id = auth.uid() or public.is_following(user_id));
create policy rankings_write on public.rankings for insert to authenticated
  with check (user_id = auth.uid());
create policy rankings_update on public.rankings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rankings_delete on public.rankings for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ rank events (feed)
create policy rank_events_read on public.rank_events for select to authenticated
  using (user_id = auth.uid() or public.is_following(user_id));
create policy rank_events_write on public.rank_events for insert to authenticated
  with check (user_id = auth.uid());

-- ------------------------------------------------------------------ posts (feed)
create policy posts_read on public.posts for select to authenticated
  using (user_id = auth.uid() or public.is_following(user_id));
create policy posts_write on public.posts for insert to authenticated
  with check (user_id = auth.uid());
create policy posts_update on public.posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ comments (visible if you can see the post)
create policy comments_read on public.comments for select to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and (p.user_id = auth.uid() or public.is_following(p.user_id))
  ));
create policy comments_write on public.comments for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.posts p
    where p.id = post_id and (p.user_id = auth.uid() or public.is_following(p.user_id))
  ));
create policy comments_delete on public.comments for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ post likes
create policy post_likes_read on public.post_likes for select to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and (p.user_id = auth.uid() or public.is_following(p.user_id))
  ));
create policy post_likes_write on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy post_likes_delete on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ daily logs (PRIVATE)
create policy daily_logs_owner on public.daily_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------ routine items (you + followers read)
create policy routine_read on public.routine_items for select to authenticated
  using (user_id = auth.uid() or public.is_following(user_id));
create policy routine_write on public.routine_items for insert to authenticated
  with check (user_id = auth.uid());
create policy routine_update on public.routine_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy routine_delete on public.routine_items for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ trials + checkins (PRIVATE)
create policy trials_owner on public.trials for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy trial_checkins_owner on public.trial_checkins for all to authenticated
  using (exists (select 1 from public.trials t where t.id = trial_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trials t where t.id = trial_id and t.user_id = auth.uid()));

-- ------------------------------------------------------------------ follows (public graph)
create policy follows_read on public.follows for select to authenticated using (true);
create policy follows_write on public.follows for insert to authenticated
  with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete to authenticated
  using (follower_id = auth.uid());

-- ------------------------------------------------------------------ auto-create a profile on signup
-- New auth user → a profiles row with a guaranteed-valid, unique placeholder @handle the user
-- customizes during onboarding. Google gives us name + avatar in user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    'dew' || substr(replace(new.id::text, '-', ''), 1, 10),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'You'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
