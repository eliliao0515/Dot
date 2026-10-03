import React from 'react';
import { View, StyleSheet } from 'react-native';
import NavHeader from '../ui/hig/NavHeader';
import { GroupedList, Section } from '../ui/hig/GroupedList';
import ListRow from '../ui/hig/ListRow';
import { H } from '../ui/hig/tokens';
import { ChatsTab } from '../ui/Icons';

/**
 * 「模擬器」分頁：列出可以自由操作的 App 模擬器，目前只有 LINE。
 * 點進去是整個畫面換成那個 App（沒有底部分頁），在裡面怎麼按都不計分、也不記錄。
 */
export default function SimulatorsScreen({ onOpenLine }: { onOpenLine: () => void }) {
  return (
    <View style={s.wrap}>
      <GroupedList>
        <NavHeader title="模擬器" />
        <Section footer="在這裡怎麼按都可以，不計分，也不會記錄。">
          <ListRow
            icon={<ChatsTab size={26} color={H.tint} />}
            title="LINE"
            subtitle="聊天、貼圖、語音、照片、打電話"
            onPress={onOpenLine}
          />
        </Section>
      </GroupedList>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: H.bg },
});
