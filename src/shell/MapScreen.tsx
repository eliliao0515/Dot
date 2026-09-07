import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Check, Mic, Chevron, VideoCam, PhoneOutline, Sticker } from '../ui/Icons';
import { MAP_NODES } from '../content/lessons';
import { MapNode } from '../engine/types';

/**
 * 路線是給眼睛看的成就感，不是必經的操作關卡。
 * 最上面那顆按鈕大到不可能按錯，長輩完全不用碰路線圖也能繼續上課。
 *
 * 刻意沒有：紅心、連續天數、寶石、排行榜、倒數計時。
 * 對長輩來說這些不是動力，是羞恥感的來源。
 */

function NodeDot({ node, size }: { node: MapNode; size: number }) {
  const inner = size * 0.46;
  if (node.state === 'done') {
    return (
      <View style={[s.dot, s.dotDone, { width: size, height: size, borderRadius: size / 2 }]}>
        <Check size={inner} color="#fff" weight={3.2} />
      </View>
    );
  }
  if (node.state === 'now') {
    return (
      <View style={[s.dot, s.dotNow, { width: size, height: size, borderRadius: size / 2 }]}>
        <Mic size={inner} color={C.indigo} weight={2.4} />
      </View>
    );
  }
  if (node.state === 'milestone') {
    return (
      <View style={[s.dot, s.dotMile, { width: size, height: size, borderRadius: size / 2 }]}>
        <PhoneOutline size={inner} color={C.red} />
      </View>
    );
  }
  const Glyph = node.id === 'video-call' ? VideoCam : Sticker;
  return (
    <View style={[s.dot, { width: size, height: size, borderRadius: size / 2 }]}>
      <Glyph size={inner} color={C.ink3} />
    </View>
  );
}

export default function MapScreen({
  onOpenLesson,
  resumeLabel,
}: {
  onOpenLesson: (lessonId: string) => void;
  resumeLabel: string;
}) {
  const { base, step, setStep } = useScale();
  const [notice, setNotice] = useState<string | null>(null);

  const dotSize = fz(base, 3.5);

  function pressNode(node: MapNode) {
    if (node.lessonId) {
      setNotice(null);
      onOpenLesson(node.lessonId);
    } else {
      // 不鎖關卡。長輩的目標很具體，擋住他只會讓他關掉 App 去問女兒。
      setNotice(`「${node.label}」這一課還沒做好。第一版只做了傳語音訊息。`);
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <T systemScaling style={[s.hello, { fontSize: fz(base, 0.98), lineHeight: fz(base, 1.5) }]}>
          陳阿嬤，午安
        </T>
        <Pressable
          onPress={() => setStep(step === 'standard' ? 'large' : 'standard')}
          hitSlop={12}
          accessibilityRole="button"
        >
          <T systemScaling style={[s.setting, { fontSize: fz(base, 0.84), lineHeight: fz(base, 1.4) }]}>
            {step === 'standard' ? '字太小？改大字' : '改回標準字'}
          </T>
        </Pressable>
      </View>

      <Pressable
        onPress={() => onOpenLesson('voice-msg')}
        style={({ pressed }) => [s.resume, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        <View style={{ flex: 1 }}>
          <T systemScaling style={[s.resumeLbl, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.3) }]}>
            接著上次
          </T>
          <T systemScaling style={[s.resumeTit, { fontSize: fz(base, 1.18), lineHeight: fz(base, 1.6) }]}>
            {resumeLabel}
          </T>
        </View>
        <Chevron size={fz(base, 1.6)} />
      </Pressable>

      <ScrollView contentContainerStyle={s.mapInner}>
        <T systemScaling style={[s.mapTitle, { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.35) }]}>
          你的學習路線
        </T>

        <View style={s.track}>
          <View style={[s.rail, { left: dotSize / 2 - 2.5 }]} />
          <View style={[s.railDone, { left: dotSize / 2 - 2.5, height: (dotSize + 18) * 2 }]} />

          {MAP_NODES.map((node) => (
            <Pressable
              key={node.id}
              onPress={() => pressNode(node)}
              style={({ pressed }) => [s.node, { marginBottom: 18 }, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <NodeDot node={node} size={dotSize} />
              <View style={{ flex: 1 }}>
                <T
                  systemScaling
                  style={[
                    s.nodeLabel,
                    { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) },
                    node.state === 'now' && { color: C.indigo },
                    node.state === 'todo' && { color: C.ink2 },
                  ]}
                >
                  {node.label}
                </T>
                <T systemScaling style={[s.nodeSub, { fontSize: fz(base, 0.75), lineHeight: fz(base, 1.25) }]}>
                  {node.sub}
                </T>
              </View>
              {node.state === 'now' ? (
                <View style={s.tag}>
                  <T systemScaling style={[s.tagText, { fontSize: fz(base, 0.72) }]}>
                    現在
                  </T>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        {notice ? (
          <View style={s.notice}>
            <T systemScaling style={[s.noticeText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.5) }]}>
              {notice}
            </T>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  top: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: C.line,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  hello: { fontWeight: '700', color: C.ink, flex: 1 },
  setting: { color: C.indigo, fontWeight: '700', textDecorationLine: 'underline' },

  resume: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: C.indigo,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resumeLbl: { color: '#CBDCE7', fontWeight: '500' },
  resumeTit: { color: '#fff', fontWeight: '900', marginTop: 2 },

  mapInner: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 40 },
  mapTitle: { color: C.ink3, fontWeight: '700', marginBottom: 14 },

  track: { position: 'relative' },
  rail: { position: 'absolute', top: 14, bottom: 14, width: 5, backgroundColor: C.line, borderRadius: 3 },
  railDone: { position: 'absolute', top: 14, width: 5, backgroundColor: C.indigo, borderRadius: 3 },

  node: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.paper,
    borderWidth: 4,
    borderColor: C.line,
  },
  dotDone: { backgroundColor: C.indigo, borderColor: C.indigo },
  dotNow: { backgroundColor: C.indigoWash, borderColor: C.indigo, borderWidth: 5 },
  dotMile: { backgroundColor: C.redWash, borderColor: C.red },

  nodeLabel: { fontWeight: '700', color: C.ink },
  nodeSub: { color: C.ink3, fontWeight: '500', marginTop: 1 },

  tag: { backgroundColor: C.indigo, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { color: '#fff', fontWeight: '700' },

  notice: {
    marginTop: 8,
    backgroundColor: C.indigoWash,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.line,
  },
  noticeText: { color: C.ink2, fontWeight: '500' },
});
