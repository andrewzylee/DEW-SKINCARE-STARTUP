import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from './state/store';
import { useUI } from './state/ui';
import { DeviceFrame } from './components/DeviceFrame';
import { TabBar, type TabKey } from './components/TabBar';
import { ActionSheet } from './components/ActionSheet';
import { gentle } from './lib/motion';
import { Onboarding } from './screens/Onboarding';
import { Feed } from './screens/Feed';
import { Log } from './screens/Log';
import { Shelf } from './screens/Shelf';
import { Profile } from './screens/Profile';
import { CalendarView } from './screens/CalendarView';
import { SideMenu } from './components/SideMenu';

export default function App() {
  const { state } = useStore();
  const { openAddProduct } = useUI();
  const [tab, setTab] = useState<TabKey>('feed');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const acct = state.account;
  const openCalendar = () => setCalendarOpen(true);

  return (
    <DeviceFrame>
      {!state.onboarded ? (
        <Onboarding onComplete={() => setTab('shelf')} />
      ) : (
        <>
          <div className="flex h-full flex-col">
            <main className="relative flex-1 overflow-y-auto no-scrollbar">
              {/* Keyed mount animation (no exit) so a tab switch always renders immediately. */}
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={gentle}
                className="min-h-full"
              >
                {tab === 'feed' && (
                  <Feed mode="feed" onOpenCalendar={openCalendar} onOpenMenu={() => setMenuOpen(true)} />
                )}
                {tab === 'discover' && (
                  <Feed mode="discover" onOpenCalendar={openCalendar} onOpenMenu={() => setMenuOpen(true)} />
                )}
                {tab === 'shelf' && <Shelf />}
                {tab === 'profile' && (
                  <Profile go={setTab} onOpenCalendar={openCalendar} onOpenLog={() => setLogOpen(true)} />
                )}
              </motion.div>
            </main>
            <TabBar
              active={tab}
              onChange={setTab}
              onCreate={() => setActionOpen(true)}
              avatar={{ name: acct.displayName, src: acct.avatar }}
            />
          </div>

          {/* Center ＋ — "what do you want to do?" */}
          <ActionSheet
            open={actionOpen}
            onClose={() => setActionOpen(false)}
            onRate={() => setTab('shelf')}
            onLog={() => setLogOpen(true)}
            onAdd={() => openAddProduct()}
            onTrial={() => setTab('shelf')}
          />

          {/* Log check-in — no longer a tab; opened from the ＋ sheet or Profile. */}
          {logOpen && (
            <div className="absolute inset-0 z-[45] overflow-y-auto no-scrollbar bg-bg">
              <Log
                go={(t) => {
                  setLogOpen(false);
                  setTab(t);
                }}
                onClose={() => setLogOpen(false)}
              />
            </div>
          )}

          <CalendarView open={calendarOpen} onClose={() => setCalendarOpen(false)} />
          <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onOpenCalendar={openCalendar} />
        </>
      )}
    </DeviceFrame>
  );
}
