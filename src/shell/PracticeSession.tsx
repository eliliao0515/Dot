import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Check } from '../ui/Icons';
import { Lesson, PracticeQuestion } from '../engine/types';
import { PRACTICE_QUESTIONS } from '../content/practice';
import ChatSim from '../sim/ChatSim';
import BigButton from './BigButton';

/**
 * 「綜合練習」的教學外殼：靛藍色系，包住開場說明／進度／完成畫面。
 * 實際聊天畫面完全沿用既有 ChatSim（綠色系），這裡不重做一份聊天介面。
 * 跟正式課程的三段鷹架無關，不用 guided/solo/transfer 那套字樣。
 */

const QUESTION_COUNT = 5;

function pickRandomQuestions(pool: PracticeQuestion[], count: number): PracticeQuestion[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/** 把一題組成 ChatSim 需要的 Lesson 形狀。用不到的欄位放合理預設值，這個模式不會顯示那些畫面。 */
function toLesson(q: PracticeQuestion): Lesson {
  return {
    id: q.id,
    eyebrow: '綜合練習',
    title: q.scenario.contact,
    why: '',
    skillName: '綜合練習',
    target: q.target,
    stages: [q.scenario],
    realDevice: { headline: '', steps: [] },
    done: { headline: '', body: '', shareWith: '' },
  };
}

type Phase = 'intro' | 'quiz' | 'done';

export default function PracticeSession({ onExit }: { onExit: () => void }) {
  const { base } = useScale();
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);

  function start() {
    setQuestions(pickRandomQuestions(PRACTICE_QUESTIONS, QUESTION_COUNT));
    setIndex(0);
    setPhase('quiz');
  }

  function handleQuestionDone() {
    const next = index + 1;
    if (next >= questions.length) {
      setPhase('done');
    } else {
      setIndex(next);
    }
  }

  if (phase === 'intro') {
    return (
      <View style={s.wrap}>
        <ScrollView contentContainerStyle={s.body}>
          <Pressable onPress={onExit} hitSlop={12}>
            <T systemScaling style={[s.back, { fontSize: fz(base, 0.88), lineHeight: fz(base, 1.4) }]}>
              ‹ 回到聊天列表
            </T>
          </Pressable>

          <T systemScaling style={[s.eyebrow, { fontSize: fz(base, 0.8), lineHeight: fz(base, 1.35) }]}>
            綜合練習
          </T>
          <T systemScaling style={[s.title, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.1) }]}>
            隨機出題，複習學過的技能
          </T>
          <T systemScaling style={[s.why, { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.7) }]}>
            這是複習，不會計分，答錯也沒關係。
          </T>
        </ScrollView>

        <View style={s.footer}>
          <BigButton label="開始" onPress={start} />
        </View>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={s.wrap}>
        <ScrollView contentContainerStyle={[s.body, { alignItems: 'center' }]}>
          <View style={s.seal}>
            <Check size={46} color="#fff" weight={4} />
          </View>
          <T systemScaling style={[s.title, s.center, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.1) }]}>
            這次複習做完了
          </T>
        </ScrollView>

        <View style={s.footer}>
          <BigButton label="回到聊天列表" onPress={onExit} />
        </View>
      </View>
    );
  }

  const question = questions[index];
  if (!question) return null;
  const lesson = toLesson(question);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.progress}>
        <T systemScaling style={[s.progressText, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
          {`第 ${index + 1} 題．共 ${questions.length} 題`}
        </T>
        <Pressable onPress={onExit} hitSlop={14} accessibilityRole="button">
          <T systemScaling style={[s.progressExit, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
            先離開
          </T>
        </Pressable>
      </View>
      <ChatSim key={question.id} lesson={lesson} script={lesson.stages[0]} onDone={handleQuestionDone} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  body: { padding: 22, paddingBottom: 12, flexGrow: 1 },
  footer: { paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },

  back: { color: C.indigo, fontWeight: '700', marginBottom: 16 },
  eyebrow: { color: C.indigo, fontWeight: '700' },
  title: { color: C.ink, fontWeight: '900', marginTop: 10 },
  why: { color: C.ink2, marginTop: 12 },
  center: { textAlign: 'center' },

  seal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
  },

  progress: {
    backgroundColor: C.indigoDark,
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: { color: '#B9CEDC', fontWeight: '700', flex: 1 },
  progressExit: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
});
