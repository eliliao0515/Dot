# Task: 把「看照片」元件接進聊天畫面，修正存照片課程內容

## Target
- 修改：`src/sim/ChatSim.tsx`
- 修改：`src/sim/parts.tsx`（`MessageRow`／`PhotoThumb` 的手勢調整，見下方）
- 修改：`src/content/lessons.ts`（只修改 `savePhotoLesson` 既有內容，
  見下方「內容修正」，不要動其他課程）
- **禁止修改**：`src/sim/PhotoViewer.tsx`（另一位 worker 負責新建這個檔案，
  你直接 import 使用，不用等他做完再開工——介面約定已經在這份 spec 定案）、
  `src/engine/types.ts`、`App.tsx`、`src/shell/**`

## Change

### 1. 照片互動方式改變
現有「存照片」的手勢是：長按收到的照片，直接存檔（`onLongPress` 觸發
`savePhoto()`）。這次照真實 LINE 的實際流程改成兩步驟：
1. **點一下**任何照片訊息（不分是不是自己傳的），開啟全螢幕的
   `PhotoViewer`（另一位 worker 提供的元件，import 進來用）
2. 在 `PhotoViewer` 裡點「下載」按鈕，才真正觸發存檔（跟現有
   `savePhoto()` 邏輯一樣，一樣會跳「已儲存」提示）

`MessageRow`／`PhotoThumb` 原本的 `onLongPress` 存照片手勢要拿掉，改成
`onPress` 開啟 `PhotoViewer`（`PhotoThumb` 元件本身的 props 介面你可以
自己調整，只要 `ChatSim.tsx` 呼叫端接得上就好，這個檔案除了這個手勢調整
以外不要動其他東西）。

`PhotoViewer` 其餘裝飾性按鈕（掃描／縮圖網格／表情／畫筆／垃圾桶／分享）
被按下時，用現有 `nudge` 或 `note` 那種中性提示的呈現方式（比照專案裡
「這個功能還沒做好」的既有語氣，例如可以直接沿用 `ChatsListScreen` 之前
用過的說法）顯示一個中性提示，**不要**顯示紅色錯誤樣式。

`timestamp` 這個 prop 先給一個固定、合理的中文格式文字（例如「上午
9:32」這種），不用真的接每則訊息的實際發送時間——目前 `Bubble` 型別本來
就沒有存時間戳記，這次不需要為了這個新增型別欄位，直接給合理的假文字
即可。

### 2. `target.node === 'photo'` 的過關判定
過關的觸發點從「長按照片」改成「在 `PhotoViewer` 裡按下載」。當
`lesson.target.node === 'photo'` 時，按下載要觸發 `setSucceeded(true)`
之後照現有模式延遲呼叫 `onDone`；下載本身（存檔＋跳「已儲存」提示）在
任何課程、任何照片上都要能正常運作，不是只有 `photo` 目標的課程才能存檔
（沿用現有邏輯：這個「動作」本身永遠可用，只是「這個動作算不算讓這一課
過關」才看 `target.node`）。

### 3. 存照片課程內容修正
`src/content/lessons.ts` 裡的 `savePhotoLesson`，因為互動方式改變，下面
幾處文字需要一起修正（**只改這幾處，其餘內容不動**）：

```ts
target: { node: 'photo', gesture: 'tap', minMs: 0 },  // 原本是 longPress: 400

why: '喜歡的照片可以留下來，點開那張照片，再點下面的下載鍵就好。',
// 原本：'喜歡的照片可以留下來，長按那張照片，選存起來就好。'

// guided 階段的 coach：
coach: '點這張照片，再點下面的下載鍵',
// 原本：'長按這張照片，選「存起來」'

// transfer 階段的 note：
note: '換一個人。喜歡的照片一樣點開，再點下載。',
// 原本：'換一個人。喜歡的照片一樣長按存起來。'

// realDevice.steps 第 4 步：
'點開那張照片，再點下面的下載鍵',
// 原本：'長按它，選存起來'

// done.body：
body: '以後想留住重要的照片，點開那張照片，再點下載鍵就好。',
// 原本：'以後想留住重要的照片，長按那張照片，選存起來就好。'
```

## Constraints
- 手勢限制：這一課現在是「點一下照片」＋「點一下下載鍵」兩個點一下動作，
  不是長按，`Target.gesture` 改成 `'tap'`（`Target.node` 維持 `'photo'`
  不變，不需要新增列舉值）
- 錯誤路徑一律沿用現有寬容處理，`PhotoViewer` 的裝飾性按鈕不算「答錯」，
  只是「這個功能還沒做好」的中性提示
- 顏色：`PhotoViewer` 是黑底（另一位 worker 會處理），跟這裡無關；聊天畫面
  本身顏色不變
- 完成前必須跑 `npx tsc --noEmit`；**如果另一位 worker 的
  `PhotoViewer.tsx` 還沒做完，你這裡 `import PhotoViewer from
  './PhotoViewer'` 會找不到模組而報錯**，這是預期中的暫時狀態，不用因此
  改變自己的範圍，也不要自己去寫一個暫時版的 `PhotoViewer.tsx`（那是對方
  的檔案）
- 必須手動重新測過「傳語音訊息」「傳貼圖」「看訊息、回訊息」三課的整套
  流程，以及綜合練習，確認沒有回歸（這三課都不受這次改動影響，但
  `ChatSim.tsx` 是共用元件，务必重新走一遍）

## Ownership
`src/sim/ChatSim.tsx`、`src/sim/parts.tsx`（僅照片手勢調整）、
`src/content/lessons.ts`（僅 `savePhotoLesson` 上述幾處文字）。另一位
worker 同時進行 `src/sim/PhotoViewer.tsx`（新建）／`src/ui/Icons.tsx`
（新增圖示）的改動，兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過（待另一位 worker 完成 `PhotoViewer.tsx` 後）
- 手動測試（`npx expo start --web`）：
  - 點「阿美」進「把照片存起來」課，guided 階段點照片會開啟全螢幕看照片
    畫面，點下載鍵正確過關進 solo 階段
  - `PhotoViewer` 裡其他按鈕（掃描/網格/表情/畫筆/垃圾桶/分享）點下去顯示
    中性提示，不會過關也不會出錯
  - 「傳語音訊息」「傳貼圖」「看訊息、回訊息」三課、綜合練習，整套流程
    重新走一遍確認沒有回歸

## 完成紀錄
- 日期：2026-09-09
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- worker 自報：下載按鈕改成先關閉 `PhotoViewer` 再存檔，避免「已儲存」
  提示跟過關文案被黑底蓋住；裝飾性按鈕的中性提示（`nudge`）zIndex 調到
  60（蓋過 `PhotoViewer` 的 50）才會顯示出來，這是必要的技術細節，不是
  UI 決策
- PM 驗收：`npx tsc --noEmit` 通過（`PhotoViewer.tsx` 已由另一位 worker
  完成，介面對上沒有問題）；改動檔案與 Ownership 範圍吻合
- PM 整合測試：點「阿美」進「把照片存起來」課，guided／solo 兩階段點照片
  都能正確開啟全螢幕看照片畫面（標題列正確顯示聯絡人名字＋時間），點下載
  正確過關進下一階段；點垃圾桶顯示「這個功能還沒做好」中性提示，正確蓋在
  黑底檢視器之上、沒被擋住
- 懸而未決事項：本次改動尚未 commit；`timestamp` 目前是寫死的假文字
  （「上午 9:32」），沒有真的對應每則訊息的實際時間
