/**
 * LINE 身分識別 — 網頁端（LIFF）。
 *
 * 設計原則：身分是加分項，不是入場券。
 *   - 在 LINE 內建瀏覽器開啟 → 無摩擦拿到身分，長輩不必輸入任何東西
 *   - 一般瀏覽器 / 離線 / SDK 載不到 → 一律回傳 null，改走匿名模式
 *
 * 因此這個檔案裡任何失敗都不可以往外拋。據點的 Wi-Fi 很爛，
 * 一個沒攔到的 reject 會讓整個 App 開不起來，而離線可用是硬需求。
 */

export type LineUser = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

const LIFF_ID = '2011571629-iO0TXxLh';
const SDK_URL = 'https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js';

let sdkPromise: Promise<void> | null = null;
let initPromise: Promise<LineUser | null> | null = null;
let cached: LineUser | null = null;

function loadSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('沒有 document，不是瀏覽器環境'));
      return;
    }
    if ((window as any).liff) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = SDK_URL;
    el.charset = 'utf-8';
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('LIFF SDK 載入失敗'));
    document.head.appendChild(el);
  });
  return sdkPromise;
}

/** 啟動時呼叫一次。重複呼叫會拿到同一個 promise，不會重跑。 */
export async function initLineAuth(): Promise<LineUser | null> {
  if (initPromise) return initPromise;

  initPromise = (async (): Promise<LineUser | null> => {
    try {
      await loadSdk();
      const liff = (window as any).liff;

      // 刻意不開 withLoginOnExternalBrowser：
      // 一般瀏覽器不要強制轉跳登入，沒有 LINE 的人也要能直接用。
      await liff.init({ liffId: LIFF_ID });

      if (!liff.isLoggedIn()) return null;

      const p = await liff.getProfile();
      cached = {
        userId: p.userId,
        displayName: p.displayName,
        pictureUrl: p.pictureUrl,
      };
      return cached;
    } catch (err) {
      console.warn('[lineAuth] 未取得 LINE 身分，改用匿名模式：', err);
      return null;
    }
  })();

  return initPromise;
}

/** 同步取用已快取的身分。給進度儲存之類的呼叫點用，拿不到就是匿名。 */
export function getCachedLineUser(): LineUser | null {
  return cached;
}

/**
 * 取得 ID token（JWT）。
 * 注意：getProfile() 的 userId 是前端資料，可以被偽造。
 * 日後做子女端進度同步時，後端必須驗這個 token 的簽章，
 * 不可以直接信任前端送上來的 userId。
 */
export async function getIdToken(): Promise<string | null> {
  try {
    await loadSdk();
    return (window as any).liff?.getIDToken?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * 在一般瀏覽器主動要求登入（會跳 LINE 授權頁）。
 * 長輩端不要呼叫這個 — 授權畫面對他們等同釣魚頁。
 * 保留給日後的子女端／照顧者模式使用。
 */
export async function requestLineLogin(): Promise<void> {
  try {
    await loadSdk();
    const liff = (window as any).liff;
    if (liff && !liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
    }
  } catch {
    // 靜默失敗，不擋使用者。
  }
}
