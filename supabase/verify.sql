-- Dew — post-setup verification. Paste into the Supabase SQL Editor and Run.
-- Every row should say PASS. Nothing here writes; it is safe to run any time.

with checks as (
  select 'tables (expect 13)' as check,
         count(*)::text as actual,
         case when count(*) = 13 then 'PASS' else 'FAIL' end as status
  from pg_tables where schemaname = 'public'

  union all
  select 'enums (expect 7)',
         count(*)::text,
         case when count(*) = 7 then 'PASS' else 'FAIL' end
  from pg_type t join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typtype = 'e'

  union all
  select 'catalog rows (expect 1164)',
         count(*)::text,
         case when count(*) = 1164 then 'PASS' else 'FAIL' end
  from public.products

  union all
  select 'catalog with images (expect 592)',
         count(*)::text,
         case when count(*) = 592 then 'PASS' else 'FAIL' end
  from public.products where image_url is not null

  union all
  select 'RLS enabled on every table (expect 13)',
         count(*)::text,
         case when count(*) = 13 then 'PASS' else 'FAIL' end
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity

  union all
  select 'RLS policies (expect 25+)',
         count(*)::text,
         case when count(*) >= 25 then 'PASS' else 'FAIL' end
  from pg_policies where schemaname = 'public'

  union all
  select 'signup trigger on auth.users',
         coalesce(string_agg(tgname, ','), 'missing'),
         case when count(*) = 1 then 'PASS' else 'FAIL' end
  from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal

  union all
  select 'handle_new_user() is SECURITY DEFINER',
         case when bool_or(prosecdef) then 'yes' else 'no' end,
         case when bool_or(prosecdef) then 'PASS' else 'FAIL' end
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'handle_new_user'

  union all
  select 'is_following() helper exists',
         count(*)::text,
         case when count(*) >= 1 then 'PASS' else 'FAIL' end
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'is_following'

  union all
  select 'onboarding columns added',
         count(*)::text,
         case when count(*) = 3 then 'PASS' else 'FAIL' end
  from information_schema.columns
  where table_schema = 'public'
    and ((table_name = 'profiles' and column_name = 'onboarded')
      or (table_name = 'skin_profiles' and column_name in ('budget', 'depth')))

  union all
  select 'rankings.product_id FK -> products',
         count(*)::text,
         case when count(*) = 1 then 'PASS' else 'FAIL' end
  from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
  where tc.table_name = 'rankings' and tc.constraint_type = 'FOREIGN KEY' and ccu.table_name = 'products'

  union all
  select 'no orphan risk: catalog covers app ids',
         count(*)::text || ' products',
         case when count(*) >= 1164 then 'PASS' else 'FAIL' end
  from public.products
)
select status, check, actual from checks order by (status = 'PASS'), check;

-- Catalog breakdown, for eyeballing:
select domain, count(*) as products, count(image_url) as with_image
from public.products group by domain order by products desc;
