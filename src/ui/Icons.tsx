import React from 'react';
import { View } from 'react-native';

/**
 * 全部用 View 畫，不使用任何第三方 App 的商標或圖示素材。
 * 也刻意不引入 react-native-svg，讓專案 npm install 一次就能跑。
 */

export function Check({ size = 24, color = '#fff', weight = 3 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.32,
          borderLeftWidth: weight,
          borderBottomWidth: weight,
          borderColor: color,
          transform: [{ rotate: '-45deg' }, { translateY: -size * 0.06 }],
        }}
      />
    </View>
  );
}

export function Mic({ size = 24, color = '#fff', weight = 2.4 }) {
  const capW = size * 0.34;
  const capH = size * 0.46;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: capW,
          height: capH,
          borderRadius: capW / 2,
          backgroundColor: color,
          marginBottom: size * 0.04,
        }}
      />
      <View
        style={{
          width: size * 0.58,
          height: size * 0.2,
          borderLeftWidth: weight,
          borderRightWidth: weight,
          borderBottomWidth: weight,
          borderColor: color,
          borderBottomLeftRadius: size * 0.29,
          borderBottomRightRadius: size * 0.29,
        }}
      />
      <View style={{ width: weight, height: size * 0.12, backgroundColor: color }} />
    </View>
  );
}

export function Play({ size = 20, color = '#fff' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.72,
          borderTopWidth: size * 0.44,
          borderBottomWidth: size * 0.44,
          borderLeftColor: color,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          marginLeft: size * 0.14,
        }}
      />
    </View>
  );
}

export function Speaker({ size = 22, color = '#fff' }) {
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: size * 0.22, height: size * 0.34, backgroundColor: color }} />
      <View
        style={{
          width: 0,
          height: 0,
          borderRightWidth: size * 0.3,
          borderTopWidth: size * 0.36,
          borderBottomWidth: size * 0.36,
          borderRightColor: color,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }}
      />
      <View
        style={{
          marginLeft: size * 0.1,
          width: size * 0.24,
          height: size * 0.24,
          borderRightWidth: 2,
          borderTopWidth: 2,
          borderColor: color,
          borderTopRightRadius: size * 0.24,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function VideoCam({ size = 20, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size * 0.72, flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderWidth: weight,
          borderColor: color,
          borderRadius: 4,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderRightWidth: size * 0.3,
          borderTopWidth: size * 0.24,
          borderBottomWidth: size * 0.24,
          borderRightColor: color,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          marginLeft: -1,
        }}
      />
    </View>
  );
}

export function Menu({ size = 20, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', gap: size * 0.18 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: weight, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

export function Chevron({ size = 22, color = '#fff', weight = 3 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.36,
          height: size * 0.36,
          borderRightWidth: weight,
          borderTopWidth: weight,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateX: -size * 0.06 }],
        }}
      />
    </View>
  );
}

export function Back({ size = 24, color = '#4A5158', weight = 2.4 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.34,
          height: size * 0.34,
          borderLeftWidth: weight,
          borderBottomWidth: weight,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateX: size * 0.05 }],
        }}
      />
    </View>
  );
}

export function PhoneOutline({ size = 26, color = '#B32B22', weight = 2.4 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.56,
          height: size * 0.86,
          borderWidth: weight,
          borderColor: color,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 2,
        }}
      >
        <View style={{ width: size * 0.18, height: weight, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

export function Sticker({ size = 26, color = '#fff', weight = 2.6 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.74,
          height: size * 0.74,
          borderWidth: weight,
          borderColor: color,
          borderRadius: 6,
          borderBottomRightRadius: size * 0.34,
        }}
      />
    </View>
  );
}

export function ThumbsUp({ size = 26, color = '#fff' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.58,
          backgroundColor: color,
          borderRadius: size * 0.14,
          transform: [{ rotate: '-18deg' }, { translateX: size * 0.04 }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.22,
          height: size * 0.34,
          backgroundColor: color,
          borderRadius: size * 0.06,
          top: size * 0.06,
          left: size * 0.2,
          transform: [{ rotate: '-30deg' }],
        }}
      />
    </View>
  );
}

export function Heart({ size = 26, color = '#fff' }) {
  const half = size * 0.5;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: half * 0.98,
          height: half,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          marginTop: -size * 0.06,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: half,
          height: half,
          backgroundColor: color,
          borderRadius: half / 2,
          top: size * 0.14,
          left: size * 0.13,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: half,
          height: half,
          backgroundColor: color,
          borderRadius: half / 2,
          top: size * 0.14,
          right: size * 0.13,
        }}
      />
    </View>
  );
}

export function Laugh({ size = 26, color = '#fff', weight = 2.4 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: weight,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', gap: size * 0.24, marginBottom: size * 0.1 }}>
        <View style={{ width: size * 0.09, height: size * 0.09, borderRadius: size * 0.05, backgroundColor: color }} />
        <View style={{ width: size * 0.09, height: size * 0.09, borderRadius: size * 0.05, backgroundColor: color }} />
      </View>
      <View
        style={{
          width: size * 0.4,
          height: size * 0.2,
          borderBottomLeftRadius: size * 0.2,
          borderBottomRightRadius: size * 0.2,
          borderBottomWidth: weight,
          borderColor: color,
        }}
      />
    </View>
  );
}

export function Ok({ size = 26, color = '#fff', weight = 2.4 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: weight,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={size * 0.52} color={color} weight={weight * 0.9} />
    </View>
  );
}

