import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { fz } from '../ui/theme';
import { MicOff, MicOutline, Speaker, PhoneHandset } from '../ui/Icons';

/**
 * LINE 語音通話畫面（全螢幕）。純呈現層，只吃 props，只回報按了什麼。
 *
 * 注意：這是自己做的版本，**還沒對照真機截圖**（2026-10-04 使用者同意先做不擬真的版本）。
 * 拿到真機畫面後，版面、顏色、按鈕位置都要照真機修。
 *
 * 按鈕位置集中在 callScreenMetrics()，教學疊層的紅圈也從這裡算。
 */
export type CallStatus = 'calling' | 'connected';

export function callScreenMetrics(base: number) {
  const k = base / 16;
  return {
    /** 靜音／擴音兩顆圓鈕 */
    btn: 66 * k,
    /** 兩顆圓鈕中心之間的距離 */
    btnSpacing: 120 * k,
    /** 圓鈕中心到畫面底部 */
    btnRowCenterFromBottom: 210 * k,
    /** 紅色掛斷鍵 */
    hangUp: 74 * k,
    hangUpCenterFromBottom: 80 * k,
  };
}

function initialColor(name: string) {
  const palette = ['#5C8A97', '#8C7B4C', '#4C7A99', '#5B8C6B', '#8A5C7A'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return palette[h % palette.length];
}

function RoundButton({
  base,
  on,
  label,
  onPress,
  children,
  offsetX,
}: {
  base: number;
  on: boolean;
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  offsetX: number;
}) {
  const m = callScreenMetrics(base);
  return (
    <View style={[s.btnWrap, { bottom: m.btnRowCenterFromBottom - m.btn / 2, marginLeft: offsetX - m.btn / 2, width: m.btn }]}>
      <Pressable
        onPress={onPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: on }}
        style={[s.round, { width: m.btn, height: m.btn, borderRadius: m.btn / 2 }, on && s.roundOn]}
      >
        {children}
      </Pressable>
      <T style={[s.btnLabel, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.2) }]}>{label}</T>
    </View>
  );
}

export default function VoiceCallScreen({
  contact,
  status,
  elapsedLabel,
  muted,
  speakerOn,
  onToggleMute,
  onToggleSpeaker,
  onHangUp,
}: {
  contact: string;
  status: CallStatus;
  elapsedLabel: string;
  muted: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onHangUp: () => void;
}) {
  const { base } = useScale();
  const m = callScreenMetrics(base);
  const avatar = fz(base, 7);

  return (
    <View style={s.wrap}>
      {/* 背景：深色底，上方一塊用好友代表色淡淡染開，當作頭像模糊背景的近似 */}
      <View style={[s.tint, { backgroundColor: initialColor(contact) }]} pointerEvents="none" />

      <View style={s.top}>
        <View style={[s.avatar, { width: avatar, height: avatar, borderRadius: avatar / 2, backgroundColor: initialColor(contact) }]}>
          <T style={[s.avatarText, { fontSize: avatar * 0.42, lineHeight: avatar * 0.55 }]}>{contact.slice(0, 1)}</T>
        </View>
        <T style={[s.name, { fontSize: fz(base, 1.6), lineHeight: fz(base, 2.1) }]}>{contact}</T>
        <T style={[s.status, { fontSize: fz(base, 1), lineHeight: fz(base, 1.4) }]}>
          {status === 'calling' ? '撥號中…' : elapsedLabel}
        </T>
      </View>

      <RoundButton base={base} on={muted} label="靜音" onPress={onToggleMute} offsetX={-m.btnSpacing / 2}>
        {muted ? (
          <MicOff size={fz(base, 1.8)} color="#1C1C1E" weight={2} />
        ) : (
          <MicOutline size={fz(base, 1.8)} color="#fff" weight={2} />
        )}
      </RoundButton>
      <RoundButton base={base} on={speakerOn} label="擴音" onPress={onToggleSpeaker} offsetX={m.btnSpacing / 2}>
        <Speaker size={fz(base, 1.6)} color={speakerOn ? '#1C1C1E' : '#fff'} />
      </RoundButton>

      <View style={[s.btnWrap, { bottom: m.hangUpCenterFromBottom - m.hangUp / 2, marginLeft: -m.hangUp / 2, width: m.hangUp }]}>
        <Pressable
          onPress={onHangUp}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="掛斷"
          style={({ pressed }) => [
            s.hangUp,
            { width: m.hangUp, height: m.hangUp, borderRadius: m.hangUp / 2 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <PhoneHandset size={fz(base, 2)} color="#fff" weight={2.4} rotate={135} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1F2A30',
    zIndex: 70,
  },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%', opacity: 0.35 },
  top: { alignItems: 'center', paddingTop: '18%', gap: 10 },
  avatar: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { color: '#fff', fontWeight: '700' },
  status: { color: 'rgba(255,255,255,0.75)' },

  btnWrap: { position: 'absolute', left: '50%', alignItems: 'center', gap: 8 },
  round: { backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  roundOn: { backgroundColor: '#FFFFFF' },
  btnLabel: { color: '#fff', fontWeight: '500', textAlign: 'center' },
  hangUp: { backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center' },
});
