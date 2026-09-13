# Task: Temporarily hide the video-call and customer-service placeholder rooms

## Context
`src/content/lessons.ts`'s `MAP_NODES`/`CHAT_ROOMS` currently include two
entries with no real lesson behind them yet:
- `video-call` (contact "小宇（孫子）", `state: 'todo'`, no `lessonId`) —
  the video-call lesson is speced out in `specs/08-incoming-video-call-lesson.md`
  but not yet built
- `anti-fraud` (contact "客服中心", `state: 'todo'`, no `lessonId`) — the
  anti-fraud module isn't built yet either

Today both still show up as rows in the Chats list; tapping them just shows
a "這個聊天室的練習還沒做好" toast (via `ChatsListScreen.tsx`'s existing
`actionable: false` handling — no code changes needed there). The project
owner wants these two rows **hidden from view entirely for now** — not
deleted forever, just withheld until their lessons actually exist — since
showing a non-functional room reads worse than not showing it at all.

## Target
- Modify: `src/content/lessons.ts` only (`MAP_NODES` and `CHAT_ROOMS`
  arrays)
- **Do not touch**: `App.tsx`, `src/sim/ChatsListScreen.tsx`,
  `src/sim/ChatSim.tsx`, `src/engine/types.ts`, `src/storage/progress.ts`,
  `src/shell/**`, `src/auth/**`, `public/**`

Sole task, no parallel worker on this file range — see the companion task
(unread badges on the Chats list), which only touches `App.tsx` and
`src/sim/ChatsListScreen.tsx` and has zero file overlap with this one, so
the two run in parallel safely.

## Change
Before removing anything, grep the whole project for `video-call` and
`anti-fraud` (both as literal strings and as part of longer identifiers) to
confirm `MAP_NODES`/`CHAT_ROOMS` are the only places these two ids are
referenced. If you find another file depending on either id (e.g. a
practice-question bank, or anything else), stop and escalate rather than
silently leaving a dangling reference.

Remove the `video-call` and `anti-fraud` entries from both the `MAP_NODES`
array and the `CHAT_ROOMS` array in `src/content/lessons.ts`. Add a short
comment at the top of `MAP_NODES` (or wherever reads most naturally) noting
why two ids are conspicuously absent, so a future session doesn't think
they were forgotten — something like: "video-call 跟 anti-fraud 兩個節點先
暫時拿掉，等各自的課做出來再放回來（video-call 的規格見
specs/08-incoming-video-call-lesson.md）。"

**Known, accepted side effect — not a bug**: `src/shell/MapScreen.tsx` also
renders from `MAP_NODES`, so those two waypoints will disappear from the
map view as well as the Chats list. This is intentional (an unbuilt lesson
shouldn't appear as a route on the map either) — you don't need to touch
`MapScreen.tsx`, just confirm during manual testing that it still renders
correctly with two fewer nodes (no crash, no leftover gap/misalignment).

This is meant to be easily reversible later (when either lesson is
actually built) — prefer a clean removal over a messy commented-out block;
git history plus the explanatory comment above is enough for a future
session to restore them.

## Constraints
- Don't touch anything about the four remaining rooms (`read-reply`,
  `sticker`, `voice-msg`, `save-photo`) — their order, content, and state
  stay exactly as they are
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`src/content/lessons.ts` only. Sole task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web`; login is mandatory on web, temporarily
  stub `lineUser` if needed to reach the Chats tab — **revert before
  finishing**, confirm via `git diff`):
  - The Chats tab list no longer shows "小宇（孫子）" or "客服中心" rows
  - The remaining four rooms still render in their original order with no
    visual gap or crash
  - The Map screen (reachable via however it's currently entered in this
    build) still renders without error and without the two removed
    waypoints

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, committed**
- Grep confirmed `video-call`/`anti-fraud` were referenced only in
  `src/content/lessons.ts` and `src/shell/MapScreen.tsx` (a generic
  `.map()` over `MAP_NODES` with no hardcoded node count/index, safe with
  fewer nodes). Both ids were removed cleanly from `MAP_NODES` and
  `CHAT_ROOMS`, with an explanatory comment above `MAP_NODES` referencing
  this spec and spec 08.
- Noteworthy finding, not a defect of this task: `MapScreen.tsx` currently
  has **no route/entry point wired up in `App.tsx` at all** in this build —
  it's pre-existing orphaned/unmounted code, unrelated to this change. The
  worker verified its `MAP_NODES` usage by reading the code rather than a
  live click-through, since there's nothing to click into yet. If a future
  session wires up a route to it, do a real visual pass at that time.
- PM verification: `npx tsc --noEmit` passed; `git diff` confirmed the
  change set is scoped to exactly `src/content/lessons.ts` — `App.tsx` was
  untouched (the worker had briefly stubbed `lineUser` there to visually
  verify the Chats list while the companion unread-badge task was also
  mid-edit on that same file, and reverted it precisely before finishing)
- PM integration test: relied on the worker's own Playwright pass
  confirming "小宇（孫子）" and "客服中心" no longer appear in the Chats
  list and the remaining four rooms keep their order with no crash
- Outstanding: none. `specs/08-incoming-video-call-lesson.md` remains the
  reference for restoring `video-call` once that lesson is actually built.
