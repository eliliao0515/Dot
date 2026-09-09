import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Plus, Camera, Album, Smile, CloseX, Trash, Send } from '../ui/Icons';

export type VoiceRecorderPhase = 'idle' | 'recording' | 'stopped';

/**
 * 接近全螢幕的語音錄音畫面，取代訊息串顯示區域（不是疊在上面的小面板）。
 * 純呈現層，只吃 props，不認得「課程」概念，也不自己算計時器 ——
 * elapsedLabel 由呼叫端算好、格式化好（例如 "00:07"）傳進來。
 * 版面骨架照 voice.png／clicked_voice.png：頂部工具列 + 中間錄音圓鈕。
 */
export default function VoiceRecorder({
  phase,
  elapsedLabel,
  onStartRecording,
  onStopRecording,
  onDiscard,
  onSend,
  onClose,
  onTopBarAction,
}: {
  phase: VoiceRecorderPhase;
  elapsedLabel: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDiscard: () => void;
  onSend: () => void;
  onClose: () => void;
  onTopBarAction: () => void;
}) {
  const { base } = useScale();
  const isIdle = phase === 'idle';
  const isRecording = phase === 'recording';

  const ringSize = fz(base, 12.5);
  const dotSize = fz(base, 3.5);
  const stopSquareSize = fz(base, 2.2);
  const sideBtnSize = fz(base, 5.6);

  return (
    <View style={s.wrap}>
      <View style={s.topBar}>
        <Pressable onPress={onTopBarAction} hitSlop={10} accessibilityRole="button">
          <Plus size={fz(base, 1.3)} color={C.chatInk} />
        </Pressable>
        <Pressable onPress={onTopBarAction} hitSlop={10} accessibilityRole="button">
          <Camera size={fz(base, 1.3)} color={C.chatInk} />
        </Pressable>
        <Pressable onPress={onTopBarAction} hitSlop={10} accessibilityRole="button">
          <Album size={fz(base, 1.3)} color={C.chatInk} />
        </Pressable>

        <View style={s.fakeInput}>
          <T style={[s.fakeInputText, { fontSize: fz(base, 1), lineHeight: fz(base, 1.4) }]}>Aa</T>
        </View>

        <Pressable onPress={onTopBarAction} hitSlop={10} accessibilityRole="button">
          <Smile size={fz(base, 1.3)} color={C.chatInk} />
        </Pressable>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <CloseX size={fz(base, 1.4)} color={C.ink} />
        </Pressable>
      </View>

      <View style={s.center}>
        {isIdle ? (
          <T style={[s.hint, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.6) }]}>點一下開始錄音</T>
        ) : (
          <T style={[s.timer, { fontSize: fz(base, 2.2), lineHeight: fz(base, 2.6) }]}>{elapsedLabel}</T>
        )}

        <View style={s.circleRow}>
          {!isIdle ? (
            <Pressable
              onPress={onDiscard}
              style={[s.sideBtn, { width: sideBtnSize, height: sideBtnSize, borderRadius: sideBtnSize / 2 }]}
              accessibilityRole="button"
            >
              <Trash size={fz(base, 1.7)} color={C.red} />
            </Pressable>
          ) : null}

          {isIdle ? (
            <Pressable
              onPress={onStartRecording}
              style={[s.ringIdle, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
              accessibilityRole="button"
            >
              <View style={[s.redDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
            </Pressable>
          ) : (
            <Pressable
              onPress={isRecording ? onStopRecording : undefined}
              style={[s.circleActive, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
              accessibilityRole="button"
            >
              <View style={[s.stopSquare, { width: stopSquareSize, height: stopSquareSize }]} />
            </Pressable>
          )}

          {!isIdle ? (
            <Pressable
              onPress={onSend}
              style={[s.sideBtn, { width: sideBtnSize, height: sideBtnSize, borderRadius: sideBtnSize / 2 }]}
              accessibilityRole="button"
            >
              <Send size={fz(base, 1.7)} color="#4C6FE8" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.chatLine,
  },
  fakeInput: {
    flex: 1,
    backgroundColor: C.chatBar,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  fakeInputText: { color: C.ink3 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  hint: { color: C.ink3, fontWeight: '500' },
  timer: { color: C.chatGreen, fontWeight: '800' },

  circleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },

  ringIdle: {
    borderWidth: 6,
    borderColor: C.chatLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: { backgroundColor: C.red },

  circleActive: {
    backgroundColor: C.chatGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: { backgroundColor: '#fff', borderRadius: 4 },

  sideBtn: {
    backgroundColor: C.chatBar,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
