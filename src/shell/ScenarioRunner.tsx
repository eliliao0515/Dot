import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Speaker } from '../ui/Icons';
import type { Lesson, StageScript } from '../engine/types';
import LineChatScreen, { type LineAction, type ThreadItem } from '../sim/LineChatScreen';
import { inputBarMetrics, topBarMetrics, callMenuMetrics } from '../sim/parts';
import CallSession, { type CallResult } from './CallSession';
import { primeCallAudio, type MicHandle } from './callAudio';
import { freeCall } from '../content/calls';

/**
 * LINE 情境關卡的教學疊層。疊在純 LINE 畫面（LineChatScreen）之上，
 * 底下的介面一個像素都不改。
 *
 * guided 提示全開，solo 要自己按「卡住了」，transfer 完全沒有提示。
 *
 * 會過關的動作是五條並行路徑，同一時刻只有 lesson.target.node 指定的那一條算數：
 * 送出語音（'mic'）、電話選單選「視訊通話」（'video'）、送出貼圖（'sticker'）、
 * 在看照片裡點下載（'photo'）、在輸入框打字送出（'reply'）、
 * 打語音電話照劇本講完、最後自己掛斷（'call'，由 CallSession 判斷）。
 * 其他課裡打字送出、傳照片、傳聯絡人都不算 —— 不讓長輩用別的方法繞過這一課真正要練的動作。
 */

const PASS_ACTION: Record<Lesson['target']['node'], LineAction['type'] | null> = {
  mic: 'sendVoice',
  video: 'pickVideoCall',
  sticker: 'sendSticker',
  photo: 'savePhoto',
  reply: 'sendText',
  plus: null,
  call: null,
};

const SUCCESS_TEXT: Partial<Record<Lesson['target']['node'], string>> = {
  video: '撥出去了',
  call: '電話打完了',
  sticker: '貼圖傳出去了',
  photo: '存起來了',
};

function GuideRing({ base, node }: { base: number; node: 'mic' | 'sticker' | 'reply' }) {
  const pulse = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduce]);

  // 紅圈的位置跟 LINE 輸入列用同一組尺寸（sim/parts.tsx 的 inputBarMetrics），輸入列改了這裡自動跟著動。
  const m = inputBarMetrics(base);

  if (node === 'reply') {
    const pad = 6;
    return (
      <View
        pointerEvents="none"
        style={[
          st.ring,
          {
            left: m.fieldLeft - pad,
            right: m.fieldRightInset - pad,
            bottom: m.padV - pad,
            height: m.fieldH + pad * 2,
            borderRadius: (m.fieldH + pad * 2) / 2,
          },
        ]}
      />
    );
  }

  // 麥克風在輸入列最右邊那一格；貼圖（笑臉）在輸入框裡面靠右。
  const targetSize = node === 'sticker' ? m.smileSize : m.micSize;
  const ringSize = targetSize + 18;
  const centerFromRight =
    node === 'sticker' ? m.fieldRightInset + m.fieldPadR + m.smileSize / 2 : m.padR + m.rightSlot / 2;
  const rightOffset = centerFromRight - ringSize / 2;
  const bottomOffset = m.barH / 2 - ringSize / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        st.ring,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2, right: rightOffset, bottom: bottomOffset },
      ]}
    >
      {!reduce && (
        <Animated.View
          style={[
            st.ringPulse,
            {
              borderRadius: (ringSize + 18) / 2,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }) }],
            },
          ]}
        />
      )}
    </View>
  );
}

/**
 * 打電話課帶著做的紅圈：還沒打開電話選單時圈頂部的電話，打開後圈「語音通話」。
 * 位置跟 LINE 頂部列、電話選單用同一組尺寸（sim/parts.tsx）。
 */
