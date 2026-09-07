import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Play, Check } from '../ui/Icons';
import { Lesson } from '../engine/types';
import BigButton from './BigButton';

/** 開場：先講理由，不講功能。標題是生活情境不是功能名稱。 */
export function BriefScreen({ lesson, onStart, onBack }: {
  lesson: Lesson;
  onStart: () => void;
  onBack: () => void;
}) {
  const { base } = useScale();
  const [dialect, setDialect] = useState<'nan' | 'zh'>('nan');
  const [playing, setPlaying] = useState(false);

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={s.body}>
        <Pressable onPress={onBack} hitSlop={12}>
          <T systemScaling style={[s.back, { fontSize: fz(base, 0.88), lineHeight: fz(base, 1.4) }]}>
            ‹ 回到路線
          </T>
        </Pressable>

        <T systemScaling style={[s.eyebrow, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.35) }]}>
          {lesson.eyebrow}
        </T>
        <T systemScaling style={[s.title, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.1) }]}>
          {lesson.title}
        </T>
        <T systemScaling style={[s.why, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.7) }]}>
          {lesson.why}
        </T>

        <Pressable
          onPress={() => setPlaying((p) => !p)}
          style={({ pressed }) => [s.listen, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
        >
          <View style={s.playCircle}>
            <Play size={fz(base, 1.1)} color={C.indigo} />
          </View>
          <View style={{ flex: 1 }}>
            <T systemScaling style={[s.listenT, { fontSize: fz(base, 1), lineHeight: fz(base, 1.45) }]}>
              {playing ? '播放中…' : '聽我念一次'}
            </T>
            <T systemScaling style={[s.listenS, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
              {playing ? lesson.why : '30 秒'}
            </T>
          </View>
        </Pressable>

        <View style={s.chips}>
          {(['nan', 'zh'] as const).map((d) => (
            <Pressable
              key={d}
              onPress={() => setDialect(d)}
              style={[s.chip, dialect === d && s.chipOn]}
              accessibilityRole="button"
            >
              <T
                systemScaling
                style={[
                  s.chipText,
                  { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.35) },
                  dialect === d && { color: '#fff' },
                ]}
              >
                {d === 'nan' ? '台語' : '國語'}
              </T>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <BigButton label="開始練習" onPress={onStart} />
      </View>
    </View>
  );
}

/** 唯一真正決定成敗的一關：離開這個 App，到真手機上做一次。 */
export function RealDeviceScreen({ lesson, onConfirm, onLater }: {
  lesson: Lesson;
  onConfirm: () => void;
  onLater: () => void;
}) {
  const { base } = useScale();
  return (
    <View style={[s.wrap, { backgroundColor: C.redWash }]}>
      <ScrollView contentContainerStyle={s.body}>
        <T systemScaling style={[s.eyebrow, { color: C.red, fontSize: fz(base, 0.8), lineHeight: fz(base, 1.35) }]}>
          里程碑
        </T>
        <T systemScaling style={[s.title, { fontSize: fz(base, 1.45), lineHeight: fz(base, 2.05) }]}>
          {lesson.realDevice.headline}
        </T>

        <View style={s.steps}>
          {lesson.realDevice.steps.map((step, i) => (
            <View key={i} style={s.step}>
              <View style={s.stepNum}>
                <T systemScaling style={[s.stepNumText, { fontSize: fz(base, 0.85) }]}>
                  {i + 1}
                </T>
              </View>
              <T systemScaling style={[s.stepText, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.65) }]}>
                {step}
              </T>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[s.footer, { gap: 11 }]}>
        <BigButton label="我傳出去了" tone="danger" onPress={onConfirm} />
        <BigButton label="等一下再做" tone="ghost" onPress={onLater} />
      </View>
    </View>
  );
}

/** 完成畫面沒有分數、沒有星等、沒有百分比。只說他現在會什麼。 */
export function DoneScreen({ lesson, onShare, onBack }: {
  lesson: Lesson;
  onShare: () => void;
  onBack: () => void;
}) {
  const { base } = useScale();
  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={[s.body, { alignItems: 'center' }]}>
        <View style={s.seal}>
          <Check size={46} color="#fff" weight={4} />
        </View>
        <T systemScaling style={[s.title, s.center, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.1) }]}>
          {lesson.done.headline}
        </T>
        <T systemScaling style={[s.why, s.center, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.7) }]}>
          {lesson.done.body}
        </T>

        <View style={s.share}>
          <T systemScaling style={[s.shareT, { fontSize: fz(base, 0.92), lineHeight: fz(base, 1.5) }]}>
            {`要不要告訴${lesson.done.shareWith}？`}
          </T>
          <T systemScaling style={[s.shareB, { fontSize: fz(base, 0.88), lineHeight: fz(base, 1.6) }]}>
            {`我們可以幫你傳一句「媽媽學會傳語音了」給她。`}
          </T>
        </View>
      </ScrollView>

      <View style={[s.footer, { gap: 11 }]}>
        <BigButton label={`告訴${lesson.done.shareWith}`} onPress={onShare} />
        <BigButton label="回到路線" tone="ghost" onPress={onBack} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  body: { padding: 22, paddingBottom: 12, flexGrow: 1 },
  footer: { paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },

  back: { color: C.indigo, fontWeight: '700', marginBottom: 16 },
  eyebrow: { color: C.indigo, fontWeight: '700' },
  title: { color: C.ink, fontWeight: '900', marginTop: 10 },
  why: { color: C.ink2, marginTop: 12 },
  center: { textAlign: 'center' },

  listen: {
    marginTop: 22,
    borderWidth: 2.5,
    borderColor: C.indigo,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenT: { color: C.indigo, fontWeight: '700' },
  listenS: { color: C.ink2, fontWeight: '500' },

  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { borderWidth: 1.5, borderColor: C.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipText: { color: C.ink2, fontWeight: '700' },

  steps: { marginTop: 22, gap: 14 },
  step: { flexDirection: 'row', gap: 13, alignItems: 'flex-start' },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '900' },
  stepText: { flex: 1, color: C.ink, paddingTop: 2 },

  seal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  share: {
    marginTop: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: C.line,
    borderRadius: 10,
    padding: 15,
  },
  shareT: { color: C.ink, fontWeight: '700' },
  shareB: { color: C.ink2, marginTop: 4 },
});
