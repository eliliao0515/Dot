import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { T, useScale } from '../Scale';
import { fz } from '../theme';
import { H } from './tokens';

type Props = { label: string; onPress: () => void; style?: ViewStyle };

/** 對應 SwiftUI Button(.borderedProminent)。最小高度 72px，比 HIG 的 44pt 大很多，是刻意的。 */
export function PrimaryButton({ label, onPress, style }: Props) {
  const { base } = useScale();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, s.primary, pressed && s.pressed, style]}
    >
      <T systemScaling style={[s.label, { color: '#fff', fontSize: fz(base, 1.35), lineHeight: fz(base, 1.85) }]}>
        {label}
      </T>
    </Pressable>
  );
}

/** 對應 SwiftUI Button(.bordered)：淺靛藍底、靛藍字。 */
export function SecondaryButton({ label, onPress, style }: Props) {
  const { base } = useScale();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, s.secondary, pressed && s.pressed, style]}
    >
      <T systemScaling style={[s.label, { color: H.tint, fontSize: fz(base, 1.35), lineHeight: fz(base, 1.85) }]}>
        {label}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: H.primaryMinHeight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primary: { backgroundColor: H.tint },
  secondary: { backgroundColor: H.tintWash, borderWidth: 1.5, borderColor: H.tint },
  pressed: { opacity: 0.8 },
  label: { fontWeight: '700', textAlign: 'center', fontFamily: H.fontFamily },
});
