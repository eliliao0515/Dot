# Task: 「傳貼圖」／「把照片存起來」課程內容

## Target
- 修改：`src/content/lessons.ts`（新增兩個 `Lesson`：`stickerLesson`、
  `savePhotoLesson`，加進 `LESSONS` record；並把 `MAP_NODES` 裡 `sticker`／
  `save-photo` 兩個節點補上對應的 `lessonId`）
- **禁止修改**：`src/engine/types.ts`、`src/sim/**`、`App.tsx`、
  `src/shell/**`（`App.tsx` 的路由邏輯本來就是照 `MAP_NODES` 的 `lessonId`
  通用判斷「這個節點能不能點進去」，你只要把資料補齊，不用改路由程式碼；
  另一位 worker 同時在改 `src/engine/types.ts`／`src/sim/ChatSim.tsx`，讓
  `Target.node` 支援你這裡會用到的 `'sticker'`／`'photo'` 值，你不用等他，
  但**中途 `npx tsc --noEmit` 可能暫時打不過**，這是預期中的，見下方
  Constraints）

## Change（內容已經由使用者審過定稿，照抄，不要自己改寫）

### `stickerLesson`
```ts
export const stickerLesson: Lesson = {
  id: 'sticker',
  eyebrow: '第 2 課 · 傳貼圖',
  title: '阿弟母親節傳訊息給你',
  why: '不知道要打什麼字沒關係，點一個貼圖就能表達心意，不用打字。',
  skillName: '傳貼圖',
  target: { node: 'sticker', gesture: 'tap', minMs: 0 },
  stages: [
    {
      stage: 'guided',
      contact: '阿弟',
      messages: [
        { id: 'g1', from: 'them', kind: 'text', text: '媽母親節快樂，今天有出去走走嗎？', showName: true },
      ],
      coach: '點下面那個貼圖的圖示，選一個你喜歡的貼圖回他',
      note: '按錯不會怎麼樣，慢慢來。',
    },
    {
      stage: 'solo',
      contact: '阿弟',
      messages: [
        { id: 's1', from: 'them', kind: 'text', text: '我禮拜五生日，晚上要不要一起吃飯？', showName: true },
      ],
      note: '這一次沒有提示。想不起來就按「卡住了」。',
    },
    {
      stage: 'transfer',
      contact: '美玲',
      messages: [
        { id: 't1', from: 'them', kind: 'text', text: '新年快樂！你們家圍爐了嗎？', showName: true },
      ],
      note: '換一個人。想回他，點貼圖選一個就好。',
    },
  ],
  realDevice: {
    headline: '現在，換你自己的手機',
    steps: ['關掉這個練習 App', '打開你平常在用的通訊軟體', '找一個人，傳一個貼圖給他', '傳出去了就回來這裡'],
  },
  done: {
    headline: '你會傳貼圖了',
    body: '以後不知道要打什麼字，點貼圖的圖示選一個貼圖就好，不用打字。',
    shareWith: '阿弟',
  },
};
```

### `savePhotoLesson`
```ts
export const savePhotoLesson: Lesson = {
  id: 'save-photo',
  eyebrow: '第 5 課 · 把照片存起來',
  title: '阿美傳了張照片給你',
  why: '喜歡的照片可以留下來，長按那張照片，選存起來就好。',
  skillName: '把照片存起來',
  target: { node: 'photo', gesture: 'longPress', minMs: 400 },
  stages: [
    {
      stage: 'guided',
      contact: '阿美',
      messages: [
        { id: 'g1', from: 'them', kind: 'photo', label: '巷口的高麗菜', showName: true },
      ],
      coach: '長按這張照片，選「存起來」',
      note: '按錯不會怎麼樣，慢慢來。',
    },
    {
      stage: 'solo',
      contact: '阿美',
      messages: [
        { id: 's1', from: 'them', kind: 'photo', label: '菜市場的芭樂' },
      ],
      note: '這一次沒有提示。想不起來就按「卡住了」。',
    },
    {
      stage: 'transfer',
      contact: '小宇',
      messages: [
        { id: 't1', from: 'them', kind: 'text', text: '阿嬤你看運動會的照片！', showName: true },
        { id: 't2', from: 'them', kind: 'photo', label: '運動會' },
      ],
      note: '換一個人。喜歡的照片一樣長按存起來。',
    },
  ],
  realDevice: {
    headline: '現在，換你自己的手機',
    steps: ['關掉這個練習 App', '打開你平常在用的通訊軟體', '找一張別人傳的照片', '長按它，選存起來', '存好了就回來這裡'],
  },
  done: {
    headline: '你會存照片了',
    body: '以後想留住重要的照片，長按那張照片，選存起來就好。',
    shareWith: '阿美',
  },
};
```

