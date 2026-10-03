import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Smile, CloseX, Trash, Send, Play, Pause } from '../ui/Icons';
import { InputBarRow, inputBarMetrics } from './parts';

export type VoiceRecorderPhase = 'idle' | 'recording' | 'stopped';

/**
 * 語音錄音面板。從輸入列的位置往上長出來，取代輸入列，上面的聊天紀錄照樣看得到 ——
 * 跟真的 LINE 一樣（voice.png／clicked_voice.png），不是全螢幕。
 * 面板高度只比中間的圓鈕多一點。
 *
 * 中間圓鈕三種樣子：
 *   - idle：灰色粗外框＋紅點（點一下開始錄）
 *   - recording：實心綠底＋白色方塊（點一下停止）
 *   - stopped：細細的綠色外框＋綠色播放鍵（點一下試聽，試聽中變成暫停鍵）
 *
 * 純呈現層，只吃 props，不認得「課程」概念，也不自己算計時器。
 */
export default function VoiceRecorder({
  phase,
  previewing,
  elapsedLabel,
  onStartRecording,
  onStopRecording,
  onTogglePreview,
  onDiscard,
  onSend,
  onClose,
  onTopBarAction,
}: {
  phase: VoiceRecorderPhase;
  /** stopped 之後正在試聽。 */
  previewing: boolean;
  elapsedLabel: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePreview: () => void;
  onDiscard: () => void;
  onSend: () => void;
  onClose: () => void;
  onTopBarAction: () => void;
}) {
  const { base } = useScale();
  const isIdle = phase === 'idle';
  const isRecording = phase === 'recording';

  // 比例照 clicked_voice.png：圓鈕約畫面寬度三分之一，兩側小圓鈕約八分之一，整排不超出畫面。
  const ringSize = fz(base, 8);
  const dotSize = fz(base, 2.2);
  const stopSquareSize = fz(base, 1.5);
  const sideBtnSize = fz(base, 3.2);
  const m = inputBarMetrics(base);
  // 「點一下開始錄音」跟計時數字共用同一個固定高度，開始錄音時面板不會被撐高。
  const labelH = fz(base, 2.1);

  return (
    <View style={s.panel}>
      {/* 頂部這一列跟一般輸入列用同一個骨架、同一組尺寸，按下麥克風時這一列完全不會跳。 */}
      <InputBarRow
        base={base}
        onPressPlus={onTopBarAction}
        onPressCamera={onTopBarAction}
        onPressAlbum={onTopBarAction}
        field={
          <>
            <T style={[s.fakeInputText, { fontSize: m.fontSize, lineHeight: m.fontSize * 1.3 }]}>Aa</T>
            <Pressable onPress={onTopBarAction} hitSlop={8} accessibilityRole="button">
              <Smile size={m.smileSize} color="#8E8E93" weight={m.stroke * 0.85} />
            </Pressable>
          </>
        }
        right={
          <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="關閉錄音">
            <CloseX size={m.rightSlot * 1.25} color="#1C1C1E" weight={m.stroke} />
          </Pressable>
        }
      />

      <View style={s.area}>
        <View style={{ height: labelH, justifyContent: 'center' }}>
          <T
            style={[
              isIdle ? s.hint : s.timer,
              isIdle
                ? { fontSize: fz(base, 0.9), lineHeight: labelH }
                : { fontSize: fz(base, 1.6), lineHeight: labelH },
            ]}
          >
            {isIdle ? '點一下開始錄音' : elapsedLabel}
          </T>
        </View>

        <View style={s.circleRow}>
          <View style={{ width: sideBtnSize, height: sideBtnSize }}>
            {!isIdle ? (
              <Pressable
                onPress={onDiscard}
                hitSlop={10}
                style={[s.sideBtn, { width: sideBtnSize, height: sideBtnSize, borderRadius: sideBtnSize / 2 }]}
                accessibilityRole="button"
                accessibilityLabel="刪除"
              >
                <Trash size={fz(base, 1.3)} color={C.red} />
              </Pressable>
            ) : null}
          </View>

          {isIdle ? (
            <Pressable
              onPress={onStartRecording}
              style={[s.ringIdle, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
              accessibilityRole="button"
              accessibilityLabel="開始錄音"
            >
              <View style={[s.redDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
            </Pressable>
          ) : isRecording ? (
            <Pressable
              onPress={onStopRecording}
              style={[s.circleActive, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
              accessibilityRole="button"
              accessibilityLabel="停止錄音"
            >
              <View style={[s.stopSquare, { width: stopSquareSize, height: stopSquareSize }]} />
            </Pressable>
          ) : (
            <Pressable
              onPress={onTogglePreview}
              style={[s.ringStopped, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
              accessibilityRole="button"
              accessibilityLabel={previewing ? '暫停試聽' : '試聽'}
            >
              {previewing ? (
                <Pause size={fz(base, 2.2)} color={C.chatGreen} />
              ) : (
                <View style={{ marginLeft: fz(base, 0.3) }}>
                  <Play size={fz(base, 2.4)} color={C.chatGreen} />
                </View>
              )}
            </Pressable>
          )}

          <View style={{ width: sideBtnSize, height: sideBtnSize }}>
            {!isIdle ? (
              <Pressable
                onPress={onSend}
                hitSlop={10}
                style={[s.sideBtn, { width: sideBtnSize, height: sideBtnSize, borderRadius: sideBtnSize / 2 }]}
                accessibilityRole="button"
                accessibilityLabel="傳送"
              >
                <Send size={fz(base, 1.3)} color="#4C6FE8" cutColor={C.paper} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: C.paper },

  fakeInputText: { flex: 1, color: '#B4B4B8' },

  area: { alignItems: 'center', paddingTop: 2, paddingBottom: 14, gap: 6 },
  hint: { color: C.ink3, fontWeight: '500' },
  timer: { color: C.chatGreen, fontWeight: '800' },

  circleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },

  ringIdle: {
    borderWidth: 5,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: { backgroundColor: '#EC4A54' },

  circleActive: {
    backgroundColor: C.chatGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: { backgroundColor: '#fff', borderRadius: 3 },

  ringStopped: {
    borderWidth: 2,
    borderColor: C.chatGreen,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideBtn: {
    backgroundColor: C.paper,
    borderWidth: 1.5,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
