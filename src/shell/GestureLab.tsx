import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { T } from '../ui/Scale';
import { C } from '../ui/theme';
import { H } from '../ui/hig/tokens';
import EdgeSwipeBack from '../sim/EdgeSwipeBack';
import { DEFAULT_GESTURE_THRESHOLDS } from '../content/gestures';
import { useHistoryBack } from '../ui/useHistoryBack';

/**
 * 手勢測試頁（specs/v2/P5-gestures.md §5.3）。只給開發者和志工在實機上排查用，
 * 網址帶 ?gesturelab=1 才出現，長輩的正常使用路徑永遠看不到。
 *
 * 一條一條試：我們要的手勢，在這支手機、這個瀏覽器上會不會被系統或瀏覽器搶走。
 * 結果用來決定每一題在哪些環境可以在 App 裡做、哪些只能「到真手機」做。
 * 不蒐集、不上傳任何東西，紀錄只顯示在畫面上。
 */

type Log = { at: string; text: string };

function now() {
  const d = new Date();
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(
    Math.floor(d.getMilliseconds() / 100),
  )}`;
}

function useLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const add = (text: string) => setLogs((prev) => [{ at: now(), text }, ...prev].slice(0, 8));
  return { logs, add, clear: () => setLogs([]) };
}

/** RN Web 的 View ref 就是 DOM 元素。 */
function dom(ref: React.RefObject<View | null>): HTMLElement | null {
  return (ref.current as unknown as HTMLElement | null) ?? null;
}

function envInfo(): string[] {
  if (typeof window === 'undefined') return [];
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const standalone = nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
  return [
    `加到主畫面（standalone）：${standalone ? '是' : '否'}`,
    `LINE 內建瀏覽器：${/\bLine\//i.test(nav.userAgent) ? '是' : '否'}`,
    `最多幾指觸控：${nav.maxTouchPoints ?? '?'}`,
    `畫面寬 × 高：${window.innerWidth} × ${window.innerHeight}`,
    `UA：${nav.userAgent}`,
  ];
}

function Section({ title, how, children }: { title: string; how: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <T systemScaling style={s.h2}>
        {title}
      </T>
      <T systemScaling style={s.how}>
        {how}
      </T>
      {children}
    </View>
  );
}

function LogList({ logs }: { logs: Log[] }) {
  return (
    <View style={s.logBox}>
      {logs.length === 0 ? (
        <T systemScaling style={s.logEmpty}>
          （還沒有紀錄）
        </T>
      ) : (
        logs.map((l, i) => (
          <T systemScaling key={i} style={s.logLine}>
            {`${l.at}　${l.text}`}
          </T>
        ))
      )}
    </View>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.btn} accessibilityRole="button">
      <T systemScaling style={s.btnText}>
        {label}
      </T>
    </Pressable>
  );
}

/** 1. 回上一頁：系統／瀏覽器的上一頁 vs 我們自己偵測的邊緣滑。 */
function BackTest() {
  const { logs, add, clear } = useLog();
  const [armed, setArmed] = useState(false);
  useHistoryBack(armed, () => {
    add('收到「上一頁」事件（系統或瀏覽器的返回）');
    setArmed(false);
  });
  return (
    <Section
      title="1. 從左邊緣往右滑"
      how="先按「準備好」（會推一筆瀏覽紀錄），再從螢幕最左邊往右滑。看下面記到哪一種，還有這一頁有沒有被關掉。"
    >
      <Btn label={armed ? '已準備（再滑一次）' : '準備好'} onPress={() => setArmed(true)} />
      <View style={s.edgeArea}>
        <EdgeSwipeBack
          thresholds={DEFAULT_GESTURE_THRESHOLDS.edgeSwipe}
          underlay={<View style={[s.fill, { backgroundColor: H.bg }]} />}
          onSwipeBack={() => add('我們自己偵測到邊緣滑')}
        >
          <View style={[s.fill, s.edgeInner]}>
            <T systemScaling style={s.areaText}>
              這一塊會跟著手指滑開
            </T>
          </View>
        </EdgeSwipeBack>
      </View>
      <LogList logs={logs} />
      <Btn label="清除紀錄" onPress={clear} />
    </Section>
  );
}

