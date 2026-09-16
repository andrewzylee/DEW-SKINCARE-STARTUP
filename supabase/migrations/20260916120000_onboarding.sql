-- Onboarding: mark completion on the profile, and store the extra quiz fields on skin_profiles.
alter table public.profiles add column if not exists onboarded boolean not null default false;
alter table public.skin_profiles add column if not exists budget text;
alter table public.skin_profiles add column if not exists depth text;
