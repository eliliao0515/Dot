import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T } from '../../ui/Scale';
import { C, fz } from '../../ui/theme';
import { ScanFrame } from '../../ui/Icons';
import { Bell, Caret, CaretRight, Eye, QrGlyph, MoneyBadge, SendMoneyGlyph, BillGlyph, HistoryGlyph, PlusCircle, BarGlyph } from './PayIcons';
import { PAY_BG, money } from './PayParts';

/**
 * Wallet 分頁的首頁。版面照使用者提供的真機截圖（2026-10-04）：
 * 大標題「錢包」＋右上點數與鈴鐺、綠色橫幅、Pay Money 餘額卡（眼睛、付款碼、收合）、
 * 卡片底下一排「轉帳／繳費／付款紀錄」。截圖以下的部分是自己補的常用功能，不是照抄。
 * 純呈現層。
 */
export default function WalletHome({
  base,
  balance,
  onOpenCode,
  onOpenScanner,
  onSendMoney,
  onPayBill,
  onHistory,
  onTopUp,
  onUnbuilt,
}: {
  base: number;
  balance: number;
  onOpenCode: () => void;
  onOpenScanner: () => void;
  onSendMoney: () => void;
  onPayBill: () => void;
  onHistory: () => void;
  onTopUp: () => void;
  onUnbuilt: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const icon = fz(base, 1.5);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.content}>
      <View style={s.titleRow}>
        <T style={[s.title, { fontSize: fz(base, 1.75), lineHeight: fz(base, 2.3) }]}>錢包</T>
        <View style={s.pill}>
          <Pressable onPress={onUnbuilt} style={s.pointsBtn} hitSlop={6} accessibilityLabel="點數">
            <View style={s.pCoin}>
              <T style={[s.pCoinText, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.2) }]}>P</T>
            </View>
            <T style={[s.pointsNum, { fontSize: fz(base, 1), lineHeight: fz(base, 1.4) }]}>0</T>
          </Pressable>
          <Pressable onPress={onUnbuilt} hitSlop={8} accessibilityLabel="通知">
            <Bell size={fz(base, 1.5)} color={C.ink} dot />
          </Pressable>
        </View>
      </View>

      <View style={s.cardWrap}>
        <Pressable onPress={onUnbuilt} style={s.banner} accessibilityRole="button">
          <T style={[s.bannerText, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]} numberOfLines={1}>
            數位帳戶開戶，享轉帳優惠
          </T>
          <CaretRight size={fz(base, 0.9)} color="rgba(255,255,255,0.85)" />
        </Pressable>

        <View style={s.card}>
          <View style={s.balanceRow}>
            <MoneyBadge size={fz(base, 2.1)} />
            <View style={{ flex: 1 }}>
              <T style={[s.moneyLabel, { fontSize: fz(base, 0.72), lineHeight: fz(base, 1) }]}>Pay Money</T>
              <T style={[s.balance, { fontSize: fz(base, 1.45), lineHeight: fz(base, 1.9) }]}>
                NT$ {hidden ? '＊＊＊＊' : money(balance)}
              </T>
            </View>
            <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} style={s.cardIcon} accessibilityLabel={hidden ? '顯示金額' : '隱藏金額'}>
              <Eye size={icon} color={C.ink} hidden={hidden} />
            </Pressable>
            <Pressable onPress={onOpenCode} hitSlop={8} style={s.cardIcon} accessibilityLabel="付款碼">
              <QrGlyph size={fz(base, 1.3)} color={C.ink} />
            </Pressable>
            <Pressable onPress={() => setCollapsed((c) => !c)} hitSlop={8} style={s.caretCircle} accessibilityLabel={collapsed ? '展開' : '收合'}>
              <Caret size={fz(base, 1)} color={C.ink} up={!collapsed} />
            </Pressable>
          </View>

          {collapsed ? null : (
            <View style={s.actions}>
              <ActionItem base={base} label="轉帳" icon={<SendMoneyGlyph size={fz(base, 1.3)} color={C.ink} />} onPress={onSendMoney} />
              <ActionItem base={base} label="繳費" icon={<BillGlyph size={fz(base, 1.3)} color={C.ink} />} onPress={onPayBill} />
              <ActionItem base={base} label="付款紀錄" icon={<HistoryGlyph size={fz(base, 1.3)} color={C.ink} />} onPress={onHistory} />
            </View>
          )}
        </View>
      </View>

      <View style={s.grid}>
        <Tile base={base} label="付款碼" icon={<BarGlyph size={icon} color={C.chatGreen} />} onPress={onOpenCode} />
        <Tile base={base} label="掃描" icon={<ScanFrame size={icon} color={C.chatGreen} weight={2.4} />} onPress={onOpenScanner} />
        <Tile base={base} label="儲值" icon={<PlusCircle size={icon} color={C.chatGreen} />} onPress={onTopUp} />
        <Tile base={base} label="轉帳" icon={<SendMoneyGlyph size={icon} color={C.chatGreen} />} onPress={onSendMoney} />
      </View>
    </ScrollView>
  );
}

function ActionItem({ base, label, icon, onPress }: { base: number; label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      {icon}
      <T style={[s.actionText, { fontSize: fz(base, 0.98), lineHeight: fz(base, 1.4) }]}>{label}</T>
    </Pressable>
  );
}

function Tile({ base, label, icon, onPress }: { base: number; label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.tile, pressed && { backgroundColor: '#EEF1F2' }]} accessibilityRole="button">
      {icon}
      <T style={[s.tileText, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.2) }]}>{label}</T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: PAY_BG },
  content: { paddingHorizontal: 16, paddingBottom: 24 },

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 18 },
  title: { color: C.ink, fontWeight: '900' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: C.chatLine },
  pointsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pCoin: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.chatGreen, alignItems: 'center', justifyContent: 'center' },
  pCoinText: { color: '#fff', fontWeight: '900' },
  pointsNum: { color: C.ink, fontWeight: '800' },

  cardWrap: { borderRadius: 14, backgroundColor: C.chatGreen, overflow: 'hidden', borderWidth: 1, borderColor: C.chatLine },
  banner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
  bannerText: { flex: 1, color: '#fff', fontWeight: '800' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  moneyLabel: { color: C.chatGreen, fontWeight: '800' },
  balance: { color: C.ink, fontWeight: '900' },
  cardIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  caretCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.chatLine, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.chatLine, paddingVertical: 14 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  actionText: { color: C.ink, fontWeight: '600' },

  grid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  tile: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.chatLine },
  tileText: { color: C.ink, fontWeight: '700' },
});
