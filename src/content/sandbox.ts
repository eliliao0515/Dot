import type { Bubble, ChatRoomAvatarGlyph } from '../engine/types';
import { CHAT_ROOMS, LESSONS } from './lessons';

/**
 * 「我的沙盒」的聊天室內容。純情境資料，沒有任何過關路徑。
 *
 * 直接沿用 LINE 情境課程裡已經審過的人物和訊息：列表那一列用 CHAT_ROOMS，
 * 點進去的開場訊息用那一課每一關裡、同一個聯絡人傳的訊息。
 * 這樣沙盒裡看到的就是學員在課程裡會看到的東西，方便對照真機驗收。
 */
export type SandboxRoom = {
  id: string;
  contactName: string;
  avatarGlyph: ChatRoomAvatarGlyph;
  avatarColor: string;
  preview: string;
  time: string;
  messages: Bubble[];
};

export const SANDBOX_ROOMS: SandboxRoom[] = CHAT_ROOMS.map((room) => {
  const lesson = LESSONS[room.id];
  const messages = lesson
    ? lesson.stages.filter((st) => st.contact === room.contactName).flatMap((st) => st.messages)
    : [];
  return { ...room, messages };
});
