# Task: 釘選的「綜合練習」入口與隨機出題容器

## Target
- 新增：`src/shell/PracticeSession.tsx`（教學外殼層，靛藍色系，包住練習流程的
  開場說明／進度／完成畫面）
- 新增：`src/content/practice.ts`（`PRACTICE_QUESTIONS` 題庫資料，內容已經
  由 PM 離線草擬、使用者審過，見下方「題庫內容」原封不動謄進去，不要自己
  改寫或新增題目）
- 修改：`src/engine/types.ts`（只新增 `PracticeKind`、`PracticeQuestion` 兩個
  型別，型別定義見下方，不要動既有任何型別）
- 修改：`src/sim/ChatsListScreen.tsx`（新增一個可選的 `pinned` prop，渲染
  釘選列；純呈現層規則不變，不要 import `content/practice` 或
  `content/lessons`）
- 修改：`App.tsx`（新增 `practice` route，串接 `PracticeSession`，隨機抽題
  邏輯放這裡或 `PracticeSession.tsx` 內都可以）
- **禁止修改**：`src/sim/ChatSim.tsx`、`src/sim/parts.tsx`（另一位 worker
  負責讓這兩個檔案支援「點視訊圖示過關」這個題型，你只需要把資料組成
  `ChatSim` 現有的 `Lesson`/`StageScript` 形狀丟給它，不用管它裡面怎麼實作、
  也不用等對方做完才能開工——介面約定已經在這份 spec 定案）、
  `src/shell/MapScreen.tsx`、`src/shell/LessonScreens.tsx`、
  `src/shell/BigButton.tsx`、`src/content/lessons.ts`、`src/ui/theme.ts`

## Change
聊天列表最上方新增一列**永遠釘選**的列（圖釘圖示＋標題「綜合練習」＋副標
「隨機出題，複習學過的技能」），不會被其他聊天室往下擠掉。

點下去進入一個新的練習流程：
1. 開場畫面（靛藍外殼）：一句話說明「這是複習，不會計分，答錯也沒關係」
   ＋一個「開始」大按鈕
2. 按開始後，從 `PRACTICE_QUESTIONS`（見下方題庫，8 題）**隨機抽 5 題、
   不重複**，逐題把該題的 `scenario`／`target` 組成 `ChatSim` 需要的
   `Lesson` 形狀（單一階段、`stage: 'transfer'`，`Lesson` 型別裡用不到的
   欄位——例如 `realDevice`／`done`——放合理的預設值即可，反正這個模式不會
   顯示那些畫面），丟給既有的 `ChatSim` 元件顯示——**跟正式課程共用同一顆
   聊天元件，不要另外做一份聊天介面**
3. 每題答對（`ChatSim` 的 `onDone` 觸發）就進下一題；進度用簡單的「第 X
   題．共 5 題」字樣顯示（靛藍色系，不要用正式課程 `TeachingFrame` 那種
   「guided/solo/transfer」字樣，那是給正式鷹架用的，這裡不適用）
4. 5 題都做完後顯示一個簡短完成畫面（「這次複習做完了」），有按鈕回到
   聊天列表
5. 練習中途想離開，隨時可以回到聊天列表（route: `chats`），不用跑完 5 題

## 新增型別（`src/engine/types.ts`，只新增這兩個）
```ts
/** 目前只有這兩種題型：長按麥克風回語音、點視訊圖示。之後可以再擴充。 */
export type PracticeKind = 'voiceReply' | 'videoTap';

/**
 * 綜合練習的一題。scenario 沿用既有 StageScript 形狀（contact/messages/note），
 * stage 固定填 'transfer'（沒有 coach、卡住了教我按鈕還在）。
 * target 沿用既有 Target 型別，videoTap 題型會用 { node: 'video', gesture: 'tap' }。
 */
export type PracticeQuestion = {
  id: string;
  kind: PracticeKind;
  scenario: StageScript;
  target: Target;
};
```

## 題庫內容（`src/content/practice.ts`，8 題照抄，隨機抽 5 題不重複）
1. `pq-1`／voiceReply／聯絡人「王阿姨」／訊息「禮拜六要不要一起去爬象山？」／
   note「這一題沒有提示，想不起來就按「卡住了」。」／target `{node:'mic',gesture:'longPress',minMs:400}`
2. `pq-2`／voiceReply／聯絡人「家豪」／訊息「阿姨，我禮拜天要用你那台果汁機，方便嗎？」／
   note 同上／target 同上
