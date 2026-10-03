import type { GestureLevelScript, GestureThresholds } from '../engine/types';

/**
 * 手勢單元的題目（specs/v2/P5-gestures.md）。
 *
 * 2026-10-04 使用者決定：手勢單元不用鷹架，讓長輩猜猜看；先照 iPhone 做；每一關最後留「到真手機」卡。
 * 操作路徑（例如 iPhone LINE 聊天室從左邊緣往右滑會回到聊天列表）必須對照真機，不能由 AI 猜。
 *
 * 門檻都是初始值，要在入門紅米／三星 A 和 iPhone 實機上調。
 */

/** LINE 模擬器分頁也用同一組，模擬器裡的邊緣滑跟關卡裡一樣。 */
export const DEFAULT_GESTURE_THRESHOLDS: GestureThresholds = {
  edgeSwipe: {
    // 真 iPhone 大約是左邊 20pt 以內；多給一點，手抖偏一點也算。
    edgePx: 30,
    // 真 iPhone 大約要拖過一半；放寬到三分之一。真手機上的說法還是講「滑過一半」，回去一定夠。
    minRatio: 0.33,
    flickVelocity: 0.5,
  },
};

export const EDGE_BACK: GestureLevelScript = {
  gesture: 'edgeSwipeBack',
  thresholds: DEFAULT_GESTURE_THRESHOLDS,
  challenges: [
    {
      id: 'edge-back-1',
      goal: '女兒的訊息看完了，想回到聊天列表。\n左上角的返回鍵太小、不好按。有沒有別的方法？',
      scene: { openRoomId: 'voice-msg' },
      pass: { type: 'back' },
      nudges: {
        backButton: '這樣也回得去！不過還有一個不用找按鈕的方法。\n點淑芬的聊天室再進去，試試看別的方法。',
      },
      hint: '不一定要按按鈕。試試看用手指在畫面上滑一下。',
      demo: 'edgeSwipeBack',
      aha: {
        gesture: '從左邊緣往右滑',
        meaning: '＝ 回上一頁。\niPhone 上大部分的 App 都可以這樣回去：LINE、設定、相簿、Safari 網頁都可以。',
      },
    },
    {
      id: 'edge-back-2',
      goal: '美惠的訊息看完了，回到聊天列表。',
      scene: { openRoomId: 'read-reply' },
      pass: { type: 'back' },
      nudges: {
        backButton: '這樣也回得去！再試一次剛剛學的方法：點美惠的聊天室再進去。',
      },
      hint: '剛剛那一題怎麼回去的？手指從畫面最左邊開始。',
      demo: 'edgeSwipeBack',
      aha: {
        gesture: '記住兩件事',
        meaning: '手指要從螢幕最左邊開始，滑過畫面一半再放開。\n滑一點點就放開，會留在原來的畫面，再滑一次就好。',
      },
    },
  ],
  realDevice: {
    headline: '在自己的 iPhone 上試一次',
    steps: [
      '打開 LINE，點一個聊天室進去。',
      '手指放在螢幕最左邊，往右滑過畫面一半再放開。',
      '回到聊天列表就成功了。在「設定」裡也可以試試看。',
    ],
  },
};
