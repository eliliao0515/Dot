import type { LineUser } from './lineAuth';

/**
 * 開發者判定 —— 決定課本首頁要不要多出「我的沙盒」（specs/v2/P2-sandbox.md）。
 *
 * 名單來自建置時的環境變數 EXPO_PUBLIC_DEV_USER_HASHES：逗號分隔的
 * userId SHA-256 十六進位字串。打包後的程式碼是公開的，所以只放雜湊，不放原始 userId。
 *
 * 注意：這**不是安全邊界**。判定完全在前端，有心人改一下就能看到沙盒，
 * 但沙盒裡只有一個模擬器，沒有任何秘密或別人的資料。不要拿它來保護任何東西。
 */

const DEV_HASHES: string[] = String(process.env.EXPO_PUBLIC_DEV_USER_HASHES ?? '')
  .split(',')
  .map((h: string) => h.trim().toLowerCase())
  .filter(Boolean);

/** 算 SHA-256。沒有 crypto.subtle（原生端、非 https 頁面）就回傳 null。 */
export async function sha256Hex(text: string): Promise<string | null> {
  try {
    const subtle = (globalThis as any).crypto?.subtle;
    if (!subtle) return null;
    const digest: ArrayBuffer = await subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

/** 算不出雜湊、名單是空的、或沒有登入，一律當作不是開發者。 */
export async function isDeveloper(user: LineUser | null): Promise<boolean> {
  if (!user || DEV_HASHES.length === 0) return false;
  const hash = await sha256Hex(user.userId);
  return hash !== null && DEV_HASHES.includes(hash);
}
