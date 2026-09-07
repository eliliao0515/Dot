# Task Spec 模板

> 每個丟給 orca worker 的任務都先寫一份這個檔案,存進 `specs/`,再把內容貼進
> `orca orchestration task-create --spec "..."`。規格先寫、審過、才派工——這是
> SDD 的核心,不要讓 agent 自己臨場決定範圍。

## Target(範圍)
- 允許修改的檔案/目錄(白名單,越窄越好)
- 明確排除的檔案(尤其是 `src/sim/**` 若本任務不該碰畫面呈現)

## Change(要交付什麼)
- 一句話講清楚做完長什麼樣子
- 不是「改善 X」這種模糊詞,要是可驗收的具體行為

## Constraints(不可違反的邊界)
固定引用 `CLAUDE.md` 裡跟這個任務相關的條款,不要讓 worker 重新發明,例如:
- `src/sim/**` 是純呈現層,只吃 props,不可得知「課程」存在
- 畫面/狀態/轉場一律走 `engine/` 的宣告式資料,不寫死在元件裡
- 教學外殼用靛藍 `#1D4E6B`,被模擬的 App 用綠色 `#12B76A`,不可混用
- 不做遊戲化競爭機制(streak、分數、排行榜等)——見 CLAUDE.md「不要做的事」
- AI 界線:**不可自行發明或變更 UI 佈局、按鈕位置、畫面轉場、或「正確操作路徑」**。
  這些必須人工編寫並對照真實 LINE App 驗證。若任務涉及這些,worker 只能提出
  「建議的腳本骨架」,實際正確路徑等待 Decision Gate 由人核准。
- 完成前必須跑 `npx tsc --noEmit` 且無錯誤

## Ownership(誰能動哪些檔案)
- 明確列出這個 worker 獨佔的檔案清單,跟其他同時派工的 task 不重疊

## Observable acceptance(怎麼算做完)
- 可執行的驗收條件,例如:「`npx tsc --noEmit` 通過」「新增的 XX 元件在
  `npx expo start --web` 下手動點擊可以看到 YY」
- 若牽涉畫面或操作路徑正確性:「需求人工在 Decision Gate 確認後才算完成,
  不得自行判定完成」
