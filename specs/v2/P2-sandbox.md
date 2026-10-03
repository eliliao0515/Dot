# Task P2：拆開 ChatSim、開發者判定、我的沙盒

> 狀態：**實作完成，待審（2026-10-04）**　·　前置：P1 已通過（2026-10-04）
> 一句話：只有開發者帳號登入時，課本首頁最上方會多一個「我的沙盒」，點進去是一個完整、沒有題目的 LINE 模擬器。
> 為了做到這件事，先把 `ChatSim` 拆成「純 LINE 畫面」和「教學疊層」兩層。

## Target（範圍）

**新增**
- `src/sim/LineChatScreen.tsx`：純 LINE 聊天室畫面，只吃 props，不知道課程存在
- `src/shell/ScenarioRunner.tsx`：教學疊層（紅圈、引導條、底部說明、卡住了、成功提示、過關判定），取代 `ChatSim`
- `src/shell/SandboxScreen.tsx`：沙盒外殼（靛藍外框「沙盒模式」＋返回）＋ LINE 聊天列表／分頁列／聊天室
- `src/content/sandbox.ts`：沙盒的假聯絡人和開場訊息（純情境內容）
- `src/auth/devAccess.ts`：開發者判定（userId 的 SHA-256 比對）

**修改**
- `src/sim/parts.tsx`：`SimTopBar` 加上可選的 `onPressBack`（沒給就跟原本一樣當作按錯）
- `App.tsx`：改用 `ScenarioRunner`；新增 `sandbox` stack；開發者判定；`?debug=1` 顯示自己的雜湊值
- `src/shell/TextbookHome.tsx`：可選的 `sandbox` 區塊
- `src/shell/PracticeSession.tsx`：改用 `ScenarioRunner`；把「回到聊天列表」改成「回到課本」（P1 遺留）
- `.github/workflows/deploy.yml`：打包時注入 `EXPO_PUBLIC_DEV_USER_HASHES`
- `.gitignore`：加 `.env*.local`

**刪除**
- `src/sim/ChatSim.tsx`：已被 `LineChatScreen` 和 `ScenarioRunner` 取代

**禁止修改**：課程內容（`lessons.ts`、`practice.ts`）、`storage/**`、`ui/hig/**`

## Change（要交付什麼）

### 1. 拆層
- `LineChatScreen` 自己負責 LINE 畫面裡的互動狀態，包括面板、錄音、播放、看照片、已讀、草稿。
  使用者的每個操作透過 `onAction` 回報給外層，例如送出語音、按視訊、送出貼圖、存照片、點現成回覆、送出文字、按到別處、按到還沒做好的按鈕
- 外層傳 `incoming`（目前應該出現的對方訊息）。LineChatScreen 依訊息 id 把**新的**接到對話串後面，
  保留 v1「三關是同一段連續對話」的行為
- 外層換關時傳新的 `resetKey`，LineChatScreen 重置介面狀態，但對話內容不清掉
- 教學元素透過插槽放進畫面，**位置要跟 v1 一模一樣**：
  `threadOverlay`（卡住了）、`aboveInputBar`（引導條／說明，面板打開時不顯示）、`chatOverlay`（紅圈）、`screenOverlay`（成功提示、中性提示）
- 「現成回覆」是 LINE 真的有的功能，由 prop `quickReplies` 開關

### 2. 開發者判定
- 建置時讀 `EXPO_PUBLIC_DEV_USER_HASHES`（逗號分隔的 SHA-256 十六進位字串），**不放原始 userId**
- 執行時用 `crypto.subtle` 算出登入者 userId 的雜湊再比對；算不出來（沒有 `crypto.subtle`）就當作不是開發者
- **這不是安全邊界**，程式碼註解要寫清楚：沙盒裡沒有秘密
- `?debug=1` 的除錯列顯示目前登入者的雜湊值，讓使用者自己複製去設定 GitHub Secret
- 本機測試：`.env.local`（不進 git）放 `dev-local` 的雜湊；`?devlogin=1` 是開發者，`?devlogin=guest` 不是

### 3. 我的沙盒
- 只有開發者會在課本首頁最上方看到一個 `Section`「我的沙盒」，裡面一列「LINE 自由操作」
- 點進去：最上方是靛藍外框「沙盒模式」＋返回箭頭；下面是 LINE 聊天列表加五個分頁
- 點聊天室進入 `LineChatScreen`：開場訊息、現成回覆、貼圖、語音、照片、聯絡人、打字、看大圖、存照片全部都能用。
  **沒有紅圈、沒有引導條、沒有卡住了、沒有過關判定、不寫進度**
- 聊天室左上角返回 → 回到聊天列表（這是真 LINE 的行為）
- 還沒做好的按鈕（視訊、Discover 等分頁、看照片裡的畫筆等）→ 中性提示「這個功能還沒做好。」
- Home 分頁顯示 `HomeProfileScreen`（沿用），但不放登出按鈕的實際作用，按了給中性提示

