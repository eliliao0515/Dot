/**
 * 點數（P4c：先存在這支手機上）。
 *
 * 跟學習進度一樣依 LINE 身分分開存，只增不減。
 * 注意：存在瀏覽器裡的資料，iPhone 7 天沒開會被清掉、換瀏覽器也看不到 ——
 * P4d 會改成存在伺服器（Cloudflare），這個檔案的介面維持不變。
 */
import { kvGet, kvSet } from './kv';
import { getCachedLineUser } from '../auth/lineAuth';

export type Points = {
  version: 1;
  total: number;
  /** 玩過幾局符號選擇題（關卡頁用來顯示打勾）。 */
  quizRounds: number;
  updatedAt: string;
};

export const EMPTY_POINTS: Points = { version: 1, total: 0, quizRounds: 0, updatedAt: '' };

function key() {
  const user = getCachedLineUser();
  return `points:v1:${user ? user.userId : 'anon'}`;
}

export async function loadPoints(): Promise<Points> {
  const raw = await kvGet(key());
  if (!raw) return EMPTY_POINTS;
  try {
    const p = JSON.parse(raw) as Points;
    if (p?.version !== 1 || typeof p.total !== 'number') return EMPTY_POINTS;
    return { ...EMPTY_POINTS, ...p };
  } catch {
    return EMPTY_POINTS;
  }
}

async function save(next: Points): Promise<Points> {
  const stamped = { ...next, updatedAt: new Date().toISOString() };
  await kvSet(key(), JSON.stringify(stamped));
  return stamped;
}

/** 加點數。amount 小於等於 0 一律不處理 —— 點數只加不扣。 */
export async function addPoints(current: Points, amount: number, opts: { quizRound?: boolean } = {}): Promise<Points> {
  if (amount <= 0 && !opts.quizRound) return current;
  return save({
    ...current,
    total: current.total + Math.max(0, amount),
    quizRounds: current.quizRounds + (opts.quizRound ? 1 : 0),
  });
}
