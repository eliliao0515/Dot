import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { SANDBOX_ROOMS } from '../content/sandbox';
import ChatsListScreen from '../sim/ChatsListScreen';
import HomeProfileScreen from '../sim/HomeProfileScreen';
import { BottomTabBar, type TabKey } from '../sim/BottomTabBar';
import LineChatScreen, { type LineAction } from '../sim/LineChatScreen';
import type { LineUser } from '../auth/lineAuth';

const UNBUILT = '這個功能還沒做好。';

/**
 * 「我的沙盒」：只有開發者看得到（見 src/auth/devAccess.ts）。
 *
 * 一個完整、沒有題目的 LINE 模擬器，用來自己測試、對照真機驗收。
 * 沒有紅圈、沒有引導條、沒有卡住了、沒有過關判定，也不寫進度。
 * 畫面上沒有任何教學外殼（2026-10-04 使用者決定拿掉頂部的「沙盒模式」那一行），
 * 整個畫面就是綠色的模擬層。離開沙盒：LINE 的 Home 分頁裡那顆按鈕（在沙盒裡寫「離開沙盒」）。
 */
export default function SandboxScreen({ user, onExit }: { user: LineUser | null; onExit: () => void }) {
  const { base } = useScale();
  const [tab, setTab] = useState<TabKey>('chats');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function show(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function handleAction(action: LineAction) {
    switch (action.type) {
      case 'pressVideo':
      case 'wrongTap':
      case 'unbuilt':
        show(UNBUILT);
        break;
      case 'viewChange':
        setToast(null);
        break;
      // 其他動作（送出、存照片……）都是正常的 LINE 行為，畫面自己會處理，這裡什麼都不用做。
    }
  }

  const room = roomId ? SANDBOX_ROOMS.find((r) => r.id === roomId) : undefined;

  return (
    <View style={s.wrap}>
      <View style={{ flex: 1 }}>
        {room ? (
          <LineChatScreen
            key={room.id}
            contact={room.contactName}
            incoming={room.messages.map((bubble) => ({ bubble, contact: room.contactName }))}
            onAction={handleAction}
            onPressBack={() => setRoomId(null)}
          />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              {tab === 'chats' ? (
                <ChatsListScreen
                  rooms={SANDBOX_ROOMS.map((r) => ({
                    id: r.id,
                    title: r.contactName,
                    preview: r.preview,
                    time: r.time,
                    avatarGlyph: r.avatarGlyph,
                    avatarColor: r.avatarColor,
                    emphasized: false,
                    unread: false,
                    actionable: true,
                  }))}
                  base={base}
                  onOpenRoom={setRoomId}
                />
              ) : null}
              {tab === 'home' && user ? (
                <HomeProfileScreen user={user} base={base} actionLabel="離開沙盒" onLogout={onExit} />
              ) : null}
            </View>
            <BottomTabBar
              active={tab}
              base={base}
              // 沒有身分（原生端）就沒有 Home 畫面可以放離開鍵，直接離開沙盒。
              onPressHome={() => (user ? setTab('home') : onExit())}
              onPressChats={() => setTab('chats')}
              onPressDiscover={() => show(UNBUILT)}
              onPressToday={() => show(UNBUILT)}
              onPressWallet={() => show(UNBUILT)}
            />
          </>
        )}

        {toast ? (
          <View style={s.toast} pointerEvents="none">
            <T style={[s.toastText, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.5) }]}>{toast}</T>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 82,
    backgroundColor: C.indigoDark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    zIndex: 60,
  },
  toastText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
