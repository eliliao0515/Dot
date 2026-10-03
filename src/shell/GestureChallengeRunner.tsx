import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import type { GestureChallenge, GestureLevelScript } from '../engine/types';
import { SANDBOX_ROOMS } from '../content/sandbox';
import LineChatScreen, { type LineAction } from '../sim/LineChatScreen';
import ChatsListScreen from '../sim/ChatsListScreen';
import { BottomTabBar } from '../sim/BottomTabBar';
import EdgeSwipeBack from '../sim/EdgeSwipeBack';
import { useHistoryBack } from '../ui/useHistoryBack';

/**
 * 手勢單元的一關：猜猜看（specs/v2/P5-gestures.md §1）。
 *
 * 不走鷹架。每一題給一件想做的事，長輩在真的 LINE 畫面上自己試：
 *  - 猜對了 → 「原來如此」卡片，講這個手勢通常是什麼意思
 *  - 做了別的事 → 畫面照真 LINE 的反應走（按返回鍵就真的回到列表），外殼說一句中性的話，可以再試
 *  - 提示要自己按「給我提示」才給：第一次給方向，第二次播示範動畫
 * 有沒有用提示都一樣算完成，不顯示第幾次才猜到。
 *
 * 「從左邊緣往右滑」有兩條路會算猜對（§5.2）：
 *  1. 我們自己偵測到邊緣滑（iPhone 加到主畫面、電腦）
 *  2. 收到瀏覽器的「上一頁」（iPhone Safari 的邊緣滑、Android 的系統返回手勢都會觸發）
 * 聊天室打開時推一筆只屬於這一題的瀏覽紀錄，上一頁退掉的是它，不會離開 App。
 */

type Screen = 'chat' | 'list';

function roomItems() {
  return SANDBOX_ROOMS.map((r) => ({
    id: r.id,
    title: r.contactName,
    preview: r.preview,
    time: r.time,
    avatarGlyph: r.avatarGlyph,
    avatarColor: r.avatarColor,
    emphasized: false,
    unread: false,
    actionable: true,
  }));
}

/** LINE 的聊天列表＋底部分頁。滑開聊天室時露出來的、回到列表時看到的，都是這一個。 */
function ChatsHome({ base, onOpenRoom }: { base: number; onOpenRoom: (id: string) => void }) {
  const noop = () => {};
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ flex: 1 }}>
        <ChatsListScreen rooms={roomItems()} base={base} onOpenRoom={onOpenRoom} />
      </View>
      <BottomTabBar
        active="chats"
        base={base}
        onPressHome={noop}
        onPressChats={noop}
        onPressDiscover={noop}
        onPressToday={noop}
        onPressWallet={noop}
      />
    </View>
  );
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduce(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  return reduce;
}

/**
 * 示範動畫：一個手指觸碰點從左邊緣往右滑，重複三次。
 * 開了「減少動態效果」就改成靜止的觸碰點加箭頭。
 */
function EdgeSwipeDemo({ base, playKey }: { base: number; playKey: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (reduce || width === 0) return;
    t.setValue(0);
    const one = Animated.sequence([
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: false }),
      Animated.delay(250),
      Animated.timing(t, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.delay(450),
    ]);
    const anim = Animated.loop(one, { iterations: 3 });
    anim.start();
    return () => anim.stop();
  }, [t, reduce, width, playKey]);

  const dot = fz(base, 2.6);
  const travel = Math.max(0, width * 0.62);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* 左邊緣標一條，讓人看到「從這裡開始」 */}
      <View style={[st.edgeMark, { top: '30%', height: '30%' }]} />
      {reduce ? (
        <View style={[st.demoRow, { top: '42%' }]}>
          <View style={[st.finger, { width: dot, height: dot, borderRadius: dot / 2 }]} />
          <T style={[st.arrowText, { fontSize: fz(base, 2.2), lineHeight: fz(base, 2.6) }]}>⟶</T>
        </View>
      ) : (
        <Animated.View
          style={[
            st.finger,
            {
              position: 'absolute',
              top: '42%',
              left: 4,
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              opacity: t.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }],
            },
          ]}
        />
      )}
    </View>
  );
}

