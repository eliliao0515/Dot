import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useScale } from '../ui/Scale';
import { fz } from '../ui/theme';
import { CloseX, ArrowRight } from '../ui/Icons';

/**
 * 用相機拍完之後的預覽畫面：黑底、照片置中、左上角關閉、
 * 右下角白底圓形加藍色箭頭的送出鍵。純呈現層，只吃 props。
 */
export default function CameraPreview({
  uri,
  onClose,
  onSend,
}: {
  uri: string;
  onClose: () => void;
  onSend: () => void;
}) {
  const { base } = useScale();
  const sendSize = 60;
  return (
    <View style={s.wrap}>
      <View style={s.topBar}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="關閉">
          <CloseX size={fz(base, 1.4)} color="#fff" />
        </Pressable>
      </View>

      <Image source={{ uri }} style={s.photo} resizeMode="contain" />

      <View style={s.bottomBar}>
        <Pressable
          onPress={onSend}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="傳送"
          style={({ pressed }) => [
            s.send,
            { width: sendSize, height: sendSize, borderRadius: sendSize / 2 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <ArrowRight size={fz(base, 1.7)} />
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
    backgroundColor: '#000',
    zIndex: 50,
  },
  topBar: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row' },
  photo: { flex: 1, width: '100%' },
  bottomBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 18 },
  send: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
