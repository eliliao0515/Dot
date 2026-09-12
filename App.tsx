import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar, Platform, Pressable, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScaleProvider, T, useScale } from './src/ui/Scale';
import { C, fz } from './src/ui/theme';
import { LESSONS, MAP_NODES, CHAT_ROOMS } from './src/content/lessons';
import ChatSim from './src/sim/ChatSim';
import ChatsListScreen, { ChatRoomItem } from './src/sim/ChatsListScreen';
import HomeProfileScreen from './src/sim/HomeProfileScreen';
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

type Route =
  | { name: 'chats' }
  | { name: 'sim'; lessonId: string; stageIndex: number }
  | { name: 'realDevice'; lessonId: string }
  | { name: 'done'; lessonId: string }
  | { name: 'practice' }
  | { name: 'home' };

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
      <T systemScaling style={[s.frameText, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
        {`練習 ${stageIndex + 1} / ${total}　${STAGE_LABEL[stage] ?? ''}`}
      </T>
      <Pressable onPress={onExit} hitSlop={14} accessibilityRole="button">
        <T systemScaling style={[s.frameExit, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
          先離開
        </T>
      </Pressable>
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

function Root() {
  const { base } = useScale();
  const [route, setRoute] = useState<Route>({ name: 'chats' });
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);

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
  const lesson = 'lessonId' in route ? LESSONS[route.lessonId] : undefined;
  // 只在網頁端強制登入 —— 原生端還沒有真正的 LIFF 串接，硬擋只會讓原生版整個開不了機。
  const showGate = Platform.OS === 'web' && authChecked && lineUser === null;

  function advance() {
    if (route.name !== 'sim' || !lesson) return;
    recordStageDone(progress, lesson.id, route.stageIndex).then(setProgress);
    const next = route.stageIndex + 1;
    if (next < lesson.stages.length) {
      setRoute({ name: 'sim', lessonId: lesson.id, stageIndex: next });
    } else {
      setRoute({ name: 'realDevice', lessonId: lesson.id });
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ExpoStatusBar style="dark" />
      <DebugBadge user={lineUser} />

      {!authChecked ? null : showGate ? (
        <LoginGate onPressLogin={() => requestLineLogin()} />
      ) : (
        <>
          {route.name === 'chats' ? (
            <ChatsListScreen
              rooms={buildRoomItems(progress)}
              base={base}
              pinned={{
                title: '綜合練習',
                sub: '隨機出題，複習學過的技能',
                onPress: () => setRoute({ name: 'practice' }),
              }}
              onOpenRoom={(id) => {
                const node = MAP_NODES.find((n) => n.id === id);
                if (!node?.lessonId) return;
                const target = LESSONS[node.lessonId];
                setRoute({
                  name: 'sim',
                  lessonId: node.lessonId,
                  // 接著上次做到的地方，不是每次都從頭。
                  stageIndex: resumeStageIndex(progress, node.lessonId, target.stages.length),
                });
              }}
              onPressHome={() => {
                // 原生端目前永遠是匿名（還沒有真正的 LIFF 串接），沒有身分可以顯示，
                // 這裡就單純不動作 —— 跟這顆分頁在網頁端已登入才會出現的內容一致。
                if (lineUser) setRoute({ name: 'home' });
              }}
            />
          ) : null}

          {route.name === 'home' && lineUser ? (
            <HomeProfileScreen
              user={lineUser}
              base={base}
              onPressChats={() => setRoute({ name: 'chats' })}
              onLogout={() => {
                logout();
                setLineUser(null);
                setRoute({ name: 'chats' });
              }}
            />
          ) : null}

          {route.name === 'practice' ? (
            <PracticeSession onExit={() => setRoute({ name: 'chats' })} />
          ) : null}

          {route.name === 'sim' && lesson ? (
            <View style={{ flex: 1 }}>
              <TeachingFrame
                stageIndex={route.stageIndex}
                total={lesson.stages.length}
                stage={lesson.stages[route.stageIndex].stage}
                onExit={() => setRoute({ name: 'chats' })}
              />
              <ChatSim
                key={`${lesson.id}-${route.stageIndex}`}
                lesson={lesson}
                script={lesson.stages[route.stageIndex]}
                onDone={advance}
              />
            </View>
          ) : null}

          {route.name === 'realDevice' && lesson ? (
            <RealDeviceScreen
              lesson={lesson}
              onConfirm={() => {
                // 只有真的在自己手機上做到才記。跳過不算，也不會被追究。
                recordRealDevice(progress, lesson.id).then(setProgress);
                setRoute({ name: 'done', lessonId: lesson.id });
              }}
              onLater={() => setRoute({ name: 'done', lessonId: lesson.id })}
            />
          ) : null}

          {route.name === 'done' && lesson ? (
            <DoneScreen lesson={lesson} onContinue={() => setRoute({ name: 'chats' })} />
          ) : null}
        </>
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
  frameExit: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
  debug: { backgroundColor: '#3B2E00', paddingHorizontal: 12, paddingVertical: 4 },
  debugText: { color: '#FFD666', fontSize: 12, lineHeight: 16 },
});
