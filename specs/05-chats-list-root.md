# Task: LINE 聊天列表作為 App 根頁面

## Target
- 新增：`src/sim/ChatsListScreen.tsx`（純呈現層，被模擬 App 的「聊天」分頁）
- 新增圖示：延伸 `src/ui/Icons.tsx`（搜尋放大鏡、＋號、相簿、日曆、聊天邀請小圖示、
  圖釘徽章、底部 5 個分頁用的 Home／Chats／Discover／月亮／錢包圖示）——只新增
  函式，不要修改既有圖示的簽名或畫法
- 修改：`src/engine/types.ts`（只新增一個型別，例如 `ChatRoomPreview`，不要動
  既有的 `Lesson`／`MapNode`／`Bubble`／`Stage` 等型別定義）
- 修改：`src/content/lessons.ts`（新增一個匯出陣列，例如 `CHAT_ROOMS`，資料來源
  沿用現有 6 個技能項目；**不要修改** `MAP_NODES`、`LESSONS`、
  `voiceMessageLesson` 既有內容）
- 修改：`App.tsx`（根路由從無换成 `ChatsListScreen`，串接既有的
  brief → sim → realDevice → done 課程流程）
- **禁止修改**：`src/shell/MapScreen.tsx`、`src/sim/ChatSim.tsx`、
  `src/sim/parts.tsx`、`src/shell/LessonScreens.tsx`、`src/shell/BigButton.tsx`、
  `src/ui/Scale.tsx`。`MapScreen.tsx` 這輪不接進任何路由，但檔案本身保留、
  不要刪除，之後會再排怎麼接回來

## Change
App 打開後看到的根頁面，換成一個像真實 LINE「聊天」分頁的畫面（`ChatsListScreen`），
版面結構依照 repo 根目錄的 `line_chats.png` 截圖：

- 頂部「聊天／好友」分頁切換（好友分頁只是外觀，點下去顯示「尚未開放」提示）
- 頂部小圖示列（相簿／日曆／聊天邀請／＋號），先做外觀，點下去顯示「尚未開放」提示
- 搜尋列（外觀即可，非必要做真的搜尋功能）
- 聊天室列表：**每一列對應現有 6 個技能項目**（看訊息、傳貼圖、傳語音訊息、
  跟孫子視訊、把照片存起來、認出假訊息），用假聯絡人頭像（手繪，不用真人照片）、
  聊天室名稱、最後一則訊息預覽、時間標籤呈現，樣式參考截圖但**內容全部換成
  假聯絡人**，不可沿用截圖裡真實使用者的照片或名字
- 目前唯一做好內容的「傳語音訊息」那一列，要有明顯的「現在」視覺強調
  （粗體標題＋未讀樣式，例如小圓點或數字徽章），取代原本已經拿掉的
  「接著上次」大按鈕；強調邏輯直接沿用 `MAP_NODES` 現有 `state === 'now'`
  這個既有欄位，點下去照舊進入 `BriefScreen → ChatSim` 的四階段教學流程
  （guided/solo/transfer/realDevice → done），流程本身完全不變
- 其餘還沒做內容的技能列，點下去顯示中性提示（沿用現有 `MapScreen.tsx`
  「這一課還沒做好」那種語氣的文字，不鎖住、不用紅色錯誤樣式）
- 底部 5 個分頁（Home／Chats／Discover／Today／Wallet），依照截圖的圖示與文字
  位置排版；只有「Chats」是目前這一頁本身（視覺上顯示為選中狀態），其餘 4 個
  點下去顯示「尚未開放」提示
- 課程流程結束（`DoneScreen` 的返回／分享）或中途「先離開」都回到這個聊天列表
  根頁面

## Constraints
- **顏色分層**：這是被模擬的 App，一律用專案既有綠色系（`C.chatGreen` 等），
  不可用教學外殼的靛藍 `C.indigo`／`C.indigoDark`
- **一律用亮色**，跟現有「傳語音訊息」那一課的 sim 畫面一致（`C.paper`／
  `C.chatBg` 那個色階），不要抄 `line_chats.png` 的暗色主題——那張截圖只是
  版面結構參考，不是配色參考
