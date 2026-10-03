import { useEffect, useRef } from 'react';

/**
 * 全螢幕的畫面（LINE 模擬器、課程、模擬器裡的聊天室、手勢題）打開時，在瀏覽紀錄裡推一筆；
 * 使用者按手機或瀏覽器的「上一頁」，就呼叫 onBack 關掉它，而不是整個離開網站。
 *
 * 可以一層疊一層（specs/v2/P5-gestures.md §5）：所有呼叫共用同一個堆疊，
 * 每一筆紀錄的 history.state 記著自己是第幾層（dotDepth）。收到 popstate 時看退到第幾層，
 * 只關掉比那一層更上面的 —— 按一次上一頁只會關一層，不會連外層一起跳掉。
 *
 * 瀏覽紀錄裡的每一筆都一樣（網址不變），只有「幾筆」有意義。所以做法是：
 * 堆疊有幾層，瀏覽紀錄就補到幾層（reconcile），多了就退、少了就推。
 * iPhone Safari 的邊緣滑可能已經自己退過一層，這樣算出來也不會多退，把外層關掉。
 */

type Entry = { id: number; onBack: () => void };

/** 由外往內排。最後一個是最上層，「上一頁」先關它。 */
const stack: Entry[] = [];
let nextId = 1;
let listening = false;
/** history.go() 是非同步的，退回途中不能再推或再退，等 popstate 到了再對一次。 */
let goPending = false;

/**
 * React 同一次更新裡，子元件的 effect 比父元件先跑。同一輪同步執行裡打開的，
 * 後打開的（外層）要排在先打開的（內層）前面，堆疊的裡外順序才對。
 */
let tickStart = -1;
let tickScheduled = false;

function stateDepth(state: unknown): number {
  const d = (state as { dotDepth?: unknown } | null)?.dotDepth;
  return typeof d === 'number' ? d : 0;
}

function reconcile() {
  if (goPending) return;
  const target = stack.length;
  let current = stateDepth(window.history.state);
  if (current > target) {
    goPending = true;
    window.history.go(target - current);
    return;
  }
  while (current < target) {
    current++;
    window.history.pushState({ dotStack: true, dotDepth: current }, '');
  }
}

function onPopState(e: PopStateEvent) {
  if (goPending) {
    // 自己用程式退回去造成的，該關的已經關了；再對一次層數。
    goPending = false;
    reconcile();
    return;
  }
  // 使用者按了上一頁（或系統返回手勢、Safari 邊緣滑）：關掉比退到的那一層更上面的。
  const closed = stack.splice(stateDepth(e.state));
  for (let i = closed.length - 1; i >= 0; i--) closed[i].onBack();
  // 往前（iPhone 右邊緣滑）會跑到比堆疊更深的紀錄，這裡會把它退回來。
  reconcile();
}

function open(onBack: () => void): number {
  if (!listening) {
    window.addEventListener('popstate', onPopState);
    listening = true;
  }
  const entry = { id: nextId++, onBack };
  if (tickStart < 0) tickStart = stack.length;
  stack.splice(tickStart, 0, entry);
  if (!tickScheduled) {
    tickScheduled = true;
    queueMicrotask(() => {
      tickScheduled = false;
      tickStart = -1;
    });
  }
  reconcile();
  return entry.id;
}

function close(id: number) {
  const index = stack.findIndex((e) => e.id === id);
  if (index < 0) return; // 已經被上一頁關掉了
  stack.splice(index, 1);
  if (tickStart > index) tickStart--;
  reconcile();
}

export function useHistoryBack(isOpen: boolean, onBack: () => void) {
  const entryId = useRef<number | null>(null);
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen && entryId.current === null) {
      entryId.current = open(() => {
        entryId.current = null;
        cb.current();
      });
    } else if (!isOpen && entryId.current !== null) {
      close(entryId.current);
      entryId.current = null;
    }
  }, [isOpen]);

  // 畫面整個拿掉（例如換題、離開關卡）也要把自己那一筆退掉。
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined' || entryId.current === null) return;
      close(entryId.current);
      entryId.current = null;
    };
  }, []);
}
