import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, StatusBar, Platform, Pressable, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScaleProvider, T, useScale } from './src/ui/Scale';
import { C, fz } from './src/ui/theme';
import { Back } from './src/ui/Icons';
import { LESSONS, MAP_NODES, CHAT_ROOMS } from './src/content/lessons';
import ChatSim from './src/sim/ChatSim';
import ChatsListScreen, { ChatRoomItem } from './src/sim/ChatsListScreen';
import HomeProfileScreen from './src/sim/HomeProfileScreen';
import { BottomTabBar, type TabKey } from './src/sim/BottomTabBar';
import { RealDeviceScreen, DoneScreen } from './src/shell/LessonScreens';
import PracticeSession from './src/shell/PracticeSession';
import LoginGate from './src/shell/LoginGate';
import { initLineAuth, requestLineLogin, logout, type LineUser } from './src/auth/lineAuth';
import {
  loadProgress,
  recordStageDone,
  recordRealDevice,
  resumeStageIndex,
  nodeStateFor,
  EMPTY_PROGRESS,
  type Progress,
} from './src/storage/progress';

/**
 * 分頁架構：activeTab 是底部 5 個分頁裡目前選中的那個（持久存在、有自己的
 * BottomTabBar），stack 是疊在分頁之上的全螢幕內容（課程/綜合練習）——
 * 疊上去的時候整條分頁列連同分頁內容都先不顯示，退出（stack 設回 null）
 * 才回到原本選中的那個分頁，不是寫死跳回聊天列表。
 */
type StackRoute =
  | { name: 'sim'; lessonId: string; stageIndex: number }
  | { name: 'realDevice'; lessonId: string }
  | { name: 'done'; lessonId: string }
  | { name: 'practice' };

/**
 * 聊天列表的假聯絡人內容（CHAT_ROOMS）跟操作狀態（MAP_NODES）分開存放，
 * 在這裡合併成 ChatsListScreen 純吃的 props，sim 層不用認得 lesson 概念。
 */
function buildRoomItems(progress: Progress): ChatRoomItem[] {
  return MAP_NODES.map((node) => {
    const room = CHAT_ROOMS.find((r) => r.id === node.id)!;
    const total = node.lessonId ? LESSONS[node.lessonId]?.stages.length ?? 0 : 0;
    const state = nodeStateFor(progress, node, total);
    return {
      id: node.id,
      title: room.contactName,
      preview: room.preview,
      time: room.time,
      avatarGlyph: room.avatarGlyph,
      avatarColor: room.avatarColor,
      emphasized: state === 'now',
      // 永遠可點。不鎖關卡是已定案的原則 — 擋住他只會讓他關掉 App 去問女兒。
      actionable: !!node.lessonId,
    };
  });
}

const STAGE_LABEL: Record<string, string> = {
  guided: '帶著做',
  solo: '自己做',
  transfer: '真的做',
};

/**
 * 模擬畫面上方唯一的一條外框。
 * 用靛藍是刻意的 — 讓長輩隨時看得出「藍色是老師，綠色是要學的 App」。
 */
