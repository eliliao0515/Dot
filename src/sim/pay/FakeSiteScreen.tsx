import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T } from '../../ui/Scale';
import { C, fz } from '../../ui/theme';
import { CloseX, Menu } from '../../ui/Icons';
import { Globe } from './PayIcons';
import type { FakeSite } from '../../content/pay';

/**
 * 掃到 QR Code 之後打開的網頁（LINE 內建瀏覽器的樣子：上面 ✕、標題、網址）。
 *
 * 網址列一定要看得清楚，這是判斷真假的第一個地方。
 * 欄位只是畫出來的框，**不能真的輸入**：不讓長輩在練習裡養成「看到欄位就打卡號」的習慣。
 * 點欄位或按鈕都會回報給外層，由外層（老師）決定要不要說明。純呈現層。
 */
export default function FakeSiteScreen({
  base,
  site,
  onClose,
  onSubmit,
  onUnbuilt,
}: {
  base: number;
  site: FakeSite;
  onClose: () => void;
  onSubmit: () => void;
  onUnbuilt: () => void;
}) {
  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="關閉">
          <CloseX size={fz(base, 1.6)} color={C.ink} weight={2.2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={[s.barTitle, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.3) }]} numberOfLines={1}>
            {site.title}
          </T>
          <View style={s.urlRow}>
            <Globe size={fz(base, 0.8)} color="#5B6369" />
            <T style={[s.url, { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.2) }]} numberOfLines={1}>
              {site.url}
            </T>
          </View>
        </View>
        <Pressable onPress={onUnbuilt} hitSlop={12} accessibilityLabel="選單">
          <Menu size={fz(base, 1.3)} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.page}>
        <T style={[s.h1, { fontSize: fz(base, 1.4), lineHeight: fz(base, 1.9) }]}>{site.title}</T>
        <T style={[s.body, { fontSize: fz(base, 1), lineHeight: fz(base, 1.6) }]}>{site.body}</T>

        {site.fields.map((f) => (
          <Pressable key={f} onPress={onSubmit} style={s.field} accessibilityRole="button">
            <T style={[s.fieldLabel, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>{f}</T>
          </Pressable>
        ))}

        <Pressable onPress={onSubmit} style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]} accessibilityRole="button">
          <T style={[s.ctaText, { fontSize: fz(base, 1.1), lineHeight: fz(base, 1.5) }]}>{site.button}</T>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.chatLine, backgroundColor: '#F7F7F7' },
  barTitle: { color: C.ink, fontWeight: '800' },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  url: { color: '#5B6369' },

  page: { padding: 20, gap: 14 },
  h1: { color: '#C2410C', fontWeight: '900' },
  body: { color: C.ink },
  field: { borderWidth: 1.5, borderColor: '#B5BCC2', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  fieldLabel: { color: '#8A939B' },
  cta: { marginTop: 6, backgroundColor: '#E8590C', borderRadius: 10, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '900' },
});
