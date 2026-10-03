/**
 * 打開手機自己的相簿或相機，拿回一張照片（網頁版）。
 *
 * 用的是瀏覽器內建的檔案選取：iPhone 會跳出系統的照片選取畫面，
 * 加了 capture 就直接開相機。照片只轉成這支手機記憶體裡的網址（blob:），
 * **不會上傳到任何伺服器**，頁面關掉就消失。
 *
 * 必須在使用者「按下去」的那一刻同步呼叫，否則瀏覽器會擋掉。
 * 使用者取消時回傳 null（不支援 cancel 事件的舊瀏覽器則永遠不會回傳，呼叫端不能乾等）。
 */
export const canPickImage = true;

export function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.display = 'none';

    let settled = false;
    const finish = (uri: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(uri);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      finish(file ? URL.createObjectURL(file) : null);
    });
    input.addEventListener('cancel', () => finish(null));

    document.body.appendChild(input);
    input.click();
  });
}
