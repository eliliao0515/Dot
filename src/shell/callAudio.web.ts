/**
 * 通話練習用的聲音（網頁版）。兩件事，全部在手機上做，不用網路、不花錢：
 *
 *  1. 對方說話：有真人錄音檔就播檔案；還沒錄就先用裝置內建的語音合成唸字幕。
 *     內建語音只是開發中的暫代 —— CLAUDE.md：台語 TTS 不夠格教長輩，正式版要換真人錄音。
 *  2. 聽長輩說話：只看麥克風「音量」判斷他開始講、講完了，**不辨識內容、不錄音、不上傳**。
 *     2026-10-04 使用者同意為此跟長輩索取麥克風權限（推翻「不索取權限」的原則，見 CLAUDE.md）。
 *
 * 這兩個都必須在使用者「按下去」那一刻先啟動（primeCallAudio），iPhone 才會放行。
 */

export type MicHandle = {
  /** 目前音量，大約 0（安靜）到 0.3（大聲講話）。 */
  level(): number;
  close(): void;
};

let zhVoice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  zhVoice =
    voices.find((v) => v.lang === 'zh-TW') ??
    voices.find((v) => v.lang.startsWith('zh-Hant')) ??
    voices.find((v) => v.lang.startsWith('zh')) ??
    null;
}

/** 在使用者點擊的當下呼叫：解鎖語音合成，並開始要麥克風。拿不到麥克風就是 null，練習照樣能做。 */
export function primeCallAudio(): Promise<MicHandle | null> {
  try {
    if (typeof speechSynthesis !== 'undefined') {
      pickVoice();
      speechSynthesis.onvoiceschanged = pickVoice;
      // iPhone 要求第一次發聲發生在點擊當下，先唸一個空字串解鎖。
      speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
  } catch {
    // 沒有語音合成就只顯示字幕。
  }
  return openMic();
}

async function openMic(): Promise<MicHandle | null> {
  try {
    const AC: typeof AudioContext | undefined = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AC || !navigator.mediaDevices?.getUserMedia) return null;
    // AudioContext 要在點擊當下建立才能出聲／收音。
    const ctx = new AC();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    return {
      level() {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        return Math.sqrt(sum / buf.length);
      },
      close() {
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
      },
    };
  } catch {
    // 使用者不給權限、或環境不支援：回 null，改用固定秒數的空檔。
    return null;
  }
}

/** 對方說一句話。回傳的 done 一定會結束（就算語音合成沒發出結束事件，也有保險計時）。 */
export function speakLine(text: string, opts: { volume: number; audio?: string }): { done: Promise<void>; cancel(): void } {
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  // 保險：大約每個字 0.28 秒，加一秒緩衝。
  const safety = setTimeout(() => finish(), text.length * 280 + 1000);
  const end = () => {
    clearTimeout(safety);
    finish();
  };

  let audioEl: HTMLAudioElement | null = null;
  try {
    if (opts.audio) {
      audioEl = new Audio(opts.audio);
      audioEl.volume = opts.volume; // iPhone 不允許改音量，會被忽略
      audioEl.onended = end;
      audioEl.play().catch(end);
    } else if (typeof speechSynthesis !== 'undefined') {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-TW';
      if (zhVoice) u.voice = zhVoice;
      u.rate = 0.9;
      u.volume = opts.volume;
      u.onend = end;
      u.onerror = end;
      speechSynthesis.speak(u);
    }
  } catch {
    // 發不出聲就只靠字幕和保險計時。
  }

  return {
    done,
    cancel() {
      clearTimeout(safety);
      try {
        audioEl?.pause();
        if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      } catch {}
      finish();
    },
  };
}
