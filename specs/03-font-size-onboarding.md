# Task: 首次啟動字級選擇流程

## Target
- 新增：`src/shell/FontSizeOnboarding.tsx`
- 修改：`src/ui/Scale.tsx`（讀取使用者選擇的初始字級參數）
- 修改：`App.tsx`（首次啟動時插入這個畫面，之後略過）
- **禁止修改**：`src/sim/**`、`src/engine/types.ts`、`src/content/**`

## Change
App 第一次啟動時，用一個外殼層（靛藍）畫面讓使用者選字級大小（例如三個
預覽等級：標準／大／特大），選完寫入偏好、套用到 `useScale()`，之後啟動
直接略過這個畫面。

## Constraints
- 這是外殼層（教學介面），要用靛藍 `#1D4E6B`，不可用綠色
- 文字一律用 `src/ui/Scale.tsx` 的 `T` 元件，不要直接用 `Text`
- 依賴 `src/state/progress.ts` 提供的存取介面來存「使用者已完成字級選擇」
  這個旗標與選定的字級值（介面規格見 `specs/02-progress-persistence.md`，
  若對方尚未完成，先寫死一個符合同樣函式簽名的本地 stub，之後合併時對齊）
- 不可觸碰模擬層（`src/sim/**`）的字級邏輯——那邊是雙層字級策略裡刻意固定、
  不隨系統縮放的部分，不要因為這個任務去動它
- 完成前跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`src/shell/FontSizeOnboarding.tsx`（新建）、`src/ui/Scale.tsx`、`App.tsx`

## Observable acceptance
- `npx tsc --noEmit` 通過
- 手動測試：清掉本地儲存後首次啟動會看到選字級畫面，選完套用，重啟後不再出現
