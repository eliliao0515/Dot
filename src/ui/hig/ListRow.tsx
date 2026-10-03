import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { T, useScale } from '../Scale';
import { fz } from '../theme';
import { Check, Chevron } from '../Icons';
import { H } from './tokens';

/** 關卡狀態只有三種。刻意不顯示數字、百分比或分數。 */
export type RowStatus = 'none' | 'partial' | 'done';

function StatusMark({ status, size }: { status: RowStatus; size: number }) {
  if (status === 'none') return null;
  if (status === 'partial') {
    return (
      <View
        accessibilityLabel="做到一半"
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.5, borderColor: H.tint }}
      />
    );
  }
  return (
    <View
      accessibilityLabel="完成"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: H.tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={size * 0.8} color="#fff" weight={2.5} />
    </View>
  );
}

/**
 * 對應 SwiftUI 的 NavigationLink 列。整列都可以點，最小高度 64px。
 * 不做滑動操作、不做長按選單 —— 每個功能都要看得到、點一下就能用。
 */
export default function ListRow({
  icon,
  title,
  subtitle,
  status = 'none',
  showChevron = true,
  onPress,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: RowStatus;
  showChevron?: boolean;
  onPress?: () => void;
}) {
  const { base } = useScale();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.row, pressed && { backgroundColor: H.pressed }]}
    >
      {icon ? <View style={s.icon}>{icon}</View> : null}
      <View style={s.body}>
        <T systemScaling style={[s.title, { fontSize: fz(base, 1.35), lineHeight: fz(base, 1.85) }]}>
          {title}
        </T>
        {subtitle ? (
          <T systemScaling style={[s.subtitle, { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.75) }]}>
            {subtitle}
          </T>
        ) : null}
      </View>
      <StatusMark status={status} size={fz(base, 1.6)} />
      {showChevron ? <Chevron size={fz(base, 1.3)} color={H.secondary} weight={2.5} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    minHeight: H.rowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    backgroundColor: H.card,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: H.tintWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { color: H.label, fontWeight: '600', fontFamily: H.fontFamily },
  subtitle: { color: H.secondary, fontFamily: H.fontFamily, marginTop: 2 },
});
