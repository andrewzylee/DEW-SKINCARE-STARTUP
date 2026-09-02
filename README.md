# STACK — your skin, sorted

A mobile-first web prototype for a **skincare app** (for everyone). It's a decision-and-record
utility — research, simplify, rank — not a social feed. The signature interaction is
**Beli-style pairwise ranking** applied to skincare.

> Prototype v0.1 · mock data only · no backend, no auth, on-device (localStorage).

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default **http://localhost:5180**). Best viewed at phone width — on a
wide screen it centers in a device frame at ~430px.

Other scripts:

```bash
npm run build   # typecheck + production build to dist/
npm run preview # serve the production build
npm run lint    # tsc --noEmit
```

## The core loop

Onboard → get your ranked starter **Stack** → **Log** what you use (streak) → **Rank** what
you've tried (tier list) → see what your **friends** love and hate.

Five tabs (Beli-style, with a prominent center **Log +**) + a first-run quiz:

- **Feed** (home) — search, For You / Trending / Friend recs chips, horizontally-scrolling
  Featured Lists (with a live "you use X of Y"), a "works for skin like yours" cohort strip, and
  a friend-activity feed (who ranked what, their tier, notes, likes). The **hamburger** opens a
  Beli-style slide-out **Menu** (invite friends, unlock pro, add your school, settings, skin
  goal, skin type, home city, concerns, ingredients to avoid, import routine, FAQ, log out…) —
  skincare-relevant items only. Skin type / concerns / home city / school are inline-editable;
  **Ingredients to avoid** is a dermatologist-grade grouped multi-select (INCI names + clinical
  notes, persisted); **Import your routine** pastes a product list, scores best-matches against
  the catalog, and adds them to your Shelf.
- **Stack** — your personalized AM/PM routine (step-numbered, product photos, one-line "why",
  price, a "using this" toggle, and lightweight swaps).
- **Log** — fast daily check-in: AM/PM checklists (with "mark all"), a no-face 5-point "skin
  today" rating, a note, and a streak ring that pops on completion.
- **Shelf** — the ranking engine + your trials. "Rank" runs pairwise
  "which did more for your skin?" comparisons (binary-search insertion, ~log₂n) into an
  **S/A/B/C/F** tier list; "Start a trial" tracks a product over time (see below).

**Skin Match + Trials (the "results, not products" layer).** Tapping any product (feed, search,
"works for skin like yours") opens a **Skin Match** sheet: a personalized 0–100 score with
reasons — ingredient/attribute-seeded so it works at n=0 (`src/lib/skinMatch.ts`), nudged by
mock community results (loved / neutral / stopped, cohort repurchase %). From there you **start
a trial**: a product tracked over a target window with periodic outcome check-ins (texture /
breakouts / dryness / redness vs. baseline) and a final **verdict** (overall 1–10 + repurchase)
that flows the product into your Shelf ranking, placed by your score. Trials live on the Shelf
("In trial") and count on your Profile.
- **Profile** — editable **photo** (on-device), @handle, bio, **followers / following**, a
  **streak & activity** card, your lists (ranked, in-routine, days logged), and Beli-style
  **Recent Activity / Playlists** tabs. Recent Activity is a feed of your own posts (reviewed a
  trial, ranked a product, checked in) each with a score/tier badge; tapping any post — here or
  in the Feed — opens a **Post detail** with the score, review, and a **comments thread** you
  can read and add to (likes + comments persist). Tapping an **avatar** (feed, comments,
  followers/following) opens that person's **friend profile** — their bio, stats, and Recent
  Activity / Playlists. The Profile also has a **Skin Wrapped** card — a Spotify-Wrapped-style
  year summary (streak, holy grails, products tried, $ spent, top brand, best skin month…)
  computed from your data and built to screenshot-share.
- **Progress** — the Feed calendar icon (and the Profile streak card) opens a month **streak
  calendar**, current/longest streak + check-in stats, and an adjustable **weekly goal** with a
  next-milestone tracker.

## Structure

```
src/
  data/mockCatalog.ts     # ~30 seed products + lookalike cohort stats (PLACEHOLDER DATA)
  data/quiz.ts            # onboarding quiz (data-driven) + answers -> profile
  data/social.ts          # mock friends, feed activity, featured lists (PLACEHOLDER DATA)
  lib/stackGenerator.ts   # quiz profile -> AM/PM routine (rules-based, explainable)
  lib/ranking.ts          # pairwise insert (resumable) + tier bands
  lib/{date,motion,cn,image,productImages}.ts
  state/store.tsx         # Context + localStorage; streak; shelf; logs; account
  components/             # Card, PillButton, TierBadge, SegmentedToggle, ProgressBar, TabBar,
                          # StreakRing, SkinRating, CompareCard, Sheet, Avatar, ProductImage, …
  screens/               # Onboarding, Feed, Stack, Log, Shelf, Profile
  styles/tokens.css      # design tokens (clean light base, emerald accent, tier colors)
```

## Design system

Clean light theme (Beli-leaning): a cool near-white canvas (`#F6F7F8`), white cards with soft
shadows, one deep-emerald accent (`#0C8F62`) plus a mint pop for streaks/highlights, big
confident type (Inter) with **mono numerals** (JetBrains Mono), generous whitespace, big
rounded cards, and tasteful spring motion (framer-motion). Never pastel-girly, never
corporate-blue.

Colors are defined as RGB-channel CSS variables in `src/styles/tokens.css` and mapped to
Tailwind via `rgb(var(--x) / <alpha-value>)`, so opacity utilities (`bg-ink/10`,
`bg-surface/85`, …) work against the tokens.

### Product photos

All ~30 products ship with **real product photos** in `src/assets/products/<id>.jpg`, sourced
from the Open Beauty Facts database + retailer/brand CDNs (clean product-on-white shots). They're
auto-loaded by `src/lib/productImages.ts` (a glob over that folder), and any product without a
file falls back to a clean brand-monogram tile. To swap one, just drop a new `<id>.jpg` in that
folder (see [`src/assets/products/README.md`](src/assets/products/README.md)) or set an `image:`
URL on the product in `mockCatalog.ts`.

Motion note: framer-motion respects `prefers-reduced-motion`. Screen entrances are enhancement
only — content mounts immediately even if the animation loop is paused.

## Out of scope (v0)

No real backend/API, auth, real checkout/affiliate (restock = placeholder link), face-scan,
camera/photo upload, social graph/feed, or push notifications.

**Product data is placeholder** — facts/tags are realistic, prices are approximate and for
prototype display only.