3. `pq-3`／voiceReply／聯絡人「里長」／訊息「明天下午社區有里民大會，記得來喔」／
   note 同上／target 同上
4. `pq-4`／videoTap／聯絡人「小美」／訊息「阿姨我們在頂樓種的花開了，要不要視訊給你看？」／
   note「想跟對方視訊，點畫面上面的攝影機圖示看看。」／target `{node:'video',gesture:'tap',minMs:0}`
5. `pq-5`／videoTap／聯絡人「建成」／訊息「媽，我到高雄了，開視訊給你看飯店房間」／
   note 同上／target 同上
6. `pq-6`／voiceReply／聯絡人「阿珍」／訊息「你上次說的那個膝蓋藥膏叫什麼名字？」／
   note 同第 1 題／target 同第 1 題
7. `pq-7`／videoTap／聯絡人「佳佳」／訊息「阿嬤你看我畫的圖，我們視訊你才看得清楚」／
   note 同第 4 題／target 同第 4 題
8. `pq-8`／voiceReply／聯絡人「陳伯伯」／訊息「下禮拜三的槌球比賽你要不要報名？」／
   note 同第 1 題／target 同第 1 題

每一題的第一則訊息 `showName: true`（比照現有 `voiceMessageLesson` 的寫法）。

## Constraints
- 顏色分層：練習流程外殼（開場說明、進度字樣、完成畫面）用 `C.indigo` 系，
  不可用綠色；實際聊天畫面沿用既有 `ChatSim`（已經是綠色系），這部分你不用
  也不要自己改
- 上面「題庫內容」已經是使用者審過的定稿，禁止自己生成、增刪、改寫題目
  文字內容——這是 CLAUDE.md 的 AI 界線規定（情境內容要人審過才能打包）
- `src/sim/ChatsListScreen.tsx` 的 `pinned` 部分維持純呈現層，只吃 props
  （例如 `title`／`sub`／`onPress`），不要在裡面 import `content/practice`
  或認得「練習」「題目」這些概念——由 `App.tsx` 決定
- 手勢只能點一下，這個新流程不做滑動或長按（長按麥克風那個既有手勢不受影響）
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`src/shell/PracticeSession.tsx`（新建）、`src/content/practice.ts`（新建）、
`src/engine/types.ts`（只新增兩個型別）、`src/sim/ChatsListScreen.tsx`（只新增
`pinned` 相關 props/渲染）、`App.tsx`。另一位 worker 同時進行
`src/sim/ChatSim.tsx`／`src/sim/parts.tsx` 的改動，兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過
- `npx expo start --web` 手動測試：
  - 聊天列表最上方有釘選列，固定不被其他列擠掉
  - 點下去有開場說明＋開始按鈕
  - 按開始後隨機跑 5 題（題型會混著出現，畫面上看得出是共用同一顆聊天元件），
    每題都能正常過關進到下一題，進度字樣正確顯示「第 X 題．共 5 題」
  - 5 題完成後顯示完成畫面，可以回到聊天列表
  - 中途按離開能立刻回到聊天列表
- 由於 `videoTap` 題型的實際過關邏輯是另一位 worker 在
  `ChatSim.tsx`／`parts.tsx` 做的，如果你這邊測試時對方還沒做完，`videoTap`
  題型可能點視訊圖示不會過關——這是預期中的，不用因此卡住，兩邊都完成後
  PM 會做整合測試

## 完成紀錄
- 日期：2026-09-07
- 執行者：worker1（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**（跟 spec 05 一樣是 main 工作目錄裡的未提交
  變更）
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`App.tsx`／
  `src/engine/types.ts`／`src/content/practice.ts`／
  `src/shell/PracticeSession.tsx`／`src/sim/ChatsListScreen.tsx`）與
  Ownership 範圍吻合，跟 worker2 的 `ChatSim.tsx`／`parts.tsx` 完全沒有交集
- PM 整合測試（跟 spec 07 合起來測）：釘選「綜合練習」列固定在聊天列表最
  上方；開場說明＋開始按鈕正常；按開始後隨機抽 5 題（實測跑出語音題型與
  視訊題型混合出現）；每題不論哪種題型都能正常過關進到下一題；完成畫面
  「這次複習做完了」＋「回到聊天列表」正確顯示並能返回根頁面
- 懸而未決事項：改動尚未 commit；題庫目前只有 8 題（之後要擴充用 PM 離線
  生成方案）；`videoTap` 的跨題型寬容測試（video 題長按麥克風／mic 題點
  視訊都不應過關）由 worker2 自行驗證，PM 沒有逐一重測
