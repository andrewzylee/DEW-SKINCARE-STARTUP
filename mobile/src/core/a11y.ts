import { useEffect } from 'react';
import { AccessibilityInfo, Platform, type AccessibilityRole } from 'react-native';

// Role for a row of tabs or a segmented control. iOS only understands a tab group through the tab-bar
// trait on the container (its renderer maps 'tab' and 'tablist' to no trait at all); Android and web
// use the standard tablist role. The items themselves use accessibilityRole="tab" + selected state.
export const TAB_LIST_ROLE: AccessibilityRole = Platform.OS === 'ios' ? 'tabbar' : 'tablist';

// Speak a message (a form error, a "sent" notice) when it appears or changes. iOS has no live regions
// and Android's are unreliable on a node that has only just mounted, so announce explicitly.
export function useAnnounce(message: string | null | undefined) {
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}
