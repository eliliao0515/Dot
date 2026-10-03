import React from 'react';
import { ICON_SVGS } from '../content/symbols/icons.generated';

/**
 * 顯示符號圖庫裡的一個圖示（網頁版）。
 *
 * 直接把 SVG 嵌進頁面，不經過 <Image>：react-native-web 的 <Image> 載不出 SVG 的 data URI
 * （2026-10-04 在 iPhone Safari 實測是空白）。圖示是我們自己打包的 Ionicons（MIT），內容固定、
 * 不含使用者輸入，所以可以安全地直接嵌入。
 */
export default function SymbolIcon({ icon, size, color = '#1C1C1E' }: { icon: string; size: number; color?: string }) {
  const svg = ICON_SVGS[icon];
  if (!svg) return null;
  const html = svg.replace(/currentColor/g, color).replace(/^<svg /, '<svg width="100%" height="100%" ');
  return React.createElement('div', {
    style: { width: size, height: size, display: 'flex', flexShrink: 0 },
    'aria-hidden': true,
    dangerouslySetInnerHTML: { __html: html },
  });
}
