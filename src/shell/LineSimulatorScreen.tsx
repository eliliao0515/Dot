import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
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
import WalletApp, { type WalletAction, type WalletCharge, type WalletContent } from '../sim/pay/WalletApp';
import {
  PAY_START_BALANCE, PAY_HISTORY_SEED, PAY_FRIENDS, SCAN_TARGETS, PAY_TOPUP_OPTIONS, PAY_PASSWORD_LENGTH,
  PAY_PASSWORD_HINT, PAY_CASHIER_CHARGE, type FakeSite,
} from '../content/pay';

const WALLET_CONTENT: WalletContent = {
  startBalance: PAY_START_BALANCE,
  historySeed: PAY_HISTORY_SEED,
  friends: PAY_FRIENDS,
  scanTargets: SCAN_TARGETS,
  topupOptions: PAY_TOPUP_OPTIONS,
  passwordLength: PAY_PASSWORD_LENGTH,
  passwordHint: PAY_PASSWORD_HINT,
};

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
  /** Wallet 分頁現在顯示的畫面；在付款碼頁時才出現「假裝店員掃碼」。 */
  const [walletView, setWalletView] = useState('home');
  const [charge, setCharge] = useState<WalletCharge | null>(null);
  /** 在假網站上準備填資料時，老師跳出來說明的那個網站。 */
  const [scamSite, setScamSite] = useState<FakeSite | null>(null);
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

  function handleWalletAction(action: WalletAction) {
    switch (action.type) {
      case 'unbuilt':
        show(UNBUILT);
        break;
      case 'fakeSiteSubmit':
        setToast(null);
        setScamSite(action.site);
        break;
      case 'viewChange':
        setToast(null);
        setWalletView(action.view);
        break;
    }
  }

  const tabBar = (
    <BottomTabBar
      active={tab}
      base={base}
      // 沒有身分（原生端）就沒有 Home 畫面可以放離開鍵，直接離開模擬器。
      onPressHome={() => (user ? setTab('home') : onExit())}
      onPressChats={() => setTab('chats')}
      onPressDiscover={() => show(UNBUILT)}
      onPressToday={() => show(UNBUILT)}
      onPressWallet={() => setTab('wallet')}
    />
  );

  const room = roomId ? SANDBOX_ROOMS.find((r) => r.id === roomId) : undefined;

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
                <HomeProfileScreen user={user} base={base} actionLabel="離開 LINE 模擬器" onLogout={onExit} />
              ) : null}
            </View>
            {tab === 'wallet' ? null : tabBar}
          </>
        )}

        {/* 錢包一直掛著（只是藏起來），切去別的分頁再回來，餘額和紀錄還在。 */}
        <View style={[StyleSheet.absoluteFill, { display: !room && tab === 'wallet' ? 'flex' : 'none' }]}>
          <WalletApp
            base={base}
            content={WALLET_CONTENT}
            tabBar={tabBar}
            charge={charge}
            bottomInset={walletView === 'code' ? 100 : 0}
            onAction={handleWalletAction}
          />
        </View>

        {room && call ? (
          <CallSession contact={room.contactName} script={freeCall} mic={call.mic} hints={false} onEnd={handleCallEnd} />
        ) : null}

        {!room && tab === 'wallet' && walletView === 'code' ? (
          <Pressable
            onPress={() => setCharge({ id: String(Date.now()), ...PAY_CASHIER_CHARGE })}
            style={({ pressed }) => [s.teacherBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <T systemScaling style={[s.teacherBtnText, { fontSize: fz(base, 1), lineHeight: fz(base, 1.4) }]}>
              練習：假裝店員掃了你的付款碼
            </T>
          </Pressable>
        ) : null}

        {scamSite ? (
          <View style={s.sheetBackdrop}>
            <View style={s.sheet}>
              <T systemScaling style={[s.sheetTitle, { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.7) }]}>
                停一下！這是假網站（練習用）
              </T>
              <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 10 }}>
                {scamSite.cues.map((cue) => (
                  <T systemScaling key={cue} style={[s.sheetCue, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.6) }]}>
                    ・{cue}
                  </T>
                ))}
              </ScrollView>
              <T systemScaling style={[s.sheetCue, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.6) }]}>
                看完按下面的按鈕，再自己按左上角的 ✕ 把網頁關掉。
              </T>
              <Pressable onPress={() => setScamSite(null)} style={({ pressed }) => [s.sheetBtn, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <T systemScaling style={[s.sheetBtnText, { fontSize: fz(base, 1.1), lineHeight: fz(base, 1.5) }]}>我知道了</T>
              </Pressable>
            </View>
          </View>
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

  // 以下是教學外殼（靛藍），不是 LINE Pay 畫面的一部分。
  teacherBtn: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 55,
  },
  teacherBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  sheetBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,51,74,0.45)',
    justifyContent: 'flex-end',
    zIndex: 70,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 4,
    borderTopColor: C.indigo,
    padding: 20,
    paddingBottom: 28,
    gap: 14,
  },
  sheetTitle: { color: C.indigoDark, fontWeight: '900' },
  sheetCue: { color: C.ink },
  sheetBtn: { minHeight: 72, borderRadius: 14, backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center' },
  sheetBtnText: { color: '#fff', fontWeight: '800' },
});
