/**
 * 原生端還沒有串接相簿和相機（v2 期間原生 App 不驗證），一律回傳 null。
 * 呼叫端看 canPickImage 決定要不要改成「這個功能還沒做好」的中性提示。
 */
export const canPickImage = false;

export async function pickImage(_source: 'camera' | 'library'): Promise<string | null> {
  return null;
}
