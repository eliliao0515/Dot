# Task: 拿掉「開始練習」中介畫面，點聊天室直接進對話

## Target
- 修改：`App.tsx`
- 修改：`src/shell/LessonScreens.tsx`（刪除 `BriefScreen`）
- **禁止修改**：`src/sim/**`、`src/content/**`、`src/engine/types.ts`、
  `src/shell/MapScreen.tsx`、`src/shell/BigButton.tsx`

## Change
真實 LINE 點一個聊天室是直接進對話串，沒有「開始練習」這種中介畫面。這次
要把這層拿掉，讓模擬器更擬真：

- 在 `ChatsListScreen` 點一列可以練習的聊天室（`actionable === true`），
  現在會先進 `BriefScreen`（顯示課程名稱、「為什麼」說明、「聽我念一次」
  按鈕、台語/國語切換、「開始練習」按鈕），按了才進 `ChatSim`。**這次改成
  點下去直接進 `ChatSim`（`guided` 階段，`stageIndex: 0`），跳過
  `BriefScreen`**
- 具體要練習什麼，讓使用者從對話情境本身得知——這件事其實已經在做了：
  `guided` 階段的 `coach` 文字（例如「壓著右下角這顆綠色的，講「我七點到」」）
  本來就會在進入對話後立刻顯示，不需要額外的說明畫面
- `BriefScreen` 裡「聽我念一次」語音預覽按鈕跟台語/國語切換，這次先整個
  拿掉，不用想辦法搬去別的地方——這兩個功能現在也只是 stub（沒有真的接
  音檔），CLAUDE.md 待辦事項第 1 項本來就要重做語音播放這塊，等那時候再
  一起設計要放在哪裡
- `BriefScreen` 這個元件本身**直接刪除**（目前沒有其他地方用到，留著只會
  變成死代碼），連同只有它在用的樣式（`back`／`listen`／`playCircle`／
  `listenT`／`listenS`／`chips`／`chip`／`chipOn`／`chipText`）一併清掉；
  `RealDeviceScreen`／`DoneScreen`共用的樣式（`eyebrow`／`title`／`why`／
  `center`／`footer`／`wrap`／`body` 等）不要動，那两個畫面繼續正常運作
- 順手修一個已知的小 bug：`DoneScreen` 的「回到路線」按鈕文字，其實現在
  按下去是回到聊天列表根頁面（不是路線圖），文字改成「回到聊天列表」跟
  實際行為一致（這是先前 spec 05／06 就留下來的已知落差，這次順便清掉）

`realDevice`／`done` 兩個畫面完全不受影響，課程走完的流程（guided → solo
→ transfer → realDevice → done）不變，只是少了進對話前的那一層。

## Constraints
- 顏色分層不變：拿掉的是外殼層（靛藍）的一個畫面，不要動 `src/sim/**`
  任何東西
- `ChatsListScreen.tsx` 是純呈現層，這次不需要改它——決定「點下去要去哪」
  的邏輯在 `App.tsx`（`onOpenRoom` callback），不是在 `ChatsListScreen`
  本身
- 手勢、既有課程內容（`voiceMessageLesson`／`stickerLesson`／
  `savePhotoLesson`）都不要動
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`App.tsx`、`src/shell/LessonScreens.tsx`。這輪沒有第二個 worker。

## Observable acceptance
- `npx tsc --noEmit` 通過
- `npx expo start --web` 手動測試：
  - 點聊天列表任何一個可練習的聊天室（阿弟/阿美/淑芬），直接進入對話畫面
    （guided 階段），沒有中間的「開始練習」畫面
  - guided 階段的教練提示文字正常顯示
  - 走完整套流程（guided → solo → transfer → realDevice → done），
    `DoneScreen` 按「回到聊天列表」能正確回到聊天列表根頁面，文字跟行為
    一致
  - 「先離開」（`TeachingFrame` 上的離開連結）在 guided/solo/transfer 階段
    仍能正常回到聊天列表

## 完成紀錄
- 日期：2026-09-09
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`App.tsx`、
  `src/shell/LessonScreens.tsx`）與 Ownership 範圍吻合
- PM 實測：點「淑芬」直接進 guided 階段（無中介畫面），coach 提示正常；
  完整跑完 guided → solo → transfer → realDevice → done，`DoneScreen`
  「回到聊天列表」文案正確且能返回聊天列表根頁面
- 懸而未決事項：本次改動尚未 commit；`BriefScreen` 原有的「聽我念一次」／
  台語國語切換功能已整個移除，待 CLAUDE.md 待辦事項第 1 項（真語音播放）
  重新設計時再決定放哪裡
