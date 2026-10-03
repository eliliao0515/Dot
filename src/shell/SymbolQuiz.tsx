import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Animated, AccessibilityInfo } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { fz } from '../ui/theme';
import { Back, Check } from '../ui/Icons';
import SymbolIcon from '../ui/SymbolIcon';
import { PrimaryButton, SecondaryButton } from '../ui/hig/Buttons';
import { H } from '../ui/hig/tokens';
import { SYMBOLS, type SymbolEntry } from '../content/symbols/symbols';
import { POINTS, QUIZ_LENGTH } from '../content/points';
import { buildQuiz, type QuizQuestion } from '../engine/quiz';

/**
 * 符號選擇題（specs/v2/P4-restructure-quiz-points.md §3）。教學外殼，靛藍系，不是模擬畫面。
 *
 * 護欄（使用者 2026-10-04 確認）：
 *  - 不倒數計時、不依作答速度加分
 *  - 答錯不扣分，不用紅色、不放音效；只把正確答案亮出來，告訴他「答案是這個」
 *  - 作答後跳出彈出視窗（背景變暗），答對和答錯樣子明顯不同；要自己按「下一題」才往下（不自動跳題）
 *
 * 四個選項各有一個顏色＋一個數字（1～4），色弱的人也分得出來。
 * 刻意不照抄 Kahoot 的紅藍黃綠＋三角菱形圓方。
 */

/** 四個選項的底色。白字在上面的對比都在 4.5:1 以上。 */
const TILE_COLORS = ['#1F6F8B', '#A4532B', '#5E4B8B', '#4D6B2A'];

type Phase = 'intro' | 'playing' | 'result';

/**
 * 作答後的彈出視窗。背後整個畫面蓋一層半透明黑色，視窗從中間輕輕彈出來
 * （系統開了「減少動態效果」就直接出現）。
 *
 *  - 答對：上面一大塊靛藍色、白色大勾勾、「答對了！」、點數標籤
 *  - 答錯：白底、細框圓圈裡放正確答案的符號、「答案是這個」—— 不用紅色、不用叉叉
 * 兩種都附上這個符號的說明，按下面的大按鈕才繼續。
 */
function ResultPopup({
  right,
  answer,
  lastQuestion,
  onNext,
}: {
  right: boolean;
  answer: SymbolEntry;
  lastQuestion: boolean;
  onNext: () => void;
}) {
  const { base } = useScale();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (!alive) return;
        if (reduce) anim.setValue(1);
        else Animated.spring(anim, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
      });
    return () => {
      alive = false;
    };
  }, [anim]);

  const badge = fz(base, 5.2);

  return (
    <View style={s.overlay} accessibilityViewIsModal>
      <Animated.View style={[s.backdrop, { opacity: anim }]} />
      <Animated.View
        style={[
          s.popup,
          {
            opacity: anim,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          },
        ]}
        accessibilityLiveRegion="polite"
      >
        {right ? (
          <View style={s.popupHeadRight}>
            <View style={[s.popupBadgeRight, { width: badge, height: badge, borderRadius: badge / 2 }]}>
              <Check size={badge * 0.55} color={H.tint} weight={5} />
            </View>
            <T systemScaling style={[s.popupTitleRight, { fontSize: fz(base, 2), lineHeight: fz(base, 2.6) }]}>答對了！</T>
            <View style={s.pointsPill}>
              <T systemScaling style={[s.pointsPillText, { fontSize: fz(base, 1.3), lineHeight: fz(base, 1.7) }]}>
                {`+${POINTS.quizCorrect} 點`}
              </T>
            </View>
          </View>
        ) : (
          <View style={s.popupHeadWrong}>
            <View style={[s.popupBadgeWrong, { width: badge, height: badge, borderRadius: badge / 2 }]}>
              <SymbolIcon icon={answer.icon} size={badge * 0.6} color={H.tint} />
            </View>
            <T systemScaling style={[s.popupTitleWrong, { fontSize: fz(base, 1.6), lineHeight: fz(base, 2.2) }]}>
              答案是這個
            </T>
            <T systemScaling style={[s.popupAnswerName, { fontSize: fz(base, 2), lineHeight: fz(base, 2.6) }]}>
              {`「${answer.name}」`}
            </T>
          </View>
        )}

        <View style={s.popupBody}>
          <View style={s.popupMeaningRow}>
            {right ? <SymbolIcon icon={answer.icon} size={fz(base, 2.2)} color={H.tint} /> : null}
            <T systemScaling style={[s.popupMeaning, { fontSize: fz(base, 1.25), lineHeight: fz(base, 1.8) }]}>
              {right ? `${answer.name}：${answer.meaning}` : answer.meaning}
            </T>
          </View>
          <PrimaryButton label={lastQuestion ? '看結果' : '下一題'} onPress={onNext} />
        </View>
      </Animated.View>
    </View>
  );
}