### 4. 使用者在 P2 期間追加的三項更新（2026-10-04）
1. **拿掉課程最上方「練習 1 / 3　帶著做」整行**（綜合練習的「第 1 題．共 5 題」也一起拿掉）。
   關卡進度和類型讓使用者在做題中感受：帶著做有引導條和紅圈，自己做只有「卡住了」，換情境什麼提示都沒有。
   離開練習改用 LINE 畫面左上角的返回鍵（跟真手機一樣：按返回就離開這個聊天室）
2. **拿掉「好／謝謝／知道了／等一下」現成回覆**，讓使用者自己打字。
   「看訊息、回訊息」課改成「在輸入框打字送出」才過關；帶著做關卡的紅圈改圈在輸入框上。
   這一課的引導文字、真手機步驟、完成文字跟著改寫 —— **是草稿，要使用者審過**
3. **點輸入框跳出手機鍵盤，App 畫面貼齊鍵盤頂部**，瀏覽器、加到主畫面、LINE 內建瀏覽器都一樣：
   - `public/index.html`：自訂 HTML 範本。禁止縮放（也避免 iOS 點輸入框自動放大）、
     `interactive-widget=resizes-visual` 讓 Android 跟 iOS 行為一致、body 釘死不能捲也不能回彈
   - `src/ui/KeyboardViewport.web.tsx`：跟著 `window.visualViewport` 調整 App 的高度和位置
   - 聊天紀錄在畫面變矮時自動捲到最新一則

### 5. 第二輪追加（2026-10-04）
1. **沙盒頂部「沙盒模式」那一行整個拿掉**，畫面全部是模擬層。離開沙盒改用 LINE Home 分頁裡的按鈕（在沙盒裡寫「離開沙盒」）
2. **語音錄音不再是全螢幕**：改成從輸入列位置往上長出來的面板，高度只比中間圓鈕多一點，聊天紀錄照樣看得到（照 voice.png／clicked_voice.png）。
   停止錄音後，中間圓鈕變成「細細的綠色外框＋綠色播放鍵」，點了可以試聽（沒有真的聲音），試聽中變暫停鍵。
   右邊的傳送鍵加上紙飛機切口，跟播放鍵分得出來
3. **輸入列改成由左到右：＋、相機、照片、輸入框、貼圖、麥克風**，相機和照片不帶文字。＋選單裡只剩「聯絡人」，假的照片挑選器刪除
4. **照片鍵**打開手機系統的相簿，選好的照片直接傳到聊天室。
   iPhone 的網頁一定會先跳「照片圖庫／拍照／選擇檔案」三選一，這是 iOS 對網頁的限制，程式無法跳過；Android 會直接打開相簿
5. **相機鍵**直接打開手機系統相機，拍完進入預覽畫面（黑底、左上角關閉、右下角白底圓形藍色箭頭送出），按送出才傳到聊天室

### 6. 第三輪追加（2026-10-04）
1. **錄音面板開始錄音前後高度一致**：「點一下開始錄音」和計時數字共用固定高度的一行，按下錄音面板不會往上撐
2. **輸入列尺寸照真 LINE 截圖重量**（iPhone 390pt 寬、標準字級）：左邊界 14、＋／相機／照片各 20 寬、
   間距 17.5／20.5／19、輸入框高 34、笑臉移進輸入框右側、麥克風改成線條圖示（沒有綠色圓底）、右邊界 18。
   全部跟著字級等比例縮放，數字集中在 `src/sim/parts.tsx` 的 `inputBarMetrics()`。
   錄音面板頂部、教學紅圈都用同一組數字，改一處全部跟著動。
   麥克風畫面上的圖示照真 LINE，觸控範圍仍保留 hitSlop 14 + pressRetentionOffset 60

照片和相機的內容只存在這支手機的記憶體裡（blob: 網址），**不會上傳到任何伺服器**，關掉頁面就消失。

## Constraints
- `src/sim/**` 不可以 import `content/`、`engine` 的 `Lesson`／`StageScript`／`Target`，也不可以知道 stage 的概念
- **v1 四課和綜合練習的畫面與行為一個像素都不能變**（拆層是重構，不是改設計）
- 靛藍是外殼、綠色是模擬層
- 零額外相依套件
- `npx tsc --noEmit`、`npm run export` 都要通過

## Observable acceptance
1. 四課加上綜合練習的回歸測試：紅圈位置、引導條、卡住了（亂點兩次會變大）、成功提示文字、續做位置，都跟 P1 一樣
2. `?devlogin=1` 看得到「我的沙盒」；`?devlogin=guest` 看不到
3. 沙盒裡每個功能都點得到，不會過關，也不會寫進度
4. 正式打包裡看不到任何原始 userId
5. 在 iPhone 模擬器（Safari）裡給使用者看實際畫面
