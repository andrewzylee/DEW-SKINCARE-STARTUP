-- DEW — initial schema (Supabase / Postgres). Phase 1 of the real-launch backend.
--
-- Relational model for the taste-graph: profiles, skin profiles, products (catalog +
-- community adds), rankings (the Shelf), ranking events + posts (the feed), daily logs,
-- routines, trials, and the follow graph. Mirrors the shapes in src/state/store.tsx so the
-- client can move from localStorage to Postgres with a thin data layer.
--
-- Security (Row-Level Security) is defined in the companion 20260912090100_security.sql —
-- RLS is enabled on every table there, so nothing is readable/writable until a policy allows it.

create extension if not exists pgcrypto;  -- gen_random_uuid()
create extension if not exists citext;    -- case-insensitive @handles

-- ------------------------------------------------------------------ enums
create type skin_type    as enum ('oily', 'dry', 'combination', 'sensitive');
create type tone         as enum ('fair', 'light', 'medium', 'tan', 'deep');
create type undertone    as enum ('warm', 'cool', 'neutral');
create type time_of_day  as enum ('am', 'pm', 'any');
create type reaction     as enum ('love', 'like', 'fine', 'dislike', 'never');
create type trial_status as enum ('active', 'completed', 'abandoned');
create type post_type    as enum ('ranking', 'trial_update', 'routine', 'recommend');

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------------ profiles (public identity)
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  handle       citext unique not null,
  display_name text not null default 'You',
  bio          text not null default '',
  location     text not null default '',
  avatar_url   text,
  school       text,
  member_since timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9_.]{2,24}$')
);
create trigger profiles_set_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ skin profiles (SENSITIVE — owner-only)
create table public.skin_profiles (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  skin_type  skin_type,
  tone       tone,
  undertone  undertone,
  goal       text,
  interests  text[] not null default '{}',
  avoid      text[] not null default '{}',   -- ingredient ids the user reacts to
  shades     jsonb  not null default '[]',    -- self-logged cross-brand shade matches
  updated_at timestamptz not null default now()
);
create trigger skin_profiles_set_updated before update on public.skin_profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ products (catalog + community adds)
create table public.products (
  id          text primary key,                 -- stable slug ('cerave-foaming-cleanser')
  brand       text not null,
  name        text not null,
  category    text not null,                    -- a categories lookup table is a fast-follow
  domain      text not null default 'skincare', -- skincare | makeup | fragrance
  price       numeric(10,2),
  time_of_day time_of_day not null default 'any',
  image_url   text,
  blurb       text,
  style_tags  text[] not null default '{}',
  is_custom   boolean not null default false,
  created_by  uuid references public.profiles (id) on delete set null,
  status      text not null default 'approved', -- community adds start 'pending' (moderation)
  created_at  timestamptz not null default now()
);
create index products_category_idx on public.products (category);
create index products_domain_idx   on public.products (domain);
create index products_created_by_idx on public.products (created_by);

-- ------------------------------------------------------------------ rankings (the Shelf)
create table public.rankings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  position   double precision not null,  -- global order; fractional so reorders don't renumber
  reaction   reaction,
  strength   text,                       -- "how close?" gap to the item above (union tightened later)
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index rankings_user_idx    on public.rankings (user_id, position);
create index rankings_product_idx on public.rankings (product_id);
create trigger rankings_set_updated before update on public.rankings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ rank events (auto feed of changes)
create table public.rank_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  category   text not null,
  from_rank  int,        -- null = newly ranked
  to_rank    int  not null,
  group_size int  not null,
  reaction   reaction,
  reason     text,
  created_at timestamptz not null default now()
);
create index rank_events_user_idx on public.rank_events (user_id, created_at desc);

-- ------------------------------------------------------------------ posts (explicit shares w/ commentary)
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       post_type not null default 'ranking',
  product_id text references public.products (id) on delete cascade,
  tier       text,
  note       text,
  standout   text,
  created_at timestamptz not null default now()
);
create index posts_user_idx on public.posts (user_id, created_at desc);

-- ------------------------------------------------------------------ comments
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

-- ------------------------------------------------------------------ post likes
create table public.post_likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ------------------------------------------------------------------ daily logs (PRIVATE)
create table public.daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  log_date    date not null,
  skin_rating int check (skin_rating between 0 and 4),
  note        text,
  logged      boolean not null default false,
  used_am     text[] not null default '{}',
  used_pm     text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  unique (user_id, log_date)
);
create trigger daily_logs_set_updated before update on public.daily_logs
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ routine items (AM / PM)
create table public.routine_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  period     text not null check (period in ('am', 'pm')),
  product_id text not null references public.products (id) on delete cascade,
  position   double precision not null,
  created_at timestamptz not null default now(),
  unique (user_id, period, product_id)
);
create index routine_items_user_idx on public.routine_items (user_id, period, position);

-- ------------------------------------------------------------------ trials (PRIVATE) + checkins
create table public.trials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  text not null references public.products (id) on delete cascade,
  start_date  date not null default current_date,
  target_days int  not null default 42,
  status      trial_status not null default 'active',
  verdict     jsonb,        -- { overall:int, repurchase:bool, note:text }
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index trials_user_idx on public.trials (user_id);
create trigger trials_set_updated before update on public.trials
  for each row execute function public.set_updated_at();

create table public.trial_checkins (
  id         uuid primary key default gen_random_uuid(),
  trial_id   uuid not null references public.trials (id) on delete cascade,
  check_date date not null,
  texture    int, breakouts int, dryness int, redness int,  -- -1 worse · 0 same · +1 better
  note       text,
  created_at timestamptz not null default now(),
  unique (trial_id, check_date)
);

-- ------------------------------------------------------------------ follows (the friend graph)
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint no_self_follow check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);
