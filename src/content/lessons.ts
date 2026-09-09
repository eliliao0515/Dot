import { Lesson, MapNode, ChatRoomPreview } from '../engine/types';

/**
 * MVP 只做完整的一課：傳語音訊息。
 * 選它的理由是它繞過打字這道最大的牆，長輩學會之後當天就用得到。
 */
export const voiceMessageLesson: Lesson = {
  id: 'voice-msg',
  eyebrow: '第 3 課 · 傳語音訊息',
  title: '淑芬問你晚上幾點到',
  why: '你不用打字，用講的就好。壓著那顆麥克風講話，放開就送出去了。',
  skillName: '傳語音訊息',
  target: { node: 'mic', gesture: 'longPress', minMs: 400 },

  stages: [
    {
      stage: 'guided',
      contact: '淑芬',
      messages: [
        { id: 'g1', from: 'them', kind: 'text', text: '媽，你晚上幾點會到？我先煮飯等你', showName: true },
        { id: 'g2', from: 'them', kind: 'text', text: '要不要我去車站接你' },
      ],
      coach: '壓著右下角這顆綠色的，講「我七點到」',
      note: '按錯不會怎麼樣，慢慢來。',
    },
    {
      stage: 'solo',
      contact: '淑芬',
      messages: [
        { id: 's0', from: 'them', kind: 'voice', seconds: 6, showName: true },
        { id: 's1', from: 'them', kind: 'text', text: '媽，冰箱那包魚要記得煮掉喔' },
      ],
      note: '這一次沒有提示。想不起來就按「卡住了」。',
    },
    {
      // 換人、換話題，用來檢驗他學到的是操作而不是位置記憶。
      // 這一階的對話內容適合由後台 AI 生成變體，人工審過後打包。
      stage: 'transfer',
      contact: '阿美',
      messages: [
        { id: 't1', from: 'them', kind: 'text', text: '明天早上要去市場嗎', showName: true },
        { id: 't2', from: 'them', kind: 'photo', label: '今天的菜' },
        { id: 't3', from: 'them', kind: 'text', text: '你看這個高麗菜多少錢一顆' },
        { id: 't4', from: 'them', kind: 'sticker', sticker: 'thumbsUp' },
        { id: 't5', from: 'them', kind: 'contact', name: '陳醫師' },
      ],
      note: '換一個人、換一件事。用講的回阿美。',
    },
  ],

  realDevice: {
    headline: '現在，換你自己的手機',
    steps: [
      '關掉這個練習 App',
      '打開你平常在用的通訊軟體',
      '找到淑芬，用講的傳一句話給她',
      '傳出去了就回來這裡',
    ],
  },

  done: {
    headline: '你會傳語音訊息了',
    body: '以後想跟誰說話，壓著綠色那顆講就好，不用打字。',
    shareWith: '淑芬',
  },
};

export const stickerLesson: Lesson = {
  id: 'sticker',
  eyebrow: '第 2 課 · 傳貼圖',
  title: '阿弟母親節傳訊息給你',
  why: '不知道要打什麼字沒關係，點一個貼圖就能表達心意，不用打字。',
  skillName: '傳貼圖',
  target: { node: 'sticker', gesture: 'tap', minMs: 0 },
  stages: [
    {
      stage: 'guided',
      contact: '阿弟',
      messages: [
        { id: 'g1', from: 'them', kind: 'text', text: '媽母親節快樂，今天有出去走走嗎？', showName: true },
      ],
      coach: '點下面那個貼圖的圖示，選一個你喜歡的貼圖回他',
      note: '按錯不會怎麼樣，慢慢來。',
    },
    {
      stage: 'solo',
      contact: '阿弟',
      messages: [
        { id: 's1', from: 'them', kind: 'text', text: '我禮拜五生日，晚上要不要一起吃飯？', showName: true },
      ],
      note: '這一次沒有提示。想不起來就按「卡住了」。',
    },
    {
      stage: 'transfer',
      contact: '美玲',
      messages: [
        { id: 't1', from: 'them', kind: 'text', text: '新年快樂！你們家圍爐了嗎？', showName: true },
      ],
      note: '換一個人。想回他，點貼圖選一個就好。',
    },
  ],
  realDevice: {
    headline: '現在，換你自己的手機',
    steps: ['關掉這個練習 App', '打開你平常在用的通訊軟體', '找一個人，傳一個貼圖給他', '傳出去了就回來這裡'],
  },
  done: {
    headline: '你會傳貼圖了',
    body: '以後不知道要打什麼字，點貼圖的圖示選一個貼圖就好，不用打字。',
    shareWith: '阿弟',
  },
};

