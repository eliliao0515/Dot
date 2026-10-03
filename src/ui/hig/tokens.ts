import { Platform } from 'react-native';
import { C } from '../theme';

/**
 * v2 教學外殼的設計 token，參考 Apple HIG 的 inset grouped 風格。
 *
 * 長輩可用性優先於 HIG（specs/v2/00-overview.md §6.2）：
 *  - 強調色沿用靛藍 —— 藍色是老師、綠色是要學的 App，外殼不可出現 chatGreen
 *  - 次要文字不用 HIG 的 #8E8E93，對比要到 7:1 以上（白內障）
 *  - 卡片用描邊不用陰影，也不用毛玻璃
 */
export const H = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  cardBorder: '#D1D1D6',
  separator: '#C6C6C8',
  pressed: '#E5E5EA',

  tint: C.indigo,
  tintWash: C.indigoWash,

  label: C.ink,
  /** 白底約 9:1、#F2F2F7 底約 8:1。 */
  secondary: '#3E4A55',

  /** 主要按鈕的觸控下限，給手抖與老花的人。 */
  primaryMinHeight: 72,
  rowMinHeight: 64,
  tabBarMinHeight: 64,

  radius: 12,
  gutter: 16,

  fontFamily: Platform.select({
    web: '-apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
    default: undefined,
  }),
} as const;
