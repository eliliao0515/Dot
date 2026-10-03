import type { CallScript } from '../engine/types';

/**
 * 語音通話劇本（測試版，2026-10-04）。
 *
 * 台詞是 AI 起草的情境內容，**使用者會整批改寫**；改這個檔案就好，不用動程式。
 * 規則：
 *  - 對方的每一句話都在帶出長輩下一個動作（開擴音、掛斷），不是閒聊
 *  - listen = 換長輩說話，講什麼都可以，我們只判斷他講完了沒
 *  - 每句台詞都有 id，之後真人錄音的檔名就用 id（例如 assets/audio/mandarin/vc-g-1.m4a）
 */

const SHUFEN_MUTED = { id: 'vc-muted-shufen', text: '喂？喂？媽，我聽不到你的聲音耶，你是不是按到靜音了？' };

const COMMON_COACH = {
  coachListen: '對方在說話。等她說完，換你回答，講什麼都可以。',
  coachUnmute: '「靜音」亮著，對方聽不到你。再按一次「靜音」把它關掉。',
};

/** 帶著做：打給淑芬，她請你開擴音，最後掛斷。 */
export const guidedCall: CallScript = {
  ...COMMON_COACH,
  mutedLine: SHUFEN_MUTED,
  steps: [
    { type: 'ring', ms: 3000 },
    { type: 'say', line: { id: 'vc-g-1', text: '喂？媽？' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-g-2', text: '你那邊好小聲耶，你開擴音好不好？' } },
    {
      type: 'expect',
      action: 'speakerOn',
      coach: '按一下「擴音」，聲音會變大聲。',
      remind: { id: 'vc-g-r1', text: '媽？你按一下擴音。' },
    },
    { type: 'say', line: { id: 'vc-g-3', text: '有了，這樣清楚多了。你今天晚上幾點會到？' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-g-4', text: '好，那我先去煮飯，晚點見，掰掰。' } },
    {
      type: 'expect',
      action: 'hangUp',
      coach: '講完了，按下面紅色的鍵掛斷。',
      remind: { id: 'vc-g-r2', text: '媽，你可以掛電話了喔。' },
    },
  ],
};

/** 自己做：再打給淑芬，爸也在旁邊。 */
export const soloCall: CallScript = {
  ...COMMON_COACH,
  mutedLine: SHUFEN_MUTED,
  steps: [
    { type: 'ring', ms: 2500 },
    { type: 'say', line: { id: 'vc-s-1', text: '喂？媽，有聽到嗎？' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-s-2', text: '爸也在旁邊對不對？你開擴音，讓他一起聽。' } },
    {
      type: 'expect',
      action: 'speakerOn',
      coach: '按一下「擴音」。',
      remind: { id: 'vc-s-r1', text: '你按一下擴音嘛。' },
    },
    { type: 'say', line: { id: 'vc-s-3', text: '爸好！我們禮拜天回去吃飯喔。' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-s-4', text: '好，那先這樣，掰掰。' } },
    {
      type: 'expect',
      action: 'hangUp',
      coach: '按紅色的鍵掛斷。',
      remind: { id: 'vc-s-r2', text: '可以掛了喔。' },
    },
  ],
};

/** 換情境：打給阿弟，順序不一樣（先聊，後開擴音）。 */
export const transferCall: CallScript = {
  coachListen: '對方在說話。等他說完，換你回答。',
  coachUnmute: COMMON_COACH.coachUnmute,
  mutedLine: { id: 'vc-muted-adi', text: '喂？阿母？我聽不到你講話耶。' },
  steps: [
    { type: 'ring', ms: 3000 },
    { type: 'say', line: { id: 'vc-t-1', text: '喂，阿母喔？' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-t-2', text: '我禮拜六要回去，你要吃什麼我幫你買。' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-t-3', text: '你那邊有點小聲，開擴音一下。' } },
    {
      type: 'expect',
      action: 'speakerOn',
      coach: '按一下「擴音」。',
      remind: { id: 'vc-t-r1', text: '阿母，按擴音啦。' },
    },
    { type: 'say', line: { id: 'vc-t-4', text: '好，聽到了。那就這樣，我先掛囉。' } },
    {
      type: 'expect',
      action: 'hangUp',
      coach: '按紅色的鍵掛斷。',
      remind: { id: 'vc-t-r2', text: '阿母，你可以掛了。' },
    },
  ],
};

/** 不是打電話課、或在沙盒裡打電話時用：對方接起來隨便聊兩句，什麼時候掛都可以。 */
export const freeCall: CallScript = {
  ...COMMON_COACH,
  mutedLine: { id: 'vc-muted-free', text: '喂？我聽不到你的聲音耶。' },
  steps: [
    { type: 'ring', ms: 2500 },
    { type: 'say', line: { id: 'vc-f-1', text: '喂？' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-f-2', text: '嗯嗯，我有在聽。' } },
    { type: 'listen' },
    { type: 'say', line: { id: 'vc-f-3', text: '好喔，那先這樣，掰掰。' } },
  ],
};
