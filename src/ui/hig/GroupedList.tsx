import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { T, useScale } from '../Scale';
import { fz } from '../theme';
import { H } from './tokens';

/** 對應 SwiftUI List(.insetGrouped)：淺灰底，內容是一張張白色圓角卡片。 */
export function GroupedList({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      {children}
    </ScrollView>
  );
}

/**
 * 對應 SwiftUI Section(header:footer:)。
 * 列與列之間自動插分隔線，分隔線從文字起點開始（HIG 的 inset separator）。
 */
export function Section({
  header,
  footer,
  children,
}: {
  header?: string;
  footer?: string;
  children: React.ReactNode;
}) {
  const { base } = useScale();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={s.section}>
      {header ? (
        <T
          systemScaling
          accessibilityRole="header"
          style={[s.header, { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.7) }]}
        >
          {header}
        </T>
      ) : null}
      <View style={s.card}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={s.separator} /> : null}
            {row}
          </React.Fragment>
        ))}
      </View>
      {footer ? (
        <T systemScaling style={[s.footer, { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.75) }]}>
          {footer}
        </T>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: H.bg },
  content: { paddingHorizontal: H.gutter, paddingBottom: 32 },
  section: { marginTop: 20 },
  header: { color: H.label, fontWeight: '700', fontFamily: H.fontFamily, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: H.card,
    borderRadius: H.radius,
    borderWidth: 1,
    borderColor: H.cardBorder,
    overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: H.separator, marginLeft: 72 },
  footer: { color: H.secondary, fontFamily: H.fontFamily, marginTop: 8, marginHorizontal: 4 },
});
