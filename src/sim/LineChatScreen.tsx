import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useScale } from '../ui/Scale';
import { C } from '../ui/theme';
import type { Bubble, StickerId } from '../engine/types';
import {
  SimTopBar,
  MessageRow,
  SimInputBar,
  AttachMenu,
  ContactPicker,
  StickerPanel,
  ReadReceipt,
  SavedPhotoToast,
  CallMenu,
  topBarMetrics,
} from './parts';
import PhotoViewer from './PhotoViewer';
import VoiceRecorder from './VoiceRecorder';
import CameraPreview from './CameraPreview';
import { pickImage, canPickImage } from './pickImage';

/** 錄音計時格式 mm:ss，例如 7 秒顯示「00:07」，65 秒顯示「01:05」。 */
function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type Panel = 'none' | 'attachMenu' | 'contactPicker' | 'stickerPanel';

/** 對話串的一則訊息，記著當時是哪個聯絡人傳的（換人時舊訊息的名字不會被改掉）。 */
export type ThreadItem = { bubble: Bubble; contact: string };

/**
 * 使用者在 LINE 畫面裡做了什麼。這一層只回報「發生了什麼」，
 * 不判斷對錯 —— 算不算過關是外層（教學疊層）的事。
 */
export type LineAction =
  | { type: 'sendVoice' }
  /** 按頂部電話，打開／關上電話選單。 */
  | { type: 'openCallMenu' }
  | { type: 'closeCallMenu' }
  /** 在電話選單選了語音通話／視訊通話。通話畫面本身由外層決定怎麼顯示。 */
  | { type: 'pickVoiceCall' }
  | { type: 'pickVideoCall' }
  | { type: 'sendSticker' }
  | { type: 'savePhoto' }
  | { type: 'sendText' }
  | { type: 'sendPhoto' }
  | { type: 'sendContact' }
  /** 返回、選單這些在聊天室裡沒有作用的按鈕（沒給 onPressBack 時，返回也算這一種）。 */
  | { type: 'wrongTap' }
  /** 模擬器還沒做出來的按鈕，例如看照片裡的畫筆、錄音畫面上方的工具列。 */
  | { type: 'unbuilt' }
  /** 開關錄音畫面或看照片。外層用來收掉還掛著的提示。 */
  | { type: 'viewChange' };

/**
 * 純 LINE 聊天室畫面。只吃 props，完全不知道「課程」存在。
 *
 * - 對方的訊息由外層透過 incoming 給；新出現的（依 id 判斷）接到對話串後面，
 *   所以外層一關一關多給訊息，就是同一段連續的對話
 * - resetKey 一變，面板、錄音、草稿這些互動狀態重置，對話內容保留
 * - 教學外殼要疊上來的東西（引導條、紅圈、卡住了、成功提示）從插槽放進來，
 *   這一層只決定它們放在哪裡，不決定要不要出現
 */
