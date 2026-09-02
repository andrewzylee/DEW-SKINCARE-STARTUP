# Dew — rank your beauty

**Beli for Beauty.** A mobile-first web prototype where you rank the makeup, skincare, and
fragrance you've actually tried — and discover what people with *your* taste and *your* skin
genuinely love. The signature interaction is **Beli-style pairwise ranking**: "which one do you
like more?" beats "give it 8.3 stars," and it compounds into a personal **taste graph** that makes
recommendations feel like a friend's, not a stranger's.

> Prototype · mock data only · no backend, no auth · on-device (localStorage).

---

## Why Dew

Beauty discovery today is TikTok → sponsored product → thousands of stranger reviews → 🤷. Dew
replaces that with: **people you know + people with your skin + people with your taste → what they
rank highest → try → rank → your friends discover it.** The ranked taste profile — not a review —
is the core object.

- **Makeup** brings frequency, visual appeal, and virality.
- **Skincare** brings depth, personalization, and long-term outcomes.
- **Fragrance** is the cleanest on-ramp (highly rankable, no shade/phenotype problem).

Positioning is **all-genders, Gen-Z, interest-led** — you pick *what you're into*, never a gender.

## The core loop

**Try → Rank → build your taste profile → see friends' rankings → find your taste twins → discover → try.**

## Features

- **Interest-based onboarding** — "What are you into?" (Skincare / Makeup / Fragrance live, Hair
  soon). Interests prune the quiz (skincare-only users skip the makeup shade questions) and shape
  the feed — never a "male/female" split.
- **Pairwise ranking engine** — binary-search insertion (~log₂n comparisons), **per category** (you
  rank blushes against blushes). Signature unit is **"#2 of 14 blushes,"** not a decimal score.
  - A quick **reaction** (😍→💀) when you add a product seeds where the search starts (fewer taps).
  - An optional **"how close?"** tap at the end tunes the gap to the item above.
  - **Reaction-anchored tiers** (S/A/B/C/F): S is *earned* (you have to love it) — a lone "meh"
    product is a B, not an automatic S.
  - **Drag-to-reorder** any category — your list is the source of truth, and tiers re-compute live.
- **Taste Match** — the moat. Turns two ranked shelves into a 0–100 match, **consensus-discounted**
  (agreeing on divisive picks counts more than on universal favorites) and **per-domain**
  (Makeup Taste is aesthetic; Skincare Match is phenotype-gated by skin type). Works at n=0 via a
  style-tag fallback.
- **Shade Match** — the acquisition wedge. Tone + undertone → shade-aware picks for
  foundation/concealer/blush/lip, plus "people with your skin." Works solo (no social graph needed).
- **Rank-change feed** — "Latest moves": *new #1*, *↑2*, *dropped out of top 5* — dynamic,
  ranking-native social content a star-review app can't produce.
- **Product page** — retailer-style detail: hero + badges, star rating, tag pills, your **Skin/Scent
  Match**, a community-rating histogram, a top review, and a sticky **Add to routine** bar.
- **Profile** — your beauty-taste archetype, per-domain counts, a ranked **fragrance wardrobe**,
  streak, Recent Activity, and a shareable **Beauty Wrapped**.
- **Log** — fast daily check-in (AM/PM checklists, a no-face skin rating, a note) with a **Log
  today** submit + streak.

## Tech

Vite · React 18 · TypeScript · Tailwind CSS · framer-motion · lucide-react. State is a React
Context over `localStorage` (single-user, on-device). No backend or auth.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default **http://localhost:5180**). Best viewed at phone width — on a wide
screen it centers in a device frame.

```bash
npm run build     # typecheck (tsc --noEmit) + production build to dist/
npm run preview   # serve the production build
```

## Structure

```
src/
  data/mockCatalog.ts   # ~55 products across skincare / makeup / fragrance (PLACEHOLDER DATA)
  data/quiz.ts          # onboarding quiz + interests + resolve→profile
  data/social.ts        # friends, feed, rank-moves, featured lists (PLACEHOLDER DATA)
  lib/ranking.ts        # pairwise insertion, reaction seeding, reaction-anchored tiers
  lib/taste.ts          # Taste Match (consensus-discounted, per-domain, phenotype-gated)
  lib/shadeMatch.ts     # Shade Match wedge
  lib/skinMatch.ts      # per-product match score (ingredient/attribute-seeded)
  state/store.tsx       # Context + localStorage: shelf, tiers, logs, trials, rank events
  state/ui.tsx          # app-wide overlays (product page, shade, lists, friends, wrapped)
  components/ · screens/ # Feed, Shelf, Log, Routine, Profile, ProductSheet, ShadeMatchView, …
```

## Out of scope (prototype)

No real backend/API, auth, checkout/affiliate, camera/selfie shade scan, real social graph, or
push notifications. **All product facts, ratings, reviews, community stats, and match scores are
mock data for demonstration.**
