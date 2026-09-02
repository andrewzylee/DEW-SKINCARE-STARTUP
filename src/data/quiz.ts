// src/data/quiz.ts
// DEW — onboarding quiz. Data-driven so the UI can render one question per screen
// generically. Copy is outcome-framed, plain, and confident (no beauty jargon, no cringe).
// Captures skin type + goal + budget + depth (→ routine) and shade tone/undertone (→ Shade Match).

import type { SkinType, Concern, PriceTier, Tone, Undertone } from './mockCatalog';

export type QuizQuestionId =
  | 'skinType'
  | 'skinTypeHelper'
  | 'goal'
  | 'budget'
  | 'depth'
  | 'tone'
  | 'undertone';
export type RoutineDepth = 'none' | 'wash' | 'some' | 'full';

// What a user is into. Interests (not gender) shape the app: they emphasize the feed and prune
// onboarding (skincare-only users never get asked their makeup undertone). 'skincare'/'makeup'
// are live; 'fragrance'/'hair' capture demand for the roadmap. Everyone shares one social graph.
export type Interest = 'skincare' | 'makeup' | 'fragrance' | 'hair';
export const LIVE_INTERESTS: Interest[] = ['skincare', 'makeup', 'fragrance'];
export const INTEREST_META: Record<
  Interest,
  { label: string; hint: string; emoji: string; live: boolean }
> = {
  skincare: { label: 'Skincare', hint: 'Cleansers, SPF, serums, acne', emoji: '🧴', live: true },
  makeup: { label: 'Makeup', hint: 'Blush, lip, base, brows', emoji: '💄', live: true },
  fragrance: { label: 'Fragrance', hint: 'Cologne, perfume, mists', emoji: '🌸', live: true },
  hair: { label: 'Hair', hint: 'Styling & care', emoji: '💇', live: false },
};

export interface QuizOption {
  value: string;
  label: string;
  hint?: string; // optional sub-label under the option
}

export interface QuizQuestion {
  id: QuizQuestionId;
  prompt: string;
  subtitle?: string;
  options: QuizOption[];
  // Only shown when a prior answer matches (used for the "not sure" skin-type helper).
  showIf?: { questionId: QuizQuestionId; equals: string };
}

export const quizIntro = {
  title: 'Welcome to Dew.',
  subtitle: 'A few quick questions, about 45 seconds. No wrong answers.',
  cta: 'Start',
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'skinType',
    prompt: "What's your skin usually like?",
    options: [
      { value: 'oily', label: 'Oily', hint: 'Shiny, especially by midday' },
      { value: 'combination', label: 'Combination', hint: 'Oily T-zone, normal cheeks' },
      { value: 'dry', label: 'Dry', hint: 'Tight, flaky, or rough' },
      { value: 'sensitive', label: 'Sensitive', hint: 'Reacts and reddens easily' },
      { value: 'unsure', label: 'Not sure', hint: 'Help me figure it out' },
    ],
  },
  {
    id: 'skinTypeHelper',
    prompt: 'A few hours after washing, your face is…',
    subtitle: 'This tells us your skin type.',
    showIf: { questionId: 'skinType', equals: 'unsure' },
    options: [
      { value: 'oily', label: 'Shiny all over' },
      { value: 'combination', label: 'Shiny in the T-zone, normal elsewhere' },
      { value: 'dry', label: 'Tight, flaky, or rough' },
      { value: 'sensitive', label: 'Red, stingy, or easily irritated' },
    ],
  },
  {
    id: 'goal',
    prompt: 'What do you most want to fix?',
    subtitle: "Pick one — we'll build around it.",
    options: [
      { value: 'acne', label: 'Clear up breakouts' },
      { value: 'oil', label: 'Control oil & shine' },
      { value: 'texture', label: 'Smooth rough texture' },
      { value: 'darkspots', label: 'Fade dark spots & marks' },
      { value: 'starter', label: 'Just build a solid basic routine' },
    ],
  },
  {
    id: 'budget',
    prompt: "What's your budget?",
    options: [
      { value: '$', label: 'Keep it cheap', hint: 'Drugstore, under ~$20 each' },
      { value: '$$', label: 'Mid-range', hint: 'Quality basics' },
      { value: '$$$', label: "I'll invest in the good stuff", hint: 'Whatever works' },
    ],
  },
  {
    id: 'depth',
    prompt: 'Where are you starting from?',
    options: [
      { value: 'none', label: 'Total beginner — nothing yet' },
      { value: 'wash', label: 'Just a face wash' },
      { value: 'some', label: 'A few products' },
      { value: 'full', label: 'I already have a full routine' },
    ],
  },
  {
    id: 'tone',
    prompt: "What's your skin tone?",
    subtitle: 'Powers Shade Match for foundation, concealer & blush.',
    options: [
      { value: 'fair', label: 'Fair', hint: 'Burns easily, rarely tans' },
      { value: 'light', label: 'Light', hint: 'Light beige' },
      { value: 'medium', label: 'Medium', hint: 'Olive or golden' },
      { value: 'tan', label: 'Tan', hint: 'Warm bronze' },
      { value: 'deep', label: 'Deep', hint: 'Rich, deep brown' },
    ],
  },
  {
    id: 'undertone',
    prompt: "What's your undertone?",
    subtitle: 'Check the veins on your wrist in daylight.',
    options: [
      { value: 'cool', label: 'Cool', hint: 'Bluish veins · silver jewelry suits you' },
      { value: 'neutral', label: 'Neutral', hint: 'A mix · both metals work' },
      { value: 'warm', label: 'Warm', hint: 'Greenish veins · gold jewelry suits you' },
    ],
  },
];

// ---------- ANSWERS -> PROFILE ----------

export interface QuizAnswers {
  skinType: SkinType | 'unsure';
  skinTypeHelper?: SkinType; // resolves an "unsure" answer
  goal: Concern;
  budget: PriceTier;
  depth: RoutineDepth;
  tone: Tone;
  undertone: Undertone;
}

export interface UserProfile {
  skinType: SkinType;
  goal: Concern; // primary concern (drives the routine & Skin Match)
  budget: PriceTier;
  depth: RoutineDepth;
  concerns?: Concern[]; // full set of concerns (multi-select, editable in the menu)
  tone?: Tone; // shade phenotype (drives Shade Match) — editable later
  undertone?: Undertone;
  interests?: Interest[]; // what they're into — shapes the feed & prunes onboarding
}

const GOAL_LABEL: Record<Concern, string> = {
  acne: 'clear breakouts',
  oil: 'control oil',
  texture: 'smooth texture',
  darkspots: 'fade dark spots',
  starter: 'build a solid routine',
};

const SKIN_LABEL: Record<SkinType, string> = {
  oily: 'oily',
  combination: 'combination',
  dry: 'dry',
  sensitive: 'sensitive',
};

export function resolveProfile(a: QuizAnswers): UserProfile {
  const skinType: SkinType = a.skinType === 'unsure' ? a.skinTypeHelper ?? 'combination' : a.skinType;
  return { skinType, goal: a.goal, budget: a.budget, depth: a.depth, tone: a.tone, undertone: a.undertone };
}

// Copy for the "Here's your routine" reveal screen.
export function buildReveal(profile: UserProfile, productCount: number) {
  return {
    title: 'Here\u2019s your routine.',
    subtitle: `${productCount} products, matched to ${SKIN_LABEL[profile.skinType]} skin and your goal to ${GOAL_LABEL[profile.goal]}.`,
    footnote: 'AM and PM below. Swap anything you want.',
    cta: 'See my routine',
  };
}