function DialRing({ base, menuOpen }: { base: number; menuOpen: boolean }) {
  const top = topBarMetrics(base);
  if (!menuOpen) {
    const size = top.iconSlot + 18;
    return (
      <View
        pointerEvents="none"
        style={[
          st.ring,
          { zIndex: 30, width: size, height: size, borderRadius: size / 2, top: top.height / 2 - size / 2, right: top.phoneCenterFromRight - size / 2 },
        ]}
      />
    );
  }
  const menu = callMenuMetrics(base);
  const pad = 6;
  return (
    <View
      pointerEvents="none"
      style={[
        st.ring,
        {
          zIndex: 30,
          top: top.height + menu.padV - pad,
          left: '50%',
          marginLeft: -(menu.gap / 2 + menu.itemW) - pad,
          width: menu.itemW + pad * 2,
          height: menu.itemH + pad * 2,
          borderRadius: 16,
        },
      ]}
    />
  );
}

export default function ScenarioRunner({
  lesson,
  script,
  onDone,
  onExit,
}: {
  lesson: Lesson;
  script: StageScript;
  onDone: () => void;
  /** LINE 畫面左上角的返回鍵就是離開練習（跟真手機一樣，按返回就離開這個聊天室）。 */
  onExit?: () => void;
}) {
  const { base } = useScale();
  const [incoming, setIncoming] = useState<ThreadItem[]>([]);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [askedForHelp, setAskedForHelp] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [callMenuOpen, setCallMenuOpen] = useState(false);
  /** 通話中：點「語音通話」那一刻要到的麥克風（可能是 null）。 */
  const [call, setCall] = useState<{ mic: Promise<MicHandle | null> } | null>(null);

  // 整段對話是連續的一條串：換一關就把這一關的開場訊息接上去，不是換掉。
  useEffect(() => {
    setIncoming((prev) => [...prev, ...script.messages.map((bubble) => ({ bubble, contact: script.contact }))]);
    setWrongTaps(0);
    setAskedForHelp(false);
    setNudge(null);
    setSucceeded(false);
    setCallMenuOpen(false);
    setCall(null);
  }, [script.stage]);

  const showCoach = script.stage === 'guided' || askedForHelp;
  const target = lesson.target;

  function pass() {
    setSucceeded(true);
    setTimeout(onDone, 1200);
  }

  /**
   * 錯誤路徑全部放行：按到別的地方不會被鎖住，也不會有紅色錯誤提示。
   * 只有連續亂點才把求助按鈕放大一次。
   */
  function handleAction(action: LineAction) {
    if (succeeded) return;
    if (action.type === PASS_ACTION[target.node]) {
      pass();
      return;
    }
    switch (action.type) {
      case 'wrongTap':
        setWrongTaps((n) => n + 1);
        break;
      case 'openCallMenu':
        setCallMenuOpen(true);
        break;
      case 'closeCallMenu':
        setCallMenuOpen(false);
        break;
      case 'pickVoiceCall':
        // 必須在點擊當下啟動聲音和麥克風，iPhone 才會放行。
        setNudge(null);
        setCall({ mic: primeCallAudio() });
        break;
      case 'pickVideoCall':
        setNudge('視訊通話還沒做好。');
        break;
      case 'unbuilt':
        setNudge('這個功能還沒做好。');
        break;
      case 'viewChange':
        setNudge(null);
        break;
    }
  }

  /**
   * 掛斷之後：聊天室多一則通話紀錄。打電話課照劇本講完就過關；
   * 提早掛斷不是錯，只是溫和地請他再打一次。
   */
  function handleCallEnd(result: CallResult) {
    setCall(null);
    setIncoming((prev) => [
      ...prev,
      {
        bubble: { id: `call-${Date.now()}`, from: 'me', kind: 'call', seconds: result.seconds, canceled: !result.connected },
        contact: script.contact,
      },
    ]);
    if (target.node !== 'call' || succeeded) return;
    if (result.completed) pass();
    else setNudge('沒關係，可以再打一次。點右上角的電話。');
  }

  const helpIsBig = wrongTaps >= 2 && !askedForHelp;
  const callScript = target.node === 'call' && script.call ? script.call : freeCall;
  const dialCoach = callMenuOpen ? '選左邊的「語音通話」。' : lesson.stages[0].coach;

  return (
    <LineChatScreen
      contact={script.contact}
      incoming={incoming}
      resetKey={script.stage}
      hideAttachMenu={succeeded}
      onAction={handleAction}
      onPressBack={onExit}
      threadOverlay={
        // solo 階段的求助鍵。永遠在，但不會自己跳出來。
        script.stage !== 'guided' && !askedForHelp && !succeeded ? (
          <Pressable
            onPress={() => setAskedForHelp(true)}
            hitSlop={12}
            style={[st.helpBtn, helpIsBig && st.helpBtnBig]}
          >
            <T style={[st.helpText, { fontSize: fz(base, helpIsBig ? 1 : 0.88), lineHeight: fz(base, 1.4) }]}>
              卡住了，教我
            </T>
          </Pressable>
        ) : null
      }
      aboveInputBar={
        succeeded ? null : showCoach ? (
          <View style={st.coach}>
            <Speaker size={fz(base, 1.3)} />
            <View style={st.coachBody}>
              <T style={[st.coachText, { fontSize: fz(base, 1.02), lineHeight: fz(base, 1.55) }]}>
                {target.node === 'call' ? dialCoach : lesson.stages[0].coach}
              </T>
              <T style={[st.coachReplay, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.3) }]}>再念一次</T>
            </View>
          </View>
        ) : (
          <View style={st.note} pointerEvents="none">
            <T style={[st.noteText, { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.45) }]}>{script.note}</T>
          </View>
        )
      }
      chatOverlay={
        showCoach && !succeeded && !call && (target.node === 'mic' || target.node === 'sticker' || target.node === 'reply') ? (
          <GuideRing base={base} node={target.node} />
        ) : showCoach && !succeeded && !call && target.node === 'call' ? (
          <DialRing base={base} menuOpen={callMenuOpen} />
        ) : null
      }
      screenOverlay={
        succeeded ? (
          <View style={st.success} pointerEvents="none">
            <T style={[st.successText, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.6) }]}>
              {SUCCESS_TEXT[target.node] ?? '送出去了'}
            </T>
          </View>
        ) : null
      }
      topOverlay={
        call ? (
          <CallSession
            contact={script.contact}
            script={callScript}
            mic={call.mic}
            hints={target.node === 'call' && showCoach}
            onAskHelp={target.node === 'call' && script.stage !== 'guided' ? () => setAskedForHelp(true) : undefined}
            onEnd={handleCallEnd}
          />
        ) : nudge && !succeeded ? (
          <View style={st.nudge} pointerEvents="none">
            <T style={[st.nudgeText, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.5) }]}>{nudge}</T>
          </View>
        ) : null
      }
    />
  );
}

