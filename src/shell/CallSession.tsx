import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Speaker } from '../ui/Icons';
import VoiceCallScreen, { callScreenMetrics } from '../sim/VoiceCallScreen';
import type { CallAction, CallLine, CallScript, CallStep } from '../engine/types';
import { speakLine, type MicHandle } from './callAudio';

/**
 * 一通語音電話：畫面是模擬層的 VoiceCallScreen，這裡負責照劇本跑（教學外殼）。
 *
 *  - 對方的話照劇本播放，字幕永遠開著
 *  - 輪到長輩說話時用麥克風音量判斷他講完了沒（不辨識內容）；沒有麥克風就等固定秒數
 *  - 輪到長輩說話時開著靜音 → 對方說「聽不到」，等他取消靜音再繼續
 *  - 「擴音」用音量模擬：沒開時聲音小，開了正常（iPhone 不允許網頁改音量，只看得到狀態變化）
 *  - 任何時候都可以掛斷；不是錯誤，結果交給外層決定
 *
 * hints 開著時（帶著做、或按了「卡住了」）才顯示引導文字和紅圈。
 */

export type CallResult = {
  /** 劇本走完、最後是在對方說掰掰之後掛斷的。 */
  completed: boolean;
  /** 有沒有接通（響鈴中掛斷 = 取消）。 */
  connected: boolean;
  seconds: number;
};

const SPEAK_TH = 0.035; // 音量至少要超過這個才算在講話
const CALIBRATE_MS = 400; // 每次換長輩說話，先量這麼久的環境噪音，門檻設在噪音之上（據點常常很吵）
const SPEAK_MIN_MS = 180; // 連續講話超過這麼久才算開始講
const SILENCE_END_MS = 1100; // 講話之後安靜這麼久算講完
const POLL_MS = 60;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function Ring({ base, size, style }: { base: number; size: number; style: object }) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: C.red, zIndex: 80 }, style]}
    />
  );
}

