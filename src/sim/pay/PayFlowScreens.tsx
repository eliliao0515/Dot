import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T } from '../../ui/Scale';
import { C, fz } from '../../ui/theme';
import { Check, Search } from '../../ui/Icons';
import { Lock, MoneyBadge } from './PayIcons';
import { PAY_BG, PayHeader, PayButton, Keypad, NameAvatar, money } from './PayParts';
import type { PayFriend, PayMerchant, PayRecord } from '../../content/pay';

/**
 * 付款、轉帳、儲值共用的流程畫面：輸入金額 → 確認 → 付款密碼 → 完成。
 * 加上選轉帳對象、付款紀錄。純呈現層，金額和餘額都由外層（WalletApp）管。
 */

export type PayPurpose =
  | { kind: 'pay'; merchant: PayMerchant }
  | { kind: 'send'; friend: PayFriend }
  | { kind: 'topup' };

const TOPUP_SOURCE = '銀行帳戶（練習用）';

export function purposeText(p: PayPurpose) {
  switch (p.kind) {
    case 'pay':
      return { title: '付款', verb: '付款', to: p.merchant.name, sub: p.merchant.sub, color: '#8C7B4C' };
    case 'send':
      return { title: '轉帳', verb: '轉帳', to: p.friend.name, sub: 'LINE 好友', color: p.friend.color };
    case 'topup':
      return { title: '儲值', verb: '儲值', to: 'Pay Money', sub: `從${TOPUP_SOURCE}`, color: C.chatGreen };
  }
}

function TargetCard({ base, purpose }: { base: number; purpose: PayPurpose }) {
  const t = purposeText(purpose);
  return (
    <View style={s.target}>
      {purpose.kind === 'topup' ? <MoneyBadge size={48} /> : <NameAvatar name={t.to} color={t.color} size={48} />}
      <View style={{ flex: 1 }}>
        <T style={[s.targetName, { fontSize: fz(base, 1.1), lineHeight: fz(base, 1.5) }]}>{t.to}</T>
        <T style={[s.targetSub, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.25) }]}>{t.sub}</T>
      </View>
    </View>
  );
}

export function AmountScreen({
  base,
  purpose,
  balance,
  quickAmounts,
  onBack,
  onNext,
}: {
  base: number;
  purpose: PayPurpose;
  balance: number;
  /** 儲值用的快速金額。 */
  quickAmounts?: number[];
  onBack: () => void;
  onNext: (amount: number) => void;
}) {
  const [text, setText] = useState('');
  const amount = Number(text || '0');
  const t = purposeText(purpose);

  return (
    <View style={s.wrap}>
      <PayHeader title={t.title} base={base} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <TargetCard base={base} purpose={purpose} />
        <View style={s.amountBox}>
          <T style={[s.amountLabel, { fontSize: fz(base, 0.9), lineHeight: fz(base, 1.3) }]}>{t.verb}金額</T>
          <T style={[s.amountBig, { fontSize: fz(base, 2.2), lineHeight: fz(base, 2.8) }, !text && { color: '#B5BCC2' }]}>
            NT$ {money(amount)}
          </T>
          <T style={[s.amountLabel, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.25) }]}>Pay Money 餘額 NT$ {money(balance)}</T>
        </View>
        {quickAmounts ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {quickAmounts.map((q) => (
              <Pressable key={q} onPress={() => setText(String(q))} style={[s.quick, amount === q && s.quickOn]}>
                <T style={[s.quickText, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.35) }]}>{money(q)}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
        <PayButton label="下一步" base={base} disabled={amount <= 0} onPress={() => onNext(amount)} />
      </ScrollView>
      <Keypad
        base={base}
        onDigit={(d) => setText((x) => (x.length >= 6 || (x === '' && d === '0') ? x : x + d))}
        onDelete={() => setText((x) => x.slice(0, -1))}
      />
    </View>
  );
}

