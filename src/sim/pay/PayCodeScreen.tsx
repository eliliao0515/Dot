import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T } from '../../ui/Scale';
import { C, fz } from '../../ui/theme';
import { CloseX, ScanFrame, Trash, Plus } from '../../ui/Icons';
import { FakeBarcode, FakeQr, BarGlyph, QrGlyph, Caret, CaretRight, Refresh, MoneyBadge } from './PayIcons';
import { money } from './PayParts';

/**
 * 付款碼畫面（給店員掃的那一頁）。版面照使用者提供的真機截圖（2026-10-04）：
 * 深色底、左上「LINE Pay」字樣、右上掃描與 ✕；白色卡片依序是會員卡、手機條碼載具、付款碼。
 * 付款碼每 5 分鐘自動換一組（真機也是），倒數到 0 只是換新碼，不是失敗。
 * 條碼都是假的，收銀機讀不到。純呈現層。
 */

const REFRESH_SECONDS = 5 * 60;
/** 手機條碼載具號碼，固定假資料。 */
const CARRIER = '/DOT8K2Q';

function fmtClock(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function PayCodeScreen({
  base,
  balance,
  bottomInset = 0,
  onClose,
  onOpenScanner,
  onUnbuilt,
}: {
  base: number;
  balance: number;
  bottomInset?: number;
  onClose: () => void;
  onOpenScanner: () => void;
  onUnbuilt: () => void;
}) {
  const [left, setLeft] = useState(REFRESH_SECONDS);
  const [round, setRound] = useState(0);
  const [mode, setMode] = useState<'bar' | 'qr'>('bar');
  const [carrierOpen, setCarrierOpen] = useState(true);
  const [codeOpen, setCodeOpen] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRound((r) => r + 1);
          return REFRESH_SECONDS;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function refresh() {
    setRound((r) => r + 1);
    setLeft(REFRESH_SECONDS);
  }

  const seed = `pay-${round}`;
  const digits = String(280000000000000000 + ((round * 7919 + 1234567) % 99999999)).slice(0, 18);
  const label = (m: number, lh: number) => ({ fontSize: fz(base, m), lineHeight: fz(base, lh) });

  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <T style={[s.brand, label(1.35, 1.8)]}>LINE Pay</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
          <Pressable onPress={onOpenScanner} hitSlop={10} accessibilityLabel="掃描">
            <ScanFrame size={fz(base, 1.6)} color="#fff" weight={2.2} />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="關閉">
            <CloseX size={fz(base, 1.8)} color="#fff" weight={2.4} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 30 + bottomInset }]}>
        <View style={s.card}>
          <Pressable onPress={onUnbuilt} style={s.cardHead}>
            <T style={[s.cardTitle, label(1.15, 1.6)]}>我的會員卡</T>
            <Plus size={fz(base, 1.4)} color="#8A939B" />
          </Pressable>
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <T style={[s.cardTitle, label(1.15, 1.6)]}>手機條碼載具</T>
            <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
              <Pressable onPress={onUnbuilt} hitSlop={8} accessibilityLabel="刪除">
                <Trash size={fz(base, 1.4)} color="#8A939B" />
              </Pressable>
              <Pressable onPress={() => setCarrierOpen((o) => !o)} hitSlop={8} accessibilityLabel={carrierOpen ? '收合' : '展開'}>
                <Caret size={fz(base, 1.2)} color="#5B6369" up={carrierOpen} />
              </Pressable>
            </View>
          </View>
          {carrierOpen ? (
            <View style={s.cardBody}>
              <FakeBarcode width={260} height={64} seed={CARRIER} />
              <T style={[s.codeText, label(1, 1.5)]}>{CARRIER}</T>
              <Pressable onPress={onUnbuilt} style={s.linkRow}>
                <T style={[s.link, label(0.9, 1.3)]}>可使用的商店</T>
                <CaretRight size={fz(base, 0.8)} color="#8A939B" />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <T style={[s.cardTitle, label(1.15, 1.6)]}>付款碼</T>
            <Pressable onPress={() => setCodeOpen((o) => !o)} hitSlop={8} accessibilityLabel={codeOpen ? '收合' : '展開'}>
              <Caret size={fz(base, 1.2)} color="#5B6369" up={codeOpen} />
            </Pressable>
          </View>
          {codeOpen ? (
            <View style={{ paddingHorizontal: 18, paddingBottom: 6 }}>
              <View style={s.codeTop}>
                <Pressable onPress={onUnbuilt} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <T style={[s.region, label(1, 1.4)]}>台灣</T>
                  <Caret size={fz(base, 0.9)} color={C.ink} />
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Pressable onPress={() => setMode('bar')} hitSlop={6} accessibilityLabel="條碼">
                    <BarGlyph size={fz(base, 1.4)} color={mode === 'bar' ? C.chatGreen : '#B5BCC2'} />
                  </Pressable>
                  <View style={{ width: 1, height: 22, backgroundColor: C.chatLine }} />
                  <Pressable onPress={() => setMode('qr')} hitSlop={6} accessibilityLabel="QR Code">
                    <QrGlyph size={fz(base, 1.3)} color={mode === 'qr' ? C.chatGreen : '#B5BCC2'} />
                  </Pressable>
                </View>
              </View>

              <View style={s.codeArea}>
                {mode === 'bar' ? (
                  <>
                    <FakeBarcode width={270} height={78} seed={seed} />
                    <T style={[s.codeText, label(0.95, 1.4)]}>{digits.replace(/(\d{4})(?=\d)/g, '$1 ')}</T>
                  </>
                ) : (
                  <FakeQr size={170} seed={seed} />
                )}
              </View>

              <Pressable onPress={refresh} style={s.refreshRow} hitSlop={6} accessibilityLabel="重新產生付款碼">
                <Refresh size={fz(base, 1.2)} color={C.ink} />
                <T style={[s.timer, label(1.05, 1.4)]}>{fmtClock(left)}</T>
              </Pressable>

              <Pressable onPress={onUnbuilt} style={s.methodRow}>
                <MoneyBadge size={fz(base, 2.2)} />
                <T style={[s.method, label(1.2, 1.6)]}>NT$ {money(balance)}</T>
                <Caret size={fz(base, 1.1)} color={C.ink} />
              </Pressable>

              <View style={s.optRow}>
                <T style={[s.optLabel, label(0.95, 1.4)]}>
                  LINE POINTS <T style={{ fontWeight: '900', color: C.ink }}>0</T>
                </T>
                <Pressable onPress={onUnbuilt} style={s.optRight}>
                  <View style={s.checkDot} />
                  <T style={[s.optLabel, label(0.95, 1.4)]}>使用點數</T>
                </Pressable>
              </View>
              <View style={[s.optRow, { borderBottomWidth: 0 }]}>
                <Pressable onPress={onUnbuilt} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <T style={[s.optLabel, label(0.95, 1.4)]}>
                    優惠券 <T style={{ fontWeight: '900', color: C.ink }}>0</T>
                  </T>
                  <CaretRight size={fz(base, 0.8)} color={C.ink} />
                </Pressable>
                <Pressable onPress={onUnbuilt} style={s.optRight}>
                  <View style={s.checkDot} />
                  <T style={[s.optLabel, label(0.95, 1.4)]}>自動套用</T>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#262626' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  brand: { color: '#fff', fontWeight: '900' },
  scroll: { paddingHorizontal: 14, paddingBottom: 30, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  cardTitle: { color: C.ink, fontWeight: '800' },
  cardBody: { alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEF0F2', paddingVertical: 18, gap: 8 },
  codeText: { color: C.ink, letterSpacing: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  link: { color: '#8A939B' },

  codeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF0F2', paddingTop: 16 },
  region: { color: C.ink, fontWeight: '800' },
  codeArea: { alignItems: 'center', justifyContent: 'center', minHeight: 190, gap: 8, paddingVertical: 14 },
  refreshRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingBottom: 12 },
  timer: { color: C.ink, fontWeight: '600' },

  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
  method: { flex: 1, color: C.ink, fontWeight: '900' },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
  optLabel: { color: '#5B6369' },
  optRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E3E6E8' },
});
