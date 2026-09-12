import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { HomeTab, ChatsTab, DiscoverTab, MoonTab, WalletTab } from '../ui/Icons';

/**
 * 底部分頁列。被模擬 App 的持久性 UI — 不管畫面切到哪個分頁的內容，
 * 這一條列都要在、都要可以互動，跟真實 LINE 的分頁列行為一樣。
 * 純呈現層：目前是哪個分頁、點了哪個分頁要做什麼，全部由呼叫端決定。
 */
export type TabKey = 'home' | 'chats' | 'discover' | 'today' | 'wallet';

function BottomTab({
  icon,
  label,
  base,
  selected,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  base: number;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.tabItem} accessibilityRole="button" hitSlop={4}>
      {icon}
      <T
        style={[
          s.tabLabel,
          { fontSize: fz(base, 0.62), lineHeight: fz(base, 1) },
          selected && s.tabLabelOn,
        ]}
      >
        {label}
      </T>
    </Pressable>
  );
}

export function BottomTabBar({
  active,
  base,
  onPressHome,
  onPressChats,
  onPressDiscover,
  onPressToday,
  onPressWallet,
}: {
  active: TabKey;
  base: number;
  onPressHome: () => void;
  onPressChats: () => void;
  onPressDiscover: () => void;
  onPressToday: () => void;
  onPressWallet: () => void;
}) {
  return (
    <View style={s.bottomBar}>
      <BottomTab
        icon={<HomeTab size={fz(base, 1.4)} color={active === 'home' ? C.chatGreen : C.ink3} />}
        label="Home"
        base={base}
        selected={active === 'home'}
        onPress={onPressHome}
      />
      <BottomTab
        icon={<ChatsTab size={fz(base, 1.4)} color={active === 'chats' ? C.chatGreen : C.ink3} />}
        label="Chats"
        base={base}
        selected={active === 'chats'}
        onPress={onPressChats}
      />
      <BottomTab
        icon={<DiscoverTab size={fz(base, 1.4)} color={active === 'discover' ? C.chatGreen : C.ink3} />}
        label="Discover"
        base={base}
        selected={active === 'discover'}
        onPress={onPressDiscover}
      />
      <BottomTab
        icon={<MoonTab size={fz(base, 1.4)} color={active === 'today' ? C.chatGreen : C.ink3} bg={C.paper} />}
        label="Today"
        base={base}
        selected={active === 'today'}
        onPress={onPressToday}
      />
      <BottomTab
        icon={<WalletTab size={fz(base, 1.4)} color={active === 'wallet' ? C.chatGreen : C.ink3} />}
        label="Wallet"
        base={base}
        selected={active === 'wallet'}
        onPress={onPressWallet}
      />
    </View>
  );
}

const s = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.chatLine,
    backgroundColor: C.paper,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { color: C.ink3, fontWeight: '600' },
  tabLabelOn: { color: C.chatGreen, fontWeight: '800' },
});
