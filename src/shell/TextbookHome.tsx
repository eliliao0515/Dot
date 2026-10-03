import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NavHeader from '../ui/hig/NavHeader';
import { GroupedList, Section } from '../ui/hig/GroupedList';
import ListRow, { type RowStatus } from '../ui/hig/ListRow';
import { PrimaryButton } from '../ui/hig/Buttons';
import Sheet from '../ui/hig/Sheet';
import { TouchDot } from '../ui/hig/glyphs';
import { H } from '../ui/hig/tokens';
import { Back, Camera, ChatsTab, Menu, Mic, PhoneHandset, Plus, Search, ShareUp, Smile, Trash, VideoCam } from '../ui/Icons';
import type { Level, LevelGlyph, Unit } from '../engine/types';

const GLYPH_SIZE = 26;

function LevelIcon({ glyph }: { glyph: LevelGlyph }) {
  const c = H.tint;
  switch (glyph) {
    case 'phone': return <PhoneHandset size={GLYPH_SIZE} color={c} weight={2} />;
    case 'chat': return <ChatsTab size={GLYPH_SIZE} color={c} />;
    case 'sticker': return <Smile size={GLYPH_SIZE} color={c} weight={2.2} />;
    case 'mic': return <Mic size={GLYPH_SIZE} color={c} weight={2.2} />;
    case 'camera': return <Camera size={GLYPH_SIZE} color={c} />;
    case 'video': return <VideoCam size={GLYPH_SIZE} color={c} />;
    case 'back': return <Back size={GLYPH_SIZE} color={c} weight={2.6} />;
    case 'search': return <Search size={GLYPH_SIZE} color={c} />;
    case 'plus': return <Plus size={GLYPH_SIZE} color={c} />;
    case 'share': return <ShareUp size={GLYPH_SIZE} color={c} />;
    case 'trash': return <Trash size={GLYPH_SIZE} color={c} />;
    case 'menu': return <Menu size={GLYPH_SIZE * 0.8} color={c} weight={2.4} />;
    case 'touch': return <TouchDot size={GLYPH_SIZE} color={c} />;
  }
}

/**
 * 課本首頁（specs/v2/P1-textbook-shell.md）。
 *
 * 純呈現：哪一關是什麼狀態、「接著上次」指去哪，都由 App.tsx 算好傳進來。
 * 任何一列都可以點 —— 不鎖關卡是已定案的原則；還沒做好的關卡點了給說明。
 */
export default function TextbookHome({
  units,
  levels,
  statusOf,
  resume,
  onOpenLevel,
  onOpenSandbox,
}: {
  units: Unit[];
  levels: Record<string, Level>;
  statusOf: (level: Level) => RowStatus;
  /** 最上方那顆大按鈕。沒有可以接的課就是 null。 */
  resume: { label: string; levelId: string } | null;
  onOpenLevel: (level: Level) => void;
  /** 只有開發者才會給。給了，最上方就多一個「我的沙盒」區塊。 */
  onOpenSandbox?: () => void;
}) {
  const [soonLevel, setSoonLevel] = useState<Level | null>(null);

  function open(level: Level) {
    if (level.kind === 'comingSoon') setSoonLevel(level);
    else onOpenLevel(level);
  }

  return (
    <View style={s.wrap}>
      <GroupedList>
        <NavHeader title="課本" />

        {onOpenSandbox ? (
          <Section header="我的沙盒" footer="只有你的帳號看得到。">
            <ListRow
              icon={<LevelIcon glyph="chat" />}
              title="LINE 自由操作"
              subtitle="沒有題目，什麼都可以按"
              onPress={onOpenSandbox}
            />
          </Section>
        ) : null}

        {resume ? (
          <PrimaryButton
            label={resume.label}
            onPress={() => open(levels[resume.levelId])}
            style={{ marginTop: onOpenSandbox ? 20 : 8 }}
          />
        ) : null}

        {units.map((unit, i) => (
          <Section key={unit.id} header={`單元${'一二三四五六七八九'[i] ?? i + 1}　${unit.title}`} footer={unit.summary}>
            {unit.levelIds.map((id) => {
              const level = levels[id];
              return (
                <ListRow
                  key={id}
                  icon={<LevelIcon glyph={level.glyph} />}
                  title={level.title}
                  subtitle={level.subtitle}
                  status={statusOf(level)}
                  onPress={() => open(level)}
                />
              );
            })}
          </Section>
        ))}
      </GroupedList>

      <Sheet
        visible={soonLevel !== null}
        title={soonLevel ? `「${soonLevel.title}」還在準備` : ''}
        message="這一關還在準備，先去練別的吧。"
        onClose={() => setSoonLevel(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: H.bg },
});
