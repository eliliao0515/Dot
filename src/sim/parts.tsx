import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { T } from '../ui/Scale';
import { C, fz } from '../ui/theme';
import {
  Back, Mic, Play, Pause, VideoCam, Menu, Sticker,
  ThumbsUp, Heart, Laugh, Ok, Flower, Camera, Person,
} from '../ui/Icons';
import { Bubble, StickerId } from '../engine/types';

/**
 * 這一層是「被模擬的 App」。
 * 純呈現、只吃 props、完全不知道課程存在 — 換一個 App 只要換這一層。
 *
 * 注意：這裡刻意不放大按鈕、不簡化版面。長輩靠空間記憶學介面，
 * 為了好按而改版面會直接毀掉回到真手機的遷移效果。
 *
 * 貼圖集合、預設回覆文字、假照片/假聯絡人選項全部是這一層自己的常數，
 * 不是課程資料 — 課程腳本只提供 script.messages 裡「對方傳來的」內容。
 */

const STICKER_ICONS: Record<StickerId, (props: { size: number; color?: string }) => React.JSX.Element> = {
  thumbsUp: ThumbsUp,
  heart: Heart,
  laugh: Laugh,
  bow: Flower,
  ok: Ok,
};
const STICKER_ORDER: StickerId[] = ['thumbsUp', 'heart', 'laugh', 'bow', 'ok'];

/** 依字串算出固定色，給假照片色塊和聯絡人頭像用。刻意避開紅色系。 */
const TINT_PALETTE = ['#4C7A99', '#5B8C6B', '#7A6B99', '#8C7B4C', '#4C8C99', '#6B7A99'];
function colorFromString(input: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) % 997;
  return palette[hash % palette.length];
}

const QUICK_REPLIES = ['好', '謝謝', '知道了', '等一下'];
const SAMPLE_PHOTOS = [
  { id: 'p1', label: '今天的菜' },
  { id: 'p2', label: '孫子的照片' },
  { id: 'p3', label: '客廳' },
  { id: 'p4', label: '公園' },
];
const SAMPLE_CONTACTS = ['陳醫師', '里長', '大兒子', '孫子小宇'];

export function SimTopBar({ contact, base, onWrongTap, onPressVideo }: {
  contact: string;
  base: number;
  onWrongTap: () => void;
  onPressVideo: () => void;
}) {
  return (
    <View style={s.topBar}>
      <Pressable onPress={onWrongTap} hitSlop={8}>
        <Back size={fz(base, 1.5)} />
      </Pressable>
      <T style={[s.contact, { fontSize: fz(base, 1), lineHeight: fz(base, 1.4) }]}>{contact}</T>
      <View style={s.topIcons}>
        <Pressable onPress={onPressVideo} hitSlop={10}>
          <VideoCam size={fz(base, 1.25)} />
        </Pressable>
        <Pressable onPress={onWrongTap} hitSlop={10}>
          <Menu size={fz(base, 1.05)} />
        </Pressable>
      </View>
    </View>
  );
}

