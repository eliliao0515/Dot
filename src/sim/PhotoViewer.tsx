import React, { useEffect, useRef, useState } from 'react';
import { View, SafeAreaView, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { fz } from '../ui/theme';
import { CloseX, ScanFrame, GridThumb, Smile, Pen, Trash, ShareUp, DownloadTray } from '../ui/Icons';

/**
 * 全螢幕看照片畫面。純呈現層，只吃 props，完全不認得「課程」概念。
 * 版面骨架照 照片編輯.png：頂部列／中間照片／底部兩排工具列。
 * 黑底白字 — 這是獨立的系統層級檢視器，不是聊天畫面也不是教學外殼，
 * 刻意不用綠色也不用靛藍。
 *
 * 掃描／縮圖網格這兩顆頂部裝飾圖示沒有對應的呼叫端功能，點下去只在這裡
 * 自己顯示中性提示；其餘按鈕（表情/畫筆/垃圾桶/分享/下載）一律呼叫對應
 * 的 callback，提示或動作由呼叫端決定。
 */

const TINT_PALETTE = ['#2C3E45', '#3B4A55', '#31404A', '#2E3B44', '#38474F', '#28353D'];
function colorFromLabel(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) % 997;
  return TINT_PALETTE[hash % TINT_PALETTE.length];
}

function useNeutralToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function show(text: string) {
    setMsg(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2000);
  }

  return { msg, show };
}

export default function PhotoViewer({
  photoLabel,
  contactName,
  timestamp,
  onClose,
  onDownload,
  onTrash,
  onShare,
  onDraw,
}: {
  photoLabel: string;
  contactName: string;
  timestamp: string;
  onClose: () => void;
  onDownload: () => void;
  onTrash: () => void;
  onShare: () => void;
  onDraw: () => void;
}) {
  const { base } = useScale();
  const { msg, show } = useNeutralToast();

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.topBar}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
          <CloseX size={fz(base, 1.3)} color="#fff" />
        </Pressable>

        <View style={s.topCenter}>
          <T style={[s.contactName, { fontSize: fz(base, 1), lineHeight: fz(base, 1.4) }]} numberOfLines={1}>
            {contactName}
          </T>
          <T style={[s.timestamp, { fontSize: fz(base, 0.72), lineHeight: fz(base, 1.2) }]} numberOfLines={1}>
            {timestamp}
          </T>
        </View>

        <View style={s.topIcons}>
          <Pressable onPress={() => show('這個功能還沒做好。')} hitSlop={10} accessibilityRole="button">
            <ScanFrame size={fz(base, 1.1)} color="#fff" />
          </Pressable>
          <Pressable onPress={() => show('這個功能還沒做好。')} hitSlop={10} accessibilityRole="button">
            <GridThumb size={fz(base, 1.1)} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[s.photoArea, { backgroundColor: colorFromLabel(photoLabel) }]}>
        <T style={[s.photoLabel, { fontSize: fz(base, 1.1), lineHeight: fz(base, 1.6) }]}>{photoLabel}</T>
      </View>

      {msg ? (
        <View style={s.toast} pointerEvents="none">
          <T style={[s.toastText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.4) }]}>{msg}</T>
        </View>
      ) : null}

      <View style={s.toolbar}>
        <View style={s.toolRow}>
          <Pressable onPress={onDraw} hitSlop={12} accessibilityRole="button">
            <Smile size={fz(base, 1.3)} color="#fff" />
          </Pressable>
          <Pressable onPress={onDraw} hitSlop={12} accessibilityRole="button">
            <Pen size={fz(base, 1.3)} color="#fff" />
          </Pressable>
        </View>

        <View style={s.toolRowBottom}>
          <Pressable onPress={onTrash} hitSlop={12} accessibilityRole="button">
            <Trash size={fz(base, 1.3)} color="#fff" />
          </Pressable>
          <Pressable onPress={onShare} hitSlop={12} accessibilityRole="button">
            <ShareUp size={fz(base, 1.3)} color="#fff" />
          </Pressable>
          <Pressable onPress={onDownload} hitSlop={12} accessibilityRole="button">
            <DownloadTray size={fz(base, 1.3)} color="#fff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  contactName: { color: '#fff', fontWeight: '700' },
  timestamp: { color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  photoArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },

  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 118,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  toastText: { color: '#fff', fontWeight: '600', textAlign: 'center' },

  toolbar: { paddingHorizontal: 20, paddingBottom: 6, gap: 18 },
  toolRow: { flexDirection: 'row', justifyContent: 'space-between' },
  toolRowBottom: { flexDirection: 'row', justifyContent: 'space-around' },
});
