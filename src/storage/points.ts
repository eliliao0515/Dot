/**
 * 點數（P4d：存在伺服器，手機上留一份副本）。
 *
 * 為什麼要伺服器：存在瀏覽器裡的資料，iPhone 7 天沒開會被清掉、換瀏覽器也看不到；
 * 工作坊要「登出、過幾天都還在」。伺服器見 server/src/index.ts（Cloudflare Worker + D1）。
 *
 * 運作方式：
 *  1. 長輩一得分，畫面上的點數馬上加上去（先記在手機上，叫「待送出」）
 *  2. 背景把「待送出」送到伺服器；伺服器自己依規則算點數，每一筆有編號、只會加一次
 *  3. 送成功就以伺服器的數字為準；網路不好就留著，下次打開或下次得分時再補送
 *  4. 沒設定伺服器網址（EXPO_PUBLIC_POINTS_API）或拿不到身分，就只存在手機上（跟 P4c 一樣）
 *
 * 點數只加不扣。讀不到、送不出去都是正常狀態，絕不能擋住長輩上課。
 */
import { kvGet, kvSet } from './kv';
import { getCachedLineUser } from '../auth/lineAuth';
import { POINTS } from '../content/points';

const API = String(process.env.EXPO_PUBLIC_POINTS_API ?? '').replace(/\/$/, '');

/** 畫面要用的點數。 */
export type Points = { total: number; quizRounds: number };
export const EMPTY_POINTS: Points = { total: 0, quizRounds: 0 };

type AwardPayload =
  | { kind: 'quiz'; ref: string; correct: number }
  | { kind: 'stage'; lessonId: string; stageIndex: number }
  | { kind: 'realDevice'; lessonId: string };

type Pending = { id: string; payload: AwardPayload; amount: number; quizRound: boolean };

type Stored = {
  version: 2;
  /** 伺服器最後一次回報的數字（沒有伺服器時就是手機上累積的數字）。 */
  base: Points;
  /** 還沒送到伺服器的點數。 */
  pending: Pending[];
};

const EMPTY_STORED: Stored = { version: 2, base: EMPTY_POINTS, pending: [] };

/** 誰在用。App 啟動時設定：LIFF 的 access token，或開發模式的假身分。 */
let tokenProvider: () => Promise<string | null> = async () => null;
let identity = 'anon';

export function configurePoints(opts: { identity: string | null; token: () => Promise<string | null> }) {
  identity = opts.identity ?? 'anon';
  tokenProvider = opts.token;
}

const key = () => `points:v2:${identity !== 'anon' ? identity : getCachedLineUser()?.userId ?? 'anon'}`;

async function readStored(): Promise<Stored> {
  const raw = await kvGet(key());
  if (!raw) return EMPTY_STORED;
  try {
    const s = JSON.parse(raw) as Stored;
    if (s?.version !== 2 || !Array.isArray(s.pending)) return EMPTY_STORED;
    return s;
  } catch {
    return EMPTY_STORED;
  }
}

async function writeStored(s: Stored) {
  await kvSet(key(), JSON.stringify(s));
}

function view(s: Stored): Points {
  return s.pending.reduce(
    (acc, p) => ({ total: acc.total + p.amount, quizRounds: acc.quizRounds + (p.quizRound ? 1 : 0) }),
    { ...s.base },
  );
}

async function call(method: string, path: string, body?: unknown): Promise<any | null> {
  if (!API) return null;
  const token = await tokenProvider();
  if (!token) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // 據點網路不好是常態，留著下次再送
  }
}

/**
 * 把待送出的一筆一筆送出去。送不出去就停，下次再試。
 * 每送成功一筆都重新讀一次最新狀態再寫回，避免蓋掉送出途中新加的點數。
 * 同一筆被送兩次也沒關係：伺服器依編號只加一次。
 */
async function flush(s: Stored): Promise<Stored> {
  if (!API) return s;
  for (const p of s.pending) {
    const r = await call('POST', '/v1/awards', p.payload);
    if (!r || typeof r.total !== 'number') break;
    const latest = await readStored();
    await writeStored({
      ...latest,
      base: { total: r.total, quizRounds: r.quizRounds },
      pending: latest.pending.filter((x) => x.id !== p.id),
    });
  }
  return readStored();
}

/** 讀點數：先拿手機上的，有伺服器就以伺服器為準，再把待送出的補送。 */
export async function loadPoints(): Promise<Points> {
  let s = await readStored();
  const r = await call('GET', '/v1/points');
  if (r && typeof r.total === 'number') {
    s = { ...s, base: { total: r.total, quizRounds: r.quizRounds } };
    await writeStored(s);
  }
  s = await flush(s);
  return view(s);
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function enqueue(payload: AwardPayload, amount: number, quizRound: boolean): Promise<Points> {
  let s = await readStored();
  const id = payload.kind === 'quiz' ? payload.ref : newId(payload.kind);
  s = { ...s, pending: [...s.pending, { id, payload, amount, quizRound }] };
  await writeStored(s);
  // 先回傳加好的數字讓畫面馬上更新，送伺服器在背景做。
  flush(s).catch(() => {});
  return view(s);
}

/** 玩完一局符號選擇題。 */
export function awardQuizRound(correct: number): Promise<Points> {
  const ref = newId('q');
  return enqueue({ kind: 'quiz', ref, correct }, correct * POINTS.quizCorrect + POINTS.quizComplete, true);
}

/** 第一次完成情境挑戰的某一步（App 依手機上的進度判斷第一次；伺服器也會擋重複）。 */
export function awardStage(lessonId: string, stageIndex: number): Promise<Points> {
  return enqueue({ kind: 'stage', lessonId, stageIndex }, POINTS.stageDone, false);
}

/** 第一次在自己手機上做到。 */
export function awardRealDevice(lessonId: string): Promise<Points> {
  return enqueue({ kind: 'realDevice', lessonId }, POINTS.realDevice, false);
}

/**
 * 清除我的點數紀錄：伺服器和這支手機上的都刪掉（個資法的刪除權）。
 * 伺服器刪除失敗（例如沒網路）回傳 false，手機上的不動，讓長輩之後再試。
 */
export async function deleteMyPoints(): Promise<boolean> {
  if (API) {
    const r = await call('DELETE', '/v1/me');
    if (!r?.deleted) return false;
  }
  await writeStored(EMPTY_STORED);
  return true;
}
