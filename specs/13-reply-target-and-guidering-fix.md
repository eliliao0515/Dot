# Task: 「回訊息」過關路徑、建議訊息收斂、紅圈引導定位修正、貼圖按鈕圖示

## Target
- 修改：`src/engine/types.ts`（只新增：把 `Target.node` 的型別擴充為包含
  `'reply'`，即 `'mic' | 'plus' | 'video' | 'sticker' | 'photo' | 'reply'`，
  不要動其他任何既有型別）
- 修改：`src/sim/ChatSim.tsx`
- 修改：`src/sim/parts.tsx`（僅限輸入列的貼圖按鈕圖示替換，見下方）
- 修改：`src/ui/Icons.tsx`（只新增一個圖示函式，不要動既有任何圖示）
- **禁止修改**：`src/content/**`、`App.tsx`、`src/shell/**`（另一位 worker
  同時在寫 `src/content/lessons.ts` 的「看訊息、回訊息」課程內容，會用到你
  這裡擴充的 `Target.node` 新值，你不用等他）

## Change

### 1. 「回訊息」過關路徑
`QuickReplyRow`（畫面上「好／謝謝／知道了／等一下」那排膠囊）目前點下去
只會把文字加進訊息串（`sendText()`），不會觸發過關。新增：當
`lesson.target.node === 'reply'` 時，點任一個膠囊都算過關（不評對錯，跟
其他題型一樣——只要做出「點一下回覆」這個動作就算會了），觸發
`setSucceeded(true)` 後跟現有一樣延遲呼叫 `onDone`。

### 2. 建議訊息（QuickReplyRow）收斂成只有「回訊息」課才顯示
目前 `QuickReplyRow` 只要「沒在顯示教練文字、沒在錄音、沒過關、沒有面板
開著」就一律顯示，不管是哪一課。這對語音／貼圖／存照片這些課來說是無關
的干擾（跟過關動作沒關係）。改成：**只有 `lesson.target.node === 'reply'`
時才顯示這排建議訊息**，其他課（`mic`/`sticker`/`photo`/`video`）完全不
顯示。

### 3. 紅圈引導（`GuideRing`）定位修正
`GuideRing` 目前寫死永遠框在麥克風按鈕上，不管這一課的過關動作是什麼。
改成依 `lesson.target.node` 決定紅圈框哪裡：
- `target.node === 'mic'`：維持現狀，框麥克風（不要改動這條路徑的定位）
- `target.node === 'sticker'`：紅圈要改框輸入列上的貼圖按鈕（在麥克風左邊
  那顆），不是麥克風。實際偏移量請你自己跑 `npx expo start --web` 目視
  對齊調整，不用問，只要視覺上紅圈確實圈住貼圖按鈕就算對
- `target.node === 'photo'`：**不要顯示紅圈**——存照片的目標是對話串裡
  一則會捲動的照片訊息，不是固定位置的按鈕，用固定位置的浮動紅圈框不出
  正確位置，容易誤導。這一課的引導完全依賴既有的教練文字（coach）跟安撫
  文字（note），不需要額外的視覺指向
- 其他情況（`reply`/`video`/`plus` 或未來新增的值）：目前沒有任何課程的
  `guided` 階段會用到這些值搭配紅圈，維持不顯示紅圈即可（安全預設值），
  不用特別處理

### 4. 貼圖按鈕圖示改成簡單笑臉
`src/sim/parts.tsx` 的 `SimInputBar` 裡，輸入列上「開啟貼圖面板」那顆按鈕
目前用的是 `Sticker` 這個圖示（畫出一個圓角方塊）。**這顆按鈕**改用一個
新的、簡單笑臉造型的圖示（圓形＋兩個點當眼睛＋一條弧線當嘴巴，比照
`src/ui/Icons.tsx` 現有手繪 `View` 風格新增，例如叫 `Smile`）。

**注意**：訊息串裡實際顯示「貼圖內容」的地方（`MessageRow` 用
`STICKER_ICONS`／既有 `Sticker` 圖示畫出送出去的貼圖本體）**不要改**，
那是另一個用途（貼圖訊息本體，不是「打開貼圖面板」這顆按鈕），維持原樣。

## Constraints
- 只能新增 `Target.node` 的列舉值跟一個新圖示函式，不要動這兩個檔案裡任何
  既有的型別或圖示定義
- 手勢限制不變：`reply` 是點一下
- 錯誤路徑一律沿用現有寬容處理（`onWrongTap`/`handleWrongTap`），不要新增
  任何負面提示
- 顏色不變：紅圈維持 `C.red`（教學外殼的引導色，跟被模擬 App 的綠色/靛藍
  外殼都不衝突，這是既有慣例，不要改色）
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤
- **這個任務會暫時性地讓另一位 worker（負責 `src/content/lessons.ts`）在
  你完成前 `tsc` 失敗**（因為他的腳本會用到 `target.node: 'reply'` 這個
  新值），這是預期中的暫時狀態，不用因此改變自己的範圍
- 必須手動重新測過「傳語音訊息」「傳貼圖」「把照片存起來」三課的
  guided → solo → transfer → realDevice → done 整套流程，以及綜合練習
  隨機抽題，確認這次改動沒有造成回歸（尤其貼圖課、語音課的紅圈位置要
  分別對得起來）

## Ownership
`src/engine/types.ts`（只新增 `Target.node` 列舉值）、`src/sim/ChatSim.tsx`、
`src/sim/parts.tsx`（僅輸入列貼圖按鈕圖示替換）、`src/ui/Icons.tsx`（只新增
`Smile` 圖示）。另一位 worker 同時進行 `src/content/lessons.ts` 的改動，
兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過
- 手動測試（`npx expo start --web`）：
  - 語音課 guided 階段：紅圈依然正確框住麥克風
  - 貼圖課 guided 階段：紅圈改框貼圖按鈕，不再框麥克風
  - 存照片課 guided 階段：沒有浮動紅圈，教練文字正常顯示
  - 建議訊息（好/謝謝/知道了/等一下）只在「看訊息、回訊息」這課出現，
    語音／貼圖／存照片課、綜合練習題目裡都不會再看到
  - 輸入列的貼圖按鈕圖示變成簡單笑臉造型，訊息串裡送出去的貼圖本體圖示
    不受影響
  - 語音／貼圖／存照片三課整套流程重新走一遍，確認沒有回歸

## 完成紀錄
- 日期：2026-09-09
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- worker 自報：實作過程中發現既有邏輯缺口——`QuickReplyRow` 原本被
  `showCoach` 擋住不顯示，會導致「回訊息」課 guided 階段教練文字說「看下面
  現成的話」卻沒有膠囊可點，已一併修正為 `reply` 課時不受 `showCoach` 影響
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`engine/types.ts`／
  `ChatSim.tsx`／`parts.tsx`／`Icons.tsx`）與 Ownership 範圍吻合，跟另一位
  worker 的 `content/lessons.ts` 沒有交集
- PM 整合測試（截圖核對）：「美惠」回訊息課 guided 階段正確顯示建議訊息，
  點任一膠囊正確過關；「阿弟」貼圖課紅圈正確改框輸入列的笑臉貼圖按鈕
  （不再框麥克風）；「阿美」存照片課 guided 階段完全沒有浮動紅圈，只靠
  教練文字提示；貼圖按鈕圖示確認已換成簡單笑臉造型
- 懸而未決事項：本次改動尚未 commit
