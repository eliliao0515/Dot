# Task: 主頁／路線圖分頁化

## Target
- 新增：`src/shell/HomeScreen.tsx`
- 新增：`src/shell/TabBar.tsx`
- 修改：`src/shell/MapScreen.tsx`（移除問候語／字級切換／接著上次區塊，只保留路線圖 track 與節點列表）
- 修改：`App.tsx`（新增 tab 容器邏輯，決定 home/map 兩個分頁與現有課程 route 的關係）
- **禁止修改**：`src/sim/**`、`src/engine/types.ts`、`src/content/**`、`src/ui/theme.ts` 的顏色常數

## Change
把現有「路線圖」畫面（`MapScreen.tsx`，目前身兼問候語／字級切換／接著上次按鈕／節點列表）拆成兩個分頁：

1. **主頁**（新分頁，`HomeScreen.tsx`）：問候語、字級切換、「接著上次」巨大按鈕。
   「接著上次」按鈕是 CLAUDE.md 的硬性規定，必須留在首頁最上方，讓使用者完全
   不需要操作路線圖也能繼續上課，不可拿掉或移到別的分頁。
2. **路線圖**（沿用現有 `MapScreen.tsx`，瘦身後只剩 track 與節點列表本身）。

底部加一個兩顆按鈕的 Tab bar（首頁／路線圖），點擊切換分頁。點進某一課的
lesson flow（`brief` → `sim` → `realDevice` → `done`）維持現有的全螢幕 route，
蓋在 tab 容器之上；離開該課程流程後回到原本所在的分頁（不是強制跳回主頁或
路線圖）。

App 預設啟動看到的是主頁分頁。

## Constraints
- Tab bar 屬於教學外殼，一律用靛藍 `#1D4E6B` 系統色（`C.indigo` / `C.indigoDark`
  等既有 theme 常數），不可用綠色 `#12B76A`——那是被模擬 App 專屬色，兩者不可混用
- 文字一律走 `src/ui/Scale.tsx` 的 `T` 元件，不要直接用 React Native 原生 `Text`
- 不做遊戲化競爭機制（streak、分數、排行榜、倒數等）；路線圖節點資料
  `MAP_NODES`（在 `src/content/lessons.ts`）不需要也不可修改
- 手勢只能是點一下，不做滑動切頁
- 觸控目標比照現有主要按鈕的寬鬆尺寸慣例（現有主要按鈕最小高度 72px），
  Tab bar 的兩顆按鈕也要好按、不擠壓、間距足夠給手抖的使用者
- 若 Tab bar 需要圖示，一律使用 `src/ui/Icons.tsx` 既有的手繪 `View` 圖示風格，
  不要引入外部圖片或字型 icon 套件（專案刻意零額外相依套件）
- 這是自訂的教學外殼 UI，不是在模擬真實 LINE App 畫面，所以版面配置本身
  （Tab bar 樣式、按鈕排列）worker 可以自行決定合理呈現，不受「AI 不可發明
  操作路徑」規則限制——該規則只限制 `src/sim/**` 對真實 App 的還原正確性
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`src/shell/HomeScreen.tsx`（新建）、`src/shell/TabBar.tsx`（新建）、
`src/shell/MapScreen.tsx`、`App.tsx`。這輪沒有第二個 worker，此任務獨佔以上
所有檔案。

## Observable acceptance
- `npx tsc --noEmit` 通過
- `npx expo start --web` 手動測試：
  - 啟動後預設顯示主頁（問候語＋字級切換＋接著上次大按鈕），底部可見兩顆
    tab 按鈕
  - 點路線圖分頁能看到節點列表（track + nodes），且沒有問候語/字級切換/
    接著上次按鈕
  - 從任一分頁點某一課進入 lesson flow，可以正常跑完 guided → solo →
    transfer → realDevice → done；離開該課程流程後回到原本所在的分頁
  - 字級切換（標準／大字）在主頁仍可正常作用