function TeachingFrame({
  stageIndex,
  total,
  stage,
  onExit,
}: {
  stageIndex: number;
  total: number;
  stage: string;
  onExit: () => void;
}) {
  const { base } = useScale();
  return (
    <View style={s.frame}>
      <Pressable onPress={onExit} hitSlop={14} accessibilityRole="button">
        <Back size={fz(base, 1.3)} color="#B9CEDC" />
      </Pressable>
      <T systemScaling style={[s.frameText, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
        {`練習 ${stageIndex + 1} / ${total}　${STAGE_LABEL[stage] ?? ''}`}
      </T>
    </View>
  );
}

/**
 * 只在網址帶 ?debug=1 時出現，給開發與據點現場排查用。
 * 長輩的正常使用路徑永遠看不到這一條。
 */
function DebugBadge({ user }: { user: LineUser | null }) {
  const on =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';
  if (!on) return null;
  return (
    <View style={s.debug}>
      <T systemScaling style={s.debugText}>
        {user ? `LINE: ${user.displayName}` : 'LINE: \u533f\u540d\uff08\u672a\u53d6\u5f97\u8eab\u5206\uff09'}
      </T>
    </View>
  );
}

/**
 * \u5206\u9801\u5217\u7684 Discover\uff0fToday\uff0fWallet \u9019\u5e7e\u9846\u9084\u6c92\u505a\u597d\u7684\u6309\u9215\u5171\u7528\u540c\u4e00\u500b\u63d0\u793a\u2014\u2014
 * \u5206\u9801\u5217\u73fe\u5728\u662f\u6574\u500b\u5206\u9801\u5340\u5171\u7528\u7684\u6301\u4e45 UI\uff0c\u63d0\u793a\u4e5f\u53ea\u9700\u8981\u4e00\u4efd\uff0c\u4e0d\u7528\u6bcf\u500b\u5206\u9801\u5167\u5bb9
 * \u5404\u81ea\u7559\u4e00\u4efd\u3002
 */
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

function Root() {
  const { base } = useScale();
  const [activeTab, setActiveTab] = useState<TabKey>('chats');
  const [stack, setStack] = useState<StackRoute | null>(null);
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const { msg, show } = useToast();

  // 身分是加分項：拿不到就匿名繼續，畫面不等它 —— 這在原生端仍然成立。
  // 網頁端則是例外：2026-09-13 使用者已知情推翻「不要註冊登入」，
  // 全站改成強制登入，見下面渲染時的 showGate 判斷。
  // 順序有意義 — 進度的 key 依身分而定，所以要等身分解析完才讀進度。
  useEffect(() => {
    let alive = true;
    initLineAuth().then((user) => {
      if (!alive) return;
      setLineUser(user);
      setAuthChecked(true);
      loadProgress().then((p) => {
        if (alive) setProgress(p);
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  const lesson = stack && 'lessonId' in stack ? LESSONS[stack.lessonId] : undefined;
  // 只在網頁端強制登入 —— 原生端還沒有真正的 LIFF 串接，硬擋只會讓原生版整個開不了機。
  const showGate = Platform.OS === 'web' && authChecked && lineUser === null;

  function advance() {
    if (!stack || stack.name !== 'sim' || !lesson) return;
    recordStageDone(progress, lesson.id, stack.stageIndex).then(setProgress);
    const next = stack.stageIndex + 1;
    if (next < lesson.stages.length) {
      setStack({ name: 'sim', lessonId: lesson.id, stageIndex: next });
    } else {
      setStack({ name: 'realDevice', lessonId: lesson.id });
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ExpoStatusBar style="dark" />
      <DebugBadge user={lineUser} />

      {!authChecked ? null : showGate ? (
        <LoginGate onPressLogin={() => requestLineLogin()} />
      ) : stack ? (
        <>
          {stack.name === 'sim' && lesson ? (
            <View style={{ flex: 1 }}>
              <TeachingFrame
                stageIndex={stack.stageIndex}
                total={lesson.stages.length}
                stage={lesson.stages[stack.stageIndex].stage}
                onExit={() => setStack(null)}
              />
              <ChatSim
                key={`${lesson.id}-${stack.stageIndex}`}
                lesson={lesson}
                script={lesson.stages[stack.stageIndex]}
                onDone={advance}
              />
            </View>
          ) : null}

          {stack.name === 'realDevice' && lesson ? (
            <RealDeviceScreen
              lesson={lesson}
              onConfirm={() => {
                // 只有真的在自己手機上做到才記。跳過不算，也不會被追究。
                recordRealDevice(progress, lesson.id).then(setProgress);
                setStack({ name: 'done', lessonId: lesson.id });
              }}
              onLater={() => setStack({ name: 'done', lessonId: lesson.id })}
            />
          ) : null}

          {stack.name === 'done' && lesson ? (
            <DoneScreen lesson={lesson} onContinue={() => setStack(null)} />
          ) : null}

          {stack.name === 'practice' ? <PracticeSession onExit={() => setStack(null)} /> : null}
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {activeTab === 'chats' ? (
              <ChatsListScreen
                rooms={buildRoomItems(progress)}
                base={base}
                pinned={{
                  title: '綜合練習',
                  sub: '隨機出題，複習學過的技能',
                  onPress: () => setStack({ name: 'practice' }),
                }}
                onOpenRoom={(id) => {
                  const node = MAP_NODES.find((n) => n.id === id);
                  if (!node?.lessonId) return;
                  const target = LESSONS[node.lessonId];
                  setStack({
                    name: 'sim',
                    lessonId: node.lessonId,
                    // 接著上次做到的地方，不是每次都從頭。
                    stageIndex: resumeStageIndex(progress, node.lessonId, target.stages.length),
                  });
                }}
              />
            ) : null}

            {activeTab === 'home' && lineUser ? (
              <HomeProfileScreen
                user={lineUser}
                base={base}
                onLogout={() => {
                  logout();
                  setLineUser(null);
                  setActiveTab('chats');
                }}
              />
            ) : null}
          </View>

          <BottomTabBar
            active={activeTab}
            base={base}
            onPressHome={() => {
              // 原生端目前永遠是匿名（還沒有真正的 LIFF 串接），沒有身分可以顯示，
              // 這裡就單純不動作 —— 跟這顆分頁在網頁端已登入才會出現的內容一致。
              if (lineUser) setActiveTab('home');
            }}
            onPressChats={() => setActiveTab('chats')}
            onPressDiscover={() => show('這個功能還沒做好。')}
            onPressToday={() => show('這個功能還沒做好。')}
            onPressWallet={() => show('這個功能還沒做好。')}
          />

          {msg ? (
            <View style={s.toast} pointerEvents="none">
              <T style={[s.toastText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.4) }]}>{msg}</T>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ScaleProvider>
      <Root />
    </ScaleProvider>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.paper,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  frame: {
    backgroundColor: C.indigoDark,
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  frameText: { color: '#B9CEDC', fontWeight: '700', flex: 1 },
  debug: { backgroundColor: '#3B2E00', paddingHorizontal: 12, paddingVertical: 4 },
  debugText: { color: '#FFD666', fontSize: 12, lineHeight: 16 },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 78,
    backgroundColor: C.chatInk,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  toastText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
