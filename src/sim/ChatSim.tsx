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
import { Speaker } from '../ui/Icons';
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
import PhotoViewer from './PhotoViewer';
import VoiceRecorder from './VoiceRecorder';

/** 錄音計時格式 mm:ss，例如 7 秒顯示「00:07」，65 秒顯示「01:05」。 */
function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 引導層疊在模擬畫面之上，底下的介面一個像素都不改。
 * guided 提示全開，solo 要自己按「卡住了」，transfer 完全沒有提示。
 *
 * 傳聯絡人這個互動不呼叫 onDone —
 * 會過關的動作是五條並行路徑，同一時刻只有 lesson.target.node 指定的
 * 那一條算數：在 VoiceRecorder 裡點傳送送出語音（'mic'）、
 * 點頂部視訊圖示（'video'）、點貼圖送出（'sticker'）、
 * 在 PhotoViewer 裡點下載存照片（'photo'）、點任一個預設回覆膠囊（'reply'）。
 */

type Panel = 'none' | 'attachMenu' | 'photoPicker' | 'contactPicker' | 'stickerPanel';

function GuideRing({ base, node }: { base: number; node: 'mic' | 'sticker' }) {
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
  // 貼圖按鈕（roundIcon）是固定 34x34，不吃 fz 縮放。
  const stickerBtnSize = 34;
  const targetSize = node === 'sticker' ? stickerBtnSize : micSize;
  const ringSize = targetSize + 16;
  // 輸入列 paddingHorizontal:12，貼圖按鈕在麥克風左邊，中間隔一個 gap:11 —
  // 貼圖按鈕右緣到畫面右緣 = 12(padding) + micSize + 11(gap)，再扣掉 (ringSize-btnSize)/2 讓紅圈置中。
  const rightOffset = node === 'sticker' ? 12 + micSize + 11 - (ringSize - stickerBtnSize) / 2 : 4;

  return (
    <View
      pointerEvents="none"
      style={[
        st.ring,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2, right: rightOffset, bottom: 1 },
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
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [recorderPhase, setRecorderPhase] = useState<'idle' | 'recording' | 'stopped'>('idle');
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
  const [viewingPhotoLabel, setViewingPhotoLabel] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const readTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroller = useRef<ScrollView>(null);

  // 換一階段就重置，不要把上一階的狀態帶過來。
  useEffect(() => {
    setSent([]);
    setRecorderOpen(false);
    setRecorderPhase('idle');
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
    setViewingPhotoLabel(null);
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

  /**
   * 點麥克風開啟全螢幕錄音畫面。取代訊息串顯示區域，不是疊在上面的面板 —
   * 跟訊息串同一層互斥，輸入列也一起先隱藏。
   */
  function openRecorder() {
    setNudge(null);
    setPanel('none');
    setSeconds(0);
    setRecorderPhase('idle');
    setRecorderOpen(true);
  }

  function beginRecording() {
    setRecorderPhase('recording');
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
  }

  function stopRecordingPhase() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecorderPhase('stopped');
  }

  /**
   * 點紙飛機才真正送出。錄音本身（開始/停止/傳送/丟棄）任何課程都能正常用，
   * 只有 target.node === 'mic' 時這個動作才算過關。
   */
  function sendVoiceMessage() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const secs = Math.max(1, seconds);
    setRecorderOpen(false);
    setRecorderPhase('idle');
    setSent((prev) => [
      ...prev,
      { id: `voice-${Date.now()}`, from: 'me', kind: 'voice', seconds: secs },
    ]);
    if (lesson.target.node === 'mic') {
      setSucceeded(true);
      setTimeout(onDone, 1200);
    }
  }

  /** 垃圾桶或右上角關閉都算取消：不送出、不過關，回到正常聊天畫面。 */
  function discardRecording() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecorderOpen(false);
    setRecorderPhase('idle');
    setSeconds(0);
  }

  /** VoiceRecorder 頂部工具列的裝飾性按鈕。沿用既有 nudge 中性提示，不是答錯。 */
  function showRecorderHint() {
    setNudge('這個功能還沒做好。');
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
    if (lesson.target.node === 'reply') {
      setSucceeded(true);
      setTimeout(onDone, 1200);
    }
  }
  function sendPhoto(label: string) {
    appendSent({ id: `photo-${Date.now()}`, from: 'me', kind: 'photo', label });
  }
  function sendContact(name: string) {
    appendSent({ id: `contact-${Date.now()}`, from: 'me', kind: 'contact', name });
  }
  function sendSticker(id: StickerId) {
    appendSent({ id: `sticker-${Date.now()}`, from: 'me', kind: 'sticker', sticker: id });
    if (lesson.target.node === 'sticker') {
      setSucceeded(true);
      setTimeout(onDone, 1200);
    }
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
    if (lesson.target.node === 'photo') {
      setSucceeded(true);
      setTimeout(onDone, 1200);
    }
  }

  function openPhoto(label: string) {
    setNudge(null);
    setViewingPhotoLabel(label);
  }
  function closePhotoViewer() {
    setNudge(null);
    setViewingPhotoLabel(null);
  }
  // PhotoViewer 蓋在最上層（zIndex:50），下載後要先關掉它，
  // 「已儲存」提示跟過關的成功文案才看得到。
  function handleDownloadPhoto() {
    setViewingPhotoLabel(null);
    savePhoto();
  }
  /**
   * PhotoViewer 裡畫筆/垃圾桶/分享這幾顆裝飾性按鈕 —
   * 一律用中性提示，不是「答錯」。沿用既有 nudge 呈現方式。
   */
  function showPhotoViewerHint() {
    setNudge('這個功能還沒做好。');
  }

  function pressPlus() {
    setPanel((p) => (p === 'attachMenu' ? 'none' : 'attachMenu'));
  }
  function pressSticker() {
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

      {recorderOpen ? (
        <View style={st.recorderSlot}>
          <VoiceRecorder
            phase={recorderPhase}
            elapsedLabel={formatElapsed(seconds)}
            onStartRecording={beginRecording}
            onStopRecording={stopRecordingPhase}
            onSend={sendVoiceMessage}
            onDiscard={discardRecording}
            onClose={discardRecording}
            onTopBarAction={showRecorderHint}
          />
        </View>
      ) : (
        <>
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
                  onOpenPhoto={openPhoto}
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
                  onOpenPhoto={openPhoto}
                />
              ))}
              {lastSent && readIds.has(lastSent.id) ? <ReadReceipt base={base} /> : null}
            </ScrollView>

            {/* solo 階段的求助鍵。永遠在，但不會自己跳出來。掛在對話串這一層，
                不管底下的 note/預設回覆/輸入列疊了多高都不會被擠到。 */}
            {script.stage !== 'guided' && !askedForHelp && !succeeded ? (
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

          {panel === 'attachMenu' && !succeeded ? (
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

          {!showCoach && !succeeded && panel === 'none' ? (
            <View style={st.note} pointerEvents="none">
              <T style={[st.noteText, { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.45) }]}>
                {script.note}
              </T>
            </View>
          ) : null}

          {/* reply 課的建議訊息就是過關目標本體，跟麥克風/貼圖鍵一樣不受 showCoach 影響 —
              guided 階段的教練文字說「看下面幾個現成的話」，這排膠囊得跟著一起顯示才點得到。 */}
          {lesson.target.node === 'reply' && !succeeded && panel === 'none' ? (
            <QuickReplyRow base={base} onPick={sendText} />
          ) : null}

          <SimInputBar
            base={base}
            onWrongTap={handleWrongTap}
            onPressPlus={pressPlus}
            onPressSticker={pressSticker}
            onPressMic={openRecorder}
            attachOpen={panel === 'attachMenu' || panel === 'photoPicker' || panel === 'contactPicker'}
            stickerOpen={panel === 'stickerPanel'}
          />

          {showCoach &&
          !succeeded &&
          panel === 'none' &&
          (lesson.target.node === 'mic' || lesson.target.node === 'sticker') ? (
            <GuideRing base={base} node={lesson.target.node} />
          ) : null}
        </>
      )}

      {succeeded ? (
        <View style={st.success} pointerEvents="none">
          <T style={[st.successText, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.6) }]}>
            {lesson.target.node === 'video'
              ? '接通了'
              : lesson.target.node === 'sticker'
              ? '貼圖傳出去了'
              : lesson.target.node === 'photo'
              ? '存起來了'
              : '送出去了'}
          </T>
        </View>
      ) : null}

      {savedPhotoToast ? <SavedPhotoToast base={base} /> : null}

      {viewingPhotoLabel ? (
        <PhotoViewer
          photoLabel={viewingPhotoLabel}
          contactName={script.contact}
          timestamp="上午 9:32"
          onClose={closePhotoViewer}
          onDownload={handleDownloadPhoto}
          onTrash={showPhotoViewerHint}
          onShare={showPhotoViewerHint}
          onDraw={showPhotoViewerHint}
        />
      ) : null}

      {nudge && !succeeded && panel === 'none' ? (
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

  // VoiceRecorder 取代訊息串顯示區域，不是疊在上面的小面板 — 給它跟 threadWrap 一樣的 flex:1。
  recorderSlot: { flex: 1 },

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
    // PhotoViewer 全螢幕蓋在 zIndex:50 — 裝飾按鈕的中性提示要蓋得過它才看得到。
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
