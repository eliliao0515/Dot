# Task: ChatSim 支援「傳貼圖」／「存照片」過關路徑

## Target
- 修改：`src/engine/types.ts`（只新增：把 `Target.node` 的型別從
  `'mic' | 'plus' | 'video'` 擴充為
  `'mic' | 'plus' | 'video' | 'sticker' | 'photo'`，不要動其他任何既有型別）
- 修改：`src/sim/ChatSim.tsx`
- **禁止修改**：`src/sim/parts.tsx`、`src/content/**`、`App.tsx`、
  `src/shell/**`（另一位 worker 同時在寫 `src/content/lessons.ts` 的兩課
  內容，會用到你這裡擴充的 `Target.node` 新值，你不用等他、也不用管他）

## Change
現有 `ChatSim.tsx` 裡：
- `sendSticker()`（使用者在 `StickerPanel` 點一個貼圖送出）目前只會把貼圖
  加進訊息串，不會觸發過關
- `savePhoto()`（長按收到的照片，跳出「已儲存」提示）目前只會顯示提示，
  不會觸發過關

這次要新增兩條過關路徑，跟現有「長按麥克風」「點視訊圖示」是並行的：
- 當 `lesson.target.node === 'sticker'` 時，`sendSticker()` 觸發後要算過關
  （`setSucceeded(true)` 後跟現有一樣延遲呼叫 `onDone`）
- 當 `lesson.target.node === 'photo'` 時，`savePhoto()` 觸發後要算過關
- 其餘情況（例如 `mic` 課程卻去點貼圖或存照片）沿用現有「錯誤路徑全部放行」
  的寬容處理，不新增任何負面提示

完成畫面文案：貼圖過關可以用「貼圈傳出去了」之類的話，存照片過關可以用
「存起來了」之類的話（參考已經有的「送出去了」/「接通了」寫法），文案怎麼
寫你自己決定就好，不用另外問。

## Constraints
- 只能新增 `Target.node` 的列舉值，不要動這個型別以外的任何東西
- 手勢限制不變：貼圖是點一下，存照片是長按，這是 `StickerPanel`／
  `PhotoThumb` 既有元件本來就有的手勢，不要去改 `parts.tsx` 或改變這兩個
  元件本身的互動方式
- 錯誤路徑一律沿用現有寬容處理（`onWrongTap`/`handleWrongTap`），不要新增
  任何「答錯」「失敗」的負面回饋或紅色提示
- 顏色不變：維持既有綠色系
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤
- **這個任務會暫時性地讓另一位 worker（負責 `src/content/lessons.ts`）在
  你完成前 `tsc` 失敗**——因為他寫的課程腳本會用到 `target.node: 'sticker'`
  跟 `'photo'` 這兩個新值，型別擴充前打不過。這是預期中的暫時狀態，不用
  因此改變自己的範圍，也不要去改對方的檔案
- 必須手動重新測過「傳語音訊息」課程 guided → solo → transfer →
  realDevice → done 整套流程，以及既有「視訊」題型（如果方便測），確認
  這次改動沒有造成回歸

## Ownership
`src/engine/types.ts`（只新增 `Target.node` 列舉值）、`src/sim/ChatSim.tsx`。
另一位 worker 同時進行 `src/content/lessons.ts` 的改動，兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過
- 手動測試：自己暫時寫一個 `target.node === 'sticker'` 的假腳本，點貼圖
  送出能正確觸發 `onDone`；一個 `target.node === 'photo'` 的假腳本，長按
  收到的照片能正確觸發 `onDone`（測完把暫時性的測試程式碼清掉，最終 diff
  只留 `ChatSim.tsx`／`engine/types.ts` 的正式改動）
- 「傳語音訊息」課程整套流程重新走一遍，確認沒有回歸

## 完成紀錄
- 日期：2026-09-08
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- worker 自報：用 Playwright 實測「傳貼圖」「把照片存起來」兩課全流程過關
  成功，也重跑「傳語音訊息」課程與綜合練習視訊題型確認無回歸，並驗證交叉
  錯誤路徑（貼圖課長按麥克風、存照片課點視訊圖示）維持寬容不過關
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`src/engine/types.ts`／
  `src/sim/ChatSim.tsx`）與 Ownership 範圍吻合，跟另一位 worker 的
  `src/content/lessons.ts` 完全沒有交集
- PM 整合測試：實際點「阿弟」進「傳貼圖」課程，guided 階段點貼圖圖示選一個
  貼圖送出，正確過關進 solo 階段；點「阿美」進「把照片存起來」課程，長按
  收到的照片，正確過關進 solo 階段
- 附註：本次派工過程中發現另一個平行 session 已經把先前的
  聊天列表／綜合練習改動（specs 04-07）commit 進 `main`
  （commit `ad5912b`），且新增了 `specs/08-incoming-video-call-lesson.md`；
  本檔原本也編號 08，為避免與該檔衝突已改名為 `10-`
- 懸而未決事項：本次改動（`src/engine/types.ts`／`src/sim/ChatSim.tsx`／
  `src/content/lessons.ts`）尚未 commit
