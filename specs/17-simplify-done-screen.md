# Task: 簡化完成畫面，打勾圖示加掉落閃爍動畫

## Target
- 修改：`src/shell/LessonScreens.tsx`（只改 `DoneScreen`，`RealDeviceScreen`
  不要動）
- 修改：`App.tsx`（`DoneScreen` 呼叫端的 props 對應調整，見下方）
- **禁止修改**：`src/sim/**`、`src/content/**`、`src/engine/types.ts`、
  `src/shell/MapScreen.tsx`、`src/shell/BigButton.tsx`

## Change

### 1. 畫面內容簡化
`DoneScreen` 目前有：打勾圖示、標題、副標題、一張「要不要告訴 OO」的分享
卡片、底下兩顆按鈕（「告訴 OO」／「回到聊天列表」）。這次簡化成：**只留
打勾圖示、標題、副標題**，拿掉分享卡片跟原本兩顆按鈕，改成**底下新增一顆
「繼續」按鈕**。

`App.tsx` 目前呼叫 `DoneScreen` 時 `onShare` 跟 `onBack` 這兩個 callback
做的事完全一樣（都是 `() => setRoute({ name: 'chats' })`），所以簡化後
`DoneScreen` 的 prop 介面改成單一一個 `onContinue: () => void`，「繼續」
按鈕就接這個 callback；`App.tsx` 呼叫端對應改成只傳一個 `onContinue`。

### 2. 打勾圖示加動畫：掉下來＋閃爍
打勾圖示（現有 `seal` 那個靛藍圓形＋白色打勾）現在是完全靜態的，這次加一個
一次性的進場動畫：
- **掉下來**：畫面出現時，圖示從上方（例如往上偏移 60-80px、透明度 0）
  往下掉到定位（偏移歸零、透明度變 1），動作自然一點（ease-out 或輕微
  彈跳感都可以，你自己抓手感）
- **閃爍**：掉到定位之後，做一個簡短的「閃一下」效果（例如圖示或圖示外圈
  的透明度快速明暗兩三下、或是短暫的光暈脈動，呈現一種「完成了、慶祝一下」
  的感覽，不用做得很花俏）
- 動畫只播一次（不是無限循環），整體長度抓 1~1.5 秒內，不要讓使用者覺得
  卡住或要等它播完才能操作——「繼續」按鈕從畫面一出現就要能立刻按，不要
  被動畫擋住或延遲啟用
- **務必比照 `src/sim/ChatSim.tsx` 裡 `GuideRing` 元件既有的做法**，用
  `AccessibilityInfo.isReduceMotionEnabled()` 檢查，如果使用者開了「減少
  動態效果」，直接顯示打勾圖示的最終靜止狀態，不要播放掉落／閃爍動畫

### 3. 清理
拿掉分享卡片後，只有它在用的樣式（`share`／`shareT`／`shareB`）一併刪除；
`title`／`why`／`center`／`wrap`／`body`／`footer`／`seal` 這些跟
`RealDeviceScreen` 共用或本來就會繼續用到的樣式不要動。

## Constraints
- 顏色不變：這是教學外殼畫面，維持 `C.indigo`／`C.paper` 既有配色，不要
  改色
- 動畫必須尊重 `AccessibilityInfo.isReduceMotionEnabled()`（見上）
- 手勢不變，這個畫面本來就沒有特殊手勢
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`src/shell/LessonScreens.tsx`、`App.tsx`。這輪沒有第二個 worker。

## Observable acceptance
- `npx tsc --noEmit` 通過
- `npx expo start --web` 手動測試：
  - 走完任一課（例如語音訊息課）到 `DoneScreen`，畫面只看到打勾圖示、
    標題、副標題、「繼續」按鈕，沒有分享卡片、沒有另外兩顆舊按鈕
  - 打勾圖示有掉落＋閃爍的進場動畫，播放一次就停止
  - 動畫播放中「繼續」按鈕就能點，點下去正確回到聊天列表
  - （如果方便測）瀏覽器/系統開啟「減少動態效果」時，打勾圖示直接顯示
    最終狀態，沒有動畫

## 完成紀錄
- 日期：2026-09-09
- 執行者：worker（既有 Claude Code terminal，直接在 main worktree 工作）
- 狀態：**功能完成，尚未 commit**
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案（`App.tsx`／
  `src/shell/LessonScreens.tsx`）與 Ownership 範圍吻合
- PM 實測：走完「傳貼圖」課整套流程到 `DoneScreen`，畫面只剩打勾圖示、
  標題、副標題、單一「繼續」按鈕，沒有分享卡片跟舊的兩顆按鈕；點「繼續」
  正確回到聊天列表根頁面
- 懸而未決事項：本次改動尚未 commit；動畫視覺效果（掉落＋閃爍）跟「減少
  動態效果」開關的實際表現，截圖看不出動態過程，未逐格驗證，僅確認最終
  靜止狀態正確且不阻擋操作