const st = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 4, borderColor: C.red },
  ringPulse: { position: 'absolute', top: -9, left: -9, right: -9, bottom: -9, borderWidth: 3, borderColor: C.red },

  // coach/note 刻意用一般排版（不是 position:absolute bottom:0）——
  // 早期版本兩者都貼齊畫面最下緣，結果整片蓋住輸入列，guided 階段的麥克風完全按不到。
  coach: {
    backgroundColor: C.indigo,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coachBody: { flex: 1 },
  coachText: { color: '#fff', fontWeight: '700' },
  coachReplay: { color: '#CBDCE7', marginTop: 6, textDecorationLine: 'underline', fontWeight: '500' },

  note: {
    backgroundColor: 'rgba(22,32,43,0.9)',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  noteText: { color: '#fff', textAlign: 'center', fontWeight: '500' },

  success: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.indigo,
    paddingHorizontal: 18,
    paddingVertical: 17,
  },
  successText: { color: '#fff', fontWeight: '900', textAlign: 'center' },

  nudge: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 82,
    backgroundColor: C.indigoDark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    // 看照片全螢幕蓋在 zIndex:50 — 裝飾按鈕的中性提示要蓋得過它才看得到。
    zIndex: 60,
  },
  nudgeText: { color: '#fff', fontWeight: '700', textAlign: 'center' },

  helpBtn: {
    position: 'absolute',
    right: 14,
    bottom: 78,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: C.indigo,
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  helpBtnBig: { paddingHorizontal: 22, paddingVertical: 13, borderWidth: 3 },
  helpText: { color: C.indigo, fontWeight: '700' },
});
