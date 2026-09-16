# Dew — backend (Supabase / Postgres)

Phase 1 of the real-launch backend. This folder is the **single source of truth for the database**,
shared by the mobile app (and reusable by anything else). The Vite app at the repo root is left
untouched as the visual/UX reference.

## What's here

| File | Purpose |
|---|---|
| `migrations/20260912090000_init_schema.sql` | Tables, enums, indexes, `updated_at` triggers |
| `migrations/20260912090100_security.sql` | Row-Level Security policies, privileges, signup trigger |
| `seed/` | Catalog import (generated from the app's product data — coming next) |

## The security model (the important part)

Everything is login-gated (`anon` gets nothing). For a signed-in user:

- **Your own data** — full control (create/read/update/delete).
- **Followers can read** your shelf (`rankings`), feed (`rank_events`, `posts`), and routines — never write.
- **Private, owner-only** — `skin_profiles`, `daily_logs`, `trials`/`trial_checkins`. Skin data never leaves you.
- **Catalog** (`products`) — readable by everyone signed in. Community adds are owner-editable and start
  `status = 'pending'` for moderation.
- **Follow graph** (`follows`) — public within the app (needed for follower counts / mutuals), writable only as yourself.

Enforced in Postgres via RLS, so the rules hold no matter what the client does.

## What you need to do (the parts I can't)

1. **Create a Supabase project** at https://supabase.com (free tier is fine to start).
2. **Apply the migrations** — either:
   - **CLI (recommended):** `npm i -g supabase`, then `supabase link --project-ref <ref>` and `supabase db push`, **or**
   - **Dashboard:** paste each migration file into the SQL Editor in order and run.
3. **Enable Google auth:** Supabase → Authentication → Providers → Google. You'll create a Google Cloud
   OAuth client and paste its ID/secret here (I'll give exact steps when we wire auth). Add the mobile
   redirect (`dew://auth-callback`) to the allowed redirect URLs.
4. **Share the two PUBLIC values** so I can wire the app: **Project URL** and **anon/public key**
   (these are safe to commit to the app's env). **Keep the `service_role` key secret** — never paste it
   to me or into the client; it bypasses RLS.

## Not yet (tracked for the next steps)

- Seed the ~1,164-product catalog into `products` (I'll generate `seed/catalog.sql` from the app's data).
- Server-authoritative ranking/taste-match via Postgres functions + Edge Functions (so the moat can't be spoofed client-side).
- Storage buckets for user/product photos, with signed uploads.
- Moderation tables + report flow for community adds and comments.
- `invites` table if we bring back the invite loop.
