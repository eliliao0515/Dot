# Task: 語音播放基礎建設

## Target
- 新增：`src/shared/audio/`(播放器元件與 hook)
- 修改（僅新增欄位，不可動既有欄位語意）：`src/engine/types.ts`
- 修改：`src/content/lessons.ts`（僅語音訊息課程的既有 step，接上音檔參照）
- **禁止修改**：`src/sim/parts.tsx`、`src/sim/ChatSim.tsx` 以外的 sim 檔案；
  `src/shell/**`；`App.tsx`

## Change
「聽我念一次」從純文字狀態切換，改為真的播放一段音檔。國語／台語各一軌，
字幕預設開啟可關閉，語速可調（0.75x / 1x）。音檔用專案內建的假音檔佔位
（本任務不含真人錄音，錄音是另外的內容產製工作，不在 agent 範圍內）。

## Constraints
- `src/sim/**` 是純呈現層，只吃 props，完全不知道「課程」存在——播放器的
  播放/暫停/進度狀態要由呼叫端（ChatSim 的容器邏輯）管理，不可在 sim 元件
  內部藏課程邏輯
- 音檔參照、字幕文字、語速選項一律放在 `engine/types.ts` 新增的資料欄位裡，
  不要寫死在元件或 `if` 判斷裡
- 教學外殼靛藍 `#1D4E6B` / 模擬 App 綠色 `#12B76A` 不可混用
- 播放按鈕若疊加在既有的模擬畫面上（例如語音訊息氣泡上的播放鍵），其**位置、
  大小、樣式必須先參照真實 LINE App 截圖**，不可自行設計新版面——這點必須
  在完成後送 Decision Gate 由人核准，不能自行判定「完成」
- 完成前跑 `npx tsc --noEmit`，不可有錯誤

## Ownership
`src/shared/audio/**`（新建）、`src/engine/types.ts`（僅新增欄位）、
`src/content/lessons.ts`（僅語音訊息課程段落）

## Observable acceptance
- `npx tsc --noEmit` 通過
- `npx expo start --web` 下，語音訊息課程的「聽我念一次」按下去有聲音、
  有字幕、能切換國語／台語、能調語速
- 播放鍵在畫面上的位置/樣式已提交 Decision Gate，附上與真實 LINE 截圖的比對
