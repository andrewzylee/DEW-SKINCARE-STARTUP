// Onboarding quiz — data-driven so the UI renders one question per screen. Ported from the web
// reference. Captures skin type + goal + budget + depth, and shade tone/undertone (→ Shade Match).
import type { SkinType, Tone, Undertone } from './types';

export type Interest = 'skincare' | 'makeup' | 'fragrance' | 'hair';
export type Concern = 'acne' | 'oil' | 'texture' | 'darkspots' | 'starter';
export type PriceTier = '$' | '$$' | '$$$';
export type RoutineDepth = 'none' | 'wash' | 'some' | 'full';
export type QuizQuestionId = 'skinType' | 'skinTypeHelper' | 'goal' | 'budget' | 'depth' | 'tone' | 'undertone';

export const INTEREST_ORDER: Interest[] = ['skincare', 'makeup', 'fragrance', 'hair'];
export const INTEREST_META: Record<Interest, { label: string; hint: string; emoji: string; live: boolean }> = {
  skincare: { label: 'Skincare', hint: 'Cleansers, SPF, serums, acne', emoji: '🧴', live: true },
  makeup: { label: 'Makeup', hint: 'Blush, lip, base, brows', emoji: '💄', live: true },
  fragrance: { label: 'Fragrance', hint: 'Cologne, perfume, mists', emoji: '🌸', live: true },
  hair: { label: 'Hair', hint: 'Styling & care', emoji: '💇', live: false },
};

export interface QuizOption {
  value: string;
  label: string;
  hint?: string;
}
export interface QuizQuestion {
  id: QuizQuestionId;
  prompt: string;
  subtitle?: string;
  options: QuizOption[];
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

export interface QuizAnswers {
  skinType: SkinType | 'unsure';
  skinTypeHelper?: SkinType;
  goal: Concern;
  budget: PriceTier;
  depth: RoutineDepth;
  tone: Tone;
  undertone: Undertone;
}

export interface OnboardingProfile {
  skinType: SkinType;
  goal: Concern;
  budget: PriceTier;
  depth: RoutineDepth;
  tone?: Tone;
  undertone?: Undertone;
  interests: Interest[];
}

export function resolveProfile(a: Partial<Record<QuizQuestionId, string>>, interests: Interest[]): OnboardingProfile {
  const skinType = (a.skinType === 'unsure' ? a.skinTypeHelper ?? 'combination' : a.skinType ?? 'combination') as SkinType;
  return {
    skinType,
    goal: (a.goal ?? 'starter') as Concern,
    budget: (a.budget ?? '$$') as PriceTier,
    depth: (a.depth ?? 'some') as RoutineDepth,
    tone: a.tone as Tone | undefined,
    undertone: a.undertone as Undertone | undefined,
    interests,
  };
}

export const SKIN_LABEL: Record<SkinType, string> = { oily: 'oily', combination: 'combination', dry: 'dry', sensitive: 'sensitive' };
export const GOAL_LABEL: Record<Concern, string> = {
  acne: 'clear breakouts',
  oil: 'control oil',
  texture: 'smooth texture',
  darkspots: 'fade dark spots',
  starter: 'build a solid routine',
};
