import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { SANDBOX_ROOMS } from '../content/sandbox';
import ChatsListScreen from '../sim/ChatsListScreen';
import HomeProfileScreen from '../sim/HomeProfileScreen';
import { BottomTabBar, type TabKey } from '../sim/BottomTabBar';
import LineChatScreen, { type LineAction, type ThreadItem } from '../sim/LineChatScreen';
import CallSession, { type CallResult } from './CallSession';
import { primeCallAudio, type MicHandle } from './callAudio';
import { freeCall } from '../content/calls';
import type { LineUser } from '../auth/lineAuth';
import EdgeSwipeBack from '../sim/EdgeSwipeBack';
import { DEFAULT_GESTURE_THRESHOLDS } from '../content/gestures';
import { useHistoryBack } from '../ui/useHistoryBack';

const UNBUILT = '這個功能還沒做好。';

/**
 * LINE 模擬器（從「模擬器」分頁推進來，整個畫面就是 LINE，沒有我們的底部分頁）。
 *
 * 一個完整、沒有題目的 LINE：聊天列表、五個分頁、聊天室、貼圖、語音、照片、打電話都能用。
 * 沒有紅圈、沒有引導條、沒有卡住了、沒有過關判定，也不計分、不寫進度。
 *
 * 離開：LINE Home 分頁裡那顆按鈕（寫「離開 LINE 模擬器」），或手機／瀏覽器的上一頁（App.tsx 處理）。
 * 2026-10-04 起開放給所有人，取代 P2 只有開發者看得到的「我的沙盒」。
 */
export default function LineSimulatorScreen({ user, onExit }: { user: LineUser | null; onExit: () => void }) {
  const { base } = useScale();
  const [tab, setTab] = useState<TabKey>('chats');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  /** 打過的電話紀錄，依聊天室分開存（只在這次打開模擬器期間）。 */
  const [extras, setExtras] = useState<Record<string, ThreadItem[]>>({});
  const [call, setCall] = useState<{ mic: Promise<MicHandle | null> } | null>(null);
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
      case 'pickVoiceCall':
        // 必須在點擊當下啟動聲音和麥克風，iPhone 才會放行。
        setToast(null);
        setCall({ mic: primeCallAudio() });
        break;
      case 'pickVideoCall':
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

  // 在聊天室裡按手機或瀏覽器的上一頁，回到聊天列表，而不是整個離開模擬器。
  useHistoryBack(roomId !== null, () => setRoomId(null));

  // 聊天列表＋底部分頁。滑開聊天室時露出來的也是這一個。
  const home = (
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
          <HomeProfileScreen user={user} base={base} actionLabel="離開 LINE 模擬器" onLogout={onExit} />
        ) : null}
      </View>
      <BottomTabBar
        active={tab}
        base={base}
        // 沒有身分（原生端）就沒有 Home 畫面可以放離開鍵，直接離開模擬器。
        onPressHome={() => (user ? setTab('home') : onExit())}
        onPressChats={() => setTab('chats')}
        onPressDiscover={() => show(UNBUILT)}
        onPressToday={() => show(UNBUILT)}
        onPressWallet={() => show(UNBUILT)}
      />
    </>
  );

  function handleCallEnd(result: CallResult) {
    setCall(null);
    if (!room) return;
    const item: ThreadItem = {
      bubble: { id: `call-${Date.now()}`, from: 'me', kind: 'call', seconds: result.seconds, canceled: !result.connected },
      contact: room.contactName,
    };
    setExtras((prev) => ({ ...prev, [room.id]: [...(prev[room.id] ?? []), item] }));
  }

  return (
    <View style={s.wrap}>
      <View style={{ flex: 1 }}>
        {room ? (
          // 跟真 iPhone 一樣，從左邊緣往右滑回到聊天列表（specs/v2/P5-gestures.md）。
          <EdgeSwipeBack
            thresholds={DEFAULT_GESTURE_THRESHOLDS.edgeSwipe}
            underlay={home}
            onSwipeBack={() => setRoomId(null)}
          >
            <LineChatScreen
              key={room.id}
              contact={room.contactName}
              incoming={[
                ...room.messages.map((bubble) => ({ bubble, contact: room.contactName })),
                ...(extras[room.id] ?? []),
              ]}
              onAction={handleAction}
              onPressBack={() => setRoomId(null)}
            />
          </EdgeSwipeBack>
        ) : (
          home
        )}

        {room && call ? (
          <CallSession contact={room.contactName} script={freeCall} mic={call.mic} hints={false} onEnd={handleCallEnd} />
        ) : null}

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
