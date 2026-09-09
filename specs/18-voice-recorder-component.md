# Task: 語音錄音全螢幕元件（VoiceRecorder）

## Target
- 新增：`src/sim/VoiceRecorder.tsx`
- 修改：`src/ui/Icons.tsx`（只新增一個「傳送」紙飛機圖示函式，重用既有的
  `Camera`／`Album`／`Smile`／`CloseX`／`Trash`／`Plus`，不要修改這些既有
  圖示）
- **禁止修改**：`src/sim/ChatSim.tsx`、`src/sim/parts.tsx`、
  `src/content/**`、`App.tsx`、`src/shell/**`、`src/engine/types.ts`
  （另一位 worker 同時在把這個元件接進 `ChatSim.tsx`，會 import 你這裡
  做的 `VoiceRecorder`，你不用等他——介面約定已經在這份 spec 定案）

## 參考素材
repo 根目錄有 `voice.png`（尚未開始錄音）跟 `clicked_voice.png`（錄音中），
這是真實 LINE 現在實際的語音錄音畫面（使用者已經對照過真機確認過），這次
版面骨架照這兩張截圖來，不要自己發明排版。

## Change
新增一個接近全螢幕的「語音錄音」畫面 `VoiceRecorder`，純呈現層，只吃
props。這個畫面在使用者點一下輸入列的麥克風圖示後開啟，取代原本的訊息
串顯示區域（`SimTopBar` 頂部列維持不變、輸入列先隱藏），有三種狀態：

### 狀態一：尚未開始錄音（`voice.png`）
- 頂部工具列（比照截圖，由左到右）：`Plus`（＋）、`Camera`、`Album`、
  中間一個灰底的文字輸入框（顯示佔位符「Aa」，純裝飾不用真的能打字）、
  `Smile`、最右邊 `CloseX`（關閉，見下方 callback 說明）
- 中間置中文字：「Tap to record a voice message.」——**這裡要翻譯成
  繁體中文**，例如「點一下開始錄音」（實際文字你可以自己順一下語氣，
  跟 `note`／`coach` 那種安撫語氣一致就好）
- 中間一個大圓：淺灰色圓形外框，正中央一個紅色小圓點。點這個紅點會
  觸發 `onStartRecording`

### 狀態二：錄音中（`clicked_voice.png`）
- 頂部工具列跟狀態一一樣（`CloseX` 這時候一樣可以按，等於取消整段錄音）
- 中間文字換成綠色計時器，格式「00:00」這樣分：秒兩位數，由呼叫端傳入
  已經格式化好的字串（見下方 props，你不用自己算時間）
- 中間大圓變成實心綠色圓形，正中央一個白色小方塊（停止圖示）。點這個
  方塊會觸發 `onStopRecording`
- 大圓左右兩側各多一個較小的圓形按鈕：左邊淺灰底、裡面紅色垃圾桶圖示
  （`Trash`），點下去觸發 `onDiscard`；右邊淺灰底、裡面藍色紙飛機圖示
  （新增的傳送圖示），點下去觸發 `onSend`

### 狀態三：已停止、還沒傳送
- 跟狀態二版面基本一樣，但計時器文字**凍結**在停止當下的秒數（不再跳動），
  中間大圓維持綠色圓形＋白色方塊的樣子（不用另外做動畫或變色，這個狀態
  純粹是「等使用者按左邊垃圾桶丟掉、或右邊紙飛機傳送」），中間大圓本身
  這時候不需要能再點（可以讓它變成不可互動，或維持點了也沒事都可以，
  不算需要特別處理的正確操作路徑）

## 元件介面（照這個寫，不要自己改參數名稱，另一位 worker 會照這個呼叫你）
```ts
export type VoiceRecorderPhase = 'idle' | 'recording' | 'stopped';

export default function VoiceRecorder({
  phase,
  elapsedLabel,
  onStartRecording,
  onStopRecording,
  onDiscard,
  onSend,
  onClose,
  onTopBarAction,
}: {
  phase: VoiceRecorderPhase;
  elapsedLabel: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDiscard: () => void;
  onSend: () => void;
  onClose: () => void;
  onTopBarAction: () => void;
}): React.JSX.Element {
  // ...
}
```
- `phase === 'idle'`：顯示狀態一（紅點圓、提示文字），`elapsedLabel` 這時
  不用顯示
- `phase === 'recording'`：顯示狀態二（綠色方塊圓＋垃圾桶／紙飛機＋
  `elapsedLabel` 當計時器文字）
- `phase === 'stopped'`：顯示狀態三（同狀態二版面，但計時器文字就是
  `elapsedLabel` 本身，呼叫端會傳凍結後的字串進來，你不用判斷要不要跳動）
- 頂部工具列的 `Plus`／`Camera`／`Album`／`Smile` 四顆裝飾性圖示，統一都
  呼叫 `onTopBarAction`（呼叫端會用這個顯示「這個功能還沒做好」之類的
  中性提示，你不用自己顯示提示文字）
- `CloseX` 呼叫 `onClose`（關閉整個錄音畫面，等同放棄，不需要另外呼叫
  `onDiscard`——呼叫端會自己處理清理邏輯）

## Constraints
- `VoiceRecorder.tsx` 是純呈現層，只吃上面定義的 props，不要 import
  `content/lessons`、不要認得「課程」「lesson」這些概念，也不要自己算
  計時器（`elapsedLabel` 由呼叫端算好傳進來）
- 手勢只能點一下，這個畫面不做長按、不做滑動
- 圖示除了新增的「傳送」紙飛機，其餘全部重用 `src/ui/Icons.tsx` 既有的
  `Camera`／`Album`／`Smile`／`CloseX`／`Trash`／`Plus`，不要重複新增
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤（如果因為另一位 worker
  還沒把這個元件接進 `ChatSim.tsx` 而出現「找不到呼叫端」之類的問題，
  那是對方負責的部分，跟你這邊的檔案無關）

## Ownership
`src/sim/VoiceRecorder.tsx`（新建）、`src/ui/Icons.tsx`（只新增傳送圖示）。
另一位 worker 同時進行 `src/sim/ChatSim.tsx`／`src/sim/parts.tsx`／
`src/content/lessons.ts`／`src/content/practice.ts` 的改動，兩邊檔案沒有
重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過（單獨檢查這個新檔案跟新圖示沒有型別錯誤）
- 三種狀態的版面結構比照 `voice.png`／`clicked_voice.png` 的骨架
- 所有 callback 都正確對應到文件裡列的按鈕，不用自己顯示任何提示文字，
  只要正確呼叫 callback 就好

## Completion record
- Date: 2026-09-09
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, not yet committed**
- PM verification: `npx tsc --noEmit` passed; changed files (`VoiceRecorder.tsx`,
  `Icons.tsx`) match ownership, no overlap with the other worker's
  `ChatSim.tsx`/`parts.tsx`/`lessons.ts`/`practice.ts`
- PM integration test: idle state matches `voice.png` almost exactly (top row
  icons, "點一下開始錄音" prompt, gray ring + red dot); recording state matches
  `clicked_voice.png` almost exactly (green circle + white stop square, ticking
  green mm:ss timer, trash left / send right); stop freezes the timer; send
  advances the lesson stage correctly
- Outstanding: not yet committed
