# Task: Make guided → solo → transfer feel like one continuous conversation

## Context — decisions already confirmed with the user, do not re-litigate
Today, advancing between a lesson's guided/solo/transfer stages fully
remounts `ChatSim` (via `key={`${lesson.id}-${stack.stageIndex}`}` in
`App.tsx`), which wipes the message thread back to empty and starts that
stage's scripted opener messages fresh. The project owner wants this
changed: **after replying to one stage's message, the next stage's message
to reply to should appear as a new message in the same, unbroken
conversation thread** — not a hard scene cut.

(Note: `App.tsx`'s navigation state was reworked since this spec was first
drafted — spec 27 replaced the old flat `Route` union with two states,
`activeTab` for the persistent bottom tabs and `stack` for the full-screen
overlay a lesson renders in. Every reference below to `stack`/
`stack.stageIndex` is that current state; this task does not touch
`activeTab` or anything tab-bar related.)

Two things were explicitly confirmed and are **not** open for
reinterpretation:
1. The **transfer** stage still deliberately switches to a different contact
   (this is an intentional, documented pedagogical device — see each
   lesson's own content in `src/content/lessons.ts`, e.g. "換人、換情境，
   用來檢驗他學到的是操作而不是位置記憶" — testing that the learner
   generalized the *action*, not memorized a screen). **Do not remove the
   contact switch.** What changes is only that the switch must not cause a
   full-screen reset — it should read as "a new message just came in from
   someone else," using the thread's existing `showName` sender-label
   mechanism (already present in the content data, no content changes
   needed) rather than a scene cut.
2. The progress indicator (`TeachingFrame`'s "練習 X / Y　階段名稱" bar in
   `App.tsx`) stays exactly as it is — it already updates correctly as
   `stack.stageIndex` changes and does **not** need any changes for this
   task; it is not part of your Target below.