export default function SymbolQuiz({
  totalPoints,
  onFinishRound,
  onExit,
}: {
  /** 這一局之前的累積點數（結算畫面要顯示加總）。 */
  totalPoints: number;
  /** 一局結束：把答對幾題交給外層；點數由點數模組（和伺服器）依規則計算。 */
  onFinishRound: (correct: number) => void;
  onExit: () => void;
}) {
  const { base } = useScale();
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const questions = useMemo(() => buildQuiz(SYMBOLS, QUIZ_LENGTH), [round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [startTotal, setStartTotal] = useState(totalPoints);

  const q: QuizQuestion | undefined = questions[index];
  const answered = picked !== null;
  const isRight = answered && picked === q?.answer.id;

  function start() {
    setStartTotal(totalPoints);
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setPhase('playing');
  }

  function pick(option: SymbolEntry) {
    if (answered || !q) return;
    setPicked(option.id);
    if (option.id === q.answer.id) setCorrect((n) => n + 1);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    onFinishRound(correct);
    setPhase('result');
  }

  function again() {
    setRound((r) => r + 1);
    setStartTotal(totalPoints);
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setPhase('playing');
  }

  const header = (
    <View style={s.header}>
      <Pressable onPress={onExit} hitSlop={14} accessibilityRole="button" accessibilityLabel="離開" style={s.headerBack}>
        <Back size={fz(base, 1.4)} color={H.tint} />
        <T systemScaling style={[s.headerBackText, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.6) }]}>
          離開
        </T>
      </Pressable>
      {phase === 'playing' ? (
        <T systemScaling style={[s.headerCount, { fontSize: fz(base, 1.15), lineHeight: fz(base, 1.6) }]}>
          {`第 ${index + 1} 題（共 ${questions.length} 題）`}
        </T>
      ) : null}
    </View>
  );

  if (phase === 'intro') {
    return (
      <View style={s.wrap}>
        {header}
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.introIcons}>
            {['chevron-back-outline', 'search-outline', 'settings-outline', 'trash-outline'].map((ic) => (
              <View key={ic} style={s.introIcon}>
                <SymbolIcon icon={ic} size={fz(base, 2.2)} color={H.tint} />
              </View>
            ))}
          </View>
          <T systemScaling style={[s.title, { fontSize: fz(base, 1.9), lineHeight: fz(base, 2.5) }]}>符號選擇題</T>
          <T systemScaling style={[s.lead, { fontSize: fz(base, 1.3), lineHeight: fz(base, 1.9) }]}>
            {`一共 ${QUIZ_LENGTH} 題。看符號選意思，或看意思選符號。\n答對一題得 ${POINTS.quizCorrect} 點，玩完再加 ${POINTS.quizComplete} 點。\n答錯不扣分，慢慢來，沒有時間限制。`}
          </T>
        </ScrollView>
        <View style={s.footer}>
          <PrimaryButton label="開始" onPress={start} />
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    const earned = correct * POINTS.quizCorrect + POINTS.quizComplete;
    return (
      <View style={s.wrap}>
        {header}
        <ScrollView contentContainerStyle={[s.body, { alignItems: 'center' }]}>
          <View style={s.seal}>
            <Check size={fz(base, 3)} color="#fff" weight={4} />
          </View>
          <T systemScaling style={[s.title, s.center, { fontSize: fz(base, 1.9), lineHeight: fz(base, 2.5) }]}>
            {`答對 ${correct} 題`}
          </T>
          <T systemScaling style={[s.earned, { fontSize: fz(base, 2.6), lineHeight: fz(base, 3.3) }]}>{`+${earned} 點`}</T>
          <T systemScaling style={[s.lead, s.center, { fontSize: fz(base, 1.3), lineHeight: fz(base, 1.9) }]}>
            {`累積 ${(startTotal + earned).toLocaleString('zh-TW')} 點`}
          </T>
        </ScrollView>
        <View style={[s.footer, { gap: 12 }]}>
          <PrimaryButton label="再玩一次" onPress={again} />
          <SecondaryButton label="回關卡" onPress={onExit} />
        </View>
      </View>
    );
  }

  if (!q) return null;
  const tileH = q.type === 'iconToName' ? fz(base, 5.5) : fz(base, 7);

  return (
    <View style={s.wrap}>
      {header}
      <ScrollView contentContainerStyle={s.playBody}>
        {/* 題目 */}
        <View style={s.promptCard}>
          {q.type === 'iconToName' ? (
            <>
              <SymbolIcon icon={q.answer.icon} size={fz(base, 6)} color="#1C1C1E" />
              <T systemScaling style={[s.prompt, { fontSize: fz(base, 1.35), lineHeight: fz(base, 1.9) }]}>
                這個符號是什麼意思？
              </T>
            </>
          ) : (
            <T systemScaling style={[s.promptBig, { fontSize: fz(base, 1.55), lineHeight: fz(base, 2.2) }]}>
              {q.answer.ask}
            </T>
          )}
        </View>

        {/* 四個選項，2×2 */}
        <View style={s.grid}>
          {q.options.map((opt, i) => {
            const isAnswer = opt.id === q.answer.id;
            const faded = answered && !isAnswer;
            return (
              <Pressable
                key={opt.id}
                onPress={() => pick(opt)}
                disabled={answered}
                accessibilityRole="button"
                accessibilityLabel={q.type === 'iconToName' ? opt.name : `選項 ${i + 1}`}
                style={({ pressed }) => [
                  s.tile,
                  { backgroundColor: TILE_COLORS[i], minHeight: tileH },
                  faded && { opacity: 0.3 },
                  answered && isAnswer && s.tileAnswer,
                  pressed && !answered && { opacity: 0.85 },
                ]}
              >
                <View style={s.badge}>
                  <T style={[s.badgeText, { color: TILE_COLORS[i], fontSize: fz(base, 0.9), lineHeight: fz(base, 1.2) }]}>
                    {String(i + 1)}
                  </T>
                </View>
                {q.type === 'iconToName' ? (
                  <T systemScaling style={[s.tileText, { fontSize: fz(base, 1.4), lineHeight: fz(base, 1.9) }]}>
                    {opt.name}
                  </T>
                ) : (
                  <SymbolIcon icon={opt.icon} size={fz(base, 3.4)} color="#FFFFFF" />
                )}
                {answered && isAnswer ? (
                  <View style={s.tileCheck}>
                    <Check size={fz(base, 1.4)} color={TILE_COLORS[i]} weight={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

      </ScrollView>

      {/* 作答後：彈出視窗，背後的題目畫面變暗。答對和答錯長得明顯不一樣，但都不用紅色。 */}
      {answered ? (
        <ResultPopup
          right={isRight}
          answer={q.answer}
          lastQuestion={index + 1 >= questions.length}
          onNext={next}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: H.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H.gutter,
    paddingVertical: 10,
    minHeight: 56,
  },
  headerBack: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerBackText: { color: H.tint, fontWeight: '600', fontFamily: H.fontFamily },
  headerCount: { color: H.secondary, fontWeight: '600', fontFamily: H.fontFamily },

  body: { padding: 22, paddingTop: 8, flexGrow: 1, justifyContent: 'center' },
  playBody: { paddingHorizontal: H.gutter, paddingBottom: 24, gap: 16 },
  footer: { paddingHorizontal: 22, paddingBottom: 22, paddingTop: 6 },
  center: { textAlign: 'center' },

  introIcons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: H.card,
    borderWidth: 1,
    borderColor: H.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: H.label, fontWeight: '800', fontFamily: H.fontFamily },
  lead: { color: H.secondary, fontFamily: H.fontFamily, marginTop: 12 },

  promptCard: {
    backgroundColor: H.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: H.cardBorder,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
  },
  prompt: { color: H.label, fontWeight: '700', fontFamily: H.fontFamily, textAlign: 'center' },
  promptBig: { color: H.label, fontWeight: '800', fontFamily: H.fontFamily, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  tileAnswer: { borderWidth: 4, borderColor: '#FFFFFF' },
  tileText: { color: '#FFFFFF', fontWeight: '800', fontFamily: H.fontFamily, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontWeight: '800' },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,20,30,0.55)' },
  popup: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: H.card,
    borderRadius: 22,
    overflow: 'hidden',
  },
  popupHeadRight: { backgroundColor: H.tint, alignItems: 'center', paddingTop: 26, paddingBottom: 22, gap: 10 },
  popupBadgeRight: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  popupTitleRight: { color: '#FFFFFF', fontWeight: '900', fontFamily: H.fontFamily },
  pointsPill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 4 },
  pointsPillText: { color: '#FFFFFF', fontWeight: '800', fontFamily: H.fontFamily },
  popupHeadWrong: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 6,
    gap: 6,
  },
  popupBadgeWrong: {
    backgroundColor: H.tintWash,
    borderWidth: 3,
    borderColor: H.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  popupTitleWrong: { color: H.secondary, fontWeight: '700', fontFamily: H.fontFamily },
  popupAnswerName: { color: H.label, fontWeight: '900', fontFamily: H.fontFamily },
  popupBody: { padding: 20, gap: 18 },
  popupMeaningRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  popupMeaning: { flexShrink: 1, color: H.label, fontFamily: H.fontFamily, textAlign: 'center' },

  seal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: H.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  earned: { color: H.tint, fontWeight: '900', fontFamily: H.fontFamily, marginTop: 8 },
});
