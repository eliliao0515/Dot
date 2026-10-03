# Task P1：課本首頁、HIG 外殼、舊課搬家

> 狀態：**實作完成，待審（2026-10-04）**　·　前置：`specs/v2/00-overview.md` 已通過
> 一句話：首頁從仿 LINE 聊天列表換成課本目錄（HIG 極簡風）。**所有既有課程的行為一點都不變。**

## Target（範圍）

**新增**
- `src/ui/hig/`：`NavHeader.tsx`、`GroupedList.tsx`（含 `Section`）、`ListRow.tsx`、
  `Buttons.tsx`（`PrimaryButton`／`SecondaryButton`）、`TabBar.tsx`、`Sheet.tsx`、`tokens.ts`
- `src/content/curriculum.ts`：`UNITS`、`LEVELS`
- `src/shell/TextbookHome.tsx`：課本首頁
- `src/shell/MeScreen.tsx`：「我」分頁（頭像、名字、登出）

**修改**
- `src/engine/types.ts`：**只新增** `Unit`、`Level`（`kind` 這一階段只有 `scenario`／`practice`／`comingSoon`），既有型別一個字都不動
- `App.tsx`：根畫面改成 `TabBar`（課本、我）；stack 流程（sim → realDevice → done、practice）保留
- `CLAUDE.md`：套用總藍圖 §10 的修訂

**禁止修改**
- `src/sim/**`：全部不動。`ChatsListScreen`、`BottomTabBar`、`HomeProfileScreen` 這一階段先不再被 `App.tsx` 引用，但**不刪**，P2 沙盒會用到
- `src/content/lessons.ts`、`src/content/practice.ts`：課程內容不動
- `src/storage/**`：進度格式不動（關卡 id 等於 lessonId）
- `src/shell/LessonScreens.tsx`、`PracticeSession.tsx`
- `src/shell/MapScreen.tsx`：目前沒有被引用。**這一階段不刪**，在回報裡列出來，請使用者決定要不要刪

## Change（要交付什麼）

### 1. 課本首頁 `TextbookHome`
由上到下：
1. `NavHeader` 大標題「課本」
2. **「接著上次」主要按鈕**（高度 ≥ 72px），點了直接進 `progress.lastLessonId` 那一課的續做關卡。
   沒有任何進度時，改成「從第一課開始」，指向推薦順序的第一個**可以上的**關卡
3. 每個單元一個 `Section`：標題是單元名稱，footer 放一句說明
   - 單元一「認識符號」、單元二「手勢」：每個關卡都是 `comingSoon`，列表照樣顯示（關卡名稱照總藍圖 §3）
   - 單元三「LINE 情境」：看訊息回訊息、傳貼圖、傳語音訊息、把照片存起來、LINE 綜合練習。
     「接視訊電話」放 `comingSoon`
4. 每一列 `ListRow`：左邊圖示（沿用 `src/ui/Icons.tsx` 裡的通用圖示，靛藍色）、標題、副標，右邊是狀態加 `›`
   - 狀態：沒做過 → 不顯示；做過一部分 → 空心圈；完成 → 打勾。**不顯示數字或百分比**
   - 狀態沿用 `nodeStateFor` 的判斷邏輯
5. 點 `comingSoon` 的列 → 打開 `Sheet`：「這一關還在準備，先去練別的吧。」加一顆「好」按鈕。**不鎖、不顯示紅色**

### 2. 「我」分頁 `MeScreen`
- 頭像（`pictureUrl`，載不到就顯示通用人像圖示）、顯示名稱、`SecondaryButton`「登出」
- 登出行為跟 v1 一樣

### 3. `TabBar`
- 兩個分頁「課本」、「我」，圖示加文字，整條高度 ≥ 64px（不含安全區域）
- 進入全螢幕練習時整條隱藏，退出後回到原本的分頁（沿用 v1 的 stack 行為）

### 4. 設計 token（`src/ui/hig/tokens.ts`）
- 背景 `#F2F2F7`、卡片 `#FFFFFF`、分隔線 hairline `#C6C6C8`
- 強調色沿用 `C.indigo`（`#1D4E6B`），**不可以出現 `chatGreen`**
- 主要文字 `C.ink`；次要文字對比 ≥ 7:1（不可直接用 `#8E8E93`）
- 字型：系統字型（網頁上 `-apple-system, "PingFang TC", "Noto Sans TC", sans-serif`）
- 外殼所有文字一律走 `T systemScaling`，並明確指定 `lineHeight`
- 描邊不用陰影，不用毛玻璃

## Constraints（不可違反的邊界）
- 不鎖關卡，任何一列都可以點（CLAUDE.md「不要做的事」）
- 沒有分數、百分比、streak 或紅色錯誤
- 長輩可用性的規定優先於 HIG（總藍圖 §6.2）：主要按鈕 72px、列表列 64px、圖示一定配文字、不做滑動操作或長按選單
- 靛藍是外殼、綠色是模擬層，不可以混用
- **零額外相依套件**：導航、分頁、sheet 全部自己寫，不裝 react-navigation
- 完成前必須跑 `npx tsc --noEmit` 且無錯誤，`npm run export` 成功

## Observable acceptance（怎麼算做完）
1. `npx tsc --noEmit` 通過；`npm run export` 成功
2. `npx expo start --web` 登入後看到課本首頁，有三個單元
3. **回歸測試**：四課加上綜合練習，從課本點進去，每一課的 guided → solo → transfer → realDevice → done
   流程、紅圈、卡住了、續做位置，都跟 v1 一模一樣
4. 完成一課後回到課本，那一列顯示打勾；做一半的顯示空心圈
5. 「接著上次」會進到正確的課和關卡
6. 點 `comingSoon` 會出現說明，關掉後留在原地
7. 手機寬度（375px）沒有橫向捲動；系統字級調大後外殼文字跟著放大，模擬層不會
8. 回報附上：首頁截圖（一般字級和大字級各一張）、改了哪些檔案、沒刪的舊檔案清單
9. **畫面相關的部分要使用者審核才算完成**，並建議在入門紅米或三星 A 系列實機上看一次
