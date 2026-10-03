import React from 'react';
import { Modal, Pressable, View, StyleSheet } from 'react-native';
import { T, useScale } from '../Scale';
import { fz } from '../theme';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { H } from './tokens';

/**
 * 對應 SwiftUI .sheet：從下方滑出的說明面板。
 * 平常只有一顆按鈕，點背景也能關，關掉就留在原地 —— 不是錯誤，也不擋人。
 * 給了 onConfirm 就變成「確認」面板：上面一顆確定（confirmLabel），下面一顆取消（actionLabel）。
 * 點背景一律等於取消，不會不小心確定。
 */
export default function Sheet({
  visible,
  title,
  message,
  actionLabel = '好',
  onClose,
  confirmLabel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message?: string;
  actionLabel?: string;
  onClose: () => void;
  confirmLabel?: string;
  onConfirm?: () => void;
}) {
  const { base } = useScale();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="關閉" />
        <View style={s.panel}>
          <View style={s.grabber} />
          <T systemScaling style={[s.title, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.0) }]}>
            {title}
          </T>
          {message ? (
            <T systemScaling style={[s.message, { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.85) }]}>
              {message}
            </T>
          ) : null}
          {onConfirm ? (
            <View style={{ marginTop: 20, gap: 12 }}>
              <PrimaryButton label={confirmLabel ?? '確定'} onPress={onConfirm} />
              <SecondaryButton label={actionLabel} onPress={onClose} />
            </View>
          ) : (
            <PrimaryButton label={actionLabel} onPress={onClose} style={{ marginTop: 20 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    backgroundColor: H.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: H.cardBorder,
    marginBottom: 16,
  },
  title: { color: H.label, fontWeight: '800', fontFamily: H.fontFamily },
  message: { color: H.secondary, fontFamily: H.fontFamily, marginTop: 8 },
});
