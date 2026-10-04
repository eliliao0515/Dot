import React, { createContext, useContext, useMemo, useState } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { FONT_STEPS, FontStepKey, textBase } from './theme';

type ScaleValue = {
  step: FontStepKey;
  base: number;
  setStep: (s: FontStepKey) => void;
};

const ScaleContext = createContext<ScaleValue>({
  step: 'standard',
  base: FONT_STEPS.standard,
  setStep: () => {},
});

export function ScaleProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<FontStepKey>('standard');
  const value = useMemo(
    () => ({ step, base: FONT_STEPS[step], setStep }),
    [step],
  );
  return <ScaleContext.Provider value={value}>{children}</ScaleContext.Provider>;
}

export function useScale() {
  return useContext(ScaleContext);
}

type TProps = TextProps & {
  /**
   * 2026-10-04 起不再有作用（保留參數只是為了不用改上百個呼叫處）。
   * 原本外殼層會放行系統字級，但實際使用時開了系統大字的長輩字被放太大、按鈕被擠出畫面按不到，
   * 使用者決定：所有文字大小一律寫死，不跟系統字級變化。
   */
  systemScaling?: boolean;
};

export function T({ systemScaling: _ignored, style, ...rest }: TProps) {
  return (
    <Text
      {...rest}
      allowFontScaling={false}
      maxFontSizeMultiplier={1}
      style={StyleSheet.flatten([textBase, style])}
    />
  );
}
