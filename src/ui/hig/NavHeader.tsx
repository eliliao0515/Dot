import React from 'react';
import { View, StyleSheet } from 'react-native';
import { T, useScale } from '../Scale';
import { fz } from '../theme';
import { H } from './tokens';

/**
 * 對應 SwiftUI NavigationStack 的大標題。
 * 往下捲時不縮成小標題 —— 畫面跳動會讓長輩以為按到了什麼。
 */
export default function NavHeader({ title }: { title: string }) {
  const { base } = useScale();
  return (
    <View style={s.wrap}>
      <T
        systemScaling
        accessibilityRole="header"
        style={[s.title, { fontSize: fz(base, 2.1), lineHeight: fz(base, 2.7) }]}
      >
        {title}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: H.gutter + 4, paddingTop: 12, paddingBottom: 8 },
  title: { color: H.label, fontWeight: '800', fontFamily: H.fontFamily },
});
