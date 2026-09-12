import React from 'react';
import { View, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import BigButton from './BigButton';

/**
 * 全站強制登入畫面（只在網頁端出現）。靛藍教學外殼色系，不是被模擬的 App。
 *
 * 這裡刻意不會自己觸發跳轉——一定要使用者親手按下按鈕才呼叫
 * requestLineLogin()。授權畫面對長輩來說觀感等同釣魚頁，這件事沒有變，
 * 差別只在於使用者本人已經知情、確認過風險後決定全站都要登入
 * （見 CLAUDE.md「2026-09-13 更新」）。按鈕天然防迴圈：畫面一開不會自己轉走，
 * 登入失敗或取消也只是留在這個畫面，可以再按一次。
 */
export default function LoginGate({ onPressLogin }: { onPressLogin: () => void }) {
  const { base } = useScale();
  return (
    <View style={s.wrap}>
      <View style={s.body}>
        <T systemScaling style={[s.eyebrow, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.35) }]}>
          開始使用前
        </T>
        <T systemScaling style={[s.title, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.1) }]}>
          用 LINE 登入一下
        </T>
        <T systemScaling style={[s.why, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.7) }]}>
          登入後我們會記住你上次做到哪裡，下次打開不用從頭開始。
        </T>
      </View>

      <View style={s.footer}>
        <BigButton label="使用 LINE 登入" onPress={onPressLogin} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  footer: { paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },

  eyebrow: { color: C.indigo, fontWeight: '700', textAlign: 'center' },
  title: { color: C.ink, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  why: { color: C.ink2, marginTop: 12, textAlign: 'center' },
});