export function ConfirmScreen({
  base,
  purpose,
  amount,
  balance,
  onBack,
  onConfirm,
  onTopUp,
}: {
  base: number;
  purpose: PayPurpose;
  amount: number;
  balance: number;
  onBack: () => void;
  onConfirm: () => void;
  onTopUp: () => void;
}) {
  const t = purposeText(purpose);
  const short = purpose.kind !== 'topup' && amount > balance;
  const row = (k: string, v: string) => (
    <View style={s.row} key={k}>
      <T style={[s.rowKey, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>{k}</T>
      <T style={[s.rowVal, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>{v}</T>
    </View>
  );

  return (
    <View style={s.wrap}>
      <PayHeader title={`確認${t.verb}`} base={base} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={s.amountBox}>
          <T style={[s.amountLabel, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>
            {purpose.kind === 'topup' ? '儲值到 Pay Money' : `${t.verb}給 ${t.to}`}
          </T>
          <T style={[s.amountBig, { fontSize: fz(base, 2.2), lineHeight: fz(base, 2.8) }]}>NT$ {money(amount)}</T>
        </View>
        <View style={s.rows}>
          {purpose.kind === 'topup'
            ? [row('儲值來源', TOPUP_SOURCE), row('儲值後餘額', `NT$ ${money(balance + amount)}`)]
            : [row('對象', t.to), row('付款方式', 'Pay Money'), row('目前餘額', `NT$ ${money(balance)}`)]}
        </View>
        {short ? (
          <View style={s.notice}>
            <T style={[s.noticeText, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.45) }]}>Pay Money 餘額不夠，要先儲值。</T>
            <PayButton label="去儲值" base={base} outline onPress={onTopUp} />
          </View>
        ) : null}
        <PayButton label={t.verb} base={base} disabled={short} onPress={onConfirm} />
      </ScrollView>
    </View>
  );
}

export function PasswordScreen({
  base,
  length,
  hint,
  onBack,
  onDone,
}: {
  base: number;
  length: number;
  /** 密碼框下方的小字。 */
  hint?: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (n < length) return;
    const t = setTimeout(onDone, 500);
    return () => clearTimeout(t);
    // onDone 由外層每次重畫都重新建立，這裡只看位數有沒有滿。
  }, [n, length]);

  return (
    <View style={s.wrap}>
      <PayHeader title="付款密碼" base={base} onBack={onBack} close />
      <View style={s.pwBody}>
        <Lock size={fz(base, 2.2)} color={C.ink} />
        <T style={[s.pwTitle, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.6) }]}>請輸入付款密碼</T>
        <View style={s.dots}>
          {Array.from({ length }, (_, i) => (
            <View key={i} style={[s.dot, i < n && s.dotOn]} />
          ))}
        </View>
        {hint ? <T style={[s.pwHint, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.3) }]}>{hint}</T> : null}
      </View>
      <Keypad base={base} onDigit={() => setN((x) => Math.min(length, x + 1))} onDelete={() => setN((x) => Math.max(0, x - 1))} />
    </View>
  );
}

