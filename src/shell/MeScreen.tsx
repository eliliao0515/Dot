import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { T, useScale } from '../ui/Scale';
import { fz } from '../ui/theme';
import { Person } from '../ui/Icons';
import NavHeader from '../ui/hig/NavHeader';
import { GroupedList, Section } from '../ui/hig/GroupedList';
import { SecondaryButton } from '../ui/hig/Buttons';
import ListRow from '../ui/hig/ListRow';
import Sheet from '../ui/hig/Sheet';
import { H } from '../ui/hig/tokens';
import { PointsCard } from './TextbookHome';
import type { LineUser } from '../auth/lineAuth';

/**
 * 「我」分頁。教學外殼的一部分，走靛藍，不是被模擬的 LINE 畫面。
 *
 * 頭像用登入者本人真實的大頭貼；沒有照片或載不到就退回手繪人像，
 * 不能出現破圖。原生端目前永遠匿名（沒有 LIFF），顯示未登入狀態。
 */
export default function MeScreen({
  user,
  points,
  onLogout,
  onDeletePoints,
}: {
  user: LineUser | null;
  points?: number;
  onLogout: () => void;
  /** 清除點數紀錄（伺服器和這支手機）。回傳 false 代表沒成功（例如沒網路）。 */
  onDeletePoints?: () => Promise<boolean>;
}) {
  const [sheet, setSheet] = useState<'confirm' | 'done' | 'failed' | null>(null);
  const { base } = useScale();
  const [imgFailed, setImgFailed] = useState(false);
  const avatar = 72;
  const showFallback = !user?.pictureUrl || imgFailed;

  return (
    <View style={s.wrap}>
      <GroupedList>
        <NavHeader title="我" />

        <Section>
          <View style={s.profile}>
            {showFallback ? (
              <View style={[s.fallback, { width: avatar, height: avatar, borderRadius: avatar / 2 }]}>
                <Person size={avatar * 0.6} color="#fff" weight={2.4} />
              </View>
            ) : (
              <Image
                source={{ uri: user!.pictureUrl }}
                style={{ width: avatar, height: avatar, borderRadius: avatar / 2 }}
                onError={() => setImgFailed(true)}
              />
            )}
            <T systemScaling style={[s.name, { fontSize: fz(base, 1.5), lineHeight: fz(base, 2.0) }]}>
              {user ? user.displayName : '還沒登入'}
            </T>
          </View>
        </Section>

        {points !== undefined ? <PointsCard points={points} /> : null}

        {user ? <SecondaryButton label="登出" onPress={onLogout} style={{ marginTop: 28 }} /> : null}

        {onDeletePoints && points !== undefined ? (
          <Section footer="會刪掉伺服器和這支手機上的點數紀錄，刪掉就找不回來。">
            <ListRow title="清除我的點數紀錄" showChevron={false} onPress={() => setSheet('confirm')} />
          </Section>
        ) : null}
      </GroupedList>

      <Sheet
        visible={sheet === 'confirm'}
        title="要清除點數紀錄嗎？"
        message="清除之後點數會變回 0，找不回來。"
        confirmLabel="清除"
        actionLabel="不要清除"
        onConfirm={() => {
          setSheet(null);
          onDeletePoints?.().then((ok) => setSheet(ok ? 'done' : 'failed'));
        }}
        onClose={() => setSheet(null)}
      />
      <Sheet visible={sheet === 'done'} title="已經清除了" onClose={() => setSheet(null)} />
      <Sheet
        visible={sheet === 'failed'}
        title="現在沒辦法清除"
        message="可能是網路不通，等一下再試一次。"
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: H.bg },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  fallback: { backgroundColor: H.tint, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, color: H.label, fontWeight: '700', fontFamily: H.fontFamily },
});
