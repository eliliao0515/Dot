import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';

/**
 * 主要按鈕的最小高度是 72px。
 * 這不是美術決定，是給手抖與老花的人的觸控目標下限。
 */
export default function BigButton({
  label,
  onPress,
  tone = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
}) {
  const { base } = useScale();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        tone === 'primary' && s.primary,
        tone === 'danger' && s.danger,
        tone === 'ghost' && s.ghost,
        pressed && s.pressed,
        style,
      ]}
    >
      <T
        systemScaling
        style={[
          s.label,
          { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.7) },
          tone === 'ghost' && { color: C.indigo },
        ]}
      >
        {label}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primary: { backgroundColor: C.indigo },
  danger: { backgroundColor: C.red },
  ghost: { borderWidth: 2.5, borderColor: C.indigo, backgroundColor: 'transparent' },
  pressed: { opacity: 0.82 },
  label: { color: '#fff', fontWeight: '900', textAlign: 'center' },
});
