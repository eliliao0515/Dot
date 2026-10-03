import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T } from '../../ui/Scale';
import { fz } from '../../ui/theme';
import { CloseX } from '../../ui/Icons';
import { FakeQr } from './PayIcons';
import type { ScanTarget } from '../../content/pay';

/**
 * 掃描器（QR Code 讀取）。
 *
 * 真手機是打開相機對準 QR Code。這裡不開相機（不多要權限，也讀不到真的碼），
 * 改成在底下列出「你眼前的東西」，選一個就等於把手機對準它。
 * 對準之後跟真機一樣不用按任何鍵，停一下就自動讀取。
 * 純呈現層：眼前有什麼由外層給，讀到之後要去哪裡也由外層決定。
 */

/** 對準之後停多久才算讀到。真機幾乎是瞬間，這裡稍微慢一點讓長輩看清楚畫面。 */
const READ_DELAY_MS = 1400;

export default function ScannerScreen({
  base,
  targets,
  onClose,
  onRead,
  onUnbuilt,
}: {
  base: number;
  targets: ScanTarget[];
  onClose: () => void;
  onRead: (target: ScanTarget) => void;
  onUnbuilt: () => void;
}) {
  const [aimed, setAimed] = useState<ScanTarget | null>(null);
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  useEffect(() => {
    if (!aimed) return;
    const t = setTimeout(() => onReadRef.current(aimed), READ_DELAY_MS);
    return () => clearTimeout(t);
  }, [aimed]);

  const frame = 230;

  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="關閉">
          <CloseX size={fz(base, 1.8)} color="#fff" />
        </Pressable>
        <T style={[s.topTitle, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.45) }]}>QR Code 掃描</T>
        <View style={{ width: fz(base, 1.8) }} />
      </View>

      <View style={[s.camera, aimed && { backgroundColor: aimed.sceneColor }]}>
        <View style={{ width: frame, height: frame, alignItems: 'center', justifyContent: 'center' }}>
          {aimed ? (
            <View style={s.paper}>
              <FakeQr size={120} seed={aimed.id} />
              <T style={[s.caption, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.25) }]}>{aimed.caption}</T>
            </View>
          ) : null}
          <Corner pos={{ top: 0, left: 0 }} sides={['Top', 'Left']} />
          <Corner pos={{ top: 0, right: 0 }} sides={['Top', 'Right']} />
          <Corner pos={{ bottom: 0, left: 0 }} sides={['Bottom', 'Left']} />
          <Corner pos={{ bottom: 0, right: 0 }} sides={['Bottom', 'Right']} />
        </View>
        <T style={[s.hint, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>
          {aimed ? '讀取中…' : '把 QR Code 放進框框裡'}
        </T>
      </View>

      <View style={s.bottom}>
        <T style={[s.pickTitle, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.3) }]}>你眼前有（選一個，假裝用手機對準它）</T>
        <ScrollView horizontal contentContainerStyle={s.chips} showsHorizontalScrollIndicator={false}>
          {targets.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setAimed(t)}
              style={[s.chip, aimed?.id === t.id && s.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: aimed?.id === t.id }}
            >
              <T style={[s.chipText, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.35) }]}>{t.label}</T>
            </Pressable>
          ))}
        </ScrollView>
        <View style={s.tools}>
          <Pressable onPress={onUnbuilt} style={s.tool}>
            <T style={[s.toolText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.2) }]}>相簿</T>
          </Pressable>
          <Pressable onPress={onUnbuilt} style={s.tool}>
            <T style={[s.toolText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.2) }]}>我的 QR Code</T>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Corner({ pos, sides }: { pos: object; sides: ('Top' | 'Left' | 'Right' | 'Bottom')[] }) {
  const style: Record<string, number | string> = { position: 'absolute', width: 34, height: 34, borderColor: '#fff' };
  for (const side of sides) style[`border${side}Width`] = 4;
  return <View style={[style, pos]} />;
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  topTitle: { color: '#fff', fontWeight: '800' },
  camera: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, backgroundColor: '#2B2B2B' },
  paper: { backgroundColor: '#fff', padding: 14, borderRadius: 6, alignItems: 'center', gap: 8, transform: [{ rotate: '-3deg' }] },
  caption: { color: '#16202B', fontWeight: '800', textAlign: 'center' },
  hint: { color: '#fff', fontWeight: '700' },

  bottom: { backgroundColor: '#111', paddingTop: 14, paddingBottom: 18, gap: 10 },
  pickTitle: { color: '#C9CFD4', paddingHorizontal: 18 },
  chips: { paddingHorizontal: 14, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: '#5B6369', backgroundColor: '#1E1E1E' },
  chipOn: { borderColor: '#12B76A', backgroundColor: '#163A28' },
  chipText: { color: '#fff', fontWeight: '700' },
  tools: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 },
  tool: { paddingVertical: 8, paddingHorizontal: 12 },
  toolText: { color: '#C9CFD4', fontWeight: '600' },
});