export default function LineChatScreen({
  contact,
  incoming,
  resetKey,
  hideAttachMenu = false,
  onAction,
  onPressBack,
  threadOverlay,
  aboveInputBar,
  chatOverlay,
  screenOverlay,
  topOverlay,
}: {
  contact: string;
  incoming: ThreadItem[];
  resetKey?: string;
  hideAttachMenu?: boolean;
  onAction: (action: LineAction) => void;
  /** 給了就是真的返回（例如沙盒回聊天列表）；沒給就當作按錯。 */
  onPressBack?: () => void;
  /** 疊在對話串上，位置相對於對話串區域。 */
  threadOverlay?: React.ReactNode;
  /** 放在面板和輸入列之間；有面板打開時不顯示，免得疊太高蓋住輸入列。 */
  aboveInputBar?: React.ReactNode;
  /** 聊天模式（不是錄音畫面）時，疊在整個畫面上。 */
  chatOverlay?: React.ReactNode;
  /** 任何時候都疊在整個畫面上，在「已儲存」提示和看照片之下。 */
  screenOverlay?: React.ReactNode;
  /** 任何時候都疊在最上層，蓋得過看照片。 */
  topOverlay?: React.ReactNode;
}) {
  const { base } = useScale();
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [draftText, setDraftText] = useState('');
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [recorderPhase, setRecorderPhase] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const [seconds, setSeconds] = useState(0);

  const [panel, setPanel] = useState<Panel>('none');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playElapsed, setPlayElapsed] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [savedPhotoToast, setSavedPhotoToast] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<{ label: string; uri?: string } | null>(null);
  const [cameraShot, setCameraShot] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [callMenuOpen, setCallMenuOpen] = useState(false);
  const [previewElapsed, setPreviewElapsed] = useState(0);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const readTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // 使用者自己選或拍的照片會變成 blob: 網址，畫面關掉時要還給瀏覽器。
  const photoUris = useRef<string[]>([]);
  const scroller = useRef<ScrollView>(null);
  // React StrictMode 在 dev 模式會把 effect 故意多跑一次 —
  // 記住哪些訊息已經接進對話串，避免重複塞兩次。
  const appendedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fresh = incoming.filter((item) => !appendedIds.current.has(item.bubble.id));
    if (fresh.length === 0) return;
    fresh.forEach((item) => appendedIds.current.add(item.bubble.id));
    setThread((prev) => [...prev, ...fresh]);
  }, [incoming]);

  // 換一關：只重置互動用的介面狀態，對話內容用接的，不是用洗掉的。
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setDraftText('');
    setRecorderOpen(false);
    setRecorderPhase('idle');
    setSeconds(0);
    setPanel('none');
    setPlayingId(null);
    setPlayElapsed(0);
    setSavedPhotoToast(false);
    setViewingPhoto(null);
    setCameraShot(null);
    setCallMenuOpen(false);
    stopPreview();
    if (playTimer.current) clearInterval(playTimer.current);
    playTimer.current = null;
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = null;
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (playTimer.current) clearInterval(playTimer.current);
      readTimers.current.forEach(clearTimeout);
      if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
      if (previewTimer.current) clearInterval(previewTimer.current);
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) photoUris.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  /** 點麥克風：錄音面板從輸入列的位置長出來，取代輸入列。聊天紀錄照樣看得到。 */
  function openRecorder() {
    onAction({ type: 'viewChange' });
    setPanel('none');
    setSeconds(0);
    setRecorderPhase('idle');
    setRecorderOpen(true);
  }

  function beginRecording() {
    setRecorderPhase('recording');
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
  }

  function stopRecordingPhase() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecorderPhase('stopped');
  }

  function stopPreview() {
    if (previewTimer.current) clearInterval(previewTimer.current);
    previewTimer.current = null;
    setPreviewing(false);
    setPreviewElapsed(0);
  }

  /** 錄完之後點中間的播放鍵試聽（沒有真的聲音，計時跑到錄音長度就停）。 */
  function togglePreview() {
    if (previewing) {
      stopPreview();
      return;
    }
    const total = Math.max(1, seconds);
    setPreviewing(true);
    setPreviewElapsed(0);
    previewTimer.current = setInterval(() => {
      setPreviewElapsed((n) => {
        if (n + 1 >= total) {
          if (previewTimer.current) clearInterval(previewTimer.current);
          previewTimer.current = null;
          setPreviewing(false);
          return 0;
        }
        return n + 1;
      });
    }, 1000);
  }

  /** 點紙飛機才真正送出。 */
  function sendVoiceMessage() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const secs = Math.max(1, seconds);
    stopPreview();
    setRecorderOpen(false);
    setRecorderPhase('idle');
    setThread((prev) => [
      ...prev,
      { bubble: { id: `voice-${Date.now()}`, from: 'me', kind: 'voice', seconds: secs }, contact },
    ]);
    onAction({ type: 'sendVoice' });
  }

  /** 垃圾桶或右上角關閉都算取消：不送出，回到正常聊天畫面。 */
  function discardRecording() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stopPreview();
    setRecorderOpen(false);
    setRecorderPhase('idle');
    setSeconds(0);
  }

  function scheduleRead(id: string) {
    const t = setTimeout(() => {
      setReadIds((prev) => new Set(prev).add(id));
    }, 1500);
    readTimers.current.push(t);
  }

  function appendSent(bubble: Bubble) {
    setThread((prev) => [...prev, { bubble, contact }]);
    setPanel('none');
    scheduleRead(bubble.id);
  }

  function appendTextBubble(text: string) {
    appendSent({ id: `txt-${Date.now()}`, from: 'me', kind: 'text', text });
  }

  function sendDraftText() {
    const text = draftText.trim();
    if (!text) return;
    appendTextBubble(text);
    setDraftText('');
    onAction({ type: 'sendText' });
  }

  function sendPhoto(uri: string) {
    appendSent({ id: `photo-${Date.now()}`, from: 'me', kind: 'photo', label: '照片', uri });
    onAction({ type: 'sendPhoto' });
  }

  /** 照片鍵：打開手機自己的相簿，選好就直接傳到聊天室。 */
  function openAlbum() {
    setPanel('none');
    if (!canPickImage) {
      onAction({ type: 'unbuilt' });
      return;
    }
    pickImage('library').then((uri) => {
      if (!uri) return;
      photoUris.current.push(uri);
      sendPhoto(uri);
    });
  }

  /** 相機鍵：直接打開手機自己的相機，拍好先看預覽，按右下角的送出才傳。 */
  function openCamera() {
    setPanel('none');
    if (!canPickImage) {
      onAction({ type: 'unbuilt' });
      return;
    }
    pickImage('camera').then((uri) => {
      if (!uri) return;
      photoUris.current.push(uri);
      onAction({ type: 'viewChange' });
      setCameraShot(uri);
    });
  }
  function sendContact(name: string) {
    appendSent({ id: `contact-${Date.now()}`, from: 'me', kind: 'contact', name });
    onAction({ type: 'sendContact' });
  }
  function sendSticker(id: StickerId) {
    appendSent({ id: `sticker-${Date.now()}`, from: 'me', kind: 'sticker', sticker: id });
    onAction({ type: 'sendSticker' });
  }

  function togglePlay(id: string, secs: number) {
    if (playTimer.current) clearInterval(playTimer.current);
    if (playingId === id) {
      playTimer.current = null;
      setPlayingId(null);
      setPlayElapsed(0);
      return;
    }
    setPlayingId(id);
    setPlayElapsed(0);
    playTimer.current = setInterval(() => {
      setPlayElapsed((n) => {
        if (n + 1 >= secs) {
          if (playTimer.current) clearInterval(playTimer.current);
          playTimer.current = null;
          setPlayingId(null);
          return 0;
        }
        return n + 1;
      });
    }, 1000);
  }

  // PhotoViewer 蓋在最上層（zIndex:50），下載後要先關掉它，「已儲存」提示才看得到。
  function handleDownloadPhoto() {
    setViewingPhoto(null);
    setSavedPhotoToast(true);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSavedPhotoToast(false), 1800);
    onAction({ type: 'savePhoto' });
  }

  const unbuilt = () => onAction({ type: 'unbuilt' });

  function togglePhoneMenu() {
    if (callMenuOpen) {
      closePhoneMenu();
      return;
    }
    setPanel('none');
    setCallMenuOpen(true);
    onAction({ type: 'openCallMenu' });
  }
  function closePhoneMenu() {
    setCallMenuOpen(false);
    onAction({ type: 'closeCallMenu' });
  }
  const wrongTap = () => onAction({ type: 'wrongTap' });

  const meBubbles = thread.filter((t) => t.bubble.from === 'me');
  const lastSent = meBubbles.length > 0 ? meBubbles[meBubbles.length - 1].bubble : null;

  return (
    <View style={st.wrap}>
      <SimTopBar
        contact={contact}
        base={base}
        onWrongTap={wrongTap}
        onPressBack={onPressBack}
        onPressPhone={togglePhoneMenu}
        onPressUnbuilt={unbuilt}
        phoneActive={callMenuOpen}
      />

      {callMenuOpen ? (
        <>
          {/* 點選單以外的地方就收起來 */}
          <Pressable
            style={[st.menuBackdrop, { top: topBarMetrics(base).height }]}
            onPress={() => closePhoneMenu()}
            accessibilityLabel="關閉電話選單"
          />
          <View style={{ position: 'absolute', left: 0, right: 0, top: topBarMetrics(base).height, zIndex: 20 }}>
            <CallMenu
              base={base}
              onPickVoice={() => {
                closePhoneMenu();
                onAction({ type: 'pickVoiceCall' });
              }}
              onPickVideo={() => {
                closePhoneMenu();
                onAction({ type: 'pickVideoCall' });
              }}
            />
          </View>
        </>
      ) : null}

      <View style={st.threadWrap}>
        <ScrollView
          ref={scroller}
          style={st.thread}
          contentContainerStyle={st.threadInner}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          // 鍵盤或錄音面板出現時畫面變矮，最新的訊息要留在下面那一塊正上方，不能被擠到看不見。
          onLayout={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          {thread.map(({ bubble, contact: from }) => (
            <MessageRow
              key={bubble.id}
              msg={bubble}
              contact={from}
              base={base}
              playingId={playingId}
              playElapsed={playElapsed}
              onTogglePlay={togglePlay}
              onOpenPhoto={(label, uri) => {
                onAction({ type: 'viewChange' });
                setViewingPhoto({ label, uri });
              }}
            />
          ))}
          {lastSent && readIds.has(lastSent.id) ? <ReadReceipt base={base} /> : null}
        </ScrollView>
        {threadOverlay}
      </View>

      {recorderOpen ? (
        <VoiceRecorder
          phase={recorderPhase}
          previewing={previewing}
          elapsedLabel={formatElapsed(previewing ? previewElapsed : seconds)}
          onStartRecording={beginRecording}
          onStopRecording={stopRecordingPhase}
          onTogglePreview={togglePreview}
          onSend={sendVoiceMessage}
          onDiscard={discardRecording}
          onClose={discardRecording}
          onTopBarAction={unbuilt}
        />
      ) : (
        <>
          {panel === 'attachMenu' && !hideAttachMenu ? (
            <AttachMenu base={base} onSelectContact={() => setPanel('contactPicker')} />
          ) : null}
          {panel === 'contactPicker' ? (
            <ContactPicker base={base} onPick={sendContact} onCancel={() => setPanel('none')} />
          ) : null}
          {panel === 'stickerPanel' ? <StickerPanel base={base} onPick={sendSticker} /> : null}

          {panel === 'none' ? aboveInputBar : null}

          <SimInputBar
            base={base}
            draftText={draftText}
            onChangeDraftText={setDraftText}
            onSendDraftText={sendDraftText}
            onPressPlus={() => setPanel((p) => (p === 'attachMenu' ? 'none' : 'attachMenu'))}
            onPressCamera={openCamera}
            onPressAlbum={openAlbum}
            onPressSticker={() => setPanel((p) => (p === 'stickerPanel' ? 'none' : 'stickerPanel'))}
            onPressMic={openRecorder}
            attachOpen={panel === 'attachMenu' || panel === 'contactPicker'}
            stickerOpen={panel === 'stickerPanel'}
          />

          {panel === 'none' ? chatOverlay : null}
        </>
      )}

      {screenOverlay}

      {savedPhotoToast ? <SavedPhotoToast base={base} /> : null}

      {viewingPhoto ? (
        <PhotoViewer
          photoLabel={viewingPhoto.label}
          photoUri={viewingPhoto.uri}
          contactName={contact}
          timestamp="上午 9:32"
          onClose={() => {
            onAction({ type: 'viewChange' });
            setViewingPhoto(null);
          }}
          onDownload={handleDownloadPhoto}
          onTrash={unbuilt}
          onShare={unbuilt}
          onDraw={unbuilt}
        />
      ) : null}

      {cameraShot ? (
        <CameraPreview
          uri={cameraShot}
          onClose={() => {
            onAction({ type: 'viewChange' });
            setCameraShot(null);
          }}
          onSend={() => {
            const uri = cameraShot;
            setCameraShot(null);
            sendPhoto(uri);
          }}
        />
      ) : null}

      {topOverlay}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.chatBg },
  threadWrap: { flex: 1 },
  thread: { flex: 1 },
  threadInner: { padding: 14, gap: 12 },
  menuBackdrop: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 19 },
});
