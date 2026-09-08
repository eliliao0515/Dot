# Task: ChatSim 支援「點視訊圖示」這個過關路徑

## Target
- 修改：`src/sim/ChatSim.tsx`
- 修改：`src/sim/parts.tsx`（`SimTopBar`）
- **禁止修改**：其他所有檔案，尤其 `App.tsx`、`src/shell/**`、
  `src/content/**`、`src/sim/ChatsListScreen.tsx`、`src/engine/types.ts`
  （另一位 worker 正在同時處理「綜合練習」容器，會呼叫到你這裡改好的
  `ChatSim`，你不用等他、也不用管他怎麼呼叫，只要維持現有 `Lesson`／
  `StageScript`／`Target` 型別的既有定義照常運作就好）

## Change
`engine/types.ts` 裡的 `Target.node` 型別本來就定義了 `'mic' | 'plus' | 'video'`
三種可能，但目前只有「長按麥克風送出語音」這條路徑真的會觸發過關
（`stopRecording()` 內部呼叫 `onDone`）。聊天視窗頂部（`SimTopBar`）本來就有
一顆視訊攝影機圖示，但目前不管什麼課程，點下去都只是 `onWrongTap`
（允許亂點、不會出錯提示，但也不會過關）。

這次要新增：**當 `lesson.target.node === 'video'` 且
`lesson.target.gesture === 'tap'` 時，點頂部那顆視訊圖示要觸發過關**——
跟現有「長按麥克風」過關是兩條並行的路徑，同一時刻只有其中一條是當前這題/
這課在意的，看 `lesson.target.node` 決定是哪一條：
- `target.node === 'mic'`：維持現有長按麥克風送出語音的路徑，不能改壞
- `target.node === 'video'`：點視訊圖示觸發過關（`setSucceeded(true)` 之後
  跟現有一樣延遲呼叫 `onDone`）
- 其他情況（例如 `mic` 課程卻去點視訊圖示，或 `video` 課程卻去長按麥克風）：
  沿用現有「錯誤路徑全部放行」的寬容處理（`handleWrongTap`），不新增任何
  負面提示

畫面下方目前寫死的「送出去了」完成提示是給語音訊息用的文字，如果這次觸發
過關的是 `video` 路徑，換一句更符合語意的話（例如「接通了」或「開始視訊
了」）；`mic` 路徑的文字維持原樣不動。這句文案怎麼寫你自己決定就好，不用
另外問。

## Constraints
- 手勢只能「點一下」和「長按」；`video` 這個題型是點一下（`tap`），不要做成
  雙擊或長按視訊圖示
- 錯誤路徑一律沿用現有的寬容處理（`onWrongTap`/`handleWrongTap`），不要新增
  任何「答錯」「失敗」的負面回饋或紅色提示——這是 CLAUDE.md 的硬性規定
- 顏色不變：這裡是被模擬的 App，維持既有綠色系（`C.chatGreen` 等），不要
  引入靛藍
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤
- **這是現有唯一已經上線的課程（傳語音訊息）在用的核心元件**，這次改動
  完成前，一定要手動重新走一遍現有「傳語音訊息」課程的 guided → solo →
  transfer → realDevice → done 整套流程，確認沒有被這次改動弄壞
  （這個既有課程目前的呼叫路徑不會傳 `target.node === 'video'`，理論上
  不受影響，但還是要實測一次，不能只憑看程式碼就假設沒事）

## Ownership
`src/sim/ChatSim.tsx`、`src/sim/parts.tsx`。另一位 worker 同時進行
`App.tsx`／`src/shell/PracticeSession.tsx`／`src/content/practice.ts`／
`src/sim/ChatsListScreen.tsx`／`src/engine/types.ts`（新增型別）的改動，
兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過
- 手動重新測過現有「傳語音訊息」課程整套流程（guided/solo/transfer/
  realDevice/done），確認沒有回歸
- 程式碼層面確認：`target.node==='video' && target.gesture==='tap'` 時點
  視訊圖示會呼叫 `onDone`；`target.node==='mic'` 時點視訊圖示不會過關、
  仍走 `onWrongTap`
- 這個任務不需要自己接一條完整的「綜合練習」路由來手動點擊測試
  `video` 題型（那條路由由另一位 worker 負責，且他的容器完成前你這邊
  也接不上）；兩邊都完成後，由 PM 做整合測試確認隨機抽到 `videoTap` 題型
  時真的能點視訊圖示過關

## 完成紀錄
- 日期：2026-09-07
- 執行者：worker2（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- worker 自報：用 Playwright 實測過「傳語音訊息」guided/solo/transfer/
  realDevice/done 整套流程無回歸，也自行測過 videoTap／voiceReply 兩種題型
  的正確路徑與交叉錯誤路徑（寬容不過關、無負面提示）
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`src/sim/ChatSim.tsx`／
  `src/sim/parts.tsx`）與 Ownership 範圍吻合，跟 worker1 的檔案完全沒有交集
- PM 整合測試（跟 spec 06 合起來測，見該 spec 完成紀錄）：實際跑一輪綜合
  練習隨機抽到的 3 題視訊題型（點頂部攝影機圖示）與 2 題語音題型（長按
  麥克風）全部正確過關；另外單獨重新走一次「傳語音訊息」課程 guided→solo
  階段確認沒有回歸
- 懸而未決事項：改動尚未 commit；跨題型的寬容測試（video 題長按麥克風／
  mic 題點視訊都不應過關）是 worker 自報，PM 沒有逐一重測
