#!/usr/bin/env node
/**
 * Fails a release build that would ship in Demo Mode.
 *
 * EXPO_PUBLIC_* variables are inlined at build time, and mobile/.env is gitignored so it never
 * reaches the EAS build server. Without this guard, `eas build --profile production` happily
 * produces a store binary where isSupabaseConfigured is false — the app would ship with a DEMO
 * MODE badge, a fabricated social graph and no backend, which is an App Store 2.1 rejection.
 *
 * Runs automatically on EAS via the `eas-build-pre-install` npm hook. Only enforced for the
 * profiles that produce shippable binaries; `development` and `simulator` may run in Demo Mode.
 */

const ENFORCED_PROFILES = new Set(['preview', 'production']);

const profile = process.env.EAS_BUILD_PROFILE;
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Local runs (no profile) check nothing unless asked explicitly with --force.
const forced = process.argv.includes('--force');
if (!forced && !ENFORCED_PROFILES.has(profile)) {
  console.log(`[check-release-env] profile "${profile ?? 'none'}" — Demo Mode allowed, skipping.`);
  process.exit(0);
}

const problems = [];

if (!url) {
  problems.push('EXPO_PUBLIC_SUPABASE_URL is not set.');
} else if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url)) {
  problems.push(`EXPO_PUBLIC_SUPABASE_URL does not look like a Supabase project URL: "${url}"`);
}

if (!key) {
  problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.');
} else if (key.includes('paste-your')) {
  problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is still the placeholder from .env.example.');
} else if (!/^(sb_publishable_[A-Za-z0-9_-]+|[\w-]+\.[\w-]+\.[\w-]+)$/.test(key)) {
  problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is neither a JWT nor an sb_publishable_ key.');
}

if (problems.length) {
  console.error('\n────────────────────────────────────────────────────────────');
  console.error(` Refusing to build profile "${profile}" — it would ship Demo Mode.`);
  console.error('────────────────────────────────────────────────────────────');
  problems.forEach((p) => console.error(`  • ${p}`));
  console.error('\n Set them as EAS environment variables (they are public values —');
  console.error(' RLS is what protects the data — but they must reach the build server):');
  console.error('\n   eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co');
  console.error('   eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key>');
  console.error('\n Never put the service_role key here — it bypasses RLS.\n');
  process.exit(1);
}

console.log(`[check-release-env] profile "${profile}" — Supabase config present. OK.`);
