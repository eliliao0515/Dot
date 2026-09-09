import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Check } from '../ui/Icons';
import { Lesson } from '../engine/types';
import BigButton from './BigButton';

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
        <BigButton label="回到聊天列表" tone="ghost" onPress={onBack} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  body: { padding: 22, paddingBottom: 12, flexGrow: 1 },
  footer: { paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },

  eyebrow: { color: C.indigo, fontWeight: '700' },
  title: { color: C.ink, fontWeight: '900', marginTop: 10 },
  why: { color: C.ink2, marginTop: 12 },
  center: { textAlign: 'center' },

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
