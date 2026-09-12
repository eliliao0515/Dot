/**
 * LINE 身分識別 — 原生端空殼。
 *
 * LIFF 是純瀏覽器的東西，直接 import 會讓 iOS / Android build 炸掉。
 * Metro 在 web 會自動改用同目錄的 lineAuth.web.ts，原生端永遠走這一支。
 *
 * 對呼叫端來說「拿不到身分」是完全合法的狀態，不需要特別處理 —
 * 這一點同時也是產品原則：身分是加分項，不是入場券。
 */

export type LineUser = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export async function initLineAuth(): Promise<LineUser | null> {
  return null;
}

export function getCachedLineUser(): LineUser | null {
  return null;
}

export async function getIdToken(): Promise<string | null> {
  return null;
}

export async function requestLineLogin(): Promise<void> {
  // 原生端沒有 LIFF，什麼都不做。
}

export function logout(): void {
  // 原生端沒有 LIFF，什麼都不做。
}
