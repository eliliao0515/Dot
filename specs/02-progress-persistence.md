# Task: 進度持久化（AsyncStorage）

## Target
- 新增：`src/state/progress.ts`（讀寫進度的唯一入口）
- 修改：`App.tsx`（掛載時讀取、階段完成時寫入）
- 修改：`src/shell/MapScreen.tsx`（顯示已完成的勾勾／路徑變色，讀已存進度）
- **禁止修改**：`src/sim/**`、`src/engine/types.ts`、`src/content/**`

## Change
關掉 App 重開後，地圖上已完成的課程/階段（guided/solo/transfer/realDevice）
勾勾與路徑變色狀態要能還原，「接著上次」按鈕要指回正確的下一步。

## Constraints
- 只用 `AsyncStorage`，不要引入任何新的第三方套件（專案刻意零額外相依）
- 對外只暴露一組簡單介面，例如
  `getProgress()` / `setStageComplete(lessonId, stage)` / `getLastPosition()`，
  其他任務（例如字級選擇）會需要用同一個模組存偏好設定，介面要單純到能被
  另一個不知道實作細節的 worker 直接呼叫
- 不做任何進度可視化以外的機制——不加分數、不加天數 streak、不加百分比
  （CLAUDE.md「不要做的事」）
- 完成前跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`src/state/progress.ts`（新建）、`App.tsx`、`src/shell/MapScreen.tsx`

## Observable acceptance
- `npx tsc --noEmit` 通過
- 手動測試：完成一關 → 關閉 web/App 重開 → 地圖勾勾與「接著上次」都還原正確