export function DoneScreen({
  base,
  purpose,
  amount,
  time,
  onFinish,
}: {
  base: number;
  purpose: PayPurpose;
  amount: number;
  time: string;
  onFinish: () => void;
}) {
  const t = purposeText(purpose);
  return (
    <View style={[s.wrap, { backgroundColor: '#fff' }]}>
      <View style={s.doneBody}>
        <View style={s.doneCheck}>
          <Check size={44} color="#fff" weight={5} />
        </View>
        <T style={[s.doneTitle, { fontSize: fz(base, 1.35), lineHeight: fz(base, 1.8) }]}>{t.verb}完成</T>
        <T style={[s.amountBig, { fontSize: fz(base, 2.2), lineHeight: fz(base, 2.8) }]}>NT$ {money(amount)}</T>
        <View style={[s.rows, { alignSelf: 'stretch' }]}>
          <View style={s.row}>
            <T style={[s.rowKey, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>{purpose.kind === 'topup' ? '來源' : '對象'}</T>
            <T style={[s.rowVal, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>{purpose.kind === 'topup' ? TOPUP_SOURCE : t.to}</T>
          </View>
          <View style={s.row}>
            <T style={[s.rowKey, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>時間</T>
            <T style={[s.rowVal, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>{time}</T>
          </View>
        </View>
      </View>
      <View style={{ padding: 16 }}>
        <PayButton label="確認" base={base} onPress={onFinish} />
      </View>
    </View>
  );
}

export function FriendsScreen({
  base,
  friends,
  onBack,
  onPick,
  onUnbuilt,
}: {
  base: number;
  friends: PayFriend[];
  onBack: () => void;
  onPick: (f: PayFriend) => void;
  onUnbuilt: () => void;
}) {
  return (
    <View style={s.wrap}>
      <PayHeader title="轉帳" base={base} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Pressable onPress={onUnbuilt} style={s.search}>
          <Search size={fz(base, 1.1)} color="#8A939B" />
          <T style={[s.targetSub, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) }]}>搜尋好友</T>
        </Pressable>
        <T style={[s.section, { fontSize: fz(base, 0.85), lineHeight: fz(base, 1.25) }]}>好友</T>
        <View style={s.rows}>
          {friends.map((f) => (
            <Pressable key={f.id} onPress={() => onPick(f)} style={({ pressed }) => [s.friend, pressed && { backgroundColor: '#F0F2F3' }]}>
              <NameAvatar name={f.name} color={f.color} size={44} />
              <T style={[s.targetName, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.45) }]}>{f.name}</T>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function HistoryScreen({ base, records, onBack }: { base: number; records: PayRecord[]; onBack: () => void }) {
  return (
    <View style={s.wrap}>
      <PayHeader title="付款紀錄" base={base} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.rows}>
          {records.map((r) => (
            <View key={r.id} style={s.record}>
              <View style={{ flex: 1 }}>
                <T style={[s.rowVal, { fontSize: fz(base, 1), lineHeight: fz(base, 1.45), textAlign: 'left' }]}>{r.title}</T>
                <T style={[s.targetSub, { fontSize: fz(base, 0.82), lineHeight: fz(base, 1.2) }]}>{r.time}</T>
              </View>
              <T style={[s.recordAmt, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.45) }, r.amount > 0 && { color: '#0E8F53' }]}>
                {r.amount > 0 ? '+' : ''}
                {money(r.amount)}
              </T>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: PAY_BG },

  target: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.chatLine },
  targetName: { color: C.ink, fontWeight: '800' },
  targetSub: { color: '#5B6369' },

  amountBox: { alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 18, borderWidth: 1, borderColor: C.chatLine },
  amountLabel: { color: '#5B6369' },
  amountBig: { color: C.ink, fontWeight: '900' },
  quick: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.chatLine, backgroundColor: '#fff' },
  quickOn: { borderColor: C.chatGreen },
  quickText: { color: C.ink, fontWeight: '800' },

  rows: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: C.chatLine, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF0F2' },
  rowKey: { color: '#5B6369' },
  rowVal: { color: C.ink, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  notice: { gap: 10, backgroundColor: '#FFF8E6', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EED9A0' },
  noticeText: { color: C.ink, fontWeight: '700' },

  pwBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 20 },
  pwTitle: { color: C.ink, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 14 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#8A939B' },
  dotOn: { backgroundColor: C.ink, borderColor: C.ink },
  pwHint: { color: '#5B6369', textAlign: 'center' },

  doneBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  doneCheck: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.chatGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  doneTitle: { color: C.ink, fontWeight: '900' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.chatLine },
  section: { color: '#5B6369', fontWeight: '700' },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF0F2' },
  record: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF0F2' },
  recordAmt: { color: C.ink, fontWeight: '800' },
});
