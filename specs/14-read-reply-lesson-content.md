# Task: 「看訊息、回訊息」課程內容

## Target
- 修改：`src/content/lessons.ts`（新增一個 `Lesson`：`readReplyLesson`，
  加進 `LESSONS` record；並把 `MAP_NODES` 裡 `read-reply` 節點補上
  `lessonId`）
- **禁止修改**：`src/engine/types.ts`、`src/sim/**`、`App.tsx`、
  `src/shell/**`（另一位 worker 同時在讓 `Target.node` 支援 `'reply'`，
  你不用等他，但過程中 `tsc` 可能暫時因為型別還不認得這個值而失敗，這是
  預期中的，見下方 Constraints）

## Change（內容已經由使用者審過定稿，照抄，不要自己改寫）

```ts
export const readReplyLesson: Lesson = {
  id: 'read-reply',
  eyebrow: '第 1 課 · 看訊息、回訊息',
  title: '美惠約你禮拜三去買菜',
  why: '不知道要打什麼字沒關係，看訊息下面幾個現成的話，點一個就能回她。',
  skillName: '看訊息、回訊息',
  target: { node: 'reply', gesture: 'tap', minMs: 0 },
  stages: [
    {
      stage: 'guided',
      contact: '美惠',
      messages: [
        { id: 'g1', from: 'them', kind: 'text', text: '禮拜三要不要一起去買菜？早上九點市場門口見', showName: true },
      ],
      coach: '看下面幾個現成的話，點一個回她就好',
      note: '按錯不會怎麼樣，慢慢來。',
    },
    {
      stage: 'solo',
      contact: '美惠',
      messages: [
        { id: 's1', from: 'them', kind: 'text', text: '我們禮拜三見喔，不見不散', showName: true },
      ],
      note: '這一次沒有提示。想不起來就按「卡住了」。',
    },
    {
      stage: 'transfer',
      contact: '阿珍',
      messages: [
        { id: 't1', from: 'them', kind: 'text', text: '新的一年，要不要來我家吃飯？', showName: true },
      ],
      note: '換一個人。看訊息，點一個現成的話回她。',
    },
  ],
  realDevice: {
    headline: '現在，換你自己的手機',
    steps: ['關掉這個練習 App', '打開你平常在用的通訊軟體', '找一則別人傳的訊息', '點下面現成的話回他', '傳出去了就回來這裡'],
  },
  done: {
    headline: '你會看訊息回訊息了',
    body: '以後收到訊息，看下面現成的話，點一個回就好，不用打字。',
    shareWith: '美惠',
  },
};
```

`MAP_NODES` 補丁（只改這一筆，其餘節點不動）：
```ts
{ id: 'read-reply', label: '看訊息、回訊息', sub: '已經會了', state: 'done', lessonId: 'read-reply' },
```

`LESSONS` record 加上這一課：
```ts
export const LESSONS: Record<string, Lesson> = {
  [voiceMessageLesson.id]: voiceMessageLesson,
  [stickerLesson.id]: stickerLesson,
  [savePhotoLesson.id]: savePhotoLesson,
  [readReplyLesson.id]: readReplyLesson,
};
```

## Constraints
- 上面的課程內容已經是使用者審過的定稿，禁止自己生成、增刪、改寫文字內容
- 不要動 `voiceMessageLesson`、`stickerLesson`、`savePhotoLesson`、既有
  `MAP_NODES` 其他節點、`CHAT_ROOMS` 資料
- 完成前必須跑 `npx tsc --noEmit`；**如果另一位 worker 的
  `engine/types.ts`／`ChatSim.tsx` 改動還沒做完，`tsc` 可能會因為
  `Target.node` 還不認得 `'reply'` 而報錯**——這是預期中的暫時狀態，不用
  因此改自己範圍以外的檔案（尤其不要自己去改 `engine/types.ts`），先確認
  自己這份內容資料本身沒有其他型別錯誤即可，最終整合驗證由 PM 負責

## Ownership
`src/content/lessons.ts`。另一位 worker 同時進行 `src/engine/types.ts`（只
新增列舉值）／`src/sim/ChatSim.tsx`／`src/sim/parts.tsx`／`src/ui/Icons.tsx`
的改動，兩邊檔案沒有重疊。

## Observable acceptance
- 內容逐字比對跟上面「Change」區塊一致
- 如果另一位 worker 已經完成，`npx tsc --noEmit` 應該通過；如果還沒完成，
  確認錯誤訊息只跟 `Target.node` 型別有關
- `npx expo start --web` 手動測試（若另一位 worker 已完成）：聊天列表的
  「美惠」列可以點進去，能看到「第 1 課．看訊息、回訊息」的內容

## 完成紀錄
- 日期：2026-09-09
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- PM 驗收：另一位 worker 完成後 `npx tsc --noEmit` 通過；改動檔案（僅
  `src/content/lessons.ts`）與 Ownership 範圍吻合
- PM 整合測試：點聊天列表「美惠」列進入「第 1 課．看訊息、回訊息」，
  guided 階段教練文字＋建議訊息膠囊正確顯示，點任一膠囊正確過關進 solo
  階段
- 懸而未決事項：本次改動尚未 commit
