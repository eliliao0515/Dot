import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar, Platform, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScaleProvider, T, useScale } from './src/ui/Scale';
import { C, fz } from './src/ui/theme';
import { Person, PhoneOutline } from './src/ui/Icons';
import { LESSONS } from './src/content/lessons';
import { UNITS, LEVELS, RECOMMENDED_ORDER } from './src/content/curriculum';
import type { Level } from './src/engine/types';
import ScenarioRunner from './src/shell/ScenarioRunner';
import LineSimulatorScreen from './src/shell/LineSimulatorScreen';
import SimulatorsScreen from './src/shell/SimulatorsScreen';
import { useHistoryBack } from './src/ui/useHistoryBack';
import SymbolQuiz from './src/shell/SymbolQuiz';
import {
  loadPoints,
  configurePoints,
  awardQuizRound,
  awardStage,
  awardRealDevice,
  deleteMyPoints,
  EMPTY_POINTS,
  type Points,
} from './src/storage/points';
import { RealDeviceScreen, DoneScreen } from './src/shell/LessonScreens';
import PracticeSession from './src/shell/PracticeSession';
import GestureChallengeRunner from './src/shell/GestureChallengeRunner';
import GestureLab from './src/shell/GestureLab';
import LoginGate from './src/shell/LoginGate';
import TextbookHome from './src/shell/TextbookHome';
import MeScreen from './src/shell/MeScreen';
import TabBar from './src/ui/hig/TabBar';
import { Book } from './src/ui/hig/glyphs';
import { H } from './src/ui/hig/tokens';
import KeyboardViewport from './src/ui/KeyboardViewport';
import type { RowStatus } from './src/ui/hig/ListRow';
import { initLineAuth, requestLineLogin, logout, getAccessToken, type LineUser } from './src/auth/lineAuth';
import { sha256Hex } from './src/auth/devAccess';
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
 * 分頁架構：activeTab 是底部三個分頁（關卡、模擬器、我）裡目前選中的那個，
 * stack 是疊在分頁之上的全螢幕內容（課程/綜合練習）——疊上去的時候
 * 整條分頁列連同分頁內容都先不顯示，退出（stack 設回 null）才回到原本選中的分頁。
 */
type TabKey = 'levels' | 'simulators' | 'me';

type StackRoute =
  | { name: 'sim'; lessonId: string; stageIndex: number }
  | { name: 'realDevice'; lessonId: string }
  | { name: 'done'; lessonId: string }
  | { name: 'practice' }
  /** 手勢單元的一關：猜猜看，然後到真手機卡（specs/v2/P5-gestures.md）。 */
  | { name: 'gesture'; levelId: string; startIndex: number }
  | { name: 'gestureRealDevice'; levelId: string }
  /** 從「模擬器」分頁推進來的 LINE 模擬器，整個畫面就是 LINE。 */
  | { name: 'lineSim' }
  /** 符號選擇題 */
  | { name: 'symbolQuiz' };

/**
 * 一關的狀態。scenario 關卡沿用 v1 的 nodeStateFor 判斷（關卡 id 等於 lessonId，
 * 舊進度直接接得上）；綜合練習和還沒做的關卡沒有進度可言。
 * gesture 關卡借用同一份進度格式：stagesDone 是猜對了幾題。
 */
function levelStatus(progress: Progress, level: Level, quizRounds = 0): RowStatus {
  // 符號選擇題沒有「做到一半」：玩過一局就打勾，之後想玩幾次都可以。
  if (level.kind === 'symbolQuiz') return quizRounds > 0 ? 'done' : 'none';
  if (level.kind === 'gesture') {
    const lp = progress.lessons[level.id];
    if (!lp) return 'none';
    if (lp.realDeviceDone || lp.stagesDone >= level.script.challenges.length) return 'done';
    return lp.stagesDone > 0 ? 'partial' : 'none';
  }
  if (level.kind !== 'scenario') return 'none';
  const total = LESSONS[level.lessonId]?.stages.length ?? 0;
  const state = nodeStateFor(
    progress,
    { id: level.id, label: level.title, sub: level.subtitle, state: 'todo', lessonId: level.lessonId },
    total,
  );
  if (state === 'done') return 'done';
  if (state === 'now') return 'partial';
  return 'none';
}

/**
 * 「接著上次」那顆大按鈕要指去哪裡：
 *  - 上次那一課還沒做完 → 接著上次
 *  - 上次那一課做完了、或從來沒上過 → 推薦順序裡下一個還沒做完、可以上的關卡
 * 只決定按鈕指向，不擋任何關卡。
 */
function resumeTarget(progress: Progress): { label: string; levelId: string } | null {
  // 只考慮關卡頁上實際列出來的關卡；暫時隱藏的舊課不要被「接著上次」指過去。
  const last =
    progress.lastLessonId && RECOMMENDED_ORDER.includes(progress.lastLessonId) ? LEVELS[progress.lastLessonId] : undefined;
  if (last && levelStatus(progress, last) === 'partial') {
    return { label: `接著上次：${last.title}`, levelId: last.id };
  }
  const next = RECOMMENDED_ORDER.map((id) => LEVELS[id]).find(
    (l) => (l.kind === 'scenario' || l.kind === 'gesture') && levelStatus(progress, l) !== 'done',
  );
  if (!next) return null;
  return { label: last ? `下一課：${next.title}` : `從第一課開始：${next.title}`, levelId: next.id };
}

