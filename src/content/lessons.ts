import { Lesson, MapNode } from '../engine/types';

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

export const LESSONS: Record<string, Lesson> = {
  [voiceMessageLesson.id]: voiceMessageLesson,
};

export const MAP_NODES: MapNode[] = [
  { id: 'read-reply', label: '看訊息、回訊息', sub: '已經會了', state: 'done' },
  { id: 'sticker', label: '傳貼圖', sub: '已經會了', state: 'done' },
  { id: 'voice-msg', label: '傳語音訊息', sub: '第 1 次練習，共 3 次', state: 'now', lessonId: 'voice-msg' },
  { id: 'video-call', label: '跟孫子視訊', sub: '還沒開始', state: 'todo' },
  { id: 'save-photo', label: '把照片存起來', sub: '還沒開始', state: 'todo' },
  { id: 'anti-fraud', label: '認出假訊息', sub: '還沒開始', state: 'todo' },
];
