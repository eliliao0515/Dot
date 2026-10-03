import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { T, useScale } from '../Scale';
import { fz } from '../theme';
import { H } from './tokens';

export type TabItem<K extends string> = {
  key: K;
  label: string;
  /** 依選中與否給顏色，回傳圖示。 */
  icon: (color: string) => React.ReactNode;
};

/**
 * 對應 SwiftUI TabView 的底部分頁列。
 * 圖示一定配文字；不用毛玻璃，白底加一條分隔線。
 */
export default function TabBar<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  const { base } = useScale();
  return (
    <View style={s.bar} accessibilityRole="tablist">
      {tabs.map((t) => {
        const on = t.key === active;
        const color = on ? H.tint : H.secondary;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={s.tab}
          >
            {t.icon(color)}
            <T
              systemScaling
              style={[
                s.label,
                { color, fontWeight: on ? '800' : '500', fontSize: fz(base, 1.0), lineHeight: fz(base, 1.35) },
              ]}
            >
              {t.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    minHeight: H.tabBarMinHeight,
    backgroundColor: H.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: H.separator,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  label: { fontFamily: H.fontFamily, textAlign: 'center' },
});
