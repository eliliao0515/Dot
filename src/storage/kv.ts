/**
 * 低階鍵值儲存 — 原生端。
 *
 * 目前是記憶體實作（關掉 App 就消失）。原生版真的要出的時候，
 * 把這三個函式換成 AsyncStorage 或 expo-sqlite 即可，呼叫端一行都不用改。
 *
 * 刻意不裝 @react-native-async-storage/async-storage：
 * 目前要交付的是網頁版，而網頁版底下它就是 localStorage，
 * 多一個相依套件換不到任何東西，也會打破專案的零額外相依原則。
 */

const mem = new Map<string, string>();

export async function kvGet(key: string): Promise<string | null> {
  return mem.get(key) ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  mem.set(key, value);
}

export async function kvRemove(key: string): Promise<void> {
  mem.delete(key);
}
