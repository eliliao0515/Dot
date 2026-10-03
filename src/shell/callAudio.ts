/**
 * 原生端還沒有串接聲音和麥克風（v2 期間原生 App 不驗證）：
 * 對方說話只顯示字幕、照字數等一段時間；沒有麥克風，換你說話時固定等幾秒。
 */
export type MicHandle = { level(): number; close(): void };

export function primeCallAudio(): Promise<MicHandle | null> {
  return Promise.resolve(null);
}

export function speakLine(text: string, _opts: { volume: number; audio?: string }): { done: Promise<void>; cancel(): void } {
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  const t = setTimeout(() => finish(), text.length * 280 + 1000);
  return {
    done,
    cancel() {
      clearTimeout(t);
      finish();
    },
  };
}