function Waveform({ heights, color }: { heights: number[]; color: string }) {
  return (
    <View style={s.wave}>
      {heights.map((h, i) => (
        <View key={i} style={{ width: 2.5, height: h, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

const WAVE = [5, 11, 15, 8, 13, 6, 10, 14, 7, 4];

function PhotoThumb({ label, size, base, onPress, onLongPress }: {
  label: string;
  size: 'bubble' | 'grid';
  base: number;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        size === 'bubble' ? s.photo : s.photoGridThumb,
        { backgroundColor: colorFromString(label, TINT_PALETTE) },
      ]}
    >
      <View style={s.photoSun} pointerEvents="none" />
      <View style={s.photoMountain} pointerEvents="none" />
      <T style={[s.photoLabel, { fontSize: fz(base, size === 'bubble' ? 0.75 : 0.68) }]}>{label}</T>
    </Pressable>
  );
}

export function MessageRow({
  msg,
  contact,
  base,
  playingId,
  playElapsed,
  onTogglePlay,
  onSavePhoto,
}: {
  msg: Bubble;
  contact: string;
  base: number;
  playingId?: string | null;
  playElapsed?: number;
  onTogglePlay?: (id: string, seconds: number) => void;
  onSavePhoto?: (id: string) => void;
}) {
  const mine = msg.from === 'me';
  const playing = playingId === msg.id;

  return (
    <View style={[s.row, mine && s.rowMine]}>
      {msg.showName && !mine ? (
        <T style={[s.senderName, { fontSize: fz(base, 0.72), lineHeight: fz(base, 1.05) }]}>
          {contact}
        </T>
      ) : null}

      {msg.kind === 'sticker' ? (
        (() => {
          const Glyph = STICKER_ICONS[msg.sticker];
          return (
            <View style={s.stickerWrap}>
              <Glyph size={fz(base, 3.4)} color={mine ? C.chatGreen : C.ink2} />
            </View>
          );
        })()
      ) : msg.kind === 'photo' ? (
        <PhotoThumb
          label={msg.label}
          size="bubble"
          base={base}
          onLongPress={!mine ? () => onSavePhoto?.(msg.id) : undefined}
        />
      ) : msg.kind === 'contact' ? (
        <View style={[s.bubble, s.contactBubble, mine && s.bubbleMine]}>
          <View style={[s.avatar, { backgroundColor: colorFromString(msg.name, TINT_PALETTE) }]}>
            <T style={[s.avatarText, { fontSize: fz(base, 0.95) }]}>{msg.name.slice(0, 1)}</T>
          </View>
          <View>
            <T
              style={[
                s.contactName,
                { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.4) },
                mine && { color: C.chatGreenInk },
              ]}
            >
              {msg.name}
            </T>
            <T style={[s.contactCaption, { fontSize: fz(base, 0.72), lineHeight: fz(base, 1.2) }]}>
              聯絡人名片
            </T>
          </View>
        </View>
      ) : (
        <View style={[s.bubble, mine && s.bubbleMine]}>
          {msg.kind === 'voice' ? (
            <Pressable style={s.voice} onPress={() => onTogglePlay?.(msg.id, msg.seconds)}>
              {playing ? (
                <Pause size={fz(base, 0.85)} color={mine ? C.chatGreenInk : C.ink} />
              ) : (
                <Play size={fz(base, 0.85)} color={mine ? C.chatGreenInk : C.ink} />
              )}
              <Waveform heights={WAVE} color={mine ? '#22503C' : '#5E7A6C'} />
              <T style={[s.voiceTime, { fontSize: fz(base, 0.78) }, mine && { color: C.chatGreenInk }]}>
                {playing ? `0:0${playElapsed ?? 0}` : `0:0${msg.seconds}`}
              </T>
            </Pressable>
          ) : (
            <T
              style={[
                s.bubbleText,
                { fontSize: fz(base, 0.95), lineHeight: fz(base, 1.55) },
                mine && { color: C.chatGreenInk },
              ]}
            >
              {msg.text}
              {msg.kind === 'link' ? (
                <T style={[s.link, { fontSize: fz(base, 0.92) }]}>{'\n' + msg.url}</T>
              ) : null}
            </T>
          )}
        </View>
      )}
    </View>
  );
}

/** 對方已讀「我」傳出去的最後一則訊息時顯示。純文字，跟真實 LINE 一樣不是打勾圖示。 */
export function ReadReceipt({ base }: { base: number }) {
  return (
    <T style={[s.readReceipt, { fontSize: fz(base, 0.7), lineHeight: fz(base, 1.1) }]}>已讀</T>
  );
}

/** 存照片後的系統提示。刻意跟著真機系統走：iOS 與 Android 措辭不同。 */
export function SavedPhotoToast({ base }: { base: number }) {
  const label = Platform.OS === 'ios' ? '已儲存到「照片」' : '已儲存';
  return (
    <View style={s.savedToast} pointerEvents="none">
      <T style={[s.savedToastText, { fontSize: fz(base, 0.88), lineHeight: fz(base, 1.4) }]}>
        {label}
      </T>
    </View>
  );
}

/** 預設回覆膠囊列。取代真正打字 — 這個族群注音/拼音是完全的牆。 */
export function QuickReplyRow({ base, onPick }: {
  base: number;
  onPick: (text: string) => void;
}) {
  return (
    <View style={s.quickReplyRow}>
      {QUICK_REPLIES.map((text) => (
        <Pressable key={text} onPress={() => onPick(text)} style={s.quickReplyChip}>
          <T style={[s.quickReplyText, { fontSize: fz(base, 0.85) }]}>{text}</T>
        </Pressable>
      ))}
    </View>
  );
}

/** 「＋」的附加選單：照片、聯絡人。 */
export function AttachMenu({ base, onSelectPhoto, onSelectContact }: {
  base: number;
  onSelectPhoto: () => void;
  onSelectContact: () => void;
}) {
  return (
    <View style={s.attachMenu}>
      <Pressable style={s.attachTile} onPress={onSelectPhoto}>
        <View style={s.attachIconWrap}>
          <Camera size={fz(base, 1.3)} color={C.ink2} />
        </View>
        <T style={[s.attachLabel, { fontSize: fz(base, 0.8) }]}>照片</T>
      </Pressable>
      <Pressable style={s.attachTile} onPress={onSelectContact}>
        <View style={s.attachIconWrap}>
          <Person size={fz(base, 1.3)} color={C.ink2} />
        </View>
        <T style={[s.attachLabel, { fontSize: fz(base, 0.8) }]}>聯絡人</T>
      </Pressable>
    </View>
  );
}

export function PhotoPicker({ base, onPick, onCancel }: {
  base: number;
  onPick: (label: string) => void;
  onCancel: () => void;
}) {
  return (
    <View style={s.pickerWrap}>
      <View style={s.pickerHead}>
        <T style={[s.pickerTitle, { fontSize: fz(base, 0.9) }]}>選一張照片</T>
        <Pressable onPress={onCancel} hitSlop={10}>
          <T style={[s.pickerCancel, { fontSize: fz(base, 0.85) }]}>取消</T>
        </Pressable>
      </View>
      <View style={s.photoGrid}>
        {SAMPLE_PHOTOS.map((p) => (
          <PhotoThumb key={p.id} label={p.label} size="grid" base={base} onPress={() => onPick(p.label)} />
        ))}
      </View>
    </View>
  );
}

export function ContactPicker({ base, onPick, onCancel }: {
  base: number;
  onPick: (name: string) => void;
  onCancel: () => void;
}) {
  return (
    <View style={s.pickerWrap}>
      <View style={s.pickerHead}>
        <T style={[s.pickerTitle, { fontSize: fz(base, 0.9) }]}>選一位聯絡人</T>
        <Pressable onPress={onCancel} hitSlop={10}>
          <T style={[s.pickerCancel, { fontSize: fz(base, 0.85) }]}>取消</T>
        </Pressable>
      </View>
      <View style={s.contactList}>
        {SAMPLE_CONTACTS.map((name) => (
          <Pressable key={name} onPress={() => onPick(name)} style={s.contactRow}>
            <View style={[s.avatar, { backgroundColor: colorFromString(name, TINT_PALETTE) }]}>
              <T style={[s.avatarText, { fontSize: fz(base, 0.9) }]}>{name.slice(0, 1)}</T>
            </View>
            <T style={[s.contactRowName, { fontSize: fz(base, 0.92) }]}>{name}</T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** 貼圖面板。點了立刻送出，不用二次確認 — 跟真實 LINE 一樣。 */
export function StickerPanel({ base, onPick }: {
  base: number;
  onPick: (id: StickerId) => void;
}) {
  return (
    <View style={s.stickerPanel}>
      {STICKER_ORDER.map((id) => {
        const Glyph = STICKER_ICONS[id];
        return (
          <Pressable key={id} onPress={() => onPick(id)} style={s.stickerTile} hitSlop={6}>
            <Glyph size={fz(base, 2.1)} color={C.ink2} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function SimInputBar({
  base,
  recording,
  minMs,
  onWrongTap,
  onPressPlus,
  onPressSticker,
  attachOpen,
  stickerOpen,
  onStart,
  onStop,
  onTooShort,
}: {
  base: number;
  recording: boolean;
  minMs: number;
  onWrongTap: () => void;
  onPressPlus: () => void;
  onPressSticker: () => void;
  attachOpen: boolean;
  stickerOpen: boolean;
  onStart: () => void;
  onStop: () => void;
  onTooShort: () => void;
}) {
  const micSize = fz(base, 2.4);
  return (
    <View style={s.inputBar}>
      <Pressable onPress={onPressPlus} hitSlop={10} style={[s.roundIcon, attachOpen && s.roundIconOn]}>
        <T style={[s.plus, { fontSize: fz(base, 1.35) }]}>＋</T>
      </Pressable>

      <Pressable style={s.field} onPress={onWrongTap}>
        <T style={[s.fieldText, { fontSize: fz(base, 0.88), lineHeight: fz(base, 1.3) }]}>
          輸入訊息
        </T>
      </Pressable>

      <Pressable onPress={onPressSticker} hitSlop={10} style={[s.roundIcon, stickerOpen && s.roundIconOn]}>
        <Sticker size={fz(base, 1.15)} color="#6B747A" weight={2.2} />
      </Pressable>

      <Pressable
        delayLongPress={minMs}
        onLongPress={onStart}
        onPressOut={() => (recording ? onStop() : undefined)}
        onPress={onTooShort}
        // 手抖的人放開時手指常會滑掉，把觸控範圍放寬。
        hitSlop={14}
        pressRetentionOffset={{ top: 60, bottom: 60, left: 60, right: 60 }}
        style={({ pressed }) => [
          s.mic,
          { width: micSize, height: micSize, borderRadius: micSize / 2 },
          (pressed || recording) && s.micActive,
        ]}
      >
        <Mic size={fz(base, 1.2)} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: {
    backgroundColor: C.chatBar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.chatLine,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contact: { fontWeight: '700', color: C.ink },
  topIcons: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 16 },

  row: { maxWidth: '78%', alignSelf: 'flex-start', gap: 4 },
  rowMine: { alignSelf: 'flex-end' },
  senderName: { color: '#41525E', marginLeft: 3, fontWeight: '500' },

  bubble: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 9, paddingHorizontal: 13 },
  bubbleMine: { backgroundColor: C.chatGreen },
  bubbleText: { color: C.ink },
  link: { color: '#1A6BB5', textDecorationLine: 'underline' },

  stickerWrap: { paddingVertical: 2 },

  contactBubble: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900' },
  contactName: { color: C.ink, fontWeight: '700' },
  contactCaption: { color: C.ink3, fontWeight: '500', marginTop: 1 },

  photo: {
    width: 152,
    height: 114,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  photoGridThumb: {
    width: 130,
    height: 98,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  photoSun: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  photoMountain: {
    position: 'absolute',
    bottom: -8,
    left: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 56,
    borderRightWidth: 38,
    borderBottomWidth: 42,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.32)',
  },
  photoLabel: {
    color: '#fff',
    fontWeight: '700',
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  voice: { flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 130 },
  wave: { flex: 1, height: 16, flexDirection: 'row', alignItems: 'center', gap: 2.5 },
  voiceTime: { color: C.ink2, fontWeight: '500' },

  readReceipt: { color: C.ink3, fontWeight: '600', alignSelf: 'flex-end', marginRight: 6, marginTop: -2 },

  savedToast: {
    position: 'absolute',
    top: '46%',
    left: 24,
    right: 24,
    alignItems: 'center',
    backgroundColor: C.osChrome,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  savedToastText: { color: '#fff', fontWeight: '700' },

  quickReplyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: C.chatBar,
  },
  quickReplyChip: {
    borderWidth: 1.5,
    borderColor: C.chatLine,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  quickReplyText: { color: C.ink2, fontWeight: '600' },

  attachMenu: {
    flexDirection: 'row',
    gap: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: C.chatBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.chatLine,
  },
  attachTile: { alignItems: 'center', gap: 6, width: 68 },
  attachIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.chatLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: { color: C.ink2, fontWeight: '600' },

  pickerWrap: {
    backgroundColor: C.chatBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.chatLine,
    maxHeight: 280,
  },
  pickerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerTitle: { color: C.ink, fontWeight: '700' },
  pickerCancel: { color: '#3E7CB1', fontWeight: '600' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },

  contactList: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  contactRowName: { color: C.ink, fontWeight: '600' },

  stickerPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: C.chatBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.chatLine,
  },
  stickerTile: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },

  inputBar: {
    backgroundColor: C.chatBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.chatLine,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  plus: { color: '#6B747A', fontWeight: '500' },
  roundIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  roundIconOn: { backgroundColor: 'rgba(18,183,106,0.16)' },
  field: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.chatLine,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  fieldText: { color: '#98A0A6' },
  mic: { backgroundColor: C.chatGreen, alignItems: 'center', justifyContent: 'center' },
  micActive: { backgroundColor: '#0E9A59' },
});
