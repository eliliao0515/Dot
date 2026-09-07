/**
 * 腳本引擎的資料結構。
 *
 * 原則:
 *  1. 介面佈局與「正確操作路徑」一律寫在這裡，人工編寫、對照真實 App 驗證過。
 *     絕不由 AI 即時生成 — 幻覺出來的步驟會教出錯誤的肌肉記憶。
 *  2. AI 只生成 messages 裡的情境內容（人物、話題、詐騙話術變體），
 *     而且是在後台生成、人工審過、打包下發，不是在使用當下呼叫。
 *  3. 平台差異放在資料裡（screens.ios 覆寫），不要散落 Platform.OS 判斷。
 */

/** 鷹架的四個階段。提示一階比一階少，最後一階要離開 App。 */
export type Stage = 'guided' | 'solo' | 'transfer' | 'realDevice';

/** 貼圖只用通用圖案（讚/愛心/笑臉/OK/花），絕不做成真實 LINE 角色。 */
export type StickerId = 'thumbsUp' | 'heart' | 'laugh' | 'bow' | 'ok';

export type Bubble =
  | { id: string; from: 'them' | 'me'; kind: 'text'; text: string; showName?: boolean }
  | { id: string; from: 'them' | 'me'; kind: 'photo'; label: string; showName?: boolean }
  | { id: string; from: 'them' | 'me'; kind: 'voice'; seconds: number; showName?: boolean }
  | { id: string; from: 'them'; kind: 'link'; text: string; url: string; showName?: boolean }
  | { id: string; from: 'them' | 'me'; kind: 'sticker'; sticker: StickerId; showName?: boolean }
  | { id: string; from: 'them' | 'me'; kind: 'contact'; name: string; showName?: boolean };

/** 使用者要完成的操作。目前只實作長按麥克風，之後可擴充 tap / swipe。 */
export type Target = {
  node: 'mic' | 'plus' | 'video';
  gesture: 'longPress' | 'tap';
  /** 長按門檻。手抖的人需要放寬，這個值要在真機上調。 */
  minMs: number;
};

export type StageScript = {
  stage: Exclude<Stage, 'realDevice'>;
  contact: string;
  messages: Bubble[];
  /** 只有 guided 階段有語音引導文字。solo 之後要按「卡住了」才出現。 */
  coach?: string;
  /** 畫面底部那條低調的說明。不是提示，是安撫。 */
  note: string;
};

export type Lesson = {
  id: string;
  eyebrow: string;
  title: string;
  why: string;
  /** 完成後告訴使用者「你會什麼了」，用技能不用分數。 */
  skillName: string;
  target: Target;
  stages: StageScript[];
  realDevice: { headline: string; steps: string[] };
  done: { headline: string; body: string; shareWith: string };
};

export type MapNodeState = 'done' | 'now' | 'todo' | 'milestone';

export type MapNode = {
  id: string;
  label: string;
  sub: string;
  state: MapNodeState;
  /** 沒有 lessonId 的節點是還沒製作的內容。刻意不鎖，按了給說明。 */
  lessonId?: string;
};
