import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Speaker, Mic } from '../ui/Icons';
import { Bubble, Lesson, StageScript, StickerId } from '../engine/types';
import {
  SimTopBar,
  MessageRow,
  SimInputBar,
  AttachMenu,
  PhotoPicker,
  ContactPicker,
  StickerPanel,
  ReadReceipt,
  SavedPhotoToast,
  QuickReplyRow,
} from './parts';

/**
 * 引導層疊在模擬畫面之上，底下的介面一個像素都不改。
 * guided 提示全開，solo 要自己按「卡住了」，transfer 完全沒有提示。
 *
 * 傳照片/聯絡人/貼圖/預設回覆這些新互動全部不呼叫 onDone —
 * 會過關的動作只有兩條並行路徑，同一時刻只有 lesson.target.node 指定的
 * 那一條算數：長按麥克風送出語音（node === 'mic'），
 * 或點頂部視訊圖示（node === 'video' 且 gesture === 'tap'）。
 */

type Panel = 'none' | 'attachMenu' | 'photoPicker' | 'contactPicker' | 'stickerPanel';

function GuideRing({ base }: { base: number }) {
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

  const micSize = fz(base, 2.4);
  const ringSize = micSize + 16;

  return (
    <View
      pointerEvents="none"
      style={[
        st.ring,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2, right: 4, bottom: 1 },
      ]}
    >
      {!reduce && (
        <Animated.View
          style={[
            st.ringPulse,
            {
              borderRadius: (ringSize + 18) / 2,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }) },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

export default function ChatSim({
  lesson,
  script,
  onDone,
}: {
  lesson: Lesson;
  script: StageScript;
  onDone: () => void;
}) {
  const { base } = useScale();
  const [sent, setSent] = useState<Bubble[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [askedForHelp, setAskedForHelp] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const [panel, setPanel] = useState<Panel>('none');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playElapsed, setPlayElapsed] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [savedPhotoToast, setSavedPhotoToast] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const readTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroller = useRef<ScrollView>(null);

  // 換一階段就重置，不要把上一階的狀態帶過來。
  useEffect(() => {
    setSent([]);
    setRecording(false);
    setSeconds(0);
    setWrongTaps(0);
    setAskedForHelp(false);
    setNudge(null);
    setSucceeded(false);
    setPanel('none');
    setPlayingId(null);
    setPlayElapsed(0);
    setReadIds(new Set());
    setSavedPhotoToast(false);
    if (playTimer.current) clearInterval(playTimer.current);
    playTimer.current = null;
    readTimers.current.forEach(clearTimeout);
    readTimers.current = [];
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = null;
  }, [script.stage]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (playTimer.current) clearInterval(playTimer.current);
      readTimers.current.forEach(clearTimeout);
      if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    };
  }, []);

  const showCoach = script.stage === 'guided' || askedForHelp;

  function startRecording() {
    setNudge(null);
    setPanel('none');
    setRecording(true);
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((n) => Math.min(n + 1, 9)), 1000);
  }

  function stopRecording() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecording(false);
    if (lesson.target.node !== 'mic') {
      handleWrongTap();
      return;
    }
    const secs = Math.max(1, seconds);
    setSent((prev) => [
      ...prev,
      { id: `voice-${Date.now()}`, from: 'me', kind: 'voice', seconds: secs },
    ]);
    setSucceeded(true);
    setTimeout(onDone, 1200);
  }

  /**
   * 錯誤路徑全部放行：按到別的地方不會被鎖住，也不會有紅色錯誤提示。
   * 只有連續亂點才把求助按鈕放大一次。
   */
  function handleWrongTap() {
    setWrongTaps((n) => n + 1);
  }

  function pressVideo() {
    if (lesson.target.node === 'video' && lesson.target.gesture === 'tap') {
      setSucceeded(true);
      setTimeout(onDone, 1200);
      return;
    }
    handleWrongTap();
  }

  function handleTooShort() {
    // 點一下不夠。這是長輩最常見的失敗，要用中性的話糾正。
    setNudge('壓著不要放開，講完話再放手');
  }

  function scheduleRead(id: string) {
    const t = setTimeout(() => {
      setReadIds((prev) => new Set(prev).add(id));
    }, 1500);
    readTimers.current.push(t);
  }

  function appendSent(bubble: Bubble) {
    setSent((prev) => [...prev, bubble]);
    setPanel('none');
    scheduleRead(bubble.id);
  }

  function sendText(text: string) {
    appendSent({ id: `txt-${Date.now()}`, from: 'me', kind: 'text', text });
  }
  function sendPhoto(label: string) {
    appendSent({ id: `photo-${Date.now()}`, from: 'me', kind: 'photo', label });
  }
  function sendContact(name: string) {
    appendSent({ id: `contact-${Date.now()}`, from: 'me', kind: 'contact', name });
  }
  function sendSticker(id: StickerId) {
    appendSent({ id: `sticker-${Date.now()}`, from: 'me', kind: 'sticker', sticker: id });
  }

  function togglePlay(id: string, seconds: number) {
    if (playTimer.current) clearInterval(playTimer.current);
    if (playingId === id) {
      playTimer.current = null;
      setPlayingId(null);
      setPlayElapsed(0);
      return;
    }
    setPlayingId(id);
    setPlayElapsed(0);
    playTimer.current = setInterval(() => {
      setPlayElapsed((n) => {
        if (n + 1 >= seconds) {
          if (playTimer.current) clearInterval(playTimer.current);
          playTimer.current = null;
          setPlayingId(null);
          return 0;
        }
        return n + 1;
      });
    }, 1000);
  }

  function savePhoto() {
    setSavedPhotoToast(true);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSavedPhotoToast(false), 1800);
  }

  function pressPlus() {
    if (recording) return;
    setPanel((p) => (p === 'attachMenu' ? 'none' : 'attachMenu'));
  }
  function pressSticker() {
    if (recording) return;
    setPanel((p) => (p === 'stickerPanel' ? 'none' : 'stickerPanel'));
  }

  const helpIsBig = wrongTaps >= 2 && !askedForHelp;
  const lastSent = sent.length > 0 ? sent[sent.length - 1] : null;

  return (
    <View style={st.wrap}>
      <SimTopBar
        contact={script.contact}
        base={base}
        onWrongTap={handleWrongTap}
        onPressVideo={pressVideo}
      />

      <View style={st.threadWrap}>
        <ScrollView
          ref={scroller}
          style={st.thread}
          contentContainerStyle={st.threadInner}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          {script.messages.map((m) => (
            <MessageRow
              key={m.id}
              msg={m}
              contact={script.contact}
              base={base}
              playingId={playingId}
              playElapsed={playElapsed}
              onTogglePlay={togglePlay}
              onSavePhoto={savePhoto}
            />
          ))}
          {sent.map((m) => (
            <MessageRow
              key={m.id}
              msg={m}
              contact={script.contact}
              base={base}
              playingId={playingId}
              playElapsed={playElapsed}
              onTogglePlay={togglePlay}
              onSavePhoto={savePhoto}
            />
          ))}
          {lastSent && readIds.has(lastSent.id) ? <ReadReceipt base={base} /> : null}
        </ScrollView>

        {/* solo 階段的求助鍵。永遠在，但不會自己跳出來。掛在對話串這一層，
            不管底下的 note/預設回覆/輸入列疊了多高都不會被擠到。 */}
        {script.stage !== 'guided' && !askedForHelp && !recording && !succeeded ? (
          <Pressable
            onPress={() => setAskedForHelp(true)}
            hitSlop={12}
            style={[st.helpBtn, helpIsBig && st.helpBtnBig]}
          >
            <T
              style={[
                st.helpText,
                { fontSize: fz(base, helpIsBig ? 1 : 0.88), lineHeight: fz(base, 1.4) },
              ]}
            >
              卡住了，教我
            </T>
          </Pressable>
        ) : null}
      </View>

      {panel === 'attachMenu' && !recording && !succeeded ? (
        <AttachMenu
          base={base}
          onSelectPhoto={() => setPanel('photoPicker')}
          onSelectContact={() => setPanel('contactPicker')}
        />
      ) : null}
      {panel === 'photoPicker' ? (
        <PhotoPicker base={base} onPick={sendPhoto} onCancel={() => setPanel('none')} />
      ) : null}
      {panel === 'contactPicker' ? (
        <ContactPicker base={base} onPick={sendContact} onCancel={() => setPanel('none')} />
      ) : null}
      {panel === 'stickerPanel' ? <StickerPanel base={base} onPick={sendSticker} /> : null}

      {showCoach && !succeeded && panel === 'none' ? (
        <View style={st.coach}>
          <Speaker size={fz(base, 1.3)} />
          <View style={st.coachBody}>
            <T style={[st.coachText, { fontSize: fz(base, 1.02), lineHeight: fz(base, 1.55) }]}>
              {lesson.stages[0].coach}
            </T>
            <T style={[st.coachReplay, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.3) }]}>
              再念一次
            </T>
          </View>
        </View>
      ) : null}

      {!showCoach && !recording && !succeeded && panel === 'none' ? (
        <View style={st.note} pointerEvents="none">
          <T style={[st.noteText, { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.45) }]}>
            {script.note}
          </T>
        </View>
      ) : null}

      {!showCoach && !recording && !succeeded && panel === 'none' ? (
        <QuickReplyRow base={base} onPick={sendText} />
      ) : null}

      <SimInputBar
        base={base}
        recording={recording}
        minMs={lesson.target.minMs}
        onWrongTap={handleWrongTap}
        onPressPlus={pressPlus}
        onPressSticker={pressSticker}
        attachOpen={panel === 'attachMenu' || panel === 'photoPicker' || panel === 'contactPicker'}
        stickerOpen={panel === 'stickerPanel'}
        onStart={startRecording}
        onStop={stopRecording}
        onTooShort={handleTooShort}
      />

      {showCoach && !recording && !succeeded && panel === 'none' ? <GuideRing base={base} /> : null}

      {/* 錄音中的回饋。用文字和秒數，不用會嚇到人的紅點。 */}
      {recording ? (
        <View style={st.recording} pointerEvents="none">
          <Mic size={fz(base, 1.2)} color="#fff" />
          <T style={[st.recordingText, { fontSize: fz(base, 1), lineHeight: fz(base, 1.5) }]}>
            {`錄音中 ${seconds} 秒　放開就送出`}
          </T>
        </View>
      ) : null}

      {succeeded ? (
        <View style={st.success} pointerEvents="none">
          <T style={[st.successText, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.6) }]}>
            {lesson.target.node === 'video' ? '接通了' : '送出去了'}
          </T>
        </View>
      ) : null}

      {savedPhotoToast ? <SavedPhotoToast base={base} /> : null}

      {nudge && !recording && !succeeded && panel === 'none' ? (
        <View style={st.nudge} pointerEvents="none">
          <T style={[st.nudgeText, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.5) }]}>
            {nudge}
          </T>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.chatBg },
  threadWrap: { flex: 1 },
  thread: { flex: 1 },
  threadInner: { padding: 14, gap: 12 },

  ring: { position: 'absolute', borderWidth: 4, borderColor: C.red },
  ringPulse: { position: 'absolute', top: -9, left: -9, right: -9, bottom: -9, borderWidth: 3, borderColor: C.red },

  // coach/note 刻意用一般排版（不是 position:absolute bottom:0）——
  // 早期版本兩者都貼齊 st.wrap 最下緣，結果整片蓋住輸入列，guided 階段的麥克風完全按不到。
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

  recording: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.indigoDark,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingText: { color: '#fff', fontWeight: '700' },

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