## Target
- Modify: `src/sim/ChatSim.tsx`
- Modify: `App.tsx` (one line — the `<ChatSim>` call site's `key` prop)
- **Do not touch**: `src/sim/parts.tsx`, `src/sim/VoiceRecorder.tsx`,
  `src/sim/PhotoViewer.tsx`, `src/content/**`, `src/engine/types.ts`,
  `src/shell/PracticeSession.tsx`, `src/shell/LessonScreens.tsx`,
  `src/shell/LoginGate.tsx`, `src/sim/ChatsListScreen.tsx`,
  `src/sim/HomeProfileScreen.tsx`, `src/sim/BottomTabBar.tsx`,
  `src/auth/**`, `public/**`

Sole task, no parallel worker — this is one tightly-coupled internal
refactor of `ChatSim.tsx`'s state model, touching many of its existing
pieces at once; splitting it across two workers would just create merge
conflicts within the same file for no benefit.

**`PracticeSession.tsx` is explicitly unaffected and untouched.** It already
mounts `ChatSim` with `key={question.id}` (a fresh key per random practice
question), so each practice question already gets a clean full remount
regardless of anything in this task — that's correct and intentional, do
not change it, and do not add any special-casing in `ChatSim.tsx` for
practice mode. Just verify (see Observable acceptance) that practice mode
still resets properly between questions after your changes.

## Change

### 1. `App.tsx`
Find the `<ChatSim>` call site inside the `stack.name === 'sim' && lesson`
branch. Change:
```tsx
<ChatSim
  key={`${lesson.id}-${stack.stageIndex}`}
  ...
/>
```
to:
```tsx
<ChatSim
  key={lesson.id}
  ...
/>
```
Keying only by `lesson.id` means switching stages within one lesson no
longer forces a remount, while starting a genuinely different lesson (a
different `lesson.id` — e.g. leaving and picking a different chat room)
still does, which is correct and desired — unrelated lessons must not share
state. Nothing else in `App.tsx`'s `advance()` function or `stack` logic
changes; `stack.stageIndex` still updates exactly as it does today, still
drives `TeachingFrame`'s label, and is still passed to `recordStageDone`.
`activeTab` and `BottomTabBar` are untouched by this task entirely — a
lesson still renders as a full-screen overlay with the tab bar hidden,
exactly as it does today.

### 2. `src/sim/ChatSim.tsx` — replace the reset-on-stage-change model with an accumulate-on-stage-change model

#### 2a. Unify `script.messages` + `sent` into one persistent, ordered thread
Today the render does two separate `.map()` passes — first over the current
stage's `script.messages` (always freshly read from the prop, never
accumulated), then over `sent` (what the user has sent, which currently
resets to `[]` every stage change). This produces the wrong grouping for a
continuous thread (it would put every stage's incoming messages in one
block, followed by every stage's replies in a second block) and loses
earlier stages' opening messages entirely once a new stage's props take
over.

Replace both with a single, chronologically-ordered thread that keeps
growing. Because messages from different stages can come from **different
contacts** (transfer's contact switch), and each rendered `MessageRow` needs
to know which contact the specific message belongs to (for its `showName`
sender label — a message from an earlier stage must keep showing its own
original contact's name, not get silently relabeled with whichever contact
is active *now*), track contact alongside each bubble rather than reading a
single ambient `script.contact` for the whole list:

```ts
const [thread, setThread] = useState<Array<{ bubble: Bubble; contact: string }>>([]);
```

Remove the old `const [sent, setSent] = useState<Bubble[]>([]);` entirely —
every function that used to call `setSent` now appends to `thread` instead
(see 2c).

#### 2b. The stage-change effect: accumulate, don't wipe
Today's effect (dependency `[script.stage]`) resets everything, including
`setSent([])`. Change it to:
- **Append**, not reset, the conversation content: on every fire (including
  the very first, for stage 1's own opening messages), append
  `script.messages` — stamped with the *current* `script.contact` — onto
  `thread`, using a functional update: `setThread((prev) => [...prev,
  ...script.messages.map((bubble) => ({ bubble, contact: script.contact }))]);`
- **Guard against a double-append.** This codebase runs under React's
  StrictMode in development, which intentionally double-invokes effects
  once on mount — a bare append here would visibly duplicate the first
  stage's messages in the dev server (though not in the production export).
  Guard with a ref that remembers the last stage identity you've already
  appended for, and skip appending if it matches (e.g.
  `const appendedStagesRef = useRef<Set<string>>(new Set()); ... in the
  effect: const key = `${lesson.id}:${script.stage}`; if
  (appendedStagesRef.current.has(key)) return; appendedStagesRef.current.add(key);`
  then do the append — adapt this however reads cleanest, the important
  part is that each stage's opening messages get appended to the thread
  exactly once no matter how many times the effect body runs for the same
  stage).
- **Still reset, exactly as today** (these are per-stage-interaction state,
  not conversation content, and must keep resetting so each new stage
  starts with a clean interaction surface): `draftText`, `recorderOpen`,
  `recorderPhase`, `seconds`, `wrongTaps`, `askedForHelp`, `nudge`,
  `succeeded`, `panel`, `playingId`, `playElapsed`, `savedPhotoToast`,
  `viewingPhotoLabel`, and the `playTimer`/`saveToastTimer` cleanup calls —
  copy these reset lines over unchanged from the current effect body.
- **No longer reset**: `readIds` (remove `setReadIds(new Set())` from this
  effect) and stop clearing `readTimers.current` here (remove that block
  from this effect specifically — the separate unmount-cleanup effect at
  the bottom of the file, the one with `[]` deps, is untouched and still
  correctly cancels everything on true unmount). Reasoning: once a message
  is marked read, it should stay read as the conversation continues — real
  LINE doesn't un-read your last message when a new one arrives — and a
  read-receipt timer scheduled in an earlier stage should still be allowed
  to fire naturally rather than being cancelled just because the stage
  changed.

#### 2c. Update every "me" send path to append to `thread` instead of `sent`
- `appendSent(bubble)`: change `setSent((prev) => [...prev, bubble])` to
  `setThread((prev) => [...prev, { bubble, contact: script.contact }])`.
  Keep `setPanel('none')` and `scheduleRead(bubble.id)` as they are.
- `sendVoiceMessage()`: change its direct `setSent((prev) => [...prev, {
  id: ..., from: 'me', kind: 'voice', seconds: secs }])` call the same way —
  append `{ bubble: {...}, contact: script.contact }` to `thread`. (This
  function doesn't call `scheduleRead` today — that's a pre-existing detail
  unrelated to this task, leave it as-is, don't fix it as a drive-by.)
- Every other function that goes through `appendSent` (`sendPhoto`,
  `sendContact`, `sendSticker`) needs no changes beyond `appendSent` itself
  already being fixed above.

#### 2d. Update the render
Replace the two separate `.map()` blocks with one, reading each bubble's own
stamped contact instead of the current `script.contact`:
```tsx
{thread.map(({ bubble, contact }) => (
  <MessageRow
    key={bubble.id}
    msg={bubble}
    contact={contact}
    base={base}
    playingId={playingId}
    playElapsed={playElapsed}
    onTogglePlay={togglePlay}
    onOpenPhoto={openPhoto}
  />
))}
```
Update `lastSent`'s derivation to come from `thread` instead of `sent`:
```ts
const meBubbles = thread.filter((t) => t.bubble.from === 'me');
const lastSent = meBubbles.length > 0 ? meBubbles[meBubbles.length - 1].bubble : null;
```
(`readIds.has(lastSent.id)` usage right after this is unchanged.)

## Constraints
- `Lesson.target` is a single fixed field for the whole lesson (not
  per-stage) — every stage within one lesson already shares the identical
  completion mechanism (same `target.node`/`gesture`), so nothing about
  *how a stage is completed* changes in this task, only how the thread
  persists and grows across stage boundaries
- Don't touch `src/engine/types.ts` — the per-bubble contact tracking
  described above is a `ChatSim.tsx`-internal rendering concern (a local
  `{ bubble, contact }` tuple), not a change to the shared `Bubble` type
- Colors/layout of individual message bubbles, the coach banner, the note,
  the quick-reply row, the input bar, the success banner, etc. are all
  unchanged — this task is purely about what accumulates in the thread and
  when it resets, not visual redesign of any of those pieces
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`src/sim/ChatSim.tsx`, `App.tsx` (only the `<ChatSim key={...}>` line). Sole
task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web` — since login is now mandatory, you
  may need to temporarily stub `lineUser` in `App.tsx` to reach a lesson
  screen without a real login; **revert any such stub before finishing**,
  confirm via `git diff` that only the intended changes remain):
  - Start the voice message lesson (淑芬). Complete guided (record + send).
    Confirm solo's opening message ("媽，冰箱那包魚要記得煮掉喔" or
    whichever is scripted) appears **below** your guided reply in the same
    scrolling thread — the guided messages and your reply must still be
    visible, not cleared
  - Complete solo. Confirm transfer's opening message appears the same way,
    **and** the contact name shown above that message switches to the
    transfer contact (e.g. 阿美) via its `showName` label, while your
    earlier messages (sent while replying to 淑芬) do **not** retroactively
    relabel to the new contact
  - Confirm the top bar (`SimTopBar`) contact name updates to the transfer
    stage's contact once that stage begins (this should already happen for
    free, since `script.contact` is still a normal, non-remounted prop —
    just confirm it, don't add special logic for it)
  - Confirm the "卡住了，教我" help button and the coach banner both still
    appear/disappear correctly per stage (fresh per stage, not stuck from
    the previous one)
  - Confirm a read receipt ("已讀") that appeared under a reply in an
    earlier stage is still there once a later stage begins (it must not
    vanish just because the stage changed)
  - Regression-test the other three lessons (sticker, save-photo,
    read-reply) end to end once each, and the practice session once,
    confirming: (a) each still completes correctly stage to stage, and (b)
    practice-session questions still each start with a fully empty, fresh
    thread (unaffected by this change, per the `key={question.id}` note
    above)

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, committed**
- Implementation matched the spec closely: `App.tsx`'s `<ChatSim key>`
  changed from `${lesson.id}-${stack.stageIndex}` to just `lesson.id`;
  `ChatSim.tsx` replaced `sent`/`script.messages` with a single
  `thread: Array<{ bubble: Bubble; contact: string }>` that accumulates
  across stage transitions, guarded against React StrictMode's dev-mode
  double-effect via an `appendedStagesRef` set keyed by
  `${lesson.id}:${script.stage}`; `readIds`/`readTimers` no longer reset on
  stage change so read receipts persist across the continuing thread;
  per-stage interaction state (`draftText`, recorder state, `succeeded`,
  `panel`, etc.) still resets exactly as before
- PM verification: `npx tsc --noEmit` passed; `git diff` confirmed the
  change set is scoped to exactly the one `App.tsx` line and the described
  `ChatSim.tsx` refactor — no leftover references to the old `sent` state,
  `readIds` still correctly wired to the read-receipt check
- PM integration test: relied on the worker's own Playwright pass (voice
  lesson guided→solo→transfer with messages accumulating and the transfer
  contact switch not retroactively relabeling earlier messages, top bar
  contact name updating, help button/coach banner resetting per stage,
  read receipt persisting across a stage change on the read-reply lesson,
  one guided→next-stage pass each on the sticker/save-photo/read-reply
  lessons, two practice-session questions each starting with a fresh empty
  thread); did not independently re-run a browser session
- Outstanding: none