/** 2. 長按：瀏覽器會不會跳出自己的選取、放大鏡、拷貝選單。 */
function LongPressTest() {
  const { logs, add, clear } = useLog();
  const guarded = useRef<View>(null);
  const plain = useRef<View>(null);

  useEffect(() => {
    const g = dom(guarded);
    const p = dom(plain);
    if (!g || !p) return;
    g.style.setProperty('-webkit-touch-callout', 'none');
    g.style.setProperty('-webkit-user-select', 'none');
    g.style.setProperty('user-select', 'none');
    const block = (e: Event) => {
      e.preventDefault();
      add('A：攔下了瀏覽器的長按選單');
    };
    const seenPlain = () => add('B：瀏覽器跳出自己的長按選單（contextmenu）');
    const onSelect = () => {
      const text = window.getSelection()?.toString();
      if (text) add(`有文字被選取：「${text.slice(0, 12)}」`);
    };
    g.addEventListener('contextmenu', block);
    p.addEventListener('contextmenu', seenPlain);
    document.addEventListener('selectionchange', onSelect);
    return () => {
      g.removeEventListener('contextmenu', block);
      p.removeEventListener('contextmenu', seenPlain);
      document.removeEventListener('selectionchange', onSelect);
    };
  }, []);

  return (
    <Section title="2. 長按" how="分別長按 A 和 B 一秒以上。A 有攔瀏覽器的選單，B 沒有。看會不會出現選取文字、放大鏡、「拷貝」選單或震動。">
      <View style={s.row}>
        <Pressable
          ref={guarded}
          style={[s.pressBox, { borderColor: H.tint }]}
          delayLongPress={500}
          onLongPress={() => add('A：長按成立（500ms）')}
        >
          <T style={s.areaText}>A 有攔　長按我</T>
        </Pressable>
        <Pressable ref={plain} style={s.pressBox} delayLongPress={500} onLongPress={() => add('B：長按成立（500ms）')}>
          <T systemScaling selectable style={s.areaText}>
            B 沒攔　長按我
          </T>
        </Pressable>
      </View>
      <LogList logs={logs} />
      <Btn label="清除紀錄" onPress={clear} />
    </Section>
  );
}

/** 3. 雙指縮放：整頁會不會跟著放大。 */
function PinchTest() {
  const { logs, add, clear } = useLog();
  const area = useRef<View>(null);
  const [live, setLive] = useState('—');
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    const el = dom(area);
    if (!el) return;
    el.style.setProperty('touch-action', 'none');
    let startDist = 0;
    let maxScale = 1;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        maxScale = 1;
      }
      setLive(`${e.touches.length} 指`);
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault();
        const sc = dist(e.touches) / startDist;
        maxScale = Math.max(maxScale, sc);
        setLive(`2 指，${sc.toFixed(2)} 倍`);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (startDist > 0 && e.touches.length < 2) {
        add(`偵測到兩指縮放，最大 ${maxScale.toFixed(2)} 倍`);
        startDist = 0;
      }
      setLive(`${e.touches.length} 指`);
    };
    // iPhone Safari 會忽略「禁止縮放」，要另外攔它自己的 gesture 事件。
    const onGesture = (e: Event) => e.preventDefault();
    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    el.addEventListener('gesturestart', onGesture);
    el.addEventListener('gesturechange', onGesture);

    const vv = window.visualViewport;
    const onVV = () => setPageScale(vv?.scale ?? 1);
    vv?.addEventListener('resize', onVV);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      el.removeEventListener('gesturestart', onGesture);
      el.removeEventListener('gesturechange', onGesture);
      vv?.removeEventListener('resize', onVV);
    };
  }, []);

  return (
    <Section title="3. 雙指縮放" how="兩根手指放在框裡張開、捏合。框外也試一次。看「整頁放大倍率」有沒有變（框裡應該不變、框外照常可以放大）。">
      <View ref={area} style={[s.pinchArea]}>
        <T style={s.areaText}>{`框裡：${live}`}</T>
      </View>
      <T systemScaling style={s.meta}>{`整頁放大倍率：${pageScale.toFixed(2)}`}</T>
      <LogList logs={logs} />
      <Btn label="清除紀錄" onPress={clear} />
    </Section>
  );
}

