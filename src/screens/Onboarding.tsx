import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import {
  buildReveal,
  INTEREST_META,
  quizIntro,
  quizQuestions,
  resolveProfile,
  type Interest,
  type QuizAnswers,
  type QuizQuestionId,
} from '../data/quiz';
import { getProduct } from '../data/mockCatalog';
import { generateStack } from '../lib/stackGenerator';
import { useStore } from '../state/store';
import { gentle, listContainer, listItem, slideVariants, spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { ProgressBar } from '../components/ProgressBar';
import { PillButton } from '../components/PillButton';
import { ProductImage } from '../components/ProductImage';
import { CategoryTag } from '../components/CategoryTag';

type Phase = 'intro' | 'interests' | 'quiz' | 'reveal';

export function Onboarding({ onComplete }: { onComplete?: () => void }) {
  const { completeOnboarding } = useStore();
  const [phase, setPhase] = useState<Phase>('intro');
  const [interests, setInterests] = useState<Interest[]>(['skincare', 'makeup']);
  const [answers, setAnswers] = useState<Partial<Record<QuizQuestionId, string>>>({});
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);

  // Interests prune the quiz: a skincare-only user is never asked their makeup undertone.
  const activeQuestions = quizQuestions.filter((q) =>
    q.id === 'tone' || q.id === 'undertone' ? interests.includes('makeup') : true,
  );
  const visible = activeQuestions.filter(
    (q) => !q.showIf || answers[q.showIf.questionId] === q.showIf.equals,
  );
  const current = visible[Math.min(index, visible.length - 1)];

  const pick = (value: string) => {
    if (picked) return;
    setPicked(value);
    const q = current;
    window.setTimeout(() => {
      const next = { ...answers, [q.id]: value };
      const nextVisible = activeQuestions.filter(
        (qq) => !qq.showIf || next[qq.showIf.questionId] === qq.showIf.equals,
      );
      setAnswers(next);
      setPicked(null);
      setDir(1);
      if (index + 1 >= nextVisible.length) setPhase('reveal');
      else setIndex(index + 1);
    }, 230);
  };

  const back = () => {
    if (index === 0) {
      setPhase('interests');
      return;
    }
    setDir(-1);
    setIndex((i) => i - 1);
  };

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {phase === 'intro' && <Intro key="intro" onStart={() => setPhase('interests')} />}

        {phase === 'interests' && (
          <InterestsStep
            key="interests"
            selected={interests}
            onToggle={(i) =>
              setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
            }
            onBack={() => setPhase('intro')}
            onContinue={() => {
              setIndex(0);
              setDir(1);
              setPhase('quiz');
            }}
          />
        )}

        {phase === 'quiz' && current && (
          <motion.div
            key="quiz"
            className="flex h-full flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 px-5 pt-6">
              <button
                type="button"
                onClick={back}
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
                aria-label="Back"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1">
                <ProgressBar value={visible.length ? index / visible.length : 0} />
              </div>
              <span className="num w-10 text-right text-xs text-muted">
                {index + 1}/{visible.length}
              </span>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={current.id}
                  custom={dir}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={gentle}
                  className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar px-5 pb-8 pt-6"
                >
                  <h1 className="font-display text-[32px] font-semibold leading-tight">
                    {current.prompt}
                  </h1>
                  {current.subtitle && (
                    <p className="mt-2 text-[15px] text-muted">{current.subtitle}</p>
                  )}

                  <div className="mt-6 flex flex-col gap-2.5">
                    {current.options.map((o) => {
                      const isPicked = picked === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => pick(o.value)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-[22px] border px-5 py-4 text-left transition-colors active:scale-[0.99]',
                            isPicked
                              ? 'border-accent bg-accent/[0.06]'
                              : 'border-line bg-surface hover:border-ink/20',
                          )}
                        >
                          <span>
                            <span className="block text-[17px] font-semibold leading-tight">
                              {o.label}
                            </span>
                            {o.hint && (
                              <span className="mt-0.5 block text-sm text-muted">{o.hint}</span>
                            )}
                          </span>
                          <span
                            className={cn(
                              'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors',
                              isPicked ? 'border-accent bg-accent text-white' : 'border-line',
                            )}
                          >
                            {isPicked && <Check size={14} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 'reveal' && (
          <Reveal
            key="reveal"
            answers={answers as QuizAnswers}
            onFinish={(profile, stack) => {
              completeOnboarding({ ...profile, interests }, stack);
              onComplete?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="flex h-full flex-col justify-between px-6 pb-10 pt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={gentle}
    >
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="mb-5 inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
        >
          DEW
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.12 }}
          className="font-display text-[46px] font-semibold leading-[1.02]"
        >
          {quizIntro.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="mt-4 max-w-[22rem] text-[17px] leading-snug text-muted"
        >
          {quizIntro.subtitle}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.28 }}
      >
        <PillButton size="lg" fullWidth onClick={onStart}>
          {quizIntro.cta}
          <ArrowRight size={18} />
        </PillButton>
        <p className="mt-4 text-center text-[13px] text-muted">
          No face, no photos. Just what works.
        </p>
      </motion.div>
    </motion.div>
  );
}

function InterestsStep({
  selected,
  onToggle,
  onBack,
  onContinue,
}: {
  selected: Interest[];
  onToggle: (i: Interest) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const order: Interest[] = ['skincare', 'makeup', 'fragrance', 'hair'];
  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={gentle}
    >
      <div className="flex items-center gap-3 px-5 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-6">
        <h1 className="font-display text-[32px] font-semibold leading-tight">What are you into?</h1>
        <p className="mt-2 text-[15px] text-muted">
          Pick anything — we’ll shape your app around it. No gender boxes here.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          {order.map((i) => {
            const meta = INTEREST_META[i];
            const on = selected.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggle(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition-colors active:scale-[0.99]',
                  on ? 'border-accent bg-accent/[0.06]' : 'border-line bg-surface hover:border-ink/20',
                )}
              >
                <span className="text-[22px]">{meta.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-semibold leading-tight">{meta.label}</span>
                    {!meta.live && (
                      <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">
                        Soon
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">{meta.hint}</span>
                </span>
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors',
                    on ? 'border-accent bg-accent text-white' : 'border-line',
                  )}
                >
                  {on && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[12.5px] leading-snug text-muted">
          Choosing a “Soon” interest adds you to the waitlist — it switches on as we roll it out.
        </p>
      </div>
      <div className="border-t border-line bg-bg/80 px-5 pb-8 pt-4 backdrop-blur">
        <PillButton size="lg" fullWidth onClick={onContinue}>
          Continue
          <ArrowRight size={18} />
        </PillButton>
      </div>
    </motion.div>
  );
}

function Reveal({
  answers,
  onFinish,
}: {
  answers: QuizAnswers;
  onFinish: (profile: ReturnType<typeof resolveProfile>, stack: {
    am: string[];
    pm: string[];
    notes: string[];
  }) => void;
}) {
  const profile = useMemo(() => resolveProfile(answers), [answers]);
  const stack = useMemo(() => generateStack(profile), [profile]);

  // Unique products across AM+PM for the reveal list (cleanser/moisturizer repeat).
  const unique = useMemo(() => {
    const ids: string[] = [];
    [...stack.am, ...stack.pm].forEach((p) => {
      if (!ids.includes(p.id)) ids.push(p.id);
    });
    return ids;
  }, [stack]);

  const reveal = buildReveal(profile, unique.length);

  const finish = () =>
    onFinish(profile, {
      am: stack.am.map((p) => p.id),
      pm: stack.pm.map((p) => p.id),
      notes: stack.notes,
    });

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={gentle}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4 pt-12">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="font-display text-[40px] font-semibold leading-tight"
        >
          {reveal.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.14 }}
          className="mt-3 text-[15px] leading-snug text-muted"
        >
          {reveal.subtitle}
        </motion.p>

        <motion.div
          className="mt-6 flex flex-col gap-2.5"
          variants={listContainer}
          initial="initial"
          animate="animate"
        >
          {unique.map((id, i) => {
            const p = getProduct(id);
            if (!p) return null;
            return (
              <motion.div
                key={id}
                variants={listItem}
                transition={spring}
                className="flex items-center gap-3.5 rounded-[22px] bg-surface p-3.5 shadow-card"
              >
                <span className="num w-5 text-center text-sm font-semibold text-muted">
                  {i + 1}
                </span>
                <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
                <div className="min-w-0 flex-1">
                  <CategoryTag category={p.category} />
                  <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
                  <div className="truncate text-[13px] text-muted">{p.brand}</div>
                </div>
                <span className="num text-sm font-semibold text-ink">${p.price}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="border-t border-line bg-bg/80 px-5 pb-8 pt-4 backdrop-blur">
        <p className="mb-3 text-center text-[13px] text-muted">{reveal.footnote}</p>
        <PillButton size="lg" fullWidth onClick={finish}>
          {reveal.cta}
          <ArrowRight size={18} />
        </PillButton>
      </div>
    </motion.div>
  );
}
