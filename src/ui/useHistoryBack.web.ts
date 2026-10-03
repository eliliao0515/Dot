import { useEffect, useRef } from 'react';

/**
 * 全螢幕的畫面（LINE 模擬器、課程）打開時，在瀏覽紀錄裡推一筆；
 * 使用者按手機或瀏覽器的「上一頁」，就呼叫 onBack 關掉它，而不是整個離開網站。
 *
 * 用程式關掉（例如按「離開 LINE 模擬器」）時，也把那一筆退掉，紀錄才不會越疊越多。
 * 網址完全不變，只動 history.state。
 */
export function useHistoryBack(open: boolean, onBack: () => void) {
  const pushed = useRef(false);
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (open && !pushed.current) {
      window.history.pushState({ dotStack: true }, '');
      pushed.current = true;
    } else if (!open && pushed.current) {
      pushed.current = false;
      if (window.history.state?.dotStack) window.history.back();
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (!pushed.current) return;
      pushed.current = false;
      cb.current();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
}