/**
 * 只在開發模式、網頁、網址帶 ?devlogin=1 時，用一個假身分跳過 LINE 登入。
 * 本機 localhost 走不完 LIFF 的授權轉址，沒有這個就看不到登入後的畫面。
 * 正式打包（npm run export）時 __DEV__ 是 false，這段整個不會生效。
 */
function devLoginUser(): LineUser | null {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const mode = new URLSearchParams(window.location.search).get('devlogin');
  // ?devlogin=1 是開發者（.env.local 放了 dev-local 的雜湊），?devlogin=guest 是一般學員。
  if (mode === '1') return { userId: 'dev-local', displayName: '開發測試' };
  if (mode === 'guest') return { userId: 'dev-guest', displayName: '一般學員' };
  return null;
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
  // 顯示自己 userId 的雜湊，讓開發者複製去設定 GitHub Secret（DEV_USER_HASHES）。
  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    if (on && user) sha256Hex(user.userId).then(setHash);
  }, [on, user]);
  if (!on) return null;
  return (
    <View style={s.debug}>
      <T systemScaling style={s.debugText}>
        {user ? `LINE: ${user.displayName}` : 'LINE: \u533f\u540d\uff08\u672a\u53d6\u5f97\u8eab\u5206\uff09'}
      </T>
      {hash ? (
        <T systemScaling selectable style={s.debugText}>
          {`dev hash: ${hash}`}
        </T>
      ) : null}
    </View>
  );
}

