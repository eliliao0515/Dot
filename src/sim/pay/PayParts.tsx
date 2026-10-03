import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T } from '../../ui/Scale';
import { C, fz } from '../../ui/theme';
import { Back, CloseX } from '../../ui/Icons';

/**
 * LINE Pay 模擬共用的小元件：頂部列、數字鍵盤、主要按鈕、金額格式。
 * 純呈現層，只吃 props。
 */

export const PAY_BG = '#F5F6F7';

/** 1234 → "1,234"。不靠 Intl，舊 Android 上也一樣。 */
export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = String(Math.abs(Math.round(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function nowLabel(): string {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function PayHeader({
  title,
  base,
  onBack,
  close = false,
}: {
  title: string;
  base: number;
  onBack: () => void;
  /** true 顯示 ✕（關閉），false 顯示 ‹（返回）。 */
  close?: boolean;
}) {
  return (
    <View style={s.header}>
      <Pressable onPress={onBack} hitSlop={12} style={s.headerBtn} accessibilityLabel={close ? '關閉' : '返回'}>
        {close ? <CloseX size={fz(base, 1.4)} color={C.ink} weight={2.2} /> : <Back size={fz(base, 1.5)} color={C.ink} />}
      </Pressable>
      <T style={[s.headerTitle, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.45) }]} numberOfLines={1}>
        {title}
      </T>
      <View style={s.headerBtn} />
    </View>
  );
}

export function PayButton({
  label,
  base,
  onPress,
  disabled = false,
  outline = false,
}: {
  label: string;
  base: number;
  onPress: () => void;
  disabled?: boolean;
  outline?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        s.btn,
        outline ? s.btnOutline : s.btnFill,
        disabled && s.btnDisabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <T style={[s.btnText, outline && { color: C.chatGreen }, disabled && { color: '#8A939B' }, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.45) }]}>
        {label}
      </T>
    </Pressable>
  );
}

/** 數字鍵盤：1–9、空白、0、刪除。 */
export function Keypad({ base, onDigit, onDelete }: { base: number; onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <View style={s.keypad}>
      {keys.map((k, i) => (
        <Pressable
          key={i}
          onPress={k === '' ? undefined : k === 'del' ? onDelete : () => onDigit(k)}
          style={({ pressed }) => [s.key, pressed && k !== '' && { backgroundColor: '#E3E6E8' }]}
          accessibilityLabel={k === 'del' ? '刪除' : k || undefined}
          disabled={k === ''}
        >
          <T style={[s.keyText, { fontSize: fz(base, k === 'del' ? 1.05 : 1.5), lineHeight: fz(base, 2) }]}>
            {k === 'del' ? '刪除' : k}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

/** 圓形頭像，裡面放名字第一個字。 */
export function NameAvatar({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <T style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42, lineHeight: size * 0.56 }}>{name.slice(0, 1)}</T>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: C.chatLine,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: C.ink, fontWeight: '800' },

  btn: { minHeight: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnFill: { backgroundColor: C.chatGreen },
  btnOutline: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.chatGreen },
  btnDisabled: { backgroundColor: '#DDE1E4', borderColor: '#DDE1E4' },
  btnText: { color: '#fff', fontWeight: '800' },

  keypad: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.chatLine },
  key: { width: '33.333%', height: 60, alignItems: 'center', justifyContent: 'center' },
  keyText: { color: C.ink, fontWeight: '600' },
});