export const savePhotoLesson: Lesson = {
  id: 'save-photo',
  eyebrow: '第 5 課 · 把照片存起來',
  title: '阿美傳了張照片給你',
  why: '喜歡的照片可以留下來，長按那張照片，選存起來就好。',
  skillName: '把照片存起來',
  target: { node: 'photo', gesture: 'longPress', minMs: 400 },
  stages: [
    {
      stage: 'guided',
      contact: '阿美',
      messages: [
        { id: 'g1', from: 'them', kind: 'photo', label: '巷口的高麗菜', showName: true },
      ],
      coach: '長按這張照片，選「存起來」',
      note: '按錯不會怎麼樣，慢慢來。',
    },
    {
      stage: 'solo',
      contact: '阿美',
      messages: [
        { id: 's1', from: 'them', kind: 'photo', label: '菜市場的芭樂' },
      ],
      note: '這一次沒有提示。想不起來就按「卡住了」。',
    },
    {
      stage: 'transfer',
      contact: '小宇',
      messages: [
        { id: 't1', from: 'them', kind: 'text', text: '阿嬤你看運動會的照片！', showName: true },
        { id: 't2', from: 'them', kind: 'photo', label: '運動會' },
      ],
      note: '換一個人。喜歡的照片一樣長按存起來。',
    },
  ],
  realDevice: {
    headline: '現在，換你自己的手機',
    steps: ['關掉這個練習 App', '打開你平常在用的通訊軟體', '找一張別人傳的照片', '長按它，選存起來', '存好了就回來這裡'],
  },
  done: {
    headline: '你會存照片了',
    body: '以後想留住重要的照片，長按那張照片，選存起來就好。',
    shareWith: '阿美',
  },
};

export const LESSONS: Record<string, Lesson> = {
  [voiceMessageLesson.id]: voiceMessageLesson,
  [stickerLesson.id]: stickerLesson,
  [savePhotoLesson.id]: savePhotoLesson,
};

export const MAP_NODES: MapNode[] = [
  { id: 'read-reply', label: '看訊息、回訊息', sub: '已經會了', state: 'done' },
  { id: 'sticker', label: '傳貼圖', sub: '已經會了', state: 'done', lessonId: 'sticker' },
  { id: 'voice-msg', label: '傳語音訊息', sub: '第 1 次練習，共 3 次', state: 'now', lessonId: 'voice-msg' },
  { id: 'video-call', label: '跟孫子視訊', sub: '還沒開始', state: 'todo' },
  { id: 'save-photo', label: '把照片存起來', sub: '還沒開始', state: 'todo', lessonId: 'save-photo' },
  { id: 'anti-fraud', label: '認出假訊息', sub: '還沒開始', state: 'todo' },
];

/**
 * 聊天列表根頁面用的假聯絡人內容，跟 MAP_NODES 用同一組 id 一一對應。
 * 純情境內容（人物、預覽文字、時間標籤），不影響任何操作路徑或正確答案。
 */
export const CHAT_ROOMS: ChatRoomPreview[] = [
  {
    id: 'read-reply',
    contactName: '美惠',
    avatarGlyph: 'chat',
    avatarColor: '#4C8C99',
    preview: '好啊，禮拜三見面再說',
    time: '昨天',
  },
  {
    id: 'sticker',
    contactName: '阿弟',
    avatarGlyph: 'sticker',
    avatarColor: '#8C7B4C',
    preview: '[貼圖]',
    time: '昨天',
  },
  {
    id: 'voice-msg',
    contactName: '淑芬',
    avatarGlyph: 'mic',
    avatarColor: '#4C7A99',
    preview: '媽，你晚上幾點會到？我先煮飯等你',
    time: '現在',
  },
  {
    id: 'video-call',
    contactName: '小宇（孫子）',
    avatarGlyph: 'video',
    avatarColor: '#7A6B99',
    preview: '阿嬤，我們視訊啦',
    time: '3 天前',
  },
  {
    id: 'save-photo',
    contactName: '阿美',
    avatarGlyph: 'camera',
    avatarColor: '#5B8C6B',
    preview: '你看這個高麗菜多少錢一顆',
    time: '5 天前',
  },
  {
    id: 'anti-fraud',
    contactName: '客服中心',
    avatarGlyph: 'alert',
    avatarColor: '#6B7A99',
    preview: '您的帳戶異常，請點擊連結確認',
    time: '上週',
  },
];
