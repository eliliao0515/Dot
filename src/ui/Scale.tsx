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
   * 模擬層一律傳 false：畫面尺寸只由我們的字級參數決定，
   * 這樣長輩看到的模擬畫面才會跟他自己手機上的一致。
   * 教學外殼層留 true，讓開了系統大字的人真的看得到大字。
   */
  systemScaling?: boolean;
};

export function T({ systemScaling = false, style, ...rest }: TProps) {
  return (
    <Text
      allowFontScaling={systemScaling}
      maxFontSizeMultiplier={systemScaling ? 1.4 : 1}
      style={StyleSheet.flatten([textBase, style])}
      {...rest}
    />
  );
}