export function Flower({ size = 26, color = '#fff' }) {
  const petal = size * 0.38;
  const r = size * 0.2;
  const petalStyle = {
    position: 'absolute' as const,
    width: petal,
    height: petal,
    borderRadius: petal / 2,
    backgroundColor: color,
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[petalStyle, { top: size * 0.5 - petal - r, left: size * 0.5 - petal / 2 }]} />
      <View style={[petalStyle, { top: size * 0.5 + r - petal / 2, left: size * 0.5 - petal / 2 }]} />
      <View style={[petalStyle, { top: size * 0.5 - petal / 2, left: size * 0.5 - petal - r }]} />
      <View style={[petalStyle, { top: size * 0.5 - petal / 2, left: size * 0.5 + r - petal / 2 }]} />
      <View
        style={{
          position: 'absolute',
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size * 0.15,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
    </View>
  );
}

export function Camera({ size = 24, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.16,
          height: size * 0.14,
          backgroundColor: color,
          position: 'absolute',
          top: size * 0.14,
          left: size * 0.24,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        }}
      />
      <View
        style={{
          width: size * 0.78,
          height: size * 0.58,
          borderRadius: 5,
          borderWidth: weight,
          borderColor: color,
          marginTop: size * 0.1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: size * 0.16,
            borderWidth: weight,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

export function Person({ size = 24, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: size * 0.17,
          borderWidth: weight,
          borderColor: color,
          marginBottom: size * 0.04,
        }}
      />
      <View
        style={{
          width: size * 0.62,
          height: size * 0.34,
          borderTopLeftRadius: size * 0.31,
          borderTopRightRadius: size * 0.31,
          borderWidth: weight,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
}

export function Pause({ size = 20, color = '#fff' }) {
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: size * 0.16 }}>
      <View style={{ width: size * 0.2, height: size * 0.62, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.2, height: size * 0.62, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

export function Search({ size = 22, color = '#5B6369', weight = 2.2 }) {
  const ring = size * 0.66;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: weight,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.02,
          right: size * 0.02,
          width: weight,
          height: size * 0.36,
          backgroundColor: color,
          borderRadius: weight / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function Plus({ size = 22, color = '#5B6369', weight = 2.4 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.7,
          height: weight,
          backgroundColor: color,
          borderRadius: weight / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: weight,
          height: size * 0.7,
          backgroundColor: color,
          borderRadius: weight / 2,
        }}
      />
    </View>
  );
}

export function Album({ size = 22, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.82,
          height: size * 0.7,
          borderRadius: 4,
          borderWidth: weight,
          borderColor: color,
          overflow: 'hidden',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.24,
            borderRightWidth: size * 0.12,
            borderBottomWidth: size * 0.28,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
            marginLeft: size * 0.08,
          }}
        />
      </View>
    </View>
  );
}

export function Calendar({ size = 22, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.82,
          height: size * 0.74,
          borderWidth: weight,
          borderColor: color,
          borderRadius: 4,
          marginTop: size * 0.06,
        }}
      >
        <View style={{ height: weight, backgroundColor: color, marginTop: size * 0.18 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: size * 0.24,
          width: weight,
          height: size * 0.18,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: size * 0.24,
          width: weight,
          height: size * 0.18,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function ChatInvite({ size = 22, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.82,
          height: size * 0.62,
          borderWidth: weight,
          borderColor: color,
          borderRadius: 8,
          borderBottomLeftRadius: 2,
          padding: size * 0.1,
          justifyContent: 'center',
          gap: size * 0.08,
        }}
      >
        <View style={{ height: weight * 0.9, backgroundColor: color, borderRadius: 2, width: '80%' }} />
        <View style={{ height: weight * 0.9, backgroundColor: color, borderRadius: 2, width: '55%' }} />
      </View>
    </View>
  );
}

/** 圖釘徽章，貼在頭像右下角表示這個聊天室釘選在最上面。 */
export function Pin({ size = 16, color = '#fff' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          backgroundColor: color,
          marginBottom: -size * 0.06,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.16,
          borderRightWidth: size * 0.16,
          borderTopWidth: size * 0.26,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
}

export function HomeTab({ size = 24, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.06,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.42,
          borderRightWidth: size * 0.42,
          borderBottomWidth: size * 0.32,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          marginTop: size * 0.3,
          width: size * 0.64,
          height: size * 0.42,
          borderWidth: weight,
          borderTopWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}

export function ChatsTab({ size = 24, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.76,
          height: size * 0.56,
          borderWidth: weight,
          borderColor: color,
          borderRadius: size * 0.16,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.06,
          left: size * 0.3,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.08,
          borderRightWidth: size * 0.08,
          borderTopWidth: size * 0.11,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
}

export function DiscoverTab({ size = 24, color = '#5B6369', weight = 2 }) {
  return (
    <View
      style={{
        width: size * 0.8,
        height: size * 0.8,
        borderRadius: size * 0.4,
        borderWidth: weight,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: size * 0.32, height: size * 0.32, transform: [{ rotate: '45deg' }] }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            marginLeft: -1,
            width: 2,
            height: '50%',
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            marginLeft: -1,
            width: 2,
            height: '50%',
            backgroundColor: color,
            opacity: 0.4,
          }}
        />
      </View>
    </View>
  );
}

export function MoonTab({ size = 24, color = '#5B6369', bg = '#FFFFFF' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size * 0.35,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size * 0.35,
          backgroundColor: bg,
          top: -size * 0.08,
          left: size * 0.18,
        }}
      />
    </View>
  );
}

export function WalletTab({ size = 24, color = '#5B6369', weight = 2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.82,
          height: size * 0.6,
          borderWidth: weight,
          borderColor: color,
          borderRadius: 4,
          justifyContent: 'center',
        }}
      >
        <View style={{ height: size * 0.16, backgroundColor: color, marginTop: -1 }} />
      </View>
    </View>
  );
}
