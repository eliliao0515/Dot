import React from 'react';
import { Image } from 'react-native';
import { ICON_SVGS } from '../content/symbols/icons.generated';

/**
 * 顯示符號圖庫裡的一個圖示（Ionicons，MIT）。
 * 原生端用 data URI 把 SVG 交給 <Image>；網頁版見 SymbolIcon.web.tsx（直接嵌入 SVG）。
 * 原生端的 <Image> 不支援 SVG（v2 期間原生 App 不驗證），之後要上原生再換做法。
 */
export default function SymbolIcon({ icon, size, color = '#1C1C1E' }: { icon: string; size: number; color?: string }) {
  const svg = ICON_SVGS[icon];
  if (!svg) return null;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/currentColor/g, color))}`;
  return <Image source={{ uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />;
}
