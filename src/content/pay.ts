/**
 * LINE Pay 模擬（Wallet 分頁）的情境資料。純資料，沒有過關路徑。
 *
 * 店家、轉帳對象、掃描器眼前的東西、假網站內容都放在這裡，`sim/pay/` 只負責畫出來。
 * 這裡的錢全部是假的：起始餘額、儲值、付款、轉帳都只存在這次打開模擬器的期間。
 *
 * 防詐內容（假網站的破綻、165）是人工撰寫，改動前要人審。
 */

export type PayMerchant = {
  id: string;
  name: string;
  /** 掃完付款碼後畫面上顯示的店家說明，例如地址。 */
  sub: string;
  /** 店家已經設定好的金額；沒給就要自己輸入金額（像路邊攤、早餐店）。 */
  fixedAmount?: number;
};

/** 假網站：掃到可疑的 QR Code 後會打開的頁面。 */
export type FakeSite = {
  id: string;
  /** 網址列顯示的網址。故意跟官方很像但不一樣。 */
  url: string;
  title: string;
  body: string;
  /** 頁面要你填的欄位（只是畫出來，不能真的輸入）。 */
  fields: string[];
  button: string;
  /** 按下按鈕後，老師（外殼）跳出來說明的破綻。 */
  cues: string[];
};

/** 掃描器裡「眼前的東西」。真手機會用相機，這裡讓長輩選一個對準。 */
export type ScanTarget = {
  id: string;
  /** 選擇列上的名字。 */
  label: string;
  /** 取景畫面裡那張紙／貼紙上寫的字。 */
  caption: string;
  /** 取景畫面的背景色（假裝是現場）。 */
  sceneColor: string;
  result: { kind: 'merchant'; merchant: PayMerchant } | { kind: 'site'; site: FakeSite };
};

export type PayFriend = { id: string; name: string; color: string };

export type PayRecord = {
  id: string;
  title: string;
  /** 正數是收入（儲值、別人轉給你），負數是支出。 */
  amount: number;
  time: string;
};

export const PAY_START_BALANCE = 1000;

/** 儲值金額的快速選項。 */
export const PAY_TOPUP_OPTIONS = [500, 1000, 2000];

/** 練習用付款密碼長度。真的 LINE Pay 是 6 碼，這裡隨便按 6 個數字都會通過。 */
export const PAY_PASSWORD_LENGTH = 6;

export const PAY_FRIENDS: PayFriend[] = [
  { id: 'meihui', name: '美惠', color: '#5B8C6B' },
  { id: 'adi', name: '阿弟', color: '#4C7A99' },
  { id: 'shufen', name: '淑芬', color: '#7A6B99' },
];

export const PAY_HISTORY_SEED: PayRecord[] = [
  { id: 'seed-1', title: '儲值（銀行帳戶）', amount: 1000, time: '10/01 09:12' },
];

const PARKING_SITE: FakeSite = {
  id: 'parking',
  url: 'linepay-tw.parking-pay.cc',
  title: '停車費逾期補繳通知',
  body: '您的車輛有一筆停車費尚未繳納，今日 23:59 前未補繳將加罰 3 倍。請立即填寫資料完成補繳。',
  fields: ['信用卡卡號', '有效期限', '背面末三碼', 'LINE Pay 付款密碼'],
  button: '立即補繳',
  cues: [
    '網址不是官方的。正式的網址不會長得這麼奇怪。',
    '「今天不繳加罰 3 倍」是在催你，越急越要停下來。',
    '真的 LINE Pay 付款，不會叫你在網頁上打信用卡號和付款密碼。',
    '貼在路邊的 QR Code 可能是被人蓋上去的假貼紙。',
  ],
};

const FLYER_SITE: FakeSite = {
  id: 'flyer',
  url: 'line-gift-2026.top/redeem',
  title: '恭喜！您獲得 LINE POINTS 500 點',
  body: '限時活動，只剩最後 3 名！登入 LINE 帳號即可領取。',
  fields: ['手機號碼', 'LINE 密碼', '簡訊驗證碼'],
  button: '登入領取',
  cues: [
    '天上不會掉禮物。「只剩 3 名」是在催你。',
    '網址不是官方的。',
    '密碼和簡訊驗證碼，任何人跟你要都不能給，包括網頁。',
    '不確定的時候：停下來，問家人，或打 165 反詐騙專線。',
  ],
};

export const SCAN_TARGETS: ScanTarget[] = [
  {
    id: 'breakfast',
    label: '早餐店櫃檯',
    caption: '巷口早餐店\n掃碼付款',
    sceneColor: '#6B5A45',
    result: { kind: 'merchant', merchant: { id: 'breakfast', name: '巷口早餐店', sub: '中正路 12 號' } },
  },
  {
    id: 'parking',
    label: '路邊停車貼紙',
    caption: '停車費\n掃碼補繳',
    sceneColor: '#4A5560',
    result: { kind: 'site', site: PARKING_SITE },
  },
  {
    id: 'flyer',
    label: '信箱裡的傳單',
    caption: '掃碼領\n500 點',
    sceneColor: '#5E4A62',
    result: { kind: 'site', site: FLYER_SITE },
  },
  {
    id: 'market',
    label: '菜市場水果攤',
    caption: '阿珠水果\n一份 150',
    sceneColor: '#55663F',
    result: {
      kind: 'merchant',
      merchant: { id: 'market', name: '阿珠水果攤', sub: '第一市場 A12', fixedAmount: 150 },
    },
  },
];

/** 付款密碼畫面下方的小字。 */
export const PAY_PASSWORD_HINT = '練習用：隨便按 6 個數字就可以。\n真的付款密碼不能告訴任何人。';

/** 在付款碼頁按「假裝店員掃了你的付款碼」時，扣款的店家。 */
export const PAY_CASHIER_CHARGE: { merchant: PayMerchant; amount: number } = {
  merchant: { id: 'store', name: '街角便利商店', sub: '收銀台 2 號', fixedAmount: 85 },
  amount: 85,
};
