# Task: 把「語音錄音」元件接進聊天畫面，修正語音訊息課程與綜合練習內容

## Target
- 修改：`src/sim/ChatSim.tsx`
- 修改：`src/sim/parts.tsx`（`SimInputBar` 麥克風按鈕手勢調整，見下方）
- 修改：`src/content/lessons.ts`（只修改 `voiceMessageLesson` 既有內容，
  見下方「內容修正」，不要動其他課程）
- 修改：`src/content/practice.ts`（只修改 5 筆 `voiceReply` 題型的
  `target` 欄位，見下方，不要動其他任何內容）
- **禁止修改**：`src/sim/VoiceRecorder.tsx`（另一位 worker 負責新建這個
  檔案，你直接 import 使用，不用等他做完再開工——介面約定已經在這份 spec
  定案）、`src/engine/types.ts`、`App.tsx`、`src/shell/**`

## Change

### 1. 語音錄音互動方式全面改變
現有「傳語音訊息」的手勢是：長按麥克風、放開就送出（`delayLongPress`／
`onPressOut`／`onTooShort` 那一套）。**這是過時的做法，這次整個換掉**，
改成真實 LINE 現在的三步驟流程：
1. **點一下**輸入列的麥克風圖示，開啟全螢幕的 `VoiceRecorder`（另一位
   worker 提供的元件，import 進來用），初始 `phase='idle'`
2. 在 `VoiceRecorder` 裡點紅色圓點開始錄音（`phase` 換成 `'recording'`），
   `ChatSim` 這邊要用計時器每秒更新 `elapsedLabel`（格式 `mm:ss`，例如
   `00:07`），並且累積實際錄音秒數
3. 點綠色方塊停止錄音（`phase` 換成 `'stopped'`，計時器凍結，不再更新
   `elapsedLabel`）
4. 點藍色紙飛機（`onSend`）才真正送出語音訊息——沿用現有邏輯把一則
   `{ kind: 'voice', seconds }` 的訊息加進 `sent` 陣列（`seconds` 用實際
   錄了幾秒，至少 1 秒，比照現有 `stopRecording()` 邏輯 `Math.max(1,
   seconds)`），關閉 `VoiceRecorder` 回到正常聊天畫面，並且沿用現有模式
   延遲呼叫 `onDone`（`target.node === 'mic'` 時這個動作算過關）
5. 點左邊垃圾桶（`onDiscard`）或右上角 `CloseX`（`onClose`）都算取消：
   關閉 `VoiceRecorder`、清掉錄音狀態、回到正常聊天畫面，**不**送出任何
   訊息、**不**觸發過關
6. 頂部工具列的裝飾性圖示（`onTopBarAction`）比照專案既有「這個功能還沒
   做好」中性提示的呈現方式顯示提示（可以沿用 `PhotoViewer` 裝飾按鈕用
   過的同一種提示機制）

`VoiceRecorder` 開啟時取代訊息串顯示區域（`SimTopBar` 頂部列維持顯示，
輸入列先隱藏，跟訊息串同一層互斥），不是疊在訊息串上面的小面板。

**移除**現有跟長按錄音相關、現在用不到的邏輯與畫面：
- `SimInputBar` 麥克風按鈕的 `delayLongPress`／`onLongPress`／
  `onPressOut`／`onPress`（`onTooShort`）——改成單純 `onPress` 呼叫一個
  新的 `onPressMic` callback（開啟 `VoiceRecorder`），保留原本寬鬆的
  `hitSlop`／`pressRetentionOffset`（好按這件事不受影響，只是手勢從長按
  改成點一下）
- `ChatSim.tsx` 裡舊的「錄音中 X 秒　放開就送出」底部橫幅（`st.recording`
  那塊）——`VoiceRecorder` 自己有計時器顯示，這個橫幅不需要了
- `handleTooShort`／「壓著不要放開，講完話再放手」那個 `nudge` 邏輯——
  新手勢沒有「按太短」這個失敗模式，這段邏輯直接刪掉

### 2. `target.node === 'mic'` 的過關判定
過關的觸發點從「長按麥克風放開」改成「在 `VoiceRecorder` 裡按傳送」，見
上面第 1 點第 4 項。錄音本身（開始/停止/傳送/丟棄）在任何課程、任何情境
都要能正常運作，不是只有 `mic` 目標的課程才能用——過關與否只看
`target.node`。

