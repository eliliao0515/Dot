import React from 'react';
import { View } from 'react-native';

/**
 * 外殼專用、Icons.tsx 裡沒有的通用圖示。一樣全部用 View 畫，不用任何第三方素材。
 */

/** 打開的書，給「課本」分頁用。 */
export function Book({ size = 24, color = '#1D4E6B', weight = 2.2 }) {
  const page = size * 0.4;
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: page,
          height: size * 0.72,
          borderWidth: weight,
          borderColor: color,
          borderTopLeftRadius: 3,
          borderBottomLeftRadius: 3,
          borderRightWidth: weight / 2,
        }}
      />
      <View
        style={{
          width: page,
          height: size * 0.72,
          borderWidth: weight,
          borderColor: color,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
          borderLeftWidth: weight / 2,
        }}
      />
    </View>
  );
}

/** 指尖觸碰點：實心圓點外加一圈，給手勢單元用。Phase 4 會換成各手勢自己的圖示。 */
export function TouchDot({ size = 24, color = '#1D4E6B', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.82,
          height: size * 0.82,
          borderRadius: size * 0.41,
          borderWidth: weight,
          borderColor: color,
        }}
      />
      <View style={{ width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18, backgroundColor: color }} />
    </View>
  );
}
