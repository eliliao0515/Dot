/**
 * 符號圖庫（specs/v2/P4-restructure-quiz-points.md §3，P4b）。
 *
 * 圖示來自 Ionicons（MIT 授權，見同目錄 IONICONS-LICENSE.txt），已轉成程式碼打包進 App，不連網下載。
 * 不用 Apple 的 SF Symbols：它的授權不允許用在網頁和 Android。
 *
 * **名稱、說明、題目都是 AI 起草的草稿（2026-10-04），使用者審過才可以拿來出題。**
 * 意思解釋錯了會教錯 —— CLAUDE.md 的 AI 界線。
 *
 * 欄位：
 *  - icon：Ionicons 的檔名（scripts/build-symbol-icons.mjs 會照這裡列的名字產生 icons.generated.ts）
 *  - name：選項上顯示的短名稱（看圖選意思的答案）
 *  - meaning：按下去會怎樣，一句話（答完題目後顯示）
 *  - ask：看意思選圖的題目
 *  - group：意思很接近的放同一組，出題時同一組不會同時出現在四個選項裡，避免兩個都對
 */
export type SymbolEntry = {
  id: string;
  icon: string;
  name: string;
  meaning: string;
  ask: string;
  group?: string;
};

export const SYMBOLS: SymbolEntry[] = [
  // 移動、找東西
  { id: 'back', icon: 'chevron-back-outline', name: '返回', meaning: '回到上一個畫面。', ask: '想回到上一頁，要按哪一個？' },
  { id: 'close', icon: 'close-outline', name: '關閉', meaning: '把這個畫面或跳出來的小視窗關掉。', ask: '想把跳出來的視窗關掉，要按哪一個？' },
  { id: 'home', icon: 'home-outline', name: '首頁', meaning: '回到這個 App 最一開始的畫面。', ask: '想回到首頁，要按哪一個？' },
  { id: 'menu', icon: 'menu-outline', name: '選單', meaning: '打開一整排功能清單。', ask: '想打開功能清單，要按哪一個？', group: 'more' },
  { id: 'more-h', icon: 'ellipsis-horizontal', name: '更多', meaning: '還有其他功能，按了會跳出更多選項。', ask: '想找更多功能，要按哪一個？', group: 'more' },
  { id: 'more-v', icon: 'ellipsis-vertical', name: '更多', meaning: '還有其他功能，按了會跳出更多選項（直的三個點，Android 常見）。', ask: '想找更多功能，要按哪一個？', group: 'more' },
  { id: 'search', icon: 'search-outline', name: '搜尋', meaning: '找東西、找人、找訊息。', ask: '想找一個人或一則訊息，要按哪一個？' },
  { id: 'add', icon: 'add-outline', name: '新增', meaning: '加一個新的東西進來，例如新增好友、新增照片。', ask: '想新增東西，要按哪一個？' },
  { id: 'settings', icon: 'settings-outline', name: '設定', meaning: '調整手機或 App 的各種設定，例如把字調大。', ask: '想把字調大，要先進哪裡？' },
  { id: 'refresh', icon: 'refresh-outline', name: '重新整理', meaning: '再載入一次，看最新的內容。畫面卡住時也可以試試。', ask: '畫面沒有更新，想再載入一次，要按哪一個？' },

  // 聯絡
  { id: 'call', icon: 'call-outline', name: '打電話', meaning: '打語音電話給對方。', ask: '想打電話給家人，要按哪一個？' },
  { id: 'videocam', icon: 'videocam-outline', name: '視訊', meaning: '打視訊電話，可以看到對方的臉。', ask: '想跟孫子視訊，要按哪一個？' },
  { id: 'mic', icon: 'mic-outline', name: '麥克風', meaning: '錄音、說話，例如錄一段語音訊息。', ask: '想錄一段話傳出去，要按哪一個？' },
  { id: 'mic-off', icon: 'mic-off-outline', name: '關麥克風', meaning: '對方聽不到你說話（通話時的靜音）。', ask: '通話時不想讓對方聽到，要按哪一個？', group: 'mute' },
  { id: 'chat', icon: 'chatbubble-outline', name: '訊息', meaning: '看訊息、聊天。', ask: '想看別人傳來的訊息，要按哪一個？' },
  { id: 'mail', icon: 'mail-outline', name: '電子郵件', meaning: '收信、寄信（Email）。', ask: '想看電子郵件，要按哪一個？' },
  { id: 'send', icon: 'send-outline', name: '送出', meaning: '把打好的訊息傳出去。', ask: '字打好了，要傳出去要按哪一個？' },
  { id: 'person-add', icon: 'person-add-outline', name: '加好友', meaning: '把新朋友加進聯絡人。', ask: '想加新朋友，要按哪一個？' },
  { id: 'people', icon: 'people-outline', name: '群組', meaning: '好幾個人一起聊天，或看好友名單。', ask: '想看家族群組，要按哪一個？' },

  // 照片、影片、聲音
  { id: 'camera', icon: 'camera-outline', name: '相機', meaning: '打開相機拍照。', ask: '想拍照，要按哪一個？' },
  { id: 'image', icon: 'image-outline', name: '照片', meaning: '打開相簿，選照片。', ask: '想從相簿選一張照片，要按哪一個？' },
  { id: 'play', icon: 'play-outline', name: '播放', meaning: '開始播放影片或聲音。', ask: '想播放影片，要按哪一個？' },
  { id: 'pause', icon: 'pause-outline', name: '暫停', meaning: '讓影片或聲音先停下來。', ask: '想讓影片先停一下，要按哪一個？' },
  { id: 'volume', icon: 'volume-high-outline', name: '聲音', meaning: '有聲音、喇叭開著；按了可以調整音量。', ask: '想調整聲音大小，要按哪一個？' },
  { id: 'volume-mute', icon: 'volume-mute-outline', name: '手機靜音', meaning: '手機沒有聲音，你聽不到。', ask: '手機突然沒聲音，可能是開了哪一個？', group: 'mute' },

  // 分享、存檔、修改
  { id: 'share', icon: 'share-outline', name: '分享', meaning: '把照片、網址傳給別人（iPhone 的樣子）。', ask: '想把照片傳給別人，要按哪一個？', group: 'share' },
  { id: 'share-social', icon: 'share-social-outline', name: '分享', meaning: '把照片、網址傳給別人（Android 的樣子）。', ask: '想把照片傳給別人，要按哪一個？', group: 'share' },
  { id: 'download', icon: 'download-outline', name: '下載', meaning: '把照片或檔案存到手機裡。', ask: '想把照片存起來，要按哪一個？' },
  { id: 'copy', icon: 'copy-outline', name: '複製', meaning: '把文字複製起來，可以貼到別的地方。', ask: '想把一段文字複製起來，要按哪一個？' },
  { id: 'trash', icon: 'trash-outline', name: '刪除', meaning: '把東西丟掉。刪掉了可能就找不回來，按之前想一下。', ask: '想刪掉一張照片，要按哪一個？' },
  { id: 'edit', icon: 'create-outline', name: '編輯', meaning: '修改、寫字或畫畫。', ask: '想修改剛剛寫的東西，要按哪一個？' },
  { id: 'heart', icon: 'heart-outline', name: '喜歡', meaning: '按讚、表示喜歡，或收藏起來。', ask: '想對一則貼文表示喜歡，要按哪一個？' },

  // 手機狀態、提醒
  { id: 'bell', icon: 'notifications-outline', name: '通知', meaning: '有新消息時會在這裡提醒你。', ask: '想看有什麼新提醒，要按哪一個？' },
  { id: 'wifi', icon: 'wifi-outline', name: 'Wi-Fi', meaning: '無線網路。連上了就不會用到行動上網的流量。', ask: '想連家裡的無線網路，要找哪一個？' },
  { id: 'battery', icon: 'battery-half-outline', name: '電池', meaning: '手機還剩多少電。', ask: '想知道手機還剩多少電，要看哪一個？' },
  { id: 'lock', icon: 'lock-closed-outline', name: '上鎖', meaning: '有密碼保護，或螢幕鎖住了。', ask: '表示「有密碼保護」的是哪一個？' },
  { id: 'location', icon: 'location-outline', name: '位置', meaning: '地圖上的位置，或你現在在哪裡。', ask: '想讓家人知道你現在在哪裡，要按哪一個？' },
  { id: 'time', icon: 'time-outline', name: '時間', meaning: '時間、鬧鐘，或最近的紀錄。', ask: '想看最近的通話紀錄，常常要找哪一個？' },
  { id: 'calendar', icon: 'calendar-outline', name: '行事曆', meaning: '看日期，記下約會。', ask: '想記下禮拜三要去看醫生，要按哪一個？' },
  { id: 'warning', icon: 'warning-outline', name: '警告', meaning: '要小心！可能有危險或詐騙，先停下來想一想。', ask: '看到哪一個符號，要先停下來、小心？' },
  { id: 'help', icon: 'help-circle-outline', name: '說明', meaning: '不會用的時候，按這裡看說明。', ask: '不知道怎麼用，想看說明要按哪一個？', group: 'info' },
  { id: 'info', icon: 'information-circle-outline', name: '資訊', meaning: '看更詳細的介紹。', ask: '想看更詳細的介紹，要按哪一個？', group: 'info' },
  { id: 'qr', icon: 'qr-code-outline', name: 'QR Code', meaning: '方塊圖案，用相機掃一下，例如加好友、付款、看菜單。', ask: '店家說「掃這個」，指的是哪一個？' },
  { id: 'check', icon: 'checkmark-outline', name: '完成', meaning: '確定、做好了。', ask: '弄好了要按確定，是哪一個？' },
];
