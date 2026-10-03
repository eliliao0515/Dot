-- Dot 點數伺服器的資料表（Cloudflare D1，SQLite）。
-- 只存「誰（LINE userId）有幾點、哪些點數已經發過」，不存名字、大頭貼或任何對話內容。

CREATE TABLE IF NOT EXISTS users (
  user_id     TEXT PRIMARY KEY,           -- LINE userId（伺服器跟 LINE 驗證過才寫入）
  total       INTEGER NOT NULL DEFAULT 0, -- 累積點數，只加不扣
  quiz_rounds INTEGER NOT NULL DEFAULT 0, -- 玩過幾局符號選擇題
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 已經發過的點數。同一個 (user_id, kind, ref) 只會發一次：
--   kind = 'quiz'       ref = 這一局的隨機編號（網路重送也不會重複加分）
--   kind = 'stage'      ref = '<lessonId>:<stageIndex>'（每一步只有第一次完成給點）
--   kind = 'realDevice' ref = '<lessonId>'
CREATE TABLE IF NOT EXISTS awards (
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,
  ref        TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, ref)
);
