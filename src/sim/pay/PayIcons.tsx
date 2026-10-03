import React from 'react';
import { View } from 'react-native';

/**
 * LINE Pay 模擬用的圖示，全部用 View 自己畫（不用第三方 logo 或圖示素材）。
 * 條碼和 QR Code 是依字串算出來的假圖案，不是能被真的收銀機讀到的碼。
 */

function hashSeq(seed: string, n: number): number[] {
  let h = 7;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = (h * 31 + seed.charCodeAt(i % seed.length) + i * 17) % 10007;
    out.push(h);
  }
  return out;
}

/** 假的 QR Code：三個角有定位方塊，其餘依 seed 填格子。 */
export function FakeQr({ size, seed, color = '#111' }: { size: number; seed: string; color?: string }) {
  const n = 21;
  const cell = size / n;
  const bits = hashSeq(seed, n * n);
  const finder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      if (inBox(r0, c0)) {
        const rr = r - r0;
        const cc = c - c0;
        const ring = Math.min(rr, cc, 6 - rr, 6 - cc);
        return ring === 0 || ring >= 2 ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const f = finder(r, c);
      const on = f === -1 ? bits[r * n + c] % 2 === 0 : f === 1;
      if (on) {
        cells.push(
          <View key={`${r}-${c}`} style={{ position: 'absolute', left: c * cell, top: r * cell, width: cell + 0.3, height: cell + 0.3, backgroundColor: color }} />,
        );
      }
    }
  }
  return <View style={{ width: size, height: size }}>{cells}</View>;
}

/** 假的一維條碼。 */
export function FakeBarcode({ width, height, seed, color = '#111' }: { width: number; height: number; seed: string; color?: string }) {
  const bars = hashSeq(seed, 48).map((v) => 1 + (v % 3));
  const total = bars.reduce((a, b) => a + b, 0) * 2;
  const unit = width / total;
  return (
    <View style={{ width, height, flexDirection: 'row' }}>
      {bars.map((w, i) => (
        <React.Fragment key={i}>
          <View style={{ width: w * unit, height, backgroundColor: color }} />
          <View style={{ width: ((i * 7) % 3 === 0 ? 2 : 1) * unit, height }} />
        </React.Fragment>
      ))}
    </View>
  );
}

/** 小 QR 圖示（錢包卡片上「付款碼」那顆）。 */
export function QrGlyph({ size = 24, color = '#111' }) {
  const box = (top: number, left: number) => (
    <View
      style={{
        position: 'absolute',
        top: top * size,
        left: left * size,
        width: size * 0.36,
        height: size * 0.36,
        borderWidth: size * 0.09,
        borderColor: color,
      }}
    />
  );
  return (
    <View style={{ width: size, height: size }}>
      {box(0, 0)}
      {box(0, 0.64)}
      {box(0.64, 0)}
      <View style={{ position: 'absolute', top: size * 0.64, left: size * 0.64, width: size * 0.14, height: size * 0.14, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.86, left: size * 0.86, width: size * 0.14, height: size * 0.14, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.64, left: size * 0.86, width: size * 0.14, height: size * 0.14, backgroundColor: color }} />
    </View>
  );
}

/** 條碼圖示（付款碼切換用）。 */
export function BarGlyph({ size = 24, color = '#111' }) {
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: size * 0.08 }}>
      {[0.16, 0.08, 0.16, 0.16].map((w, i) => (
        <View key={i} style={{ width: size * w, height: size * 0.86, backgroundColor: color, borderRadius: 1 }} />
      ))}
    </View>
  );
}

/** 眼睛（顯示／隱藏金額）。hidden 時多一條斜線。 */
export function Eye({ size = 24, color = '#111', hidden = false }) {
  const w = size * 0.09;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.9,
          height: size * 0.56,
          borderRadius: size * 0.45,
          borderWidth: w,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13, borderWidth: w, borderColor: color }} />
      </View>
      {hidden ? (
        <View style={{ position: 'absolute', width: size, height: w, backgroundColor: color, transform: [{ rotate: '-35deg' }] }} />
      ) : null}
    </View>
  );
}

/** 鈴鐺（通知）。 */
export function Bell({ size = 24, color = '#111', dot = false }) {
  const w = size * 0.08;
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          marginTop: size * 0.1,
          width: size * 0.64,
          height: size * 0.62,
          borderTopLeftRadius: size * 0.32,
          borderTopRightRadius: size * 0.32,
          borderWidth: w,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
      <View style={{ width: size * 0.86, height: w, backgroundColor: color, borderRadius: w }} />
      <View style={{ width: size * 0.22, height: size * 0.1, borderBottomLeftRadius: size * 0.11, borderBottomRightRadius: size * 0.11, backgroundColor: color, marginTop: size * 0.04 }} />
      {dot ? (
        <View style={{ position: 'absolute', top: 0, right: 0, width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13, backgroundColor: '#12B76A' }} />
      ) : null}
    </View>
  );
}

