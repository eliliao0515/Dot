import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import {
  Search,
  Plus,
  Album,
  Calendar,
  ChatInvite,
  Pin,
  Mic,
  Sticker,
  VideoCam,
  Camera,
  PhoneOutline,
} from '../ui/Icons';
import { ChatRoomAvatarGlyph } from '../engine/types';

/**
 * 被模擬的 LINE「聊天」分頁，是這個 App 打開後看到的根頁面。
 * 純呈現層，只吃 props：哪一列可以點、點下去發生什麼事，全部由 App.tsx 決定。
 * 這裡完全不認得「課程」「lesson」這些概念。
 */

export type ChatRoomItem = {
  id: string;
  title: string;
  preview: string;
  time: string;
  avatarGlyph: ChatRoomAvatarGlyph;
  avatarColor: string;
  /** 沿用 MAP_NODES 的 state === 'now'，用來決定這一列要不要有「現在」強調樣式。 */
  emphasized: boolean;
  /** 這一列的課還沒做完，要不要顯示未讀提示。跟 emphasized 是兩件獨立的事。 */
  unread: boolean;
  /** 這一列點下去是不是真的會開始一段教學流程；false 的話畫面自己顯示中性提示。 */
  actionable: boolean;
};

/** 永遠釘選在列表最上方的那一列。純呈現資料，內容與點下去的行為都由呼叫端決定。 */
export type PinnedRoomItem = {
  title: string;
  sub: string;
  onPress: () => void;
};

const AVATAR_ICONS: Record<ChatRoomAvatarGlyph, (props: { size: number; color?: string }) => React.JSX.Element> = {
  chat: ChatInvite,
  sticker: Sticker,
  mic: Mic,
  video: VideoCam,
  camera: Camera,
  alert: PhoneOutline,
};

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function show(text: string) {
    setMsg(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }

  return { msg, show };
}

function TopIconButton({
  onPress,
  children,
  showDot,
}: {
  onPress: () => void;
  children: React.ReactNode;
  showDot?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={s.topIconBtn} accessibilityRole="button">
      {children}
      {showDot ? <View style={s.topIconDot} /> : null}
    </Pressable>
  );
}

function PinnedRow({ pinned, base }: { pinned: PinnedRoomItem; base: number }) {
  return (
    <Pressable
      onPress={pinned.onPress}
      style={({ pressed }) => [s.row, s.pinnedRow, pressed && { backgroundColor: C.chatBar }]}
      accessibilityRole="button"
    >
      <View style={[s.avatar, { backgroundColor: C.chatGreen }]}>
        <Pin size={fz(base, 1.3)} color="#fff" />
      </View>

      <View style={{ flex: 1 }}>
        <T style={[s.roomTitle, s.roomTitleNow, { fontSize: fz(base, 0.98), lineHeight: fz(base, 1.4) }]}>
          {pinned.title}
        </T>
        <T style={[s.roomPreview, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.35) }]} numberOfLines={1}>
          {pinned.sub}
        </T>
      </View>
    </Pressable>
  );
}

