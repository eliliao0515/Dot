import React, { useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, PanResponder, StyleSheet, type ViewStyle } from 'react-native';

/**
 * iPhone 的「從左邊緣往右滑回上一頁」。純呈現層：包住一個畫面，手指從左邊緣往右拖，
 * 畫面就跟著手指往右移開，露出底下的上一頁（underlay）；拖得夠遠放開就呼叫 onSwipeBack，
 * 不夠遠就彈回原位 —— 跟真 iPhone 一樣。
 *
 * 只回報「滑回去了」，不判斷對錯。門檻由外層從腳本資料傳進來（specs/v2/P5-gestures.md）。
 *
 * 網頁上的限制（§5）：iPhone Safari 和 Android 的系統返回手勢會先搶走邊緣的觸控，
 * 那種情況這裡收不到，要靠外層的 useHistoryBack 收「上一頁」事件。
 * 這個元件主要是給沒有系統手勢的環境用（iPhone 加到主畫面、電腦）。
 */

export type EdgeSwipeThresholds = {
  /** 手指要從左邊幾 px 以內開始，才算邊緣滑。 */
  edgePx: number;
  /** 拖過畫面寬度的這個比例放開，就算回上一頁。 */
  minRatio: number;
  /** 或是放開時往右的速度超過這個值（px/ms），像真 iPhone 輕輕一撥也會回去。 */
  flickVelocity: number;
};

export default function EdgeSwipeBack({
  thresholds,
  underlay,
  onSwipeBack,
  enabled = true,
  children,
}: {
  thresholds: EdgeSwipeThresholds;
  /** 滑開時露出來的上一頁。 */
  underlay?: React.ReactNode;
  onSwipeBack: () => void;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const box = useRef<View>(null);
  const frame = useRef({ left: 0, width: 0 });

  // PanResponder 只建立一次，裡面讀到的 props 要從 ref 拿最新的。
  const latest = useRef({ thresholds, onSwipeBack, enabled });
  latest.current = { thresholds, onSwipeBack, enabled };

  function measure() {
    box.current?.measureInWindow((left, _top, width) => {
      frame.current = { left, width };
    });
  }

  const responder = useMemo(() => {
    const settle = (to: number, done?: () => void) => {
      Animated.timing(x, {
        toValue: to,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        if (done) done();
        x.setValue(0);
        setDragging(false);
      });
    };

    return PanResponder.create({
      // 用 capture：就算手指一開始落在訊息、按鈕或捲動區上，只要是從邊緣往右拖，就由這裡接手。
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        const { enabled: on, thresholds: t } = latest.current;
        if (!on) return false;
        const startX = g.x0 - frame.current.left;
        return startX <= t.edgePx && g.dx > 6 && Math.abs(g.dx) > Math.abs(g.dy);
      },
      onPanResponderGrant: () => {
        measure();
        setDragging(true);
      },
      onPanResponderMove: (_e, g) => x.setValue(Math.max(0, g.dx)),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_e, g) => {
        const { thresholds: t } = latest.current;
        const width = frame.current.width || 1;
        const far = g.dx >= width * t.minRatio;
        const flick = g.vx >= t.flickVelocity && g.dx > t.edgePx;
        if (far || flick) settle(width, () => latest.current.onSwipeBack());
        else settle(0);
      },
      onPanResponderTerminate: () => settle(0),
    });
  }, [x]);

  const width = frame.current.width || 400;

  return (
    <View ref={box} style={s.wrap} onLayout={measure} {...responder.panHandlers}>
      {dragging && underlay ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            // 底下那一頁像真 iPhone 一樣從左邊一點點跟進來。
            { transform: [{ translateX: x.interpolate({ inputRange: [0, width], outputRange: [-width * 0.3, 0], extrapolate: 'clamp' }) }] },
          ]}
          pointerEvents="none"
        >
          {underlay}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              s.dim,
              { opacity: x.interpolate({ inputRange: [0, width], outputRange: [1, 0], extrapolate: 'clamp' }) },
            ]}
          />
        </Animated.View>
      ) : null}
      <Animated.View style={[s.page, dragging && s.pageEdge, { transform: [{ translateX: x }] }]}>{children}</Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // 網頁上讓瀏覽器只管上下捲動，左右的拖曳交給這裡（不然瀏覽器可能把它當成自己的手勢）。
  wrap: { flex: 1, overflow: 'hidden', touchAction: 'pan-y' } as ViewStyle,
  page: { flex: 1 },
  // 用描邊不用陰影，分出正在移開的那一頁。
  pageEdge: { borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.25)' },
  dim: { backgroundColor: 'rgba(0,0,0,0.12)' },
});
