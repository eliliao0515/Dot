import React from 'react';
import { View, Pressable, StyleSheet, Platform, TextInput, Image } from 'react-native';
import { T } from '../ui/Scale';
import { C, fz, textBase } from '../ui/theme';
import {
  Back, Mic, MicOutline, Plus, Play, Pause, VideoCam, Menu, Smile, Send,
  ThumbsUp, Heart, Laugh, Ok, Flower, Camera, Album, Person,
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

/** 語音訊息時長顯示，例如 65 秒顯示「1:05」。錄音現在點一下開始/停止，長度不再固定個位數。 */
function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SAMPLE_CONTACTS = ['陳醫師', '里長', '大兒子', '孫子小宇'];

export function SimTopBar({ contact, base, onWrongTap, onPressBack, onPressVideo }: {
  contact: string;
  base: number;
  onWrongTap: () => void;
  /** 給了就是真的返回；沒給就跟選單鍵一樣當作按錯。 */
  onPressBack?: () => void;
  onPressVideo: () => void;
}) {
  return (
    <View style={s.topBar}>
      <Pressable onPress={onPressBack ?? onWrongTap} hitSlop={8}>
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

function PhotoThumb({ label, uri, size, base, onPress }: {
  label: string;
  uri?: string;
  size: 'bubble' | 'grid';
  base: number;
  onPress?: () => void;
}) {
  if (uri) {
    return (
      <Pressable onPress={onPress} style={[size === 'bubble' ? s.photo : s.photoGridThumb, s.photoReal]}>
        <Image source={{ uri }} style={s.photoImage} resizeMode="cover" accessibilityLabel={label} />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
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
  onOpenPhoto,
}: {
  msg: Bubble;
  contact: string;
  base: number;
  playingId?: string | null;
  playElapsed?: number;
  onTogglePlay?: (id: string, seconds: number) => void;
  onOpenPhoto?: (label: string, uri?: string) => void;
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
          uri={msg.uri}
          size="bubble"
          base={base}
          onPress={() => onOpenPhoto?.(msg.label, msg.uri)}
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
                {formatDuration(playing ? playElapsed ?? 0 : msg.seconds)}
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


/** 「＋」的附加選單：照片、聯絡人。 */
/** ＋選單。照片和相機已經直接放在輸入列上（跟真的 LINE 一樣），這裡不再重複。 */
export function AttachMenu({ base, onSelectContact }: {
  base: number;
  onSelectContact: () => void;
}) {
  return (
    <View style={s.attachMenu}>
      <Pressable style={s.attachTile} onPress={onSelectContact}>
        <View style={s.attachIconWrap}>
          <Person size={fz(base, 1.3)} color={C.ink2} />
        </View>
        <T style={[s.attachLabel, { fontSize: fz(base, 0.8) }]}>聯絡人</T>
      </Pressable>
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

/**
 * 輸入列的尺寸。照真的 LINE（iPhone、390pt 寬）截圖量出來的，以標準字級為基準，
 * 全部跟著 base 等比例縮放 —— 按鈕大小和間距的比例永遠固定，跟真手機一致。
 *
 *   ＋  相機  照片  [ Aa ············ ☺ ]  🎤
 *   14 20 17.5 20 20.5 20 19 [  輸入框 34 高  ] 14 15 18
 *
 * 錄音面板頂部那一列也用同一組數字（InputBarRow），按下麥克風時那一列才不會跳。
 * 教學疊層的紅圈也從這裡算位置，改這裡就會一起跟著動。
 */
export function inputBarMetrics(base: number) {
  const k = base / 16;
  const m = {
    padL: 14 * k,
    padR: 18 * k,
    padV: 8 * k,
    iconSlot: 20 * k,
    gapPlusCamera: 17.5 * k,
    gapCameraAlbum: 20.5 * k,
    gapAlbumField: 19 * k,
    gapFieldRight: 14 * k,
    fieldH: 34 * k,
    fieldPadL: 15 * k,
    fieldPadR: 8 * k,
    fontSize: 17 * k,
    smileSize: 19 * k,
    rightSlot: 15 * k,
    micSize: 28 * k,
    stroke: 1.8 * k,
  };
  return {
    ...m,
    barH: m.fieldH + m.padV * 2,
    /** 輸入框左緣到畫面左緣的距離。 */
    fieldLeft: m.padL + m.iconSlot * 3 + m.gapPlusCamera + m.gapCameraAlbum + m.gapAlbumField,
    /** 輸入框右緣到畫面右緣的距離。 */
    fieldRightInset: m.padR + m.rightSlot + m.gapFieldRight,
  };
}

const BAR_ICON = '#1C1C1E';

/**
 * 輸入列的骨架：左邊＋、相機、照片，中間輸入框，右邊一個位置（麥克風／送出／關閉）。
 * 一般輸入列和錄音面板頂部共用，兩者尺寸保證一模一樣。
 */
export function InputBarRow({
  base,
  field,
  right,
  onPressPlus,
  onPressCamera,
  onPressAlbum,
  plusActive = false,
}: {
  base: number;
  field: React.ReactNode;
  right: React.ReactNode;
  onPressPlus: () => void;
  onPressCamera: () => void;
  onPressAlbum: () => void;
  plusActive?: boolean;
}) {
  const m = inputBarMetrics(base);
  const slot = { width: m.iconSlot, height: m.fieldH, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={[s.inputBar, { paddingLeft: m.padL, paddingRight: m.padR, paddingVertical: m.padV }]}>
      <Pressable onPress={onPressPlus} hitSlop={8} style={slot} accessibilityLabel="更多">
        <Plus size={m.iconSlot / 0.7} color={plusActive ? C.chatGreen : BAR_ICON} weight={m.stroke} />
      </Pressable>
      {/* 從左到右：＋、相機、照片，跟真的 LINE 一樣直接放在輸入框左邊，不用先按＋。 */}
      <Pressable onPress={onPressCamera} hitSlop={8} style={[slot, { marginLeft: m.gapPlusCamera }]} accessibilityLabel="相機">
        <Camera size={m.iconSlot / 0.78} color={BAR_ICON} weight={m.stroke} />
      </Pressable>
      <Pressable onPress={onPressAlbum} hitSlop={8} style={[slot, { marginLeft: m.gapCameraAlbum }]} accessibilityLabel="照片">
        <Album size={m.iconSlot / 0.82} color={BAR_ICON} weight={m.stroke} />
      </Pressable>

      <View
        style={[
          s.field,
          {
            marginLeft: m.gapAlbumField,
            height: m.fieldH,
            borderRadius: m.fieldH / 2,
            paddingLeft: m.fieldPadL,
            paddingRight: m.fieldPadR,
          },
        ]}
      >
        {field}
      </View>

      <View style={{ marginLeft: m.gapFieldRight, width: m.rightSlot, height: m.fieldH, alignItems: 'center', justifyContent: 'center' }}>
        {right}
      </View>
    </View>
  );
}

export function SimInputBar({
  base,
  draftText,
  onChangeDraftText,
  onSendDraftText,
  onPressPlus,
  onPressCamera,
  onPressAlbum,
  onPressSticker,
  onPressMic,
  attachOpen,
  stickerOpen,
}: {
  base: number;
  draftText: string;
  onChangeDraftText: (text: string) => void;
  onSendDraftText: () => void;
  onPressPlus: () => void;
  onPressCamera: () => void;
  onPressAlbum: () => void;
  onPressSticker: () => void;
  onPressMic: () => void;
  attachOpen: boolean;
  stickerOpen: boolean;
}) {
  const m = inputBarMetrics(base);
  const hasDraft = draftText.length > 0;
  return (
    <InputBarRow
      base={base}
      onPressPlus={onPressPlus}
      onPressCamera={onPressCamera}
      onPressAlbum={onPressAlbum}
      plusActive={attachOpen}
      field={
        <>
          <TextInput
            value={draftText}
            onChangeText={onChangeDraftText}
            placeholder="Aa"
            placeholderTextColor="#B4B4B8"
            allowFontScaling={false}
            returnKeyType="send"
            onSubmitEditing={onSendDraftText}
            style={[textBase, s.fieldInput, { fontSize: m.fontSize, lineHeight: m.fontSize * 1.3, color: C.ink }]}
          />
          <Pressable onPress={onPressSticker} hitSlop={8} accessibilityLabel="貼圖">
            <Smile size={m.smileSize} color={stickerOpen ? C.chatGreen : '#8E8E93'} weight={m.stroke * 0.85} />
          </Pressable>
        </>
      }
      right={
        <Pressable
          onPress={hasDraft ? onSendDraftText : onPressMic}
          // 手抖的人常按不準，把觸控範圍放寬；畫面上的圖示大小照真 LINE，不放大。
          hitSlop={14}
          pressRetentionOffset={{ top: 60, bottom: 60, left: 60, right: 60 }}
          style={({ pressed }) => [s.micSlot, pressed && { opacity: 0.6 }]}
          accessibilityLabel={hasDraft ? '傳送' : '語音訊息'}
        >
          {hasDraft ? (
            <Send size={m.micSize * 0.85} color={C.chatGreen} />
          ) : (
            <MicOutline size={m.micSize} color={BAR_ICON} weight={m.stroke} />
          )}
        </Pressable>
      }
    />
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
  photoReal: { backgroundColor: '#000', overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.chatLine,
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
    // 網頁上的 <input> 有自己的預設寬度，不設 minWidth:0 會把右邊的麥克風擠出畫面。
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9DE',
  },
  fieldInput: { flex: 1, minWidth: 0, paddingVertical: 0 },
  micSlot: { alignItems: 'center', justifyContent: 'center' },
});
