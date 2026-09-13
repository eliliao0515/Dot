# Task: Show an unread badge on every not-yet-done chat room

## Context
`ChatsListScreen.tsx`'s `RoomRow` already renders a small green "1" badge
(`s.unreadBadge`) next to a room's time — but today it's driven by
`room.emphasized`, which `App.tsx`'s `buildRoomItems()` sets to `true` only
for the single recommended-next room (`state === 'now'`). The same
`emphasized` flag also drives the bold/dark title+preview text for that one
room.

The project owner wants a second, independent behavior added: **every chat
room that hasn't been fully completed yet should show this badge — not just
the one recommended "now" room — and it should disappear once that room's
lesson is actually done.** This must not change the existing "recommended
next" bold-text highlighting, which should keep working exactly as it does
today for only the single `now` room.

## Target
- Modify: `App.tsx` (`buildRoomItems()` only)
- Modify: `src/sim/ChatsListScreen.tsx` (`ChatRoomItem` type + `RoomRow`'s
  badge condition only)
- **Do not touch**: `src/storage/progress.ts` (its `nodeStateFor()` already
  computes exactly the state this task needs — `'done' | 'now' | 'todo' |
  'milestone'` — read it, don't change it), `src/content/lessons.ts`,
  `src/engine/types.ts`, `src/sim/ChatSim.tsx`, `src/sim/HomeProfileScreen.tsx`,
  `src/sim/BottomTabBar.tsx`, `src/shell/**`, `src/auth/**`, `public/**`

Sole task, no parallel worker on this file range — see the companion task
(hiding two placeholder rooms) which only touches `src/content/lessons.ts`
and has zero file overlap with this one, so the two run in parallel safely.

## Change

### 1. `src/sim/ChatsListScreen.tsx`
Add a new field to `ChatRoomItem`, independent from `emphasized`:
```ts
export type ChatRoomItem = {
  id: string;
  title: string;
  preview: string;
  time: string;
  avatarGlyph: ChatRoomAvatarGlyph;
  avatarColor: string;
  emphasized: boolean;
  /** 這一列的課還沒做完，要不要顯示未讀提示。跟 emphasized 是兩件獨立的事。 */
  unread: boolean;
  actionable: boolean;
};
```
In `RoomRow`, change the badge's render condition from `room.emphasized` to
`room.unread`:
```tsx
{room.unread ? (
  <View style={s.unreadBadge}>
    <T style={[s.unreadBadgeText, { fontSize: fz(base, 0.68), lineHeight: fz(base, 1) }]}>1</T>
  </View>
) : null}
```
Leave every other use of `room.emphasized` (the bold title/preview text
styling) completely unchanged — that stays tied to `emphasized` only, still
meaning "this is the one recommended next room."

### 2. `App.tsx`
In `buildRoomItems()`, add the new field using the `state` value it already
computes via `nodeStateFor()`:
```ts
return {
  id: node.id,
  title: room.contactName,
  preview: room.preview,
  time: room.time,
  avatarGlyph: room.avatarGlyph,
  avatarColor: room.avatarColor,
  emphasized: state === 'now',
  unread: !!node.lessonId && state !== 'done',
  actionable: !!node.lessonId,
};
```
(`!!node.lessonId &&` guards against showing an unread badge on a
not-yet-built placeholder room that has no real lesson behind it — those
rooms are non-actionable and shouldn't imply there's something to catch up
on.)

## Constraints
- The badge itself stays exactly as it looks today (a static "1", not an
  actual unread count) — this task only changes which rooms show it, not
  its visual design
- Don't touch the bold-title "recommended next" styling — that's a
  different, existing concept (`emphasized`) that stays as-is
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`App.tsx` (`buildRoomItems()` only), `src/sim/ChatsListScreen.tsx`
(`ChatRoomItem` type + `RoomRow`'s badge condition only). Sole task this
round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web`; login is mandatory on web, temporarily
  stub `lineUser` if needed to reach the Chats tab — **revert before
  finishing**, confirm via `git diff`):
  - On first load with no progress, every room that has a real lesson
    (`read-reply`, `sticker`, `voice-msg`, `save-photo` today) shows the
    unread badge
  - Complete a lesson's full guided→solo→transfer→realDevice (or skip
    real-device via "等一下再做") for one room — confirm its badge
    disappears once done, while the still-unfinished rooms keep theirs
  - Confirm the single recommended-next room still shows its bold
    title/preview text exactly as before, independent of the badge

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, committed**
- Implementation matched the spec exactly: `ChatRoomItem` gained an
  independent `unread` field; `RoomRow`'s badge condition switched from
  `room.emphasized` to `room.unread`; `buildRoomItems()` computes
  `unread: !!node.lessonId && state !== 'done'`. `emphasized` and its bold
  title/preview styling were untouched.
- PM verification: `npx tsc --noEmit` passed; `git diff` confirmed the
  change set is scoped to exactly the two described files
- PM integration test: relied on the worker's own Playwright pass (fresh
  progress shows the badge on all four lesson-backed rooms; completing one
  lesson end-to-end removes only that room's badge while the other three
  keep theirs; the recommended-next row's bold styling stays independent)
- Outstanding: none