export default function CallSession({
  contact,
  script,
  mic,
  hints,
  onAskHelp,
  onEnd,
}: {
  contact: string;
  script: CallScript;
  /** primeCallAudio() 在點擊當下拿到的麥克風（可能是 null）。 */
  mic: Promise<MicHandle | null>;
  hints: boolean;
  /** 沒有提示的階段按了「卡住了」。不給就不顯示那顆鍵。 */
  onAskHelp?: () => void;
  onEnd: (result: CallResult) => void;
}) {
  const { base } = useScale();
  const m = callScreenMetrics(base);

  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [expect, setExpect] = useState<Extract<CallStep, { type: 'expect' }> | null>(null);
  const [waitingUnmute, setWaitingUnmute] = useState(false);

  const live = useRef({ muted: false, speakerOn: false, atFinalHangUp: false, connected: false, seconds: 0 });
  // 每一次啟動劇本都有自己的取消旗標（開發模式 React 會故意啟動兩次，不能共用）。
  type Run = { cancelled: boolean };
  const runRef = useRef<Run>({ cancelled: false });
  const actionWaiter = useRef<{ action: CallAction; resolve: () => void } | null>(null);
  const currentSpeech = useRef<{ cancel(): void } | null>(null);
  const ended = useRef(false);

  // 通話計時（接通後才開始）
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => {
      live.current.seconds += 1;
      setSeconds(live.current.seconds);
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  async function say(run: Run, line: CallLine) {
    if (run.cancelled) return;
    setSubtitle(line.text);
    const sp = speakLine(line.text, { volume: live.current.speakerOn ? 1 : 0.45, audio: line.audio });
    currentSpeech.current = sp;
    await sp.done;
    currentSpeech.current = null;
  }

  /** 等長輩取消靜音。一直沒取消，對方每 10 秒再說一次「聽不到」。 */
  async function waitUnmuted(run: Run) {
    setWaitingUnmute(true);
    let waited = 0;
    while (live.current.muted && !run.cancelled) {
      await sleep(POLL_MS);
      waited += POLL_MS;
      if (waited >= 10000 && live.current.muted && !run.cancelled) {
        waited = 0;
        await say(run, script.mutedLine);
      }
    }
    setWaitingUnmute(false);
  }

  /** 換長輩說話。開著靜音就讓對方說「聽不到」，等他取消靜音再重來。 */
  async function listen(run: Run, step: Extract<CallStep, { type: 'listen' }>) {
    // 權限視窗沒人理的話不能一直卡著：最多等 6 秒，還沒拿到就先用固定秒數的空檔。
    const handle = await Promise.race([mic, sleep(6000).then(() => null)]);
    setHasMic(!!handle);
    for (;;) {
      if (run.cancelled) return;
      if (live.current.muted) {
        setListening(false);
        await say(run, script.mutedLine);
        await waitUnmuted(run);
        continue;
      }
      setListening(true);
      let heard = false;
      let speakingMs = 0;
      let silentMs = 0;
      let elapsed = 0;
      let floor = Infinity;
      let threshold = SPEAK_TH;
      const limit = handle ? step.maxMs ?? 9000 : step.fallbackMs ?? 4000;
      let mutedMidway = false;
      while (!run.cancelled && elapsed < limit) {
        await sleep(POLL_MS);
        elapsed += POLL_MS;
        if (live.current.muted) {
          mutedMidway = true;
          break;
        }
        if (!handle) continue;
        const lv = handle.level();
        setLevel(lv);
        if (elapsed <= CALIBRATE_MS) {
          floor = Math.min(floor, lv);
          threshold = Math.max(SPEAK_TH, floor * 2.5 + 0.015);
          continue;
        }
        if (lv > threshold) {
          speakingMs += POLL_MS;
          silentMs = 0;
          if (speakingMs >= SPEAK_MIN_MS) heard = true;
        } else if (heard) {
          silentMs += POLL_MS;
          if (silentMs >= SILENCE_END_MS) break;
        }
      }
      setListening(false);
      setLevel(0);
      if (!mutedMidway) return;
    }
  }

  function waitForAction(action: CallAction): Promise<void> {
    if (action === 'speakerOn' && live.current.speakerOn) return Promise.resolve();
    return new Promise((resolve) => {
      actionWaiter.current = { action, resolve };
    });
  }

  async function expectStep(run: Run, step: Extract<CallStep, { type: 'expect' }>) {
    setExpect(step);
    if (step.action === 'hangUp') live.current.atFinalHangUp = true;
    const done = waitForAction(step.action);
    let finished = false;
    done.then(() => (finished = true));
    while (!finished && !run.cancelled) {
      const waitMs = step.remindAfterMs ?? 9000;
      await Promise.race([done, sleep(waitMs)]);
      if (!finished && !run.cancelled && step.remind) await say(run, step.remind);
    }
    setExpect(null);
  }

  useEffect(() => {
    const run: Run = { cancelled: false };
    runRef.current = run;
    (async () => {
      for (const step of script.steps) {
        if (run.cancelled) return;
        if (step.type === 'ring') {
          await sleep(step.ms);
          if (run.cancelled) return;
          live.current.connected = true;
          setConnected(true);
        } else if (step.type === 'say') {
          await say(run, step.line);
        } else if (step.type === 'listen') {
          await listen(run, step);
        } else if (step.type === 'expect') {
          await expectStep(run, step);
        }
      }
      // 劇本走完還沒掛（自由通話）：就停在通話中，等使用者自己掛。
    })();
    return () => {
      run.cancelled = true;
      currentSpeech.current?.cancel();
      // 真的離開畫面才關麥克風；開發模式緊接著重跑的那一次還要用。
      setTimeout(() => {
        if (runRef.current === run) mic.then((h) => h?.close());
      }, 0);
    };
  }, []);

  function finish() {
    if (ended.current) return;
    ended.current = true;
    const completed = live.current.atFinalHangUp;
    runRef.current.cancelled = true;
    currentSpeech.current?.cancel();
    mic.then((h) => h?.close());
    if (actionWaiter.current?.action === 'hangUp') actionWaiter.current.resolve();
    onEnd({ completed, connected: live.current.connected, seconds: live.current.seconds });
  }

  function toggleSpeaker() {
    const next = !live.current.speakerOn;
    live.current.speakerOn = next;
    setSpeakerOn(next);
    if (next && actionWaiter.current?.action === 'speakerOn') {
      actionWaiter.current.resolve();
      actionWaiter.current = null;
    }
  }

  function toggleMute() {
    const next = !live.current.muted;
    live.current.muted = next;
    setMuted(next);
  }

  // 引導：現在該做什麼
  let coach: string | undefined;
  let ringOn: 'speaker' | 'hangUp' | 'mute' | null = null;
  if (waitingUnmute) {
    coach = script.coachUnmute;
    ringOn = 'mute';
  } else if (expect) {
    coach = expect.coach;
    ringOn = expect.action === 'speakerOn' ? 'speaker' : 'hangUp';
  } else if (connected) {
    coach = script.coachListen;
  }

  const ringSize = (target: 'speaker' | 'mute' | 'hangUp') => (target === 'hangUp' ? m.hangUp : m.btn) + 18;

  return (
    <View style={StyleSheet.absoluteFill}>
      <VoiceCallScreen
        contact={contact}
        status={connected ? 'connected' : 'calling'}
        elapsedLabel={fmt(seconds)}
        muted={muted}
        speakerOn={speakerOn}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onHangUp={finish}
      />

      {/* 字幕：對方說的話永遠顯示；換你說話時顯示音量 */}
      <View style={[st.subtitle, { bottom: m.btnRowCenterFromBottom + m.btn / 2 + fz(base, 3) }]} pointerEvents="none">
        {listening ? (
          <View style={st.listenRow}>
            <T style={[st.listenText, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.5) }]}>
              {hasMic ? '換你說話…' : '換你說話…（說完等一下）'}
            </T>
            {hasMic ? (
              <View style={st.meter}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[st.meterBar, { height: 6 + i * 4, opacity: level > 0.012 + i * 0.012 ? 1 : 0.25 }]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : subtitle ? (
          <T style={[st.subtitleText, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.65) }]}>
            {`${contact}：${subtitle}`}
          </T>
        ) : null}
      </View>

      {hints && coach ? (
        <View style={st.coach} pointerEvents="none">
          <Speaker size={fz(base, 1.3)} />
          <T style={[st.coachText, { fontSize: fz(base, 1.02), lineHeight: fz(base, 1.55) }]}>{coach}</T>
        </View>
      ) : null}

      {!hints && onAskHelp && connected ? (
        <Pressable onPress={onAskHelp} hitSlop={12} style={st.helpBtn} accessibilityRole="button">
          <T style={[st.helpText, { fontSize: fz(base, 0.88), lineHeight: fz(base, 1.4) }]}>卡住了，教我</T>
        </Pressable>
      ) : null}

      {hints && ringOn ? (
        <Ring
          base={base}
          size={ringSize(ringOn)}
          style={{
            left: '50%',
            marginLeft:
              (ringOn === 'speaker' ? m.btnSpacing / 2 : ringOn === 'mute' ? -m.btnSpacing / 2 : 0) - ringSize(ringOn) / 2,
            bottom: (ringOn === 'hangUp' ? m.hangUpCenterFromBottom : m.btnRowCenterFromBottom) - ringSize(ringOn) / 2,
          }}
        />
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  subtitle: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 75,
    alignItems: 'center',
  },
  subtitleText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  listenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  listenText: { color: '#fff', fontWeight: '700' },
  meter: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  meterBar: { width: 5, borderRadius: 2, backgroundColor: '#7EE2A8' },

  coach: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 75,
    backgroundColor: C.indigo,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coachText: { flex: 1, color: '#fff', fontWeight: '700' },

  helpBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 75,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: C.indigo,
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  helpText: { color: C.indigo, fontWeight: '700' },
});