function Root() {
  const { base } = useScale();
  const [activeTab, setActiveTab] = useState<TabKey>('levels');
  const [stack, setStack] = useState<StackRoute | null>(null);
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [points, setPoints] = useState<Points>(EMPTY_POINTS);

  // 身分是加分項：拿不到就匿名繼續，畫面不等它 —— 這在原生端仍然成立。
  // 網頁端則是例外：2026-09-13 使用者已知情推翻「不要註冊登入」，
  // 全站改成強制登入，見下面渲染時的 showGate 判斷。
  // 順序有意義 — 進度的 key 依身分而定，所以要等身分解析完才讀進度。
  useEffect(() => {
    let alive = true;
    initLineAuth().then((liffUser) => {
      if (!alive) return;
      const user = liffUser ?? devLoginUser();
      setLineUser(user);
      setAuthChecked(true);
      // 點數存在伺服器，依 LINE 身分。開發模式的假身分送 "dev:<id>"，只有本機伺服器（DEV_MODE）認得。
      configurePoints({
        identity: user?.userId ?? null,
        token: liffUser ? getAccessToken : async () => (user ? `dev:${user.userId}` : null),
      });
      loadPoints().then((p) => {
        if (alive) setPoints(p);
      });
      loadProgress().then((p) => {
        if (alive) setProgress(p);
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  const lesson = stack && 'lessonId' in stack ? LESSONS[stack.lessonId] : undefined;
  const gestureLevel = stack && 'levelId' in stack ? LEVELS[stack.levelId] : undefined;
  // 只在網頁端強制登入 —— 原生端還沒有真正的 LIFF 串接，硬擋只會讓原生版整個開不了機。
  const showGate = Platform.OS === 'web' && authChecked && lineUser === null;

  // 全螢幕的畫面（課程、LINE 模擬器）打開時，按手機或瀏覽器的上一頁就回到原本的分頁。
  useHistoryBack(stack !== null, () => setStack(null));


  function advance() {
    if (!stack || stack.name !== 'sim' || !lesson) return;
    // 第一次完成這一步才給點數；重做已經做過的步驟不再給，避免同一步一直刷。
    const doneBefore = progress.lessons[lesson.id]?.stagesDone ?? 0;
    if (stack.stageIndex >= doneBefore) awardStage(lesson.id, stack.stageIndex).then(setPoints);
    recordStageDone(progress, lesson.id, stack.stageIndex).then(setProgress);
    const next = stack.stageIndex + 1;
    if (next < lesson.stages.length) {
      setStack({ name: 'sim', lessonId: lesson.id, stageIndex: next });
    } else {
      setStack({ name: 'realDevice', lessonId: lesson.id });
    }
  }

  function openLevel(level: Level) {
    if (level.kind === 'symbolQuiz') {
      setStack({ name: 'symbolQuiz' });
      return;
    }
    if (level.kind === 'practice') {
      setStack({ name: 'practice' });
      return;
    }
    if (level.kind === 'gesture') {
      // 從還沒猜對的那一題開始；全部猜過了就從頭再玩一次。
      const done = progress.lessons[level.id]?.stagesDone ?? 0;
      setStack({ name: 'gesture', levelId: level.id, startIndex: done < level.script.challenges.length ? done : 0 });
      return;
    }
    if (level.kind !== 'scenario') return;
    const target = LESSONS[level.lessonId];
    setStack({
      name: 'sim',
      lessonId: level.lessonId,
      // 接著上次做到的地方，不是每次都從頭。
      stageIndex: resumeStageIndex(progress, level.lessonId, target.stages.length),
    });
  }

  return (
    <SafeAreaView style={[s.safe, !stack && !showGate && { backgroundColor: H.bg }]}>
      <ExpoStatusBar style="dark" />
      <DebugBadge user={lineUser} />

      {!authChecked ? null : showGate ? (
        <LoginGate onPressLogin={() => requestLineLogin()} />
      ) : stack ? (
        <>
          {stack.name === 'sim' && lesson ? (
            <ScenarioRunner
              key={lesson.id}
              lesson={lesson}
              script={lesson.stages[stack.stageIndex]}
              onDone={advance}
              onExit={() => setStack(null)}
            />
          ) : null}

          {stack.name === 'gesture' && gestureLevel?.kind === 'gesture' ? (
            <GestureChallengeRunner
              key={gestureLevel.id}
              script={gestureLevel.script}
              startIndex={stack.startIndex}
              onChallengeDone={(i) => recordStageDone(progress, gestureLevel.id, i).then(setProgress)}
              onFinish={() => setStack({ name: 'gestureRealDevice', levelId: gestureLevel.id })}
              onExit={() => setStack(null)}
            />
          ) : null}

          {stack.name === 'gestureRealDevice' && gestureLevel?.kind === 'gesture' ? (
            <RealDeviceScreen
              realDevice={gestureLevel.script.realDevice}
              confirmLabel="我做到了"
              onConfirm={() => {
                recordRealDevice(progress, gestureLevel.id).then(setProgress);
                setStack(null);
              }}
              onLater={() => setStack(null)}
            />
          ) : null}

          {stack.name === 'realDevice' && lesson ? (
            <RealDeviceScreen
              realDevice={lesson.realDevice}
              onConfirm={() => {
                // 只有真的在自己手機上做到才記。跳過不算，也不會被追究。
                if (!progress.lessons[lesson.id]?.realDeviceDone) awardRealDevice(lesson.id).then(setPoints);
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

          {stack.name === 'lineSim' ? <LineSimulatorScreen user={lineUser} onExit={() => setStack(null)} /> : null}

          {stack.name === 'symbolQuiz' ? (
            <SymbolQuiz
              totalPoints={points.total}
              onFinishRound={(correct) => awardQuizRound(correct).then(setPoints)}
              onExit={() => setStack(null)}
            />
          ) : null}
        </>
      ) : (
        <View style={{ flex: 1, backgroundColor: H.bg }}>
          <View style={{ flex: 1 }}>
            {activeTab === 'levels' ? (
              <TextbookHome
                units={UNITS}
                levels={LEVELS}
                statusOf={(level) => levelStatus(progress, level, points.quizRounds)}
                resume={resumeTarget(progress)}
                points={points.total}
                onOpenLevel={openLevel}
              />
            ) : null}

            {activeTab === 'simulators' ? <SimulatorsScreen onOpenLine={() => setStack({ name: 'lineSim' })} /> : null}

            {activeTab === 'me' ? (
              <MeScreen
                user={lineUser}
                points={points.total}
                onDeletePoints={() =>
                  deleteMyPoints().then((ok) => {
                    if (ok) setPoints(EMPTY_POINTS);
                    return ok;
                  })
                }
                onLogout={() => {
                  logout();
                  setLineUser(null);
                  setPoints(EMPTY_POINTS);
                  setActiveTab('levels');
                }}
              />
            ) : null}
          </View>

          <TabBar<TabKey>
            tabs={[
              { key: 'levels', label: '關卡', icon: (color) => <Book size={fz(base, 1.6)} color={color} /> },
              {
                key: 'simulators',
                label: '模擬器',
                icon: (color) => <PhoneOutline size={fz(base, 1.6)} color={color} weight={2.2} />,
              },
              { key: 'me', label: '我', icon: (color) => <Person size={fz(base, 1.6)} color={color} weight={2.2} /> },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * 網址帶 ?gesturelab=1 時只顯示手勢測試頁（specs/v2/P5-gestures.md §5.3），給開發者和志工在實機上排查。
 * 不經過登入：那一頁沒有任何個人資料，而且要能在還沒設定 LINE 登入的測試機上打開。
 */
function isGestureLab(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('gesturelab') === '1'
  );
}

export default function App() {
  return (
    <ScaleProvider>
      <KeyboardViewport>{isGestureLab() ? <GestureLab /> : <Root />}</KeyboardViewport>
    </ScaleProvider>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.paper,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  debug: { backgroundColor: '#3B2E00', paddingHorizontal: 12, paddingVertical: 4 },
  debugText: { color: '#FFD666', fontSize: 12, lineHeight: 16 },
});
