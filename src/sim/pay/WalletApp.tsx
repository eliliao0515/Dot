import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import WalletHome from './WalletHome';
import PayCodeScreen from './PayCodeScreen';
import ScannerScreen from './ScannerScreen';
import FakeSiteScreen from './FakeSiteScreen';
import {
  AmountScreen, ConfirmScreen, PasswordScreen, DoneScreen, FriendsScreen, HistoryScreen, type PayPurpose,
} from './PayFlowScreens';
import { nowLabel } from './PayParts';
import type { FakeSite, PayFriend, PayMerchant, PayRecord, ScanTarget } from '../../content/pay';

/**
 * 被模擬的 LINE Pay（Wallet 分頁）。跟 LineChatScreen 一樣是「一個 App」：
 * 自己管畫面切換、餘額和付款紀錄，完全不知道課程存在。
 *
 * 店家、好友、掃描器眼前的東西、假網站全部由外層透過 props 給（資料在 content/pay.ts）。
 * 錢都是假的，只活在這個元件掛著的期間。
 */

export type WalletAction =
  /** 還沒做的按鈕。 */
  | { type: 'unbuilt' }
  /** 在假網站上點了欄位或按鈕（準備要填資料了）。外層決定要不要說明。 */
  | { type: 'fakeSiteSubmit'; site: FakeSite }
  /** 換了畫面。外層用來收提示，或判斷現在是不是在付款碼頁。 */
  | { type: 'viewChange'; view: WalletView['name'] };

export type WalletContent = {
  startBalance: number;
  historySeed: PayRecord[];
  friends: PayFriend[];
  scanTargets: ScanTarget[];
  topupOptions: number[];
  passwordLength: number;
  passwordHint?: string;
};

/** 外部來的扣款：店員掃了付款碼。id 一換就是新的一筆。 */
export type WalletCharge = { id: string; merchant: PayMerchant; amount: number };

type WalletView =
  | { name: 'home' }
  | { name: 'code' }
  | { name: 'scan' }
  | { name: 'site'; site: FakeSite }
  | { name: 'friends' }
  | { name: 'history' }
  | { name: 'amount'; purpose: PayPurpose }
  | { name: 'confirm'; purpose: PayPurpose; amount: number }
  | { name: 'password'; purpose: PayPurpose; amount: number }
  | { name: 'done'; purpose: PayPurpose; amount: number; time: string };

