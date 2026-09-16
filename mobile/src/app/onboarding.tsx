import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react-native';

import {
  GOAL_LABEL,
  INTEREST_META,
  INTEREST_ORDER,
  quizIntro,
  quizQuestions,
  resolveProfile,
  SKIN_LABEL,
  type Interest,
  type QuizQuestionId,
} from '@/core/quiz';
import { palette, radius, space } from '@/core/theme';
import { useProfile } from '@/data/profile-store';

type Phase = 'intro' | 'interests' | 'quiz' | 'reveal';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useProfile();

  const [phase, setPhase] = useState<Phase>('intro');
  const [interests, setInterests] = useState<Interest[]>(['skincare', 'makeup']);
  const [answers, setAnswers] = useState<Partial<Record<QuizQuestionId, string>>>({});
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const activeQuestions = quizQuestions.filter((q) =>
    q.id === 'tone' || q.id === 'undertone' ? interests.includes('makeup') : true,
  );
  const visible = activeQuestions.filter((q) => !q.showIf || answers[q.showIf.questionId] === q.showIf.equals);
  const current = visible[Math.min(index, visible.length - 1)];

  const pick = (value: string) => {
    const q = current;
    const next = { ...answers, [q.id]: value };
    const nextVisible = activeQuestions.filter((qq) => !qq.showIf || next[qq.showIf.questionId] === qq.showIf.equals);
    setAnswers(next);
    if (index + 1 >= nextVisible.length) setPhase('reveal');
    else setIndex(index + 1);
  };

  const back = () => {
    if (index === 0) setPhase('interests');
    else setIndex((i) => i - 1);
  };

  const finish = async () => {
    setSaving(true);
    const profile = resolveProfile(answers, interests);
    await completeOnboarding({
      skinType: profile.skinType,
      goal: profile.goal,
      budget: profile.budget,
      depth: profile.depth,
      tone: profile.tone,
      undertone: profile.undertone,
      interests: profile.interests,
    });
    router.replace('/');
  };

  // ---- Intro ----
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(10), paddingBottom: insets.bottom + space(6), paddingHorizontal: space(6), justifyContent: 'space-between' }}>
        <View>
          <View style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: 12, paddingVertical: 5, marginBottom: space(5) }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: palette.muted, letterSpacing: 2 }}>DEW</Text>
          </View>
          <Text style={{ fontSize: 44, fontWeight: '800', color: palette.ink, letterSpacing: -1 }}>{quizIntro.title}</Text>
          <Text style={{ marginTop: space(4), fontSize: 17, lineHeight: 24, color: palette.muted, maxWidth: 340 }}>{quizIntro.subtitle}</Text>
        </View>
        <View>
          <CTA label={quizIntro.cta} onPress={() => setPhase('interests')} />
          <Text style={{ marginTop: space(4), textAlign: 'center', fontSize: 13, color: palette.muted }}>No face, no photos. Just what works.</Text>
        </View>
      </View>
    );
  }

  // ---- Interests ----
  if (phase === 'interests') {
    const toggle = (i: Interest) => setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <View style={{ paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
          <Pressable onPress={() => setPhase('intro')} hitSlop={10}><ChevronLeft size={22} color={palette.muted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: space(4) }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: palette.ink, lineHeight: 38 }}>What are you into?</Text>
          <Text style={{ marginTop: space(2), fontSize: 15, color: palette.muted }}>Pick anything — we'll shape your app around it. No gender boxes here.</Text>
          <View style={{ marginTop: space(5), gap: 10 }}>
            {INTEREST_ORDER.map((i) => {
              const meta = INTEREST_META[i];
              const on = interests.includes(i);
              return (
                <Pressable key={i} onPress={() => toggle(i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, borderWidth: 1, borderColor: on ? palette.accent : palette.line, backgroundColor: on ? 'rgba(110,125,95,0.06)' : palette.surface, paddingHorizontal: 16, paddingVertical: 16 }}>
                  <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: palette.ink }}>{meta.label}</Text>
                      {!meta.live ? <View style={{ borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.06)', paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontSize: 10, fontWeight: '800', color: palette.muted, letterSpacing: 0.5 }}>SOON</Text></View> : null}
                    </View>
                    <Text style={{ marginTop: 2, fontSize: 13, color: palette.muted }}>{meta.hint}</Text>
                  </View>
                  <CheckCircle on={on} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={{ borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: insets.bottom + space(5) }}>
          <CTA label="Continue" onPress={() => { setIndex(0); setPhase('quiz'); }} disabled={interests.length === 0} />
        </View>
      </View>
    );
  }

  // ---- Quiz ----
  if (phase === 'quiz' && current) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
          <Pressable onPress={back} hitSlop={10}><ChevronLeft size={22} color={palette.muted} /></Pressable>
          <View style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.08)', overflow: 'hidden' }}>
            <View style={{ width: `${visible.length ? (index / visible.length) * 100 : 0}%`, height: '100%', borderRadius: 999, backgroundColor: palette.accent }} />
          </View>
          <Text style={{ width: 40, textAlign: 'right', fontSize: 12, color: palette.muted }}>{index + 1}/{visible.length}</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingTop: space(5), paddingBottom: insets.bottom + space(6) }}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: palette.ink, lineHeight: 36 }}>{current.prompt}</Text>
          {current.subtitle ? <Text style={{ marginTop: space(2), fontSize: 15, color: palette.muted }}>{current.subtitle}</Text> : null}
          <View style={{ marginTop: space(5), gap: 10 }}>
            {current.options.map((o) => (
              <Pressable key={o.value} onPress={() => pick(o.value)} style={({ pressed }) => ({ borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: pressed ? 'rgba(110,125,95,0.06)' : palette.surface, paddingHorizontal: 18, paddingVertical: 16 })}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: palette.ink }}>{o.label}</Text>
                {o.hint ? <Text style={{ marginTop: 2, fontSize: 13.5, color: palette.muted }}>{o.hint}</Text> : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---- Reveal ----
  const profile = resolveProfile(answers, interests);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(10), paddingBottom: insets.bottom + space(6), paddingHorizontal: space(6), justifyContent: 'space-between' }}>
      <View>
        <Text style={{ fontSize: 40, fontWeight: '800', color: palette.ink, lineHeight: 46, letterSpacing: -0.5 }}>You're all set.</Text>
        <Text style={{ marginTop: space(3), fontSize: 16, lineHeight: 23, color: palette.muted }}>
          Tuned to <Text style={{ fontWeight: '700', color: palette.ink }}>{SKIN_LABEL[profile.skinType]}</Text> skin and your goal to <Text style={{ fontWeight: '700', color: palette.ink }}>{GOAL_LABEL[profile.goal]}</Text>.
        </Text>
        <View style={{ marginTop: space(5), gap: 10 }}>
          <SummaryRow label="Skin type" value={SKIN_LABEL[profile.skinType]} />
          <SummaryRow label="Main goal" value={GOAL_LABEL[profile.goal]} />
          {profile.tone ? <SummaryRow label="Shade" value={`${profile.tone}${profile.undertone ? ` · ${profile.undertone}` : ''}`} /> : null}
          <SummaryRow label="Into" value={profile.interests.join(', ')} />
        </View>
      </View>
      <CTA label={saving ? 'Setting up…' : 'Start ranking'} onPress={finish} disabled={saving} />
    </View>
  );
}

function CTA({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.accent, borderRadius: radius.pill, paddingVertical: 16, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 })}>
      <Text style={{ color: palette.white, fontSize: 16, fontWeight: '700' }}>{label}</Text>
      <ArrowRight size={18} color={palette.white} />
    </Pressable>
  );
}

function CheckCircle({ on }: { on: boolean }) {
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 0 : 1.5, borderColor: palette.line, backgroundColor: on ? palette.accent : 'transparent' }}>
      {on ? <Check size={14} color={palette.white} strokeWidth={3} /> : null}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 16, paddingVertical: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink, textTransform: 'capitalize' }}>{value}</Text>
    </View>
  );
}
