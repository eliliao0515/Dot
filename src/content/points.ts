/**
 * 點數規則（specs/v2/P4-restructure-quiz-points.md §4）。數字可以依工作坊現場調整。
 *
 * 護欄（2026-10-04 使用者確認）：點數只加不扣；答錯 0 分、不倒扣；不依作答速度加分。
 */
export const POINTS = {
  /** 符號選擇題答對一題 */
  quizCorrect: 100,
  /** 玩完一局（不管答對幾題），鼓勵玩完 */
  quizComplete: 50,
  /** 情境挑戰第一次完成一個步驟（帶著做／自己做／換情境）；重做同一步驟不再給 */
  stageDone: 100,
  /** 第一次在自己手機上做到（realDevice）—— 唯一真正的成功指標，給最多 */
  realDevice: 300,
} as const;

/** 符號選擇題每局幾題 */
export const QUIZ_LENGTH = 10;
