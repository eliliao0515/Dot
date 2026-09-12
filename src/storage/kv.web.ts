/**
 * 低階鍵值儲存 — 網頁端（localStorage）。
 *
 * ⚠️ 為什麼一定要加前綴：
 * localStorage 依 origin 隔離，不是依路徑。我們的 origin 是
 * https://eliliao0515.github.io，所以同一個 GitHub 帳號底下的
 * 每一個 Pages 專案共用同一份 localStorage。不加前綴的話，
 * 另一個專案寫了同名的 key 就會把進度蓋掉。
 *
 * ⚠️ iOS 的 7 天清除：
 * Safari 的 ITP 會在「連續 7 天使用 Safari 但沒造訪本站」後
 * 刪除所有 script 可寫入儲存。iOS 上所有瀏覽器底層都是 WebKit，
 * 換 Chrome 也一樣。加到主畫面的 PWA 有獨立計時器、不受此限 —
 * 這是我們要做 PWA 的第二個理由（第一個是離線）。
 * 因此呼叫端必須把「進度不見了」當成正常狀態處理，不能當錯誤。
 *
 * 所有操作都吞掉例外：無痕模式、關閉網站資料的瀏覽器會直接 throw，
 * 而儲存失敗絕對不可以擋住長輩上課。
 */

const PREFIX = 'dot:';

export async function kvGet(key: string): Promise<string | null> {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch (err) {
    console.warn('[kv] 讀取失敗，當作沒有資料：', err);
    return null;
  }
}

export async function kvSet(key: string, value: string): Promise<void> {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch (err) {
    // 容量滿了或瀏覽器禁止寫入。不重試、不提示，課照上。
    console.warn('[kv] 寫入失敗，本次進度不會保存：', err);
  }
}

export async function kvRemove(key: string): Promise<void> {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch (err) {
    console.warn('[kv] 刪除失敗：', err);
  }
}
