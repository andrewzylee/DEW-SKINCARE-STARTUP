# Building Dew

The app uses Expo's Continuous Native Generation — there is no `ios/` or `android/` directory in the
repo on purpose. EAS generates them on its build machines from `app.json` every time. Don't commit
them; if you ever run `npx expo prebuild` locally to inspect the output, delete the folders after.

**You do not need a Mac.** EAS builds iOS on its own macOS machines. (You can't run
`expo prebuild --platform ios` on Windows, but you don't need to.)

## One-time setup

```bash
npm install -g eas-cli
```

```bash
eas login
```

```bash
eas init
```

`eas init` creates the EAS project and writes `extra.eas.projectId` into `app.json`. Commit that.

## Environment variables — read this before your first release build

`EXPO_PUBLIC_*` values are **inlined at build time**. `mobile/.env` is gitignored, so it never
reaches the EAS build server. Without the variables set on EAS, a production build silently ships in
Demo Mode — fabricated social graph, `DEMO MODE` badge, no backend. That is an App Store 2.1
rejection.

`scripts/check-release-env.js` runs automatically via the `eas-build-pre-install` hook and **fails
the build** rather than letting that happen. To satisfy it:

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co
```

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your anon key>
```

Repeat with `--environment preview` for preview builds. Both values are public — row-level security
is what protects the data. **Never** put the `service_role` key here; it bypasses RLS.

Check locally any time:

```bash
npm run check:release-env
```

## Build profiles

| Profile | What it makes | Needs |
|---|---|---|
| `development` | Dev client, installs on your own device, Metro attaches | Apple acct (iOS only) |
| `simulator` | iOS simulator build | Apple acct |
| `preview` | Standalone APK / internal iOS build — real app, no store | Apple acct (iOS only) |
| `production` | AAB for Play, IPA for App Store | Both accounts |

Demo Mode is allowed on `development` and `simulator`; it is blocked on `preview` and `production`.

## First build

Android needs no paid account for a `preview` APK you sideload — start there:

```bash
eas build --profile preview --platform android
```

Then iOS, once you're enrolled in the Apple Developer Program:

```bash
eas build --profile development --platform ios
```

EAS will offer to generate and manage signing credentials. Let it — say yes to the keystore and to
the provisioning profile. They're stored on EAS and reused.

## Versioning

`cli.appVersionSource` is `"remote"`, so EAS owns `versionCode` / `buildNumber` and bumps them on
every `production` build (`autoIncrement: true`). Don't hand-edit them in `app.json`. The
user-facing `version` ("1.0.0") is still yours to set manually.

## Submitting

```bash
eas submit --platform android --latest
```

```bash
eas submit --platform ios --latest
```

## Before you spend money on any of this

The build pipeline is ready; the *app* is not submittable yet. Still outstanding and not fixable
here: a real app icon (the current one is Expo's stock template art), a hosted privacy policy and
terms, in-app account deletion, Sign in with Apple, UGC reporting/blocking, a live Supabase project,
and removing the fabricated social graph. Google Play additionally requires a closed test with 12
testers for 14 continuous days before granting production access to new personal accounts — start
that clock as early as you can with a `preview` build.

## Health checks

```bash
npm run doctor && npm run typecheck
```