/** 往上／往下的小箭頭（展開收合）。 */
export function Caret({ size = 16, color = '#111', up = false, weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderLeftWidth: weight,
          borderTopWidth: weight,
          borderColor: color,
          transform: [{ translateY: up ? size * 0.12 : -size * 0.12 }, { rotate: up ? '45deg' : '225deg' }],
        }}
      />
    </View>
  );
}

/** 往右的小箭頭。 */
export function CaretRight({ size = 14, color = '#111', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRightWidth: weight,
          borderTopWidth: weight,
          borderColor: color,
          transform: [{ translateX: -size * 0.1 }, { rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/** 錢幣上一個箭頭（轉帳）。 */
export function SendMoneyGlyph({ size = 24, color = '#111' }) {
  const w = size * 0.08;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, borderWidth: w, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.06, height: size * 0.42, backgroundColor: color }} />
      </View>
      <View style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.44, height: size * 0.44, borderRadius: size * 0.22, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.22, height: w, backgroundColor: '#fff' }} />
        <View
          style={{
            position: 'absolute',
            right: size * 0.1,
            width: size * 0.12,
            height: size * 0.12,
            borderRightWidth: w,
            borderTopWidth: w,
            borderColor: '#fff',
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    </View>
  );
}

/** 帳單（繳費）。 */
export function BillGlyph({ size = 24, color = '#111' }) {
  const w = size * 0.08;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.86, height: size * 0.66, borderWidth: w, borderColor: color, borderRadius: 2, paddingTop: size * 0.12, paddingLeft: size * 0.14, flexDirection: 'row', gap: size * 0.05 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: w, height: size * 0.14, backgroundColor: color }} />
        ))}
      </View>
    </View>
  );
}

/** 紀錄（時鐘＋單據）。 */
export function HistoryGlyph({ size = 24, color = '#111' }) {
  const w = size * 0.08;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size * 0.7, height: size * 0.84, borderWidth: w, borderColor: color, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.3, height: w, backgroundColor: color, marginBottom: size * 0.08 }} />
        <View style={{ width: size * 0.3, height: w, backgroundColor: color }} />
      </View>
      <View style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.46, height: size * 0.46, borderRadius: size * 0.23, borderWidth: w, borderColor: color, backgroundColor: '#fff' }} />
    </View>
  );
}

/** 加號（儲值）。 */
export function PlusCircle({ size = 24, color = '#111' }) {
  const w = size * 0.08;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: w, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.46, height: w, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: w, height: size * 0.46, backgroundColor: color }} />
    </View>
  );
}

/** 繞一圈的箭頭（重新產生付款碼）。 */
export function Refresh({ size = 20, color = '#111' }) {
  const w = size * 0.1;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          borderWidth: w,
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.06,
          right: size * 0.1,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.16,
          borderRightWidth: size * 0.16,
          borderBottomWidth: size * 0.22,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          transform: [{ rotate: '100deg' }],
        }}
      />
    </View>
  );
}

/** 錢包卡片上 Pay Money 的小標（自己畫的綠色錢幣，不是官方 logo）。 */
export function MoneyBadge({ size = 36 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.56, height: size * 0.56, borderRadius: size * 0.28, borderWidth: size * 0.07, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.07, height: size * 0.3, backgroundColor: '#fff' }} />
      </View>
    </View>
  );
}

/** 鎖頭（付款密碼）。 */
export function Lock({ size = 28, color = '#111' }) {
  const w = size * 0.09;
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View style={{ width: size * 0.5, height: size * 0.42, borderTopLeftRadius: size * 0.25, borderTopRightRadius: size * 0.25, borderWidth: w, borderBottomWidth: 0, borderColor: color }} />
      <View style={{ width: size * 0.8, height: size * 0.52, borderRadius: size * 0.08, backgroundColor: color }} />
    </View>
  );
}

/** 地球（瀏覽器網址列前面，表示這是網頁）。 */
export function Globe({ size = 16, color = '#111' }) {
  const w = size * 0.1;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: w, borderColor: color, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ width: size * 0.44, height: size, borderRadius: size * 0.22, borderWidth: w, borderColor: color }} />
      <View style={{ position: 'absolute', width: size, height: w, backgroundColor: color }} />
    </View>
  );
}
