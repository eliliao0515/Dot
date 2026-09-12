# Task: Make the chat input field a real, typeable TextInput

## Target
- Modify: `src/sim/parts.tsx` (`SimInputBar` only)
- Modify: `src/sim/ChatSim.tsx`
- **Do not touch**: `src/content/**`, `src/engine/types.ts`, `App.tsx`,
  `src/shell/**`, `src/sim/PhotoViewer.tsx`, `src/sim/VoiceRecorder.tsx`

This is a single self-contained change to the shared input bar used by every
lesson and the practice session — no parallel worker this round.

## Context / why
Right now the message input field in `SimInputBar` is a decorative
`Pressable` that does nothing when tapped (routes to the existing
"tolerant mis-tap" handler). This was deliberate while typing wasn't
functional anywhere in the app. The user now wants the field to actually
work: tapping it on a real phone should bring up the device's on-screen
keyboard and accept typed input; on desktop/web it should accept the
physical keyboard (no on-screen keyboard needed there — that's inherent
platform behavior, not something to special-case in code). React Native's
built-in `TextInput` already does exactly this on every platform for free —
this task is about swapping the fake placeholder for a real `TextInput`, not
building custom keyboard-summoning logic.

**Decisions already made by the user — do not re-litigate:**
1. Free-typed text that gets sent through this new field must **not** count
   as completing the "看訊息、回訊息" lesson (`target.node === 'reply'`) —
   only tapping an existing quick-reply chip (`QuickReplyRow`) completes
   that lesson. Typing is purely an additional, realistic affordance; it
   must not let a learner bypass the lesson's actual teaching point (avoid
   typing, tap the canned reply instead).
2. The mic/send button must swap dynamically like real LINE: when the field
   is empty, show the existing mic icon (tap opens `VoiceRecorder`, current
   behavior, unchanged); as soon as there's typed text, swap to the existing
   `Send` icon (paper plane, already defined in `src/ui/Icons.tsx`) and
   pressing it sends the typed text instead of opening the recorder. When
   the field is cleared again, it swaps back to the mic icon.

## Change

### 1. `src/sim/parts.tsx` — `SimInputBar`
- Replace the decorative field `Pressable` with a real `TextInput` (from
  `react-native`):
  - `value`/`onChangeText` come from new props (see interface below)
  - placeholder text "輸入訊息" via the `placeholder` prop, not a static
    `<T>` — style the placeholder color to match the current `s.fieldText`
    look
  - single line (`multiline={false}` or just omit `multiline`, default is
    single-line) — a growing multi-line composer is out of scope for this
    task
  - `allowFontScaling={false}` and merge in `textBase` from
    `src/ui/theme.ts` — this is the project's existing hard rule for the
    sim layer (fixed sizing driven only by `useScale()`, never system font
    scaling); every other text element in `sim/` already follows this, a
    raw `TextInput` needs it set explicitly since it isn't wrapped by the
    `T` helper component
  - `returnKeyType="send"` and `onSubmitEditing` wired to the same send
    action as the button — pressing physical Enter/Return (common on a
    real keyboard, and how `onSubmitEditing` fires on web too) should send,
    matching ordinary chat-app expectations and the "let the computer
    keyboard drive this" part of the request
- The rightmost round button changes from always-mic to conditional:
  - `draftText.length === 0` → same as today: `Mic` icon, `onPress` calls
    the existing `onPressMic` (opens `VoiceRecorder`), same `hitSlop` /
    `pressRetentionOffset` generous-touch-target treatment as it has now
  - `draftText.length > 0` → `Send` icon (from `src/ui/Icons.tsx`),
    `onPress` calls a new `onSendDraftText` callback instead
- New props needed on `SimInputBar`: `draftText: string`,
  `onChangeDraftText: (text: string) => void`, `onSendDraftText: () => void`.
  Remove the `onWrongTap` prop from `SimInputBar`'s signature — it was only
  ever used by the decorative field placeholder, which no longer exists;
  don't touch `onWrongTap` usage anywhere else (e.g. `SimTopBar`, which is a
  separate component with its own `onWrongTap` prop — leave that alone).

