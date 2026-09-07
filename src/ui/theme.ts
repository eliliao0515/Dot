import { Platform, TextStyle } from 'react-native';

/**
 * 教學外殼用靛藍，被模擬的通訊軟體用綠色。
 * 兩層顏色刻意分開，長輩才分得出「現在是在練習」還是「回到真的 App」。
 */
export const C = {
  ink: '#16202B',
  ink2: '#4C5C6A',
  ink3: '#7B8894',
  paper: '#FFFFFF',
  page: '#EBE6DC',
  line: '#D5CEC1',

  indigo: '#1D4E6B',
  indigoDark: '#10334A',
  indigoWash: '#E4EDF3',

  red: '#B32B22',
  redWash: '#FBE9E7',

  chatGreen: '#12B76A',
  chatGreenInk: '#0A2A1B',
  chatBg: '#C3D3DD',
  chatBar: '#F2F4F5',
  chatLine: '#DDE1E4',
  chatInk: '#4A5158',

  /** 真機系統層級提示專用（例如「已儲存」toast）。不是教學外殼，也不是 LINE 介面本身的顏色。 */
  osChrome: 'rgba(20,20,20,0.85)',
} as const;

/** 字級檔位。模擬層完全由這個值驅動，不吃系統縮放。 */
export const FONT_STEPS = {
  standard: 16,
  large: 19.5,
} as const;

export type FontStepKey = keyof typeof FONT_STEPS;

/** 以基準字級乘上倍率，四捨五入到 0.5px，避免中文字在 Android 上抖動。 */
export function fz(base: number, mult: number): number {
  return Math.round(base * mult * 2) / 2;
}

/**
 * Android 的 Text 預設會加上字體內距，中文行高會比 iOS 高好幾像素。
 * 每一個 Text 都套這個，並且明確指定 lineHeight，兩個平台才對得起來。
 */
export const textBase: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;