- `src/sim/**` 必須維持純呈現層，只吃 props，完全不能認得「課程」「lesson」
  這些概念——哪一列可以點、哪一列顯示提示，由 `App.tsx` 透過 props 決定，
  不要在 `ChatsListScreen.tsx` 內部 import `content/lessons.ts` 或 `LESSONS`
- 圖示一律延伸 `src/ui/Icons.tsx` 既有的手繪 `View` 風格，不引入外部圖片、
  icon 套件、emoji、或截圖裡的真實頭像／LINE 官方素材
- 手勢只能點一下，這一頁不做滑動或長按
- 完成前必須跑 `npx tsc --noEmit`，不可有錯誤
- 這是全新畫面的版面配置，已提供 `line_chats.png` 當結構參考（分頁切換、
  搜尋列、列表列的頭像/標題/預覽/時間排法、底部 5 個分頁位置），架構跟著
  截圖走，但顏色改亮色、內容全部換假聯絡人；截圖沒交代清楚的細節（例如
  精確間距、字級數值）可以合理判斷不必每個都問，但整體排版骨架不要自己
  重新發明

## Ownership
`src/sim/ChatsListScreen.tsx`（新建）、`src/ui/Icons.tsx`（只新增）、
`src/engine/types.ts`（只新增型別）、`src/content/lessons.ts`（只新增
`CHAT_ROOMS`）、`App.tsx`。這輪沒有第二個 worker，此任務獨佔以上所有檔案。

## Observable acceptance
- `npx tsc --noEmit` 通過
- `npx expo start --web` 手動測試：
  - 啟動後直接看到聊天列表根頁面，6 個技能列都在，樣式跟截圖版面結構一致
    但是亮色、假聯絡人
  - 「傳語音訊息」那一列有明顯的「現在」強調樣式，點下去能正常跑完
    guided → solo → transfer → realDevice → done 整套流程，結束後回到
    聊天列表
  - 其餘技能列點下去顯示中性提示文字，不會卡住或跳錯畫面
  - 頂部「好友」分頁、頂部小圖示列、底部 Home／Discover／Today／Wallet
    四個分頁，點下去都顯示「尚未開放」提示
  - `src/shell/MapScreen.tsx` 檔案還在，但沒有被任何地方 import

## 完成紀錄
- 日期：2026-09-07
- 執行者：worker1（既有 Claude Code terminal，直接在 main worktree 工作，
  未走獨立分支）
- 狀態：**功能完成，尚未 commit**。改動仍是 main 工作目錄裡的未提交變更
  （`git status` 顯示 `App.tsx`／`src/content/lessons.ts`／`src/engine/types.ts`／
  `src/ui/Icons.tsx` modified、`src/sim/ChatsListScreen.tsx` 新增），基準
  commit 為 `67145e5`（新增 /pm skill）
- PM 驗收：`npx tsc --noEmit` 通過；改動檔案與 Ownership 範圍完全吻合；
  `src/sim/**` 純呈現層規則沒被違反（`ChatsListScreen.tsx` 不 import
  `content/lessons`）；`npx expo start --web` 手動點擊驗證：根頁面正確顯示
  6 個假聯絡人列、「傳語音訊息」列（現在強調樣式）可正常跑完四階段教學
  流程並返回列表、未開放列與其他 4 個底部分頁點下去正確顯示中性提示、
  `MapScreen.tsx` 保留未被引用
- 懸而未決事項：
  1. `src/shell/LessonScreens.tsx` 的 `BriefScreen`「回到路線」文字沒有更新
     （這輪 Ownership 明確排除這個檔案），現在按下去其實是回到聊天列表、
     不是路線圖，文字語意有落差，之後排進小修
  2. 這次改動尚未經過實機測試（紅米／三星 A 系列），只在模擬器/瀏覽器
     驗證過版面，按照 CLAUDE.md 規定不能只憑模擬器驗證宣稱完成
  3. `src/shell/MapScreen.tsx`（教學路線圖）這輪確定不接，之後要不要接回來、
     怎麼接（例如放進 Home 分頁）還沒排定
  4. 改動尚未 commit，等使用者確認後再決定怎麼收尾
