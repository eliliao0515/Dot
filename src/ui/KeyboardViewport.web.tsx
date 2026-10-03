import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

/**
 * 讓整個 App 永遠剛好填滿「看得到的範圍」，鍵盤跳出來時底部就貼齊鍵盤頂部。
 *
 * 為什麼要自己做：手機瀏覽器跳出鍵盤時，大多不會把版面變矮，而是把鍵盤蓋在頁面上，
 * 再自己把頁面往上推一段（iOS Safari、LINE 內建瀏覽器、加到主畫面的網頁 App 都是）。
 * 結果是輸入列不一定貼著鍵盤，整頁還能被手指拖來拖去。
 *
 * 做法：public/index.html 把 body 釘死不能捲，這裡跟著 window.visualViewport
 * （扣掉鍵盤後真正看得到的那一塊）調整 App 的高度和位置：
 *   - 高度 = 看得到的高度 → 輸入列在最底下，剛好貼在鍵盤上面
 *   - 往下移 offsetTop → 瀏覽器偷偷把畫面往上推多少，就補回多少
 * Android Chrome 在 index.html 設了 interactive-widget=resizes-visual，行為跟 iOS 一致，走同一條路。
 * 沒有 visualViewport 的舊瀏覽器就維持滿版，不處理。
 */
export default function KeyboardViewport({ children }: { children: React.ReactNode }) {
  const [box, setBox] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // 頁面本身不該捲動。iOS 聚焦輸入框時偶爾會捲 window 本身，捲回原點。
        if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
        setBox({ height: Math.round(vv.height), top: Math.round(vv.offsetTop) });
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('scroll', update);
    // 鍵盤收起來時 iOS 有時不會發 resize，補一次。
    window.addEventListener('focusout', update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('focusout', update);
    };
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: box ? box.height : '100%',
        transform: [{ translateY: box ? box.top : 0 }],
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}
