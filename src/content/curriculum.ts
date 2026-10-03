import type { Level, Unit } from '../engine/types';
import { LESSONS } from './lessons';
import { EDGE_BACK } from './gestures';

/**
 * v2 課本目錄（specs/v2/00-overview.md §3）。
 *
 * 單元一的關卡名稱是草稿；單元二照 specs/v2/P5-gestures.md，還沒做的先列成 comingSoon（照樣能點，不鎖關卡）。
 * 單元三的 scenario 關卡直接引用 v1 的 Lesson，副標題沿用課程標題。
 */

function scenario(lessonId: string, title: string, glyph: Level['glyph']): Level {
  return { id: lessonId, kind: 'scenario', lessonId, title, subtitle: LESSONS[lessonId].title, glyph };
}

function soon(id: string, title: string, glyph: Level['glyph']): Level {
  return { id, kind: 'comingSoon', title, subtitle: '還在準備', glyph };
}

const LEVEL_LIST: Level[] = [
  // v2 P4：目前關卡頁實際列出的
  { id: 'sym-quiz', kind: 'symbolQuiz', title: '符號選擇題', subtitle: '每次 10 題，答對一題 100 點', glyph: 'search' },

  // 單元一　認識符號
  soon('sym-back', '往回走、回首頁', 'back'),
  soon('sym-search', '找東西', 'search'),
  soon('sym-more', '加東西、更多', 'plus'),
  soon('sym-talk', '說話與看', 'mic'),
  soon('sym-share', '分享與儲存', 'share'),
  soon('sym-settings', '設定與通知', 'menu'),
  soon('sym-careful', '不要亂按的', 'trash'),

  // 單元二　手勢（specs/v2/P5-gestures.md §3）：猜猜看，不走鷹架
  { id: 'ges-edge-back', kind: 'gesture', title: '回上一頁', subtitle: '不用按返回鍵也能回去', glyph: 'back', script: EDGE_BACK },
  soon('ges-chat-preview', '先偷看訊息', 'touch'),
  soon('ges-message-menu', '訊息的更多選項', 'touch'),
  soon('ges-double-tap', '把照片放大', 'touch'),
  soon('ges-pinch', '兩根手指放大縮小', 'touch'),

  // 單元三　LINE 情境
  scenario('read-reply', '看訊息、回訊息', 'chat'),
  scenario('sticker', '傳貼圖', 'sticker'),
  scenario('voice-msg', '傳語音訊息', 'mic'),
  scenario('save-photo', '把照片存起來', 'camera'),
  scenario('voice-call', '打語音電話', 'phone'),
  soon('video-call', '接視訊電話', 'video'),
  { id: 'line-practice', kind: 'practice', title: 'LINE 綜合練習', subtitle: '隨機出題，複習學過的技能', glyph: 'chat' },
];

export const LEVELS: Record<string, Level> = Object.fromEntries(LEVEL_LIST.map((l) => [l.id, l]));

/**
 * 關卡頁的三個類別（specs/v2/P4-restructure-quiz-points.md §2，2026-10-04 使用者決定先各做一關）。
 * 其他已經做好的 LINE 課（回訊息、貼圖、語音訊息、存照片）和綜合練習先不列出來，
 * 資料留在 LEVELS 裡，之後要放回哪個類別再決定。
 */
export const UNITS: Unit[] = [
  {
    id: 'symbols',
    title: '認識符號',
    summary: '手機上的小圖案各代表什麼意思。',
    levelIds: ['sym-quiz'],
  },
  {
    id: 'gestures',
    title: '練習手勢',
    summary: '用手指按、壓、滑，每一種手勢練一練。',
    levelIds: ['ges-edge-back', 'ges-chat-preview', 'ges-message-menu', 'ges-double-tap', 'ges-pinch'],
  },
  {
    id: 'scenarios',
    title: '情境挑戰',
    summary: '把學過的東西，用在 LINE 裡真的會遇到的事情上。',
    levelIds: ['voice-call'],
  },
];

/** 推薦順序：照單元、照關卡排下來。只用來決定「接著上次」指去哪，不擋任何關卡。 */
export const RECOMMENDED_ORDER: string[] = UNITS.flatMap((u) => u.levelIds);
