import { PracticeQuestion } from '../engine/types';

/**
 * 綜合練習題庫。內容已經由 PM 離線草擬、使用者審過定稿，
 * 照抄進來，不要自己生成、增刪或改寫題目文字。
 * 隨機抽 5 題、不重複的邏輯放在 PracticeSession.tsx。
 */
export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'pq-1',
    kind: 'voiceReply',
    scenario: {
      stage: 'transfer',
      contact: '王阿姨',
      messages: [
        { id: 'pq-1-m1', from: 'them', kind: 'text', text: '禮拜六要不要一起去爬象山？', showName: true },
      ],
      note: '這一題沒有提示，想不起來就按「卡住了」。',
    },
    target: { node: 'mic', gesture: 'longPress', minMs: 400 },
  },
  {
    id: 'pq-2',
    kind: 'voiceReply',
    scenario: {
      stage: 'transfer',
      contact: '家豪',
      messages: [
        { id: 'pq-2-m1', from: 'them', kind: 'text', text: '阿姨，我禮拜天要用你那台果汁機，方便嗎？', showName: true },
      ],
      note: '這一題沒有提示，想不起來就按「卡住了」。',
    },
    target: { node: 'mic', gesture: 'longPress', minMs: 400 },
  },
  {
    id: 'pq-3',
    kind: 'voiceReply',
    scenario: {
      stage: 'transfer',
      contact: '里長',
      messages: [
        { id: 'pq-3-m1', from: 'them', kind: 'text', text: '明天下午社區有里民大會，記得來喔', showName: true },
      ],
      note: '這一題沒有提示，想不起來就按「卡住了」。',
    },
    target: { node: 'mic', gesture: 'longPress', minMs: 400 },
  },
  {
    id: 'pq-4',
    kind: 'videoTap',
    scenario: {
      stage: 'transfer',
      contact: '小美',
      messages: [
        { id: 'pq-4-m1', from: 'them', kind: 'text', text: '阿姨我們在頂樓種的花開了，要不要視訊給你看？', showName: true },
      ],
      note: '想跟對方視訊，點畫面上面的攝影機圖示看看。',
    },
    target: { node: 'video', gesture: 'tap', minMs: 0 },
  },
  {
    id: 'pq-5',
    kind: 'videoTap',
    scenario: {
      stage: 'transfer',
      contact: '建成',
      messages: [
        { id: 'pq-5-m1', from: 'them', kind: 'text', text: '媽，我到高雄了，開視訊給你看飯店房間', showName: true },
      ],
      note: '想跟對方視訊，點畫面上面的攝影機圖示看看。',
    },
    target: { node: 'video', gesture: 'tap', minMs: 0 },
  },
  {
    id: 'pq-6',
    kind: 'voiceReply',
    scenario: {
      stage: 'transfer',
      contact: '阿珍',
      messages: [
        { id: 'pq-6-m1', from: 'them', kind: 'text', text: '你上次說的那個膝蓋藥膏叫什麼名字？', showName: true },
      ],
      note: '這一題沒有提示，想不起來就按「卡住了」。',
    },
    target: { node: 'mic', gesture: 'longPress', minMs: 400 },
  },
  {
    id: 'pq-7',
    kind: 'videoTap',
    scenario: {
      stage: 'transfer',
      contact: '佳佳',
      messages: [
        { id: 'pq-7-m1', from: 'them', kind: 'text', text: '阿嬤你看我畫的圖，我們視訊你才看得清楚', showName: true },
      ],
      note: '想跟對方視訊，點畫面上面的攝影機圖示看看。',
    },
    target: { node: 'video', gesture: 'tap', minMs: 0 },
  },
  {
    id: 'pq-8',
    kind: 'voiceReply',
    scenario: {
      stage: 'transfer',
      contact: '陳伯伯',
      messages: [
        { id: 'pq-8-m1', from: 'them', kind: 'text', text: '下禮拜三的槌球比賽你要不要報名？', showName: true },
      ],
      note: '這一題沒有提示，想不起來就按「卡住了」。',
    },
    target: { node: 'mic', gesture: 'longPress', minMs: 400 },
  },
];
