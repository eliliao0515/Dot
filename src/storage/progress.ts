/**
 * 學習進度 — 領域層。
 *
 * 設計原則（都是從 CLAUDE.md 的既有決策推導出來的）：
 *
 *  1. 進度存在使用者自己的裝置上，我們沒有伺服器。
 *     這讓「不需要註冊登入」成立，也讓隱私權政策最容易誠實撰寫。
 *
 *  2. 身分是加分項不是入場券：有 LINE 身分就用 userId 當 key，
 *     沒有就用 anon。兩條路都要能完整上完課。
 *
 *  3. 進度只增不減，而且沒有任何「連續天數」「幾天沒來」的概念。
 *     長輩會住院、回南部、顧孫。中斷是常態，不是失敗。
 *
 *  4. 讀不到進度是正常狀態（iOS 7 天清除、換瀏覽器、清資料），
 *     必須安靜地退回空進度，絕不可以報錯或擋人。
 */

import type { MapNode, MapNodeState } from '../engine/types';
import { kvGet, kvSet } from './kv';
import { getCachedLineUser } from '../auth/lineAuth';

export type LessonProgress = {
  /** 已完成的鷹架關數（guided/solo/transfer）。 */
  stagesDone: number;
  /** 是否已在真手機上做過一次。這是唯一真正決定成敗的一關。 */
  realDeviceDone: boolean;
};

export type Progress = {
  version: 1;
  lessons: Record<string, LessonProgress>;
  /** 「接著上次」要跳回哪一課。 */
  lastLessonId?: string;
  updatedAt: string;
};

export const EMPTY_PROGRESS: Progress = {
  version: 1,
  lessons: {},
  updatedAt: '',
};

/**
 * 依身分決定 key。同一台共用平板上不同 LINE 帳號的進度因此分開，
 * 匿名使用者則共用 anon 那一份 — 據點共用平板要分人，
 * 未來得靠選人畫面而不是靠這裡。
 */
function progressKey(): string {
  const user = getCachedLineUser();
  return `progress:v1:${user ? user.userId : 'anon'}`;
}

export async function loadProgress(): Promise<Progress> {
  const raw = await kvGet(progressKey());
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Progress;
    if (parsed?.version !== 1 || typeof parsed.lessons !== 'object') {
      return EMPTY_PROGRESS;
    }
    return { ...EMPTY_PROGRESS, ...parsed };
  } catch {
    // 資料壞掉就當作沒有。不要試圖修復，也不要讓使用者看到任何東西。
    return EMPTY_PROGRESS;
  }
}

async function save(next: Progress): Promise<Progress> {
  const stamped = { ...next, updatedAt: new Date().toISOString() };
  await kvSet(progressKey(), JSON.stringify(stamped));
  return stamped;
}

function lessonOf(p: Progress, lessonId: string): LessonProgress {
  return p.lessons[lessonId] ?? { stagesDone: 0, realDeviceDone: false };
}

/** 完成第 stageIndex 關（0-based）。只增不減，重做舊關不會把進度往回吃。 */
export async function recordStageDone(
  current: Progress,
  lessonId: string,
  stageIndex: number,
): Promise<Progress> {
  const prev = lessonOf(current, lessonId);
  const next: Progress = {
    ...current,
    lastLessonId: lessonId,
    lessons: {
      ...current.lessons,
      [lessonId]: {
        ...prev,
        stagesDone: Math.max(prev.stagesDone, stageIndex + 1),
      },
    },
  };
  return save(next);
}

/** 在真手機上做到了。realDevice 可以跳過，跳過就不呼叫這個。 */
export async function recordRealDevice(
  current: Progress,
  lessonId: string,
): Promise<Progress> {
  const prev = lessonOf(current, lessonId);
  const next: Progress = {
    ...current,
    lastLessonId: lessonId,
    lessons: {
      ...current.lessons,
      [lessonId]: { ...prev, realDeviceDone: true },
    },
  };
  return save(next);
}

/** 這一課接下來要從第幾關開始。全部做完就回到最後一關讓他重做。 */
export function resumeStageIndex(
  p: Progress,
  lessonId: string,
  totalStages: number,
): number {
  const done = lessonOf(p, lessonId).stagesDone;
  return Math.min(done, Math.max(totalStages - 1, 0));
}

/**
 * 依真實進度推導聊天列表要不要強調某一列。
 *
 * 注意這裡只影響「強調」，不影響「可不可以點」 —
 * 不鎖關卡是已定案的原則，任何節點永遠都能進去。
 */
export function nodeStateFor(
  p: Progress,
  node: MapNode,
  totalStages: number,
): MapNodeState {
  if (!node.lessonId) return node.state;

  const lp = p.lessons[node.lessonId];
  if (!lp) return node.state === 'done' ? 'todo' : node.state;

  if (lp.realDeviceDone) return 'done';
  if (lp.stagesDone >= totalStages) return 'done';
  if (lp.stagesDone > 0) return 'now';
  return node.state === 'done' ? 'todo' : node.state;
}
