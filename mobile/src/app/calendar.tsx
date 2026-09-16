import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Minus, Plus, Target, Trophy, X, type LucideIcon } from 'lucide-react-native';

import {
  currentStreak,
  demoLog,
  isLoggedKey,
  longestStreak,
  MONTH_NAMES,
  monthCells,
  nextMilestone,
  RATING_COLORS,
  RATING_LABELS,
  todayKey,
  totalCheckins,
  weekKeys,
  WEEKDAYS,
} from '@/core/progress';
import { palette, radius, space } from '@/core/theme';

type CalMode = 'skin' | 'streak';

// Progress — streak stats, weekly goal, and a month heat-map of check-ins. Ported from the web
// CalendarView; runs on deterministic demo history until the daily-logs backend is wired.
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = todayKey();
  const [ty, tm] = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    return [y, m - 1] as const;
  }, [today]);

  const [view, setView] = useState({ year: ty, month: tm });
  const [mode, setMode] = useState<CalMode>('skin');
  const [goal, setGoal] = useState(5);
  const [selected, setSelected] = useState<string | null>(null);

  const streak = currentStreak();
  const longest = longestStreak();
  const total = totalCheckins();
  const cells = monthCells(view.year, view.month);
  const monthLogged = cells.filter((c) => c.key && isLoggedKey(c.key)).length;
  const isCurrentMonth = view.year === ty && view.month === tm;

  const week = weekKeys(today);
  const loggedThisWeek = week.filter((k) => isLoggedKey(k)).length;
  const hitGoal = loggedThisWeek >= goal;

  const next = nextMilestone(streak);
  const goTo = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + space(4), paddingHorizontal: space(5), paddingBottom: space(2) }}>
        <Pressable onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color={palette.ink} /></Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: palette.ink }}>Progress</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(8) }} showsVerticalScrollIndicator={false}>
        {/* Stat tiles */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile Icon={Flame} tint={palette.makeup} value={streak} label="Day streak" />
          <StatTile Icon={Trophy} tint={palette.tierS} value={longest} label="Longest" />
          <StatTile Icon={Target} tint={palette.accent} value={total} label="Check-ins" />
        </View>

        {/* Weekly goal */}
        <View style={{ marginTop: space(4), borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, padding: space(4) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>Weekly goal</Text>
              <Text style={{ fontSize: 12.5, color: palette.muted, marginTop: 1 }}>
                <Text style={{ fontWeight: '700', color: palette.ink }}>{loggedThisWeek}</Text> of {goal} days this week{hitGoal ? ' — hit it! 🎉' : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RoundBtn Icon={Minus} onPress={() => setGoal((g) => Math.max(1, g - 1))} />
              <Text style={{ width: 22, textAlign: 'center', fontSize: 16, fontWeight: '800', color: palette.ink }}>{goal}</Text>
              <RoundBtn Icon={Plus} onPress={() => setGoal((g) => Math.min(7, g + 1))} />
            </View>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 6 }}>
            {week.map((k, i) => {
              const logged = isLoggedKey(k);
              const isToday = k === today;
              return (
                <View key={k} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ height: 32, alignSelf: 'stretch', borderRadius: 10, backgroundColor: logged ? palette.accent : 'rgba(46,46,46,0.06)', borderWidth: isToday && !logged ? 2 : 0, borderColor: palette.accent }} />
                  <Text style={{ fontSize: 10, color: palette.muted }}>{WEEKDAYS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Month calendar */}
        <View style={{ marginTop: space(4), borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, padding: space(4) }}>
          {/* Skin / Streak toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, padding: 4, marginBottom: 12 }}>
            {(['skin', 'streak'] as const).map((m) => {
              const on = mode === m;
              return (
                <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, borderRadius: 999, paddingVertical: 7, alignItems: 'center', backgroundColor: on ? palette.surface : 'transparent' }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: on ? palette.ink : palette.muted }}>{m === 'skin' ? 'Skin' : 'Streak'}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>
              {MONTH_NAMES[view.month]} <Text style={{ color: palette.muted }}>{view.year}</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <RoundBtn Icon={ChevronLeft} onPress={() => goTo(-1)} />
              <RoundBtn Icon={ChevronRight} onPress={() => goTo(1)} disabled={isCurrentMonth} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: palette.muted }}>{w}</Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((c, i) => {
              if (!c.key) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
              const rating = demoLog(c.key);
              const logged = rating !== null;
              const isToday = c.key === today;
              const future = c.key > today;
              const fill = logged ? (mode === 'skin' && rating !== null ? RATING_COLORS[rating] : palette.accent) : undefined;
              return (
                <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                  <Pressable
                    disabled={future}
                    onPress={() => setSelected(c.key)}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: fill ?? 'transparent',
                      borderWidth: isToday ? 2 : 0,
                      borderColor: palette.accent,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: fill ? palette.white : future ? 'rgba(140,145,132,0.5)' : isToday ? palette.accent : palette.ink }}>{c.day}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          {mode === 'skin' ? (
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 }}>
              <Text style={{ fontSize: 11, color: palette.muted }}>Rough</Text>
              <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                {RATING_COLORS.map((c) => (
                  <View key={c} style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: c }} />
                ))}
              </View>
              <Text style={{ fontSize: 11, color: palette.muted }}>Great</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.accent }} />
                <Text style={{ fontSize: 12.5, color: palette.muted }}>Logged</Text>
              </View>
              <Text style={{ fontSize: 12.5, color: palette.muted }}><Text style={{ fontWeight: '700', color: palette.ink }}>{monthLogged}</Text> in {MONTH_NAMES[view.month]}</Text>
            </View>
          )}
        </View>

        {/* Milestone */}
        {next === null ? (
          <View style={{ marginTop: space(4), borderRadius: radius.lg, backgroundColor: palette.accentSoft, padding: space(4) }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: palette.accentInk, textAlign: 'center' }}>You've passed every streak milestone. Legend. 🏆</Text>
          </View>
        ) : (
          <View style={{ marginTop: space(4), borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, padding: space(4) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>Next milestone</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.muted }}>{next} days</Text>
            </View>
            <View style={{ marginTop: 8, height: 10, borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.06)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.round((streak / next) * 100)}%`, height: '100%', borderRadius: 999, backgroundColor: palette.accentBright }} />
            </View>
            <Text style={{ marginTop: 8, fontSize: 12.5, color: palette.muted }}>
              <Text style={{ fontWeight: '700', color: palette.ink }}>{Math.max(0, next - streak)}</Text> more day{next - streak === 1 ? '' : 's'} to hit a {next}-day streak.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Day detail */}
      {selected ? <DayDetail dateKey={selected} onClose={() => setSelected(null)} /> : null}
    </View>
  );
}

function DayDetail({ dateKey: key, onClose }: { dateKey: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const rating = demoLog(key);
  const rated = rating !== null;
  const label = useMemo(() => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, [key]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' }}>
      <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(46,46,46,0.25)' }} />
      <View style={{ backgroundColor: palette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: insets.bottom + space(6) }}>
        <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 999, backgroundColor: palette.line, marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink, flex: 1 }}>{label}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(46,46,46,0.05)', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color={palette.muted} />
          </Pressable>
        </View>
        {rated ? (
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ borderRadius: 999, backgroundColor: RATING_COLORS[rating], paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.white }}>{RATING_LABELS[rating]}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={{ width: 6, height: 8 + i * 4, borderRadius: 999, backgroundColor: i <= rating ? RATING_COLORS[rating] : 'rgba(46,46,46,0.12)' }} />
              ))}
            </View>
            <Text style={{ marginLeft: 'auto', fontSize: 13, color: palette.muted }}>{rating + 1}/5</Text>
          </View>
        ) : (
          <Text style={{ marginTop: 14, fontSize: 14, color: palette.muted }}>No check-in logged this day. Rate your skin in Log to fill it in.</Text>
        )}
      </View>
    </View>
  );
}

function StatTile({ Icon, tint, value, label }: { Icon: LucideIcon; tint: string; value: number; label: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, padding: 12, alignItems: 'center' }}>
      <Icon size={18} color={tint} />
      <Text style={{ marginTop: 4, fontSize: 22, fontWeight: '800', color: palette.ink }}>{value}</Text>
      <Text style={{ marginTop: 2, fontSize: 11, color: palette.muted }}>{label}</Text>
    </View>
  );
}

function RoundBtn({ Icon, onPress, disabled }: { Icon: LucideIcon; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}>
      <Icon size={16} color={palette.muted} />
    </Pressable>
  );
}