export default function WalletApp({
  base,
  content,
  tabBar,
  charge,
  bottomInset = 0,
  onAction,
}: {
  base: number;
  content: WalletContent;
  /** 底部分頁列，只在錢包首頁顯示（其他畫面是全螢幕）。 */
  tabBar: React.ReactNode;
  charge?: WalletCharge | null;
  /** 外層在畫面底部蓋了東西時，可捲動內容底下多留的空間。 */
  bottomInset?: number;
  onAction: (a: WalletAction) => void;
}) {
  const [view, setViewRaw] = useState<WalletView>({ name: 'home' });
  const [balance, setBalance] = useState(content.startBalance);
  const [records, setRecords] = useState<PayRecord[]>(content.historySeed);

  function go(next: WalletView) {
    setViewRaw(next);
    onAction({ type: 'viewChange', view: next.name });
  }
  const home = () => go({ name: 'home' });
  const unbuilt = () => onAction({ type: 'unbuilt' });

  useEffect(() => {
    if (!charge) return;
    go({ name: 'confirm', purpose: { kind: 'pay', merchant: charge.merchant }, amount: charge.amount });
    // 只在新的一筆扣款進來時跳轉。
  }, [charge?.id]);

  function startPurpose(purpose: PayPurpose) {
    if (purpose.kind === 'pay' && purpose.merchant.fixedAmount) {
      go({ name: 'confirm', purpose, amount: purpose.merchant.fixedAmount });
    } else {
      go({ name: 'amount', purpose });
    }
  }

  function settle(purpose: PayPurpose, amount: number) {
    const time = nowLabel();
    const delta = purpose.kind === 'topup' ? amount : -amount;
    const title =
      purpose.kind === 'pay' ? purpose.merchant.name : purpose.kind === 'send' ? `轉帳給 ${purpose.friend.name}` : '儲值（銀行帳戶）';
    setBalance((b) => b + delta);
    setRecords((r) => [{ id: `r-${Date.now()}`, title, amount: delta, time }, ...r]);
    go({ name: 'done', purpose, amount, time });
  }

  function readTarget(t: ScanTarget) {
    if (t.result.kind === 'merchant') startPurpose({ kind: 'pay', merchant: t.result.merchant });
    else go({ name: 'site', site: t.result.site });
  }

  let screen: React.ReactNode;
  switch (view.name) {
    case 'home':
      screen = (
        <>
          <View style={{ flex: 1 }}>
            <WalletHome
              base={base}
              balance={balance}
              onOpenCode={() => go({ name: 'code' })}
              onOpenScanner={() => go({ name: 'scan' })}
              onSendMoney={() => go({ name: 'friends' })}
              onPayBill={unbuilt}
              onHistory={() => go({ name: 'history' })}
              onTopUp={() => go({ name: 'amount', purpose: { kind: 'topup' } })}
              onUnbuilt={unbuilt}
            />
          </View>
          {tabBar}
        </>
      );
      break;
    case 'code':
      screen = <PayCodeScreen base={base} balance={balance} bottomInset={bottomInset} onClose={home} onOpenScanner={() => go({ name: 'scan' })} onUnbuilt={unbuilt} />;
      break;
    case 'scan':
      screen = <ScannerScreen base={base} targets={content.scanTargets} onClose={home} onRead={readTarget} onUnbuilt={unbuilt} />;
      break;
    case 'site': {
      const site = view.site;
      screen = (
        <FakeSiteScreen
          base={base}
          site={site}
          onClose={home}
          onSubmit={() => onAction({ type: 'fakeSiteSubmit', site })}
          onUnbuilt={unbuilt}
        />
      );
      break;
    }
    case 'friends':
      screen = (
        <FriendsScreen
          base={base}
          friends={content.friends}
          onBack={home}
          onPick={(friend) => go({ name: 'amount', purpose: { kind: 'send', friend } })}
          onUnbuilt={unbuilt}
        />
      );
      break;
    case 'history':
      screen = <HistoryScreen base={base} records={records} onBack={home} />;
      break;
    case 'amount': {
      const { purpose } = view;
      screen = (
        <AmountScreen
          base={base}
          purpose={purpose}
          balance={balance}
          quickAmounts={purpose.kind === 'topup' ? content.topupOptions : undefined}
          onBack={purpose.kind === 'send' ? () => go({ name: 'friends' }) : home}
          onNext={(amount) => go({ name: 'confirm', purpose, amount })}
        />
      );
      break;
    }
    case 'confirm': {
      const { purpose, amount } = view;
      screen = (
        <ConfirmScreen
          base={base}
          purpose={purpose}
          amount={amount}
          balance={balance}
          onBack={purpose.kind === 'pay' && purpose.merchant.fixedAmount ? home : () => go({ name: 'amount', purpose })}
          onConfirm={() => go({ name: 'password', purpose, amount })}
          onTopUp={() => go({ name: 'amount', purpose: { kind: 'topup' } })}
        />
      );
      break;
    }
    case 'password': {
      const { purpose, amount } = view;
      screen = (
        <PasswordScreen
          base={base}
          length={content.passwordLength}
          hint={content.passwordHint}
          onBack={() => go({ name: 'confirm', purpose, amount })}
          onDone={() => settle(purpose, amount)}
        />
      );
      break;
    }
    case 'done':
      screen = <DoneScreen base={base} purpose={view.purpose} amount={view.amount} time={view.time} onFinish={home} />;
      break;
  }

  return <View style={{ flex: 1 }}>{screen}</View>;
}
