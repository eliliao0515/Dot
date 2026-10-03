import type { SymbolEntry } from '../content/symbols/symbols';

/**
 * 符號選擇題的出題邏輯（純函式，不碰畫面）。
 *
 *  - 每局 count 題，「看圖選意思」和「看意思選圖」各半，順序打散
 *  - 同一局的正確答案不重複
 *  - 四個選項：同一組（group，意思接近）的符號不會同時出現；看圖選意思時名稱也不會重複
 */
export type QuizType = 'iconToName' | 'nameToIcon';

export type QuizQuestion = {
  id: string;
  type: QuizType;
  answer: SymbolEntry;
  /** 四個選項（已打散），其中一個是 answer。 */
  options: SymbolEntry[];
};

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const groupOf = (s: SymbolEntry) => s.group ?? `solo:${s.id}`;

function pickOptions(answer: SymbolEntry, pool: SymbolEntry[], rand: () => number): SymbolEntry[] {
  const options = [answer];
  const usedGroups = new Set([groupOf(answer)]);
  const usedNames = new Set([answer.name]);
  for (const cand of shuffle(pool, rand)) {
    if (options.length === 4) break;
    if (usedGroups.has(groupOf(cand)) || usedNames.has(cand.name)) continue;
    options.push(cand);
    usedGroups.add(groupOf(cand));
    usedNames.add(cand.name);
  }
  return shuffle(options, rand);
}

export function buildQuiz(symbols: SymbolEntry[], count = 10, rand: () => number = Math.random): QuizQuestion[] {
  const answers = shuffle(symbols, rand).slice(0, Math.min(count, symbols.length));
  const half = Math.ceil(answers.length / 2);
  const types: QuizType[] = shuffle(
    answers.map((_, i) => (i < half ? 'iconToName' : 'nameToIcon')),
    rand,
  );
  return answers.map((answer, i) => ({
    id: `${answer.id}-${i}`,
    type: types[i],
    answer,
    options: pickOptions(answer, symbols, rand),
  }));
}
