/**
 * Dot 點數伺服器（Cloudflare Worker + D1）。specs/v2/P4-restructure-quiz-points.md §4、P4d。
 *
 * 為什麼要伺服器：點數存在手機瀏覽器裡，iPhone 7 天沒開就會被清掉、換瀏覽器也看不到；
 * 工作坊要「登出、過幾天都還在」，只能依 LINE 帳號存在伺服器上。
 *
 * 安全：
 *  - 前端送 LIFF 的 access token，伺服器自己跟 LINE 驗證（token 真的是發給 Dot 的、還沒過期），
 *    再跟 LINE 拿 userId。前端自己說「我是誰」一律不信（src/auth/lineAuth.web.ts 早就寫了要這樣做）
 *  - 點數由伺服器依規則計算，前端只說「發生了什麼」（答對幾題、完成哪一步），不能直接說「給我幾點」
 *  - 每一筆點數都有編號，同一筆只會加一次（網路不好重送也不會重複加分）
 *
 * 只存 LINE userId、點數、哪些點數發過。不存名字、大頭貼、對話內容。
 */

// ---- Cloudflare 的型別（只宣告用到的部分，不另外裝套件）----
interface D1Result {
  meta: { changes: number };
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}
export interface Env {
  DB: D1Database;
  LINE_CHANNEL_ID: string;
  ALLOWED_ORIGINS: string;
  /** 只在本機開發（.dev.vars）設成 "1"：接受 "dev:<userId>" 假 token。正式環境絕對不要設。 */
  DEV_MODE?: string;
}

// ---- 點數規則（要跟 App 的 src/content/points.ts 一致）----
const RULES = {
  quizCorrect: 100,
  quizComplete: 50,
  quizMaxQuestions: 10,
  stageDone: 100,
  realDevice: 300,
};

type Award =
  | { kind: 'quiz'; ref: string; correct: number }
  | { kind: 'stage'; lessonId: string; stageIndex: number }
  | { kind: 'realDevice'; lessonId: string };

const SAFE_ID = /^[A-Za-z0-9:_-]{1,80}$/;

/** 檢查前端送來的資料，算出這一筆該給幾點。格式不對回 null。 */
function priceAward(body: unknown): { kind: string; ref: string; amount: number; quizRound: boolean } | null {
  const a = body as Award;
  if (!a || typeof a !== 'object') return null;
  if (a.kind === 'quiz') {
    if (!SAFE_ID.test(String(a.ref))) return null;
    const correct = Number(a.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct > RULES.quizMaxQuestions) return null;
    return { kind: 'quiz', ref: a.ref, amount: correct * RULES.quizCorrect + RULES.quizComplete, quizRound: true };
  }
  if (a.kind === 'stage') {
    const idx = Number(a.stageIndex);
    if (!SAFE_ID.test(String(a.lessonId)) || !Number.isInteger(idx) || idx < 0 || idx > 9) return null;
    return { kind: 'stage', ref: `${a.lessonId}:${idx}`, amount: RULES.stageDone, quizRound: false };
  }
  if (a.kind === 'realDevice') {
    if (!SAFE_ID.test(String(a.lessonId))) return null;
    return { kind: 'realDevice', ref: a.lessonId, amount: RULES.realDevice, quizRound: false };
  }
  return null;
}

// ---- 跟 LINE 驗證身分 ----
const tokenCache = new Map<string, { userId: string; until: number }>();

async function userIdFromToken(token: string, env: Env): Promise<string | null> {
  if (env.DEV_MODE === '1' && token.startsWith('dev:')) {
    const id = token.slice(4);
    return SAFE_ID.test(id) ? id : null;
  }
  const cached = tokenCache.get(token);
  if (cached && cached.until > Date.now()) return cached.userId;

  // 1. 這個 access token 是不是發給 Dot 的、還有沒有效
  const v = await fetch(`https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(token)}`);
  if (!v.ok) return null;
  const info = (await v.json()) as { client_id?: string; expires_in?: number };
  if (info.client_id !== env.LINE_CHANNEL_ID || !info.expires_in || info.expires_in <= 0) return null;

  // 2. 用這個 token 跟 LINE 拿 userId
  const p = await fetch('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${token}` } });
  if (!p.ok) return null;
  const profile = (await p.json()) as { userId?: string };
  if (!profile.userId) return null;

  // 最多快取 10 分鐘，不超過 token 本身的有效時間
  tokenCache.set(token, { userId: profile.userId, until: Date.now() + Math.min(600, info.expires_in) * 1000 });
  return profile.userId;
}

// ---- HTTP ----
function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function readTotals(env: Env, userId: string) {
  const row = await env.DB.prepare('SELECT total, quiz_rounds FROM users WHERE user_id = ?')
    .bind(userId)
    .first<{ total: number; quiz_rounds: number }>();
  return { total: row?.total ?? 0, quizRounds: row?.quiz_rounds ?? 0 };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    const url = new URL(req.url);
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'unauthorized' }, 401, h);

    let userId: string | null = null;
    try {
      userId = await userIdFromToken(token, env);
    } catch {
      return json({ error: 'line_unreachable' }, 502, h);
    }
    if (!userId) return json({ error: 'unauthorized' }, 401, h);

    // 目前的點數
    if (req.method === 'GET' && url.pathname === '/v1/points') {
      return json(await readTotals(env, userId), 200, h);
    }

    // 發點數：前端說發生了什麼，伺服器算該給幾點；同一筆只給一次
    if (req.method === 'POST' && url.pathname === '/v1/awards') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return json({ error: 'bad_request' }, 400, h);
      }
      const award = priceAward(body);
      if (!award) return json({ error: 'bad_request' }, 400, h);

      const now = new Date().toISOString();
      // 兩句放在同一個交易（batch）裡：第一句記下這一筆（重複就忽略），
      // 第二句只在第一句真的有寫入時（changes() > 0）才把點數加上去。
      const [inserted] = await env.DB.batch([
        env.DB.prepare('INSERT OR IGNORE INTO awards (user_id, kind, ref, amount, created_at) VALUES (?, ?, ?, ?, ?)').bind(
          userId,
          award.kind,
          award.ref,
          award.amount,
          now,
        ),
        env.DB.prepare(
          `INSERT INTO users (user_id, total, quiz_rounds, created_at, updated_at)
           SELECT ?, ?, ?, ?, ? WHERE changes() > 0
           ON CONFLICT(user_id) DO UPDATE SET total = total + excluded.total,
             quiz_rounds = quiz_rounds + excluded.quiz_rounds, updated_at = excluded.updated_at`,
        ).bind(userId, award.amount, award.quizRound ? 1 : 0, now, now),
      ]);
      const awarded = inserted.meta.changes > 0;
      return json({ ...(await readTotals(env, userId)), awarded }, 200, h);
    }

    // 清除我的資料（個資法的刪除權）
    if (req.method === 'DELETE' && url.pathname === '/v1/me') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM awards WHERE user_id = ?').bind(userId),
        env.DB.prepare('DELETE FROM users WHERE user_id = ?').bind(userId),
      ]);
      return json({ deleted: true }, 200, h);
    }

    return json({ error: 'not_found' }, 404, h);
  },
};