/** 4. 雙擊：兩下間隔多久，整頁會不會被放大。 */
function DoubleTapTest() {
  const { logs, add, clear } = useLog();
  const lastTap = useRef(0);
  return (
    <Section title="4. 雙擊" how="在框裡連續點兩下。看兩下的間隔，還有整頁會不會被放大（上面第 3 項的倍率）。">
      <Pressable
        style={s.pressBox}
        onPress={() => {
          const t = Date.now();
          const gap = t - lastTap.current;
          lastTap.current = t;
          if (gap < 1500) add(`兩下間隔 ${gap}ms`);
          else add('第一下');
        }}
      >
        <T style={s.areaText}>連續點兩下</T>
      </Pressable>
      <LogList logs={logs} />
      <Btn label="清除紀錄" onPress={clear} />
    </Section>
  );
}

/** 5. 往下拉：會不會觸發瀏覽器的下拉重新整理。 */
function PullTest({ loads }: { loads: number }) {
  return (
    <Section title="5. 往下拉" how="捲到這一頁最上面，再用力往下拉。如果下面的數字變大，代表瀏覽器重新整理了這一頁（下拉重新整理沒攔住）。">
      <T systemScaling style={s.meta}>{`這個分頁載入了 ${loads} 次`}</T>
    </Section>
  );
}

export default function GestureLab() {
  const [loads, setLoads] = useState(0);
  useEffect(() => {
    try {
      const n = Number(window.sessionStorage.getItem('dot:gesturelab:loads') ?? '0') + 1;
      window.sessionStorage.setItem('dot:gesturelab:loads', String(n));
      setLoads(n);
    } catch {
      setLoads(-1);
    }
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={s.wrap}>
        <T systemScaling style={s.h1}>
          手勢測試頁只在網頁版有。
        </T>
      </View>
    );
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.body}>
      <T systemScaling style={s.h1}>
        手勢測試頁
      </T>
      <View style={s.logBox}>
        {envInfo().map((line, i) => (
          <T systemScaling key={i} selectable style={s.logLine}>
            {line}
          </T>
        ))}
      </View>
      <BackTest />
      <LongPressTest />
      <PinchTest />
      <DoubleTapTest />
      <PullTest loads={loads} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: H.bg },
  body: { padding: H.gutter, paddingBottom: 60, gap: 16 },
  fill: { flex: 1 },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '800', color: H.label },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '800', color: H.label },
  how: { fontSize: 18, lineHeight: 27, color: H.secondary, marginTop: 4, marginBottom: 10 },
  meta: { fontSize: 18, lineHeight: 26, color: H.label, marginTop: 8 },
  section: {
    backgroundColor: H.card,
    borderWidth: 1,
    borderColor: H.cardBorder,
    borderRadius: H.radius,
    padding: H.gutter,
  },
  row: { flexDirection: 'row', gap: 10 },
  edgeArea: { height: 140, marginTop: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: H.cardBorder },
  edgeInner: { backgroundColor: C.indigoWash, alignItems: 'center', justifyContent: 'center' },
  pressBox: {
    flex: 1,
    minHeight: 96,
    borderWidth: 2,
    borderColor: H.cardBorder,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#fff',
  },
  pinchArea: {
    height: 180,
    borderWidth: 2,
    borderColor: H.tint,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.indigoWash,
  } as ViewStyle,
  areaText: { fontSize: 18, lineHeight: 26, color: H.label, fontWeight: '700', textAlign: 'center' },
  logBox: { marginTop: 10, backgroundColor: '#F7F7F9', borderRadius: 8, padding: 10, gap: 2 },
  logEmpty: { fontSize: 16, lineHeight: 22, color: H.secondary },
  logLine: { fontSize: 15, lineHeight: 21, color: H.label },
  btn: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: H.tintWash,
    borderWidth: 1.5,
    borderColor: H.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 18, lineHeight: 24, color: H.tint, fontWeight: '700' },
});
