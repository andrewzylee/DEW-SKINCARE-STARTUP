import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from './state/store';
import { DeviceFrame } from './components/DeviceFrame';
import { TabBar, type TabKey } from './components/TabBar';
import { gentle } from './lib/motion';
import { Onboarding } from './screens/Onboarding';
import { Feed } from './screens/Feed';
import { Stack } from './screens/Stack';
import { Log } from './screens/Log';
import { Shelf } from './screens/Shelf';
import { Profile } from './screens/Profile';
import { CalendarView } from './screens/CalendarView';
import { SideMenu } from './components/SideMenu';

export default function App() {
  const { state } = useStore();
  const [tab, setTab] = useState<TabKey>('feed');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const acct = state.account;
  const openCalendar = () => setCalendarOpen(true);

  return (
    <DeviceFrame>
      {!state.onboarded ? (
        <Onboarding onComplete={() => setTab('stack')} />
      ) : (
        <>
          <div className="flex h-full flex-col">
            <main className="relative flex-1 overflow-y-auto no-scrollbar">
              {/* Keyed mount animation (no exit) so a tab switch always renders immediately,
                  even if the animation loop is paused (e.g. a backgrounded tab). */}
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={gentle}
                className="min-h-full"
              >
                {tab === 'feed' && (
                  <Feed go={setTab} onOpenCalendar={openCalendar} onOpenMenu={() => setMenuOpen(true)} />
                )}
                {tab === 'stack' && <Stack />}
                {tab === 'log' && <Log go={setTab} />}
                {tab === 'shelf' && <Shelf />}
                {tab === 'profile' && <Profile go={setTab} onOpenCalendar={openCalendar} />}
              </motion.div>
            </main>
            <TabBar
              active={tab}
              onChange={setTab}
              avatar={{ name: acct.displayName, src: acct.avatar }}
            />
          </div>
          <CalendarView open={calendarOpen} onClose={() => setCalendarOpen(false)} />
          <SideMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onOpenCalendar={openCalendar}
          />
        </>
      )}
    </DeviceFrame>
  );
}