### 2. `src/sim/ChatSim.tsx`
- New state: `draftText` (string, starts `''`).
- Reset `draftText` back to `''` in the existing stage-change `useEffect`
  (the one that already resets `sent`, `recording`, `panel`, etc. when
  `script.stage` changes) — a typed-but-unsent draft shouldn't survive into
  the next stage.
- Split today's `sendText(text: string)` (used by `QuickReplyRow`'s
  `onPick`) so the "does this complete the reply lesson" logic stays
  attached only to the quick-reply path. Suggested shape (rename or
  restructure however reads cleanest, but preserve this separation):
  ```ts
  function appendTextBubble(text: string) {
    appendSent({ id: `txt-${Date.now()}`, from: 'me', kind: 'text', text });
  }

  function sendQuickReply(text: string) {
    appendTextBubble(text);
    if (lesson.target.node === 'reply') {
      setSucceeded(true);
      setTimeout(onDone, 1200);
    }
  }

  function sendDraftText() {
    const text = draftText.trim();
    if (!text) return;
    appendTextBubble(text);
    setDraftText('');
  }
  ```
  Update the `QuickReplyRow` call site (`onPick={sendText}` →
  `onPick={sendQuickReply}`) and pass `draftText` / `setDraftText` /
  `sendDraftText` down to `<SimInputBar>` as the new props, dropping the
  `onWrongTap` prop from that call site.
- `sendDraftText` must **never** check `lesson.target.node` and must
  **never** call `setSucceeded`/`onDone` — sending free-typed text does not
  complete any lesson, on any `target.node` value (`mic`, `sticker`,
  `photo`, `reply`, `video`, or anything added later). This applies
  identically inside the practice session (`PracticeSession.tsx` reuses this
  same `ChatSim` component for `voiceReply`/`videoTap` questions) — no
  separate handling needed there since it's the same shared component, just
  don't special-case practice mode differently.

## Constraints
- Don't add any red/error styling, validation messages, or character limits
  — sending blank/whitespace-only text is simply a no-op (guarded by the
  `.trim()` check), not an error state, consistent with the project's
  "tolerate everything, never scold" policy
- Don't touch `GuideRing` positioning logic — it doesn't target the text
  field itself and is unaffected by this change
- Colors unchanged — this is still the simulated app's green-tinted sim
  layer, no indigo
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`src/sim/parts.tsx` (only `SimInputBar`), `src/sim/ChatSim.tsx`. Sole task
this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web`, since this is where "computer
  keyboard" is easiest to verify): open any lesson's chat screen, click the
  input field, type text with the physical keyboard — text appears in the
  field, mic icon swaps to the send (paper-plane) icon as soon as there's
  any text, swaps back to mic when the field is emptied
- Pressing the send icon (or physical Enter) with typed text appends it to
  the thread as a normal outgoing text bubble and clears the field
- On the "看訊息、回訊息" lesson specifically: typing free text and sending
  it does **not** advance the stage / does not trigger the success state;
  tapping an existing quick-reply chip still does (regression-check this)
- On the other three lessons (voice message, sticker, save-photo) and the
  practice session: typing and sending free text never advances the stage
  either — confirm no regression on their existing correct-path completions
  (mic recorder send, sticker tap, photo download) by re-running each
  lesson's guided stage once
- Switching lesson stages (guided → solo → transfer) clears any leftover
  typed draft text

## Completion record
- Date: 2026-09-12
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, not yet committed** (committed separately by PM, see below)
- PM verification: `npx tsc --noEmit` passed; changed files
  (`src/sim/ChatSim.tsx`, `src/sim/parts.tsx`) match ownership exactly
- PM integration test: on the voice-message lesson, typed free text ("測試打字看看")
  sent via the send button appears as a bubble but stays on stage 1/3 (no
  false completion); on the read-reply lesson, typed free text ("隨便打的話")
  likewise sends without completing, while tapping an existing quick-reply
  chip afterward correctly advances to stage 2/3 — confirms the two send
  paths are properly separated
- Note: unrelated `app.json` / icon asset changes appeared in the working
  tree at the same time (from another concurrent session working on
  branding/the video-call lesson) — not part of this task, left untouched,
  not committed alongside this change
