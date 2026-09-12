# Task: Replace "先離開" text link with a top-left back arrow

## Target
- Modify: `App.tsx` (only the `TeachingFrame` component and its styles)
- **Do not touch**: anything else in `App.tsx`, `src/content/**`,
  `src/engine/types.ts`, `src/sim/**`, `src/shell/**`, `src/auth/**`,
  `public/**`

Sole task, single small component.

## Context
`TeachingFrame` is the indigo bar shown above the simulated chat during a
lesson's guided/solo/transfer stages (rendered in `App.tsx`'s `Root()` for
the `'sim'` route). It currently shows "練習 X / Y　階段名稱" as a text
label, with a separate "先離開" text link on the right that calls `onExit`.

The project owner wants this changed: no explicit "leave" text link. Instead,
a back arrow in the top-left corner (same visual convention as a normal
screen's "go back" affordance) should call the same `onExit` behavior —
more intuitive than a text link, and it's what people expect from a
top-left chevron.

## Change
Restructure `TeachingFrame`'s layout:
- Top-left: a back arrow, using the existing hand-drawn `Back` icon from
  `src/ui/Icons.tsx` (already used elsewhere in the sim layer, e.g.
  `SimTopBar`) — import it into `App.tsx`. Wrap it in a `Pressable` calling
  `onExit`, with generous `hitSlop` (this component already uses `hitSlop={14}`
  on the old exit link — keep an equally generous touch target, this is
  shell chrome so the usual "big enough for shaky hands" concern still
  applies)
- The "練習 X / Y　階段名�稱" label stays, showing the same text as today —
  just reposition it to fit next to/after the arrow (e.g. arrow on the far
  left, label taking the remaining space). Exact spacing/alignment is yours
  to decide sensibly; this is teaching-shell chrome, not a real-LINE-screen
  fidelity question
- Remove the old "先離開" text link and its `s.frameExit` style entirely —
  there is no longer a second, separate exit affordance elsewhere in this
  bar
- The `Back` icon's default color (`#4A5158`) is a dark gray meant for light
  backgrounds — this bar is `C.indigoDark`, so pass a light color (e.g.
  white or the existing `#B9CEDC` tone already used for `s.frameText` in
  this component) so it's visible against the indigo background

`onExit`'s behavior itself is unchanged — it's still wired to
`() => setRoute({ name: 'chats' })` at the call site, nothing about what
happens when you exit a lesson changes, only how you trigger it.

## Constraints
- Colors stay indigo (this is teaching-shell chrome, unaffected by this
  change)
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`App.tsx` (only the `TeachingFrame` function and its styles in the
`StyleSheet.create` block at the bottom). Sole task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web`): start any lesson (e.g. voice
  message), confirm the indigo bar above the chat shows a back arrow in the
  top-left and the "練習 X / Y　階段名稱" label, with no "先離開" text
  anywhere
- Tapping the back arrow returns to the chat list, exactly like the old
  "先離開" link did

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, not yet committed** (committed separately by PM)
- PM verification: `npx tsc --noEmit` passed; `git diff` confirmed only
  `TeachingFrame` and its styles changed
- PM integration test: temporarily stubbed `lineUser` in `App.tsx` (reverted
  before committing, confirmed via `git diff`) to reach the login-gated sim
  screen without a real login. Confirmed the back arrow renders top-left
  next to the "練習 1 / 3　帶著做" label, no "先離開" text anywhere, and
  tapping it correctly returns to the chat list
- Outstanding: not yet committed