### 3. 語音訊息課程內容修正
`src/content/lessons.ts` 裡的 `voiceMessageLesson`，因為手勢改變，下面
幾處文字需要一起修正（**只改這幾處，其餘內容不動，尤其 messages 對話
內容、`realDevice.steps`、`transfer`/`solo` 的 note 都不用改**）：

```ts
target: { node: 'mic', gesture: 'tap', minMs: 0 },
// 原本是 { node: 'mic', gesture: 'longPress', minMs: 400 }

why: '你不用打字，用講的就好。點麥克風錄音，說完點傳送就送出去了。',
// 原本：'你不用打字，用講的就好。壓著那顆麥克風講話，放開就送出去了。'

// guided 階段的 coach：
coach: '點右下角麥克風，錄一句「我七點到」，說完點藍色傳送鍵送出去',
// 原本：'壓著右下角這顆綠色的，講「我七點到」'

// done.body：
body: '以後想跟誰說話，點麥克風錄音，說完點傳送就好，不用打字。',
// 原本：'以後想跟誰說話，壓著綠色那顆講就好，不用打字。'
```

### 4. 綜合練習題庫內容修正
`src/content/practice.ts` 裡**所有** `kind: 'voiceReply'` 的題目（總共 5
筆），`target` 欄位從：
```ts
target: { node: 'mic', gesture: 'longPress', minMs: 400 },
```
改成：
```ts
target: { node: 'mic', gesture: 'tap', minMs: 0 },
```
其餘欄位（`scenario`、`id`）不要動；`videoTap` 題型的 3 筆不要動。

## Constraints
- 手勢限制：錄音現在是「點一下麥克風」開啟畫面、「點一下紅點」開始、
  「點一下綠色方塊」停止、「點一下紙飛機或垃圾桶」結束，全部是點一下，
  不是長按
- 錯誤路徑一律沿用現有寬容處理，取消錄音（垃圾桶／關閉）不算「答錯」，
  不要顯示任何負面提示
- 顏色：`VoiceRecorder` 版面顏色由另一位 worker 處理（比照截圖），
  聊天畫面本身既有顏色不變
- 完成前必須跑 `npx tsc --noEmit`；**如果另一位 worker 的
  `VoiceRecorder.tsx` 還沒做完，你這裡 `import VoiceRecorder from
  './VoiceRecorder'` 會找不到模組而報錯**，這是預期中的暫時狀態，不用
  因此改變自己的範圍，也不要自己去寫一個暫時版的 `VoiceRecorder.tsx`
- 必須手動重新測過「傳貼圖」「把照片存起來」「看訊息、回訊息」三課的
  整套流程，以及綜合練習裡的視訊題型，確認沒有回歸（這三課不受這次改動
  影響，但 `ChatSim.tsx`／`parts.tsx` 是共用元件，务必重新走一遍）

## Ownership
`src/sim/ChatSim.tsx`、`src/sim/parts.tsx`（僅麥克風按鈕手勢調整）、
`src/content/lessons.ts`（僅 `voiceMessageLesson` 上述幾處）、
`src/content/practice.ts`（僅 5 筆 `voiceReply` 的 `target` 欄位）。
另一位 worker 同時進行 `src/sim/VoiceRecorder.tsx`（新建）／
`src/ui/Icons.tsx`（新增傳送圖示）的改動，兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過（待另一位 worker 完成 `VoiceRecorder.tsx` 後）
- 手動測試（`npx expo start --web`）：
  - 點「淑芬」進「傳語音訊息」課，guided 階段點麥克風開啟錄音畫面，點紅點
    開始、點綠色方塊停止、點紙飛機傳送，正確過關進 solo 階段
  - 點垃圾桶或右上角關閉，正確取消、不送出訊息、不過關，回到聊天畫面
  - 綜合練習隨機抽到 `voiceReply` 題型時，同樣的新錄音流程能正確過關
  - 「傳貼圖」「把照片存起來」「看訊息、回訊息」三課、綜合練習視訊題型，
    整套流程重新走一遍確認沒有回歸

## Completion record
- Date: 2026-09-09
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, not yet committed**
- Worker self-report: also fixed a pre-existing display bug exposed by removing
  the old recording cap — the voice bubble duration was hardcoded as `0:0X`,
  which produced garbled output past 9 seconds; now correctly formatted as
  `mm:ss`
- PM verification: `npx tsc --noEmit` passed after both workers finished;
  changed files match ownership
- PM integration test: full record → stop (timer freezes) → send flow on the
  "淑芬" voice lesson correctly advances guided → solo; discard/close paths
  not separately re-tested by PM but covered by worker's own Playwright run
- Outstanding: not yet committed
