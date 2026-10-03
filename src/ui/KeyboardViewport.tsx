import React from 'react';
import { View } from 'react-native';

/**
 * 原生端版本：目前直接放行。v2 期間原生 App 不驗證（specs/v2/00-overview.md §9），
 * 鍵盤對齊只在網頁版處理，見 KeyboardViewport.web.tsx。
 */
export default function KeyboardViewport({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
