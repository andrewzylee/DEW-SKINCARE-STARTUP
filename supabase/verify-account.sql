-- Dew — verify a real signed-up account wrote correctly. Run in the SQL Editor after signing in
-- and completing onboarding. Reads only; safe to run repeatedly.

-- 1. The auth user and the profile the trigger should have minted for it.
select
  u.email,
  u.email_confirmed_at is not null            as email_confirmed,
  p.id is not null                            as profile_row_created,
  p.handle,
  p.handle ~ '^[a-z0-9_.]{2,24}$'             as handle_valid,
  p.display_name,
  p.onboarded
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;

-- 2. The skin profile onboarding should have written (empty until you finish the quiz).
select user_id, skin_type, tone, undertone, goal, budget, depth, interests
from public.skin_profiles;

-- 3. Your shelf. Rank something in the app, then re-run this — rows should appear.
--    Before the full seed this insert would have failed with FK 23503 and been swallowed.
select r.position, r.product_id, pr.brand, pr.name, r.reaction, r.strength
from public.rankings r
join public.products pr on pr.id = r.product_id
order by r.position;

-- 4. Counts at a glance.
select
  (select count(*) from auth.users)          as auth_users,
  (select count(*) from public.profiles)     as profiles,
  (select count(*) from public.skin_profiles) as skin_profiles,
  (select count(*) from public.rankings)     as rankings,
  (select count(*) from public.products)     as products;
