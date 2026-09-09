import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
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

/**
 * 打勾圖示的一次性進場動畫：掉下來＋閃一下，慶祝完成。
 * 尊重 AccessibilityInfo.isReduceMotionEnabled()（比照 ChatSim 的 GuideRing）—
 * 開了「減少動態效果」就直接顯示最終靜止狀態，不播動畫。
 * 動畫只影響這個圖示本身，不會擋住或延遲下面「繼續」按鈕的可點性。
 */
function DoneSeal() {
  const dropY = useRef(new Animated.Value(-70)).current;
  const sealOpacity = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const [reduce, setReduce] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) {
        setReduce(v);
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (reduce) {
      dropY.setValue(0);
      sealOpacity.setValue(1);
      flash.setValue(0);
      return;
    }
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(dropY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sealOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [ready, reduce, dropY, sealOpacity, flash]);

  return (
    <View style={s.sealWrap}>
      <Animated.View
        pointerEvents="none"
        style={[s.sealHalo, { opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]}
      />
      <Animated.View style={[s.seal, { opacity: sealOpacity, transform: [{ translateY: dropY }] }]}>
        <Check size={46} color="#fff" weight={4} />
      </Animated.View>
    </View>
  );
}

/** 完成畫面沒有分數、沒有星等、沒有百分比。只說他現在會什麼。 */
export function DoneScreen({ lesson, onContinue }: {
  lesson: Lesson;
  onContinue: () => void;
}) {
  const { base } = useScale();
  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={[s.body, { alignItems: 'center' }]}>
        <DoneSeal />
        <T systemScaling style={[s.title, s.center, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.1) }]}>
          {lesson.done.headline}
        </T>
        <T systemScaling style={[s.why, s.center, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.7) }]}>
          {lesson.done.body}
        </T>
      </ScrollView>

      <View style={s.footer}>
        <BigButton label="繼續" onPress={onContinue} />
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

  sealWrap: {
    width: 132,
    height: 132,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 66,
    backgroundColor: C.indigoWash,
  },
  seal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
