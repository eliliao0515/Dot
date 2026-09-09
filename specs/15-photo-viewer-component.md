# Task: 全螢幕看照片元件（PhotoViewer）

## Target
- 新增：`src/sim/PhotoViewer.tsx`
- 修改：`src/ui/Icons.tsx`（只新增圖示函式，不要修改既有任何圖示）
- **禁止修改**：`src/sim/ChatSim.tsx`、`src/sim/parts.tsx`、
  `src/content/**`、`App.tsx`、`src/shell/**`、`src/engine/types.ts`
  （另一位 worker 同時在把這個元件接進 `ChatSim.tsx`，會 import 你這裡
  做的 `PhotoViewer`，你不用等他，也不用管他怎麼呼叫——介面約定已經在
  這份 spec 定案）

## 參考素材
repo 根目錄有 `照片編輯.png`，是真實 LINE 點開一張照片後的「全螢幕看照片」
畫面截圖，這次的版面骨架照這張截圖來，不要自己發明排版。截圖裡「知螢」是
截圖來源本人手機上的真實聯絡人名字，**不要沿用**，畫面上的聯絡人名字／
照片內容一律用呼叫端傳進來的 props，不要寫死。

## Change
新增一個全螢幕的「看照片」畫面 `PhotoViewer`，純呈現層，只吃 props：

- **背景**：黑色（這是照片檢視器，不是聊天畫面，不用綠色也不用靛藍外殼色，
  比照截圖用黑底白字）
- **頂部列**：
  - 左邊：關閉（X）按鈕
  - 中間：聯絡人名字（粗體）＋下面一行小字的日期時間
  - 右邊：兩個裝飾性圖示（掃描文字圖示、縮圖網格圖示）——這兩個先不用
    做任何功能，點下去顯示中性的「這個功能還沒做好」提示就好，重點是
    版面骨架跟截圖一致
- **中間**：照片內容本身（沿用現有 `label` 文字＋色塊風格即可，不用做
  真的圖片，維持專案「零圖片素材、用色塊＋文字」的既有做法）
- **底部工具列（兩排，比照截圖）**：
  - 上排：左邊一個表情符號/微笑圖示（`onDraw`／反應功能先做外觀，點下去
    顯示中性提示）、右邊一個畫筆圖示（`onDraw`，同樣先做外觀＋中性提示）
  - 下排：三個等距排列的圖示——垃圾桶（`onTrash`，中性提示）、分享
    （方塊＋往上箭頭，`onShare`，中性提示）、下載（方塊/托盤＋往下箭頭，
    `onDownload`，**這顆是真正有功能的，呼叫端會傳真正的存檔邏輯進來**）

## 元件介面（照這個寫，不要自己改參數名稱，另一位 worker 會照這個呼叫你）
```ts
export default function PhotoViewer({
  photoLabel,
  contactName,
  timestamp,
  onClose,
  onDownload,
  onTrash,
  onShare,
  onDraw,
}: {
  photoLabel: string;
  contactName: string;
  timestamp: string;
  onClose: () => void;
  onDownload: () => void;
  onTrash: () => void;
  onShare: () => void;
  onDraw: () => void;
}): React.JSX.Element {
  // ...
}
```
不需要額外的 `visible` prop——呼叫端會自己決定要不要渲染這個元件（要顯示
就整個元件掛上去，不顯示就不渲染），你只要把上面這些 props 都吃進去、
正確渲染畫面跟呼叫對應的 callback 就好。

## 新增圖示（`src/ui/Icons.tsx`，只新增，不要動既有任何圖示）
比照現有手繪 `View` 風格新增以下函式（名稱你可以自己取，只要語意清楚）：
- 關閉（X，兩條交叉線）
- 掃描/取文字（簡單的四角取景框造型即可）
- 縮圖網格（2x2 或 3x3 小方塊）
- 畫筆/繪圖（一支簡單的筆，**不要做成彩色漸層圓圈**——那是真實 LINE 的
  樣式，這裡刻意不模仿真實 App 的視覺識別，用單色簡筆畫就好）
- 垃圾桶（桶身＋蓋子的簡單造型）
- 分享（方塊＋往上的箭頭）
- 下載（方塊或托盤＋往下的箭頭）
- 表情符號/微笑（如果 `src/ui/Icons.tsx` 已經有笑臉圖示可以直接重用，不用
  重複新增）

## Constraints
- `PhotoViewer.tsx` 是純呈現層，只吃上面定義的 props，不要 import
  `content/lessons`、不要認得「課程」「lesson」這些概念
- 手勢只能點一下，這個畫面不做滑動換照片、不做捏合縮放
- 圖示一律延伸 `src/ui/Icons.tsx` 既有的手繪 `View` 風格，不引入外部圖片、
  icon 套件、emoji、或截圖裡的真實素材
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤（如果因為另一位 worker
  還沒把這個元件接進 `ChatSim.tsx` 而出現「找不到呼叫端」之類的問題，
  那是對方負責的部分，跟你這邊的檔案無關，你只要確認自己這個新檔案本身
  型別正確）

## Ownership
`src/sim/PhotoViewer.tsx`（新建）、`src/ui/Icons.tsx`（只新增）。另一位
worker 同時進行 `src/sim/ChatSim.tsx`／`src/sim/parts.tsx`／
`src/content/lessons.ts` 的改動，兩邊檔案沒有重疊。

## Observable acceptance
- `npx tsc --noEmit` 通過（單獨檢查這個新檔案沒有型別錯誤）
- 版面結構（頂部列、中間照片、底部兩排工具列）比照 `照片編輯.png` 的骨架
- 所有裝飾性按鈕（掃描/網格/表情/畫筆/垃圾桶/分享）點下去都會呼叫對應的
  callback，由呼叫端決定要不要顯示提示——你不用自己顯示提示文字，只要
  正確呼叫 callback 就好

## 完成紀錄
- 日期：2026-09-09
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- worker 自報：spec 定案的 props 只有 onClose/onDownload/onTrash/onShare/
  onDraw，沒有涵蓋掃描／縮圖網格兩顆裝飾鍵，worker 因此讓這兩顆自己顯示
  中性提示（沒有對外暴露 callback）——這是 spec 遺漏的小缺口，不影響功能，
  之後如果要讓這兩顆也走統一的呼叫端提示機制可以再補
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`PhotoViewer.tsx`／
  `Icons.tsx`）與 Ownership 範圍吻合，跟另一位 worker 的
  `ChatSim.tsx`／`parts.tsx`／`lessons.ts` 沒有交集
- PM 整合測試：見 spec 16 完成紀錄（兩邊是同一次整合測試一起做的）
- 懸而未決事項：本次改動尚未 commit；掃描／縮圖網格兩顆按鈕沒有走統一的
  callback 機制（見上）
