# Dot 點數伺服器

Cloudflare Workers + D1（免費方案）。依 LINE 帳號存點數，讓「登出、過幾天、換瀏覽器」點數都還在。
設計說明見 `specs/v2/P4-restructure-quiz-points.md` §4 與 `src/index.ts` 開頭的註解。

**費用：** 免費方案每天 10 萬次請求、5GB 資料庫，一場工作坊用不到 1%。超過也只是暫停服務，不會自動扣款（除非你自己升級付費方案）。

## 第一次部署（大約 15 分鐘）

> 需要你自己操作：註冊帳號、登入、按授權。這些我不能代勞。

1. 到 https://dash.cloudflare.com/sign-up 註冊 Cloudflare 帳號（免費，不需要信用卡）
2. 在終端機登入（會打開瀏覽器請你按授權）：
   ```bash
   cd server
   npx wrangler@4 login
   ```
3. 建立資料庫，**把印出來的 `database_id` 貼到 `wrangler.toml`** 取代 `REPLACE_WITH_YOUR_D1_DATABASE_ID`：
   ```bash
   npx wrangler@4 d1 create dot-points
   ```
4. 建立資料表：
   ```bash
   npx wrangler@4 d1 execute dot-points --remote --file schema.sql
   ```
5. 部署：
   ```bash
   npx wrangler@4 deploy
   ```
   最後會印出網址，像 `https://dot-points.<你的帳號>.workers.dev`
6. 把這個網址設成 GitHub 的 repository variable（不是 secret），名稱 `POINTS_API_URL`：
   ```bash
   gh variable set POINTS_API_URL --repo eliliao0515/Dot --body "https://dot-points.<你的帳號>.workers.dev"
   ```
7. **先把隱私權政策換成新版**（`specs/v2/P4d-privacy-draft.md`，要你審過），再合併到 main 部署網頁版

## 要確認的設定

- `wrangler.toml` 的 `LINE_CHANNEL_ID` 是 LIFF ID 的前半段（目前 `2011571629`）。伺服器用它確認 token 是發給 Dot 的
- `ALLOWED_ORIGINS` 只允許 GitHub Pages 上的 Dot 和本機開發呼叫
- **絕對不要**在正式環境設定 `DEV_MODE`（那是本機測試用的假身分開關，只寫在 `.dev.vars`）

## 本機開發

```bash
cd server
npx wrangler@4 d1 execute dot-points --local --file schema.sql   # 第一次
npx wrangler@4 dev --local --port 8799
```
App 的 `.env.local` 加上 `EXPO_PUBLIC_POINTS_API=http://localhost:8799`，網址帶 `?devlogin=1` 就會用假身分 `dev:dev-local` 連本機伺服器。

## API

所有請求都要帶 `Authorization: Bearer <LIFF access token>`。

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/v1/points` | 目前點數 `{ total, quizRounds }` |
| POST | `/v1/awards` | 發點數。body 是發生了什麼（`{kind:'quiz', ref, correct}`、`{kind:'stage', lessonId, stageIndex}`、`{kind:'realDevice', lessonId}`），伺服器依規則算點數；同一筆只會加一次 |
| DELETE | `/v1/me` | 刪除這個帳號的所有資料 |

## 查資料（工作坊結束後想看大家玩得怎樣）

```bash
npx wrangler@4 d1 execute dot-points --remote --command "SELECT COUNT(*) AS users, SUM(total) AS points FROM users"
```