export default function GestureChallengeRunner({
  script,
  startIndex,
  onChallengeDone,
  onFinish,
  onExit,
}: {
  script: GestureLevelScript;
  startIndex: number;
  /** 猜對一題（不管有沒有用提示）。 */
  onChallengeDone: (index: number) => void;
  /** 最後一題的「原來如此」看完了。 */
  onFinish: () => void;
  onExit: () => void;
}) {
  const { base } = useScale();
  const [index, setIndex] = useState(startIndex);
  const challenge: GestureChallenge = script.challenges[index];
  const [view, setView] = useState<Screen>('chat');
  const [solved, setSolved] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [demoKey, setDemoKey] = useState(0);
  const [nudge, setNudge] = useState<string | null>(null);
  // 邊緣滑和瀏覽器的上一頁可能同時來（iPhone Safari），只算一次。
  const solvedRef = useRef(false);

  const room = SANDBOX_ROOMS.find((r) => r.id === challenge.scene.openRoomId) ?? SANDBOX_ROOMS[0];
  const last = index === script.challenges.length - 1;

  function solve() {
    if (solvedRef.current) return;
    solvedRef.current = true;
    setSolved(true);
    setView('list');
    setNudge(null);
    onChallengeDone(index);
  }

  // 聊天室打開、還沒猜到的時候，「上一頁」就是答案。
  useHistoryBack(view === 'chat' && !solved, solve);

  function handleAction(action: LineAction) {
    if (action.type === 'viewChange') setNudge(null);
    // 其他動作（傳訊息、看照片……）都是正常的 LINE 行為，照常讓它發生，不評論。
  }

  /** 按了左上角的返回鍵：真的回到列表（錯的路也走得通），說一句中性的話。 */
  function pressedBackButton() {
    if (solvedRef.current) return;
    setView('list');
    setNudge(challenge.nudges.backButton ?? '這樣也回得去！再試試看別的方法。');
  }

  /** 在列表上點聊天室：再進去一次，就是再試一次。 */
  function reopen(roomId: string) {
    if (solvedRef.current) return;
    if (roomId !== room.id) {
      setNudge(`這一題要看的是${room.contactName}的聊天室，點那一列再進去。`);
      return;
    }
    setNudge(null);
    setView('chat');
  }

  function askHint() {
    if (hintLevel === 0) setHintLevel(1);
    else {
      setHintLevel(2);
      setDemoKey((k) => k + 1);
    }
  }

  function next() {
    if (last) {
      onFinish();
      return;
    }
    solvedRef.current = false;
    setSolved(false);
    setHintLevel(0);
    setNudge(null);
    setView('chat');
    setIndex((i) => i + 1);
  }

  const chatsHome = <ChatsHome base={base} onOpenRoom={reopen} />;

  const taskCard = (
    <View style={st.card}>
      <T style={[st.cardEyebrow, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.3) }]}>
        {`猜猜看　${index + 1}／${script.challenges.length}`}
      </T>
      <T style={[st.cardGoal, { fontSize: fz(base, 1.02), lineHeight: fz(base, 1.55) }]}>{challenge.goal}</T>
      {hintLevel >= 1 ? (
        <T style={[st.cardHint, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.5) }]}>{`提示：${challenge.hint}`}</T>
      ) : null}
      <View style={st.cardRow}>
        <Pressable onPress={askHint} hitSlop={8} accessibilityRole="button" style={st.hintBtn}>
          <T style={[st.hintBtnText, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.35) }]}>
            {hintLevel === 0 ? '給我提示' : hintLevel === 1 ? '做給我看' : '再看一次'}
          </T>
        </Pressable>
        <Pressable onPress={onExit} hitSlop={8} accessibilityRole="button" style={st.exitBtn}>
          <T style={[st.exitText, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.35) }]}>離開這一關</T>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={st.wrap}>
      {view === 'chat' ? (
        <EdgeSwipeBack thresholds={script.thresholds.edgeSwipe} underlay={chatsHome} onSwipeBack={solve}>
          <LineChatScreen
            key={`${challenge.id}`}
            contact={room.contactName}
            incoming={room.messages.map((bubble) => ({ bubble, contact: room.contactName }))}
            onAction={handleAction}
            onPressBack={pressedBackButton}
            aboveInputBar={taskCard}
            screenOverlay={hintLevel >= 2 ? <EdgeSwipeDemo key={demoKey} base={base} playKey={demoKey} /> : null}
          />
        </EdgeSwipeBack>
      ) : (
        chatsHome
      )}

      {view === 'list' && !solved ? (
        <View style={st.sheet}>
          <T style={[st.sheetText, { fontSize: fz(base, 1), lineHeight: fz(base, 1.55) }]}>{nudge}</T>
          <View style={st.cardRow}>
            <Pressable onPress={() => reopen(room.id)} accessibilityRole="button" style={st.primaryBtn}>
              <T style={[st.primaryText, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.45) }]}>再試一次</T>
            </Pressable>
            <Pressable onPress={onExit} hitSlop={8} accessibilityRole="button" style={st.exitBtnDark}>
              <T style={[st.exitTextDark, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.35) }]}>離開這一關</T>
            </Pressable>
          </View>
        </View>
      ) : null}

      {view === 'list' && solved ? (
        <View style={st.backdrop}>
          <View style={st.aha}>
            <T style={[st.ahaEyebrow, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.35) }]}>原來如此</T>
            <T style={[st.ahaTitle, { fontSize: fz(base, 1.35), lineHeight: fz(base, 1.85) }]}>{challenge.aha.gesture}</T>
            <T style={[st.ahaBody, { fontSize: fz(base, 1), lineHeight: fz(base, 1.6) }]}>{challenge.aha.meaning}</T>
            <Pressable onPress={next} accessibilityRole="button" style={[st.primaryBtn, st.ahaBtn]}>
              <T style={[st.ahaBtnText, { fontSize: fz(base, 1.1), lineHeight: fz(base, 1.5) }]}>{last ? '完成' : '下一題'}</T>
            </Pressable>
          </View>
        </View>
      ) : null}

      {view === 'chat' && nudge ? (
        <View style={st.toast} pointerEvents="none">
          <T style={[st.toastText, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.5) }]}>{nudge}</T>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },

  // 任務卡：放在對話串和輸入列之間（跟 ScenarioRunner 的引導條同一個位置），不蓋住輸入列。
  card: { backgroundColor: C.indigo, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 },
  cardEyebrow: { color: '#CBDCE7', fontWeight: '700' },
  cardGoal: { color: '#fff', fontWeight: '700', marginTop: 4 },
  cardHint: { color: '#fff', marginTop: 8, fontWeight: '500' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  hintBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBtnText: { color: C.indigo, fontWeight: '800' },
  exitBtn: { minHeight: 48, paddingHorizontal: 8, justifyContent: 'center' },
  exitText: { color: '#fff', textDecorationLine: 'underline', fontWeight: '500' },

  // 按了返回鍵、回到列表時的說明。蓋住 LINE 底部分頁，那裡在這一題本來就不需要按。
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.indigo,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  sheetText: { color: '#fff', fontWeight: '700' },
  primaryBtn: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: C.indigo, fontWeight: '800' },
  exitBtnDark: { minHeight: 48, paddingHorizontal: 8, justifyContent: 'center' },
  exitTextDark: { color: '#fff', textDecorationLine: 'underline', fontWeight: '500' },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,51,74,0.35)',
    justifyContent: 'flex-end',
  },
  aha: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 3,
    borderColor: C.indigo,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
  },
  ahaEyebrow: { color: C.indigo, fontWeight: '800' },
  ahaTitle: { color: C.ink, fontWeight: '900', marginTop: 6 },
  ahaBody: { color: C.ink, marginTop: 10 },
  ahaBtn: { backgroundColor: C.indigo, marginTop: 18, minHeight: 72 },
  ahaBtnText: { color: '#fff', fontWeight: '800' },

  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 70,
    backgroundColor: C.indigoDark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    zIndex: 60,
  },
  toastText: { color: '#fff', fontWeight: '700', textAlign: 'center' },

  edgeMark: { position: 'absolute', left: 0, width: 5, backgroundColor: C.red, borderRadius: 3 },
  demoRow: { position: 'absolute', left: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  finger: { backgroundColor: 'rgba(179,43,34,0.35)', borderWidth: 3, borderColor: C.red },
  arrowText: { color: C.red, fontWeight: '900' },
});
