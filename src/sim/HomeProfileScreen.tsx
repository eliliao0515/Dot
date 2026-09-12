import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { T } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import { Person } from '../ui/Icons';
import type { LineUser } from '../auth/lineAuth';

/**
 * 底部「Home」分頁的個人檔案畫面。這是被模擬 App 自己的內容，走綠色系，
 * 不是教學外殼（靛藍）——雖然畫面本身沒有對應的真實 LINE 截圖可以照抄，
 * 顏色分層規則還是不變：待在綠色家族裡，不跟登入畫面的靛藍混在一起。
 *
 * 頭像用真的 <Image> 顯示使用者自己的大頭貼，是全案唯一一張真實網路圖片——
 * 其餘假聯絡人一律用手繪 View 圖示，因為那些是虛構人物；這裡不是，
 * 是登入者本人真實帳號的照片，不算「冒用第三方素材」。沒有照片或載入失敗
 * 一律退回手繪 Person 圖示，不能出現破圖或讓畫面炸掉。
 */
export default function HomeProfileScreen({
  user,
  base,
  onLogout,
}: {
  user: LineUser;
  base: number;
  onLogout: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = !user.pictureUrl || imgFailed;
  const avatarSize = 108;

  return (
    <View style={s.wrap}>
      <View style={s.body}>
        {showFallback ? (
          <View
            style={[
              s.avatarFallback,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
            ]}
          >
            <Person size={fz(base, 2.4)} color="#fff" />
          </View>
        ) : (
          <Image
            source={{ uri: user.pictureUrl }}
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
            onError={() => setImgFailed(true)}
          />
        )}

        <T style={[s.name, { fontSize: fz(base, 1.2), lineHeight: fz(base, 1.7) }]}>{user.displayName}</T>
      </View>

      <View style={s.footer}>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [s.logoutBtn, pressed && s.logoutBtnPressed]}
          accessibilityRole="button"
        >
          <T style={[s.logoutText, { fontSize: fz(base, 1.05), lineHeight: fz(base, 1.5) }]}>登出</T>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  avatarFallback: {
    backgroundColor: C.chatGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: C.ink, fontWeight: '800' },

  footer: { paddingHorizontal: 22, paddingBottom: 30, paddingTop: 6 },
  logoutBtn: {
    minHeight: 72,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: C.chatGreen,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  logoutBtnPressed: { opacity: 0.82 },
  logoutText: { color: C.chatGreen, fontWeight: '900', textAlign: 'center' },
});