### `MAP_NODES` 補丁
把既有 `MAP_NODES` 裡這兩筆加上 `lessonId`（其餘欄位、其餘節點不動）：
```ts
{ id: 'sticker', label: '傳貼圖', sub: '已經會了', state: 'done', lessonId: 'sticker' },
{ id: 'save-photo', label: '把照片存起來', sub: '還沒開始', state: 'todo', lessonId: 'save-photo' },
```

`LESSONS` record 加上這兩課：
```ts
export const LESSONS: Record<string, Lesson> = {
  [voiceMessageLesson.id]: voiceMessageLesson,
  [stickerLesson.id]: stickerLesson,
  [savePhotoLesson.id]: savePhotoLesson,
};
```

## Constraints
- 上面的課程內容已經是使用者審過的定稿，禁止自己生成、增刪、改寫文字內容
- 不要動 `voiceMessageLesson`、既有 `MAP_NODES` 其他節點、`CHAT_ROOMS` 資料
- 完成前必須跑 `npx tsc --noEmit`；**如果另一位 worker 的
  `engine/types.ts`／`ChatSim.tsx` 改動還沒做完，`tsc` 可能會因為
  `Target.node` 還不認得 `'sticker'`／`'photo'` 而報錯**——這是預期中的
  暫時狀態，不用因此改自己範圍以外的檔案（尤其不要自己去改
  `engine/types.ts`），先確認自己這份內容資料本身沒有其他型別錯誤即可，
  最終整合驗證由 PM 負責

## Ownership
`src/content/lessons.ts`。另一位 worker 同時進行 `src/engine/types.ts`（只
新增列舉值）／`src/sim/ChatSim.tsx` 的改動，兩邊檔案沒有重疊。

## Observable acceptance
- 內容逐字比對跟上面「Change」區塊一致
- 如果另一位 worker 已經完成，`npx tsc --noEmit` 應該通過；如果還沒完成，
  確認錯誤訊息只跟 `Target.node` 型別有關（不是你自己這份資料寫錯了其他
  東西）
- `npx expo start --web` 手動測試（若另一位 worker 已完成）：聊天列表的
  「阿弟」「阿美」兩列可以點進去，能看到對應課程的 `BriefScreen`

## 完成紀錄
- 日期：2026-09-08
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- worker 自報：內容逐字照抄 spec 定稿；提交時 `tsc` 因對方尚未完成
  `Target.node` 型別擴充而有兩個預期中的暫時錯誤，僅限於此
- PM 驗收：另一位 worker 完成後 `npx tsc --noEmit` 通過；改動檔案（僅
  `src/content/lessons.ts`）與 Ownership 範圍吻合
- PM 整合測試：點聊天列表「阿弟」列進入「第 2 課．傳貼圖」、點「阿美」列
  進入「第 5 課．把照片存起來」，`BriefScreen` 文案（title/why）與腳本內容
  皆與定稿一致，guided→solo 兩階段實測過關成功
- 附註：本次派工過程中發現另一個平行 session 已經把先前的聊天列表／
  綜合練習改動（specs 04-07）commit 進 `main`（commit `ad5912b`），且新增
  了 `specs/08-incoming-video-call-lesson.md`；本檔原本也編號 09，為避免
  跟對方的 08 混淆、保持連號，改名為 `11-`
- 懸而未決事項：本次改動尚未 commit；`MAP_NODES` 裡 `sticker`／
  `save-photo` 兩節點雖補上 `lessonId`，`state` 欄位（`done`/`todo`）沒有
  跟著調整，是否要改看使用者是否覺得需要