function RoomRow({
  room,
  base,
  onPress,
}: {
  room: ChatRoomItem;
  base: number;
  onPress: () => void;
}) {
  const Glyph = AVATAR_ICONS[room.avatarGlyph];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: C.chatBar }]}
      accessibilityRole="button"
    >
      <View style={[s.avatar, { backgroundColor: room.avatarColor }]}>
        <Glyph size={fz(base, 1.3)} color="#fff" />
        <View style={s.pinBadge}>
          <Pin size={fz(base, 0.62)} color="#fff" />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <T
          style={[
            s.roomTitle,
            { fontSize: fz(base, 0.98), lineHeight: fz(base, 1.4) },
            room.emphasized && s.roomTitleNow,
          ]}
          numberOfLines={1}
        >
          {room.title}
        </T>
        <T
          style={[
            s.roomPreview,
            { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.35) },
            room.emphasized && s.roomPreviewNow,
          ]}
          numberOfLines={1}
        >
          {room.preview}
        </T>
      </View>

      <View style={s.roomRight}>
        <T style={[s.roomTime, { fontSize: fz(base, 0.72), lineHeight: fz(base, 1.2) }]}>{room.time}</T>
        {room.unread ? (
          <View style={s.unreadBadge}>
            <T style={[s.unreadBadgeText, { fontSize: fz(base, 0.68), lineHeight: fz(base, 1) }]}>1</T>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChatsListScreen({
  rooms,
  base,
  pinned,
  onOpenRoom,
}: {
  rooms: ChatRoomItem[];
  base: number;
  pinned?: PinnedRoomItem;
  onOpenRoom: (id: string) => void;
}) {
  const { msg, show } = useToast();

  function pressRoom(room: ChatRoomItem) {
    if (room.actionable) {
      onOpenRoom(room.id);
    } else {
      show(`「${room.title}」這個聊天室的練習還沒做好。`);
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.topRow}>
        <View style={s.tabsPill}>
          <View style={s.tabChatsOn}>
            <T style={[s.tabChatsText, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.4) }]}>聊天</T>
            <View style={s.chevronDown} />
          </View>
          <Pressable onPress={() => show('好友名單這一版還沒做。')} hitSlop={8} accessibilityRole="button">
            <T style={[s.tabFriendsText, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.4) }]}>好友</T>
          </Pressable>
        </View>

        <View style={s.topIcons}>
          <TopIconButton onPress={() => show('這個功能還沒做好。')}>
            <Album size={fz(base, 1.15)} color={C.chatInk} />
          </TopIconButton>
          <TopIconButton onPress={() => show('這個功能還沒做好。')}>
            <Calendar size={fz(base, 1.15)} color={C.chatInk} />
          </TopIconButton>
          <TopIconButton onPress={() => show('這個功能還沒做好。')} showDot>
            <ChatInvite size={fz(base, 1.15)} color={C.chatInk} />
          </TopIconButton>
          <TopIconButton onPress={() => show('這個功能還沒做好。')}>
            <Plus size={fz(base, 1.15)} color={C.chatInk} />
          </TopIconButton>
        </View>
      </View>

      <View style={s.searchBar}>
        <Search size={fz(base, 1)} color={C.ink3} />
        <T style={[s.searchText, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.4) }]}>搜尋</T>
      </View>

      {pinned ? <PinnedRow pinned={pinned} base={base} /> : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.listInner}>
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} base={base} onPress={() => pressRoom(room)} />
        ))}
      </ScrollView>

      {msg ? (
        <View style={s.toast} pointerEvents="none">
          <T style={[s.toastText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.4) }]}>{msg}</T>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },

  topRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tabsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tabChatsOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.chatGreen,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabChatsText: { color: '#fff', fontWeight: '800' },
  chevronDown: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }, { translateY: -2 }],
  },
  tabFriendsText: { color: C.ink3, fontWeight: '700' },

  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topIconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIconDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.red,
  },

  searchBar: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: C.chatBar,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.chatLine,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchText: { color: C.ink3, fontWeight: '500' },

  listInner: { paddingBottom: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 78,
    borderBottomWidth: 1,
    borderBottomColor: C.chatLine,
  },
  pinnedRow: {
    backgroundColor: C.chatBar,
    borderBottomWidth: 1.5,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.chatInk,
    borderWidth: 2,
    borderColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roomTitle: { color: C.ink, fontWeight: '600' },
  roomTitleNow: { fontWeight: '900' },
  roomPreview: { color: C.ink3, fontWeight: '500', marginTop: 2 },
  roomPreviewNow: { color: C.ink2, fontWeight: '700' },

  roomRight: { alignItems: 'flex-end', gap: 6 },
  roomTime: { color: C.ink3, fontWeight: '500' },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: C.chatGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: { color: '#fff', fontWeight: '800' },

  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    // 這顆 toast 貼的是這個畫面自己 wrap 的底部——BottomTabBar 搬去 App.tsx 後，
    // wrap 已經不再包含分頁列的高度了，所以這裡不能再照分頁列還在時候的 78，
    // 要扣掉分頁列高度才會貼齊分頁列正上方（跟 App.tsx 那個共用 toast 的視覺位置對齊）。
    bottom: 18,
    backgroundColor: C.chatInk,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  toastText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
