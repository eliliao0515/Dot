# Task: Replace the ad-hoc `Route` union with a real tab-navigator model

## Context
`App.tsx` today drives the whole app off one `Route` discriminated union
(`chats | sim | realDevice | done | practice | home`) rendered as a chain of
`route.name === 'x' ? ... : null` blocks. The bottom tab bar
(`BottomTabBar`, from spec 24) is duplicated — each of `ChatsListScreen.tsx`
and `HomeProfileScreen.tsx` renders its own copy, with its own local
`useToast()` copy for the still-unbuilt Discover/Today/Wallet tabs.

The project owner wants this replaced with a real tab-navigator
architecture: the 5 tabs (Home/Chats/Discover/Today/Wallet) are genuine
peer destinations owned by one root navigator, not separately-rendered
copies inside each screen. **This is a navigation-architecture change, not
a visual redesign** — none of the actual screens' look changes.

**Hard constraint, do not violate:** this project deliberately ships with
**zero extra npm dependencies** (`CLAUDE.md`: "零額外相依套件，刻意如此，
`npm install` 一次就能跑"). Do **not** add `@react-navigation/*` or any other
navigation library. Build the navigator by hand with plain React state —
this is a small enough app that a hand-rolled model is entirely
appropriate, and matches how the existing codebase already works
everywhere else (no external state or nav libraries anywhere in `src/`).

## Target
- Modify: `App.tsx` (the `Route` type, `Root()`'s state and render tree,
  every navigation call site)
- Modify: `src/sim/ChatsListScreen.tsx` (remove its own `BottomTabBar` +
  toast; becomes a pure content pane)
- Modify: `src/sim/HomeProfileScreen.tsx` (same)
- **Do not touch**: `src/sim/BottomTabBar.tsx` (already correct, just gets a
  new call site), `src/sim/ChatSim.tsx`, `src/sim/parts.tsx`,
  `src/sim/VoiceRecorder.tsx`, `src/sim/PhotoViewer.tsx`,
  `src/content/**`, `src/engine/types.ts`, `src/shell/PracticeSession.tsx`,
  `src/shell/LessonScreens.tsx`, `src/shell/LoginGate.tsx`, `src/auth/**`,
  `src/storage/**`, `public/**`

Sole task, no parallel worker — this reshapes shared state that
`ChatsListScreen.tsx`, `HomeProfileScreen.tsx`, and every route call site in
`App.tsx` all depend on simultaneously; splitting it across two workers
would just produce two halves that don't type-check against each other.

**This task blocks/supersedes `specs/26-continuous-stage-thread.md`** — that
spec was written against the current `Route`/`route.stageIndex` shape and
will need a small revision (to use whatever new `stack` state replaces it)
once this lands. Do not dispatch spec 26 until this one is merged. This is
being tracked by the PM, not something you need to act on.

## Change

### 1. Replace the `Route` type
Delete the current `Route` union. Replace with two independent pieces of
state that together model a real tab navigator: which of the 5 root tabs is
active, and an optional full-screen "stack" pushed on top of it (matching
how tab-based apps normally work — tapping into a chat opens a full-screen
conversation over the tab bar; going back returns to whichever tab you were
on underneath):

```ts
import type { TabKey } from './src/sim/BottomTabBar';

type StackRoute =
  | { name: 'sim'; lessonId: string; stageIndex: number }
  | { name: 'realDevice'; lessonId: string }
  | { name: 'done'; lessonId: string }
  | { name: 'practice' };
```

In `Root()`:
```ts
const [activeTab, setActiveTab] = useState<TabKey>('chats');
const [stack, setStack] = useState<StackRoute | null>(null);
```

`lesson` derivation changes from reading `route` to reading `stack`:
```ts
const lesson = stack && 'lessonId' in stack ? LESSONS[stack.lessonId] : undefined;
```

### 2. Rewrite `Root()`'s render tree
Keep the existing `!authChecked` / `showGate` guards exactly as they are
(unrelated to this task). Below those, the structure becomes:

- **If `stack` is non-null**: render exactly the one matching stack screen,
  full-screen, **no tab bar** — this preserves today's existing behavior
  where lesson/practice screens hide the tab bar entirely. This covers what
  today's `route.name === 'sim' | 'realDevice' | 'done' | 'practice'`
  branches render — same JSX, same props, just gated on `stack.name`
  instead of `route.name`, and reading `stack.lessonId`/`stack.stageIndex`
  instead of `route.lessonId`/`route.stageIndex`.
- **Else** (`stack` is null): render the persistent tab frame — a
  `flex: 1` container holding whichever tab's content is active, then
  **one** `<BottomTabBar>` call (moved here from inside the two screens),
  then **one** toast overlay (see step 5) for the Discover/Today/Wallet
  placeholder tabs:
  ```tsx
  <View style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>
      {activeTab === 'chats' ? <ChatsListScreen .../> : null}
      {activeTab === 'home' && lineUser ? <HomeProfileScreen .../> : null}
    </View>
    <BottomTabBar
      active={activeTab}
      base={base}
      onPressHome={() => { if (lineUser) setActiveTab('home'); }}
      onPressChats={() => setActiveTab('chats')}
      onPressDiscover={() => show('這個功能還沒做好。')}
      onPressToday={() => show('這個功能還沒做好。')}
      onPressWallet={() => show('這個功能還沒做好。')}
    />
    {/* toast element here, same visual style as today's */}
  </View>
  ```
  (`activeTab === 'home' && !lineUser` naturally renders neither screen,
  matching today's guard where the Home tab is unreachable while
  anonymous.)

### 3. Update every navigation call site in `App.tsx`
- `ChatsListScreen`'s `onOpenRoom`: `setStack({ name: 'sim', lessonId:
  node.lessonId, stageIndex: resumeStageIndex(...) })` instead of
  `setRoute({ name: 'sim', ... })`
- The pinned "綜合練習" card's `onPress`: `setStack({ name: 'practice' })`
- `advance()`: keep its existing completion/progress-recording logic
  unchanged, just write results into `stack` instead of `route`:
  `setStack({ name: 'sim', lessonId: lesson.id, stageIndex: next })` or
  `setStack({ name: 'realDevice', lessonId: lesson.id })`
- `TeachingFrame`'s `onExit` (the back-arrow handler), `RealDeviceScreen`'s
  `onLater`, `DoneScreen`'s `onContinue`, `PracticeSession`'s `onExit`: all
  become `() => setStack(null)` — this returns to whichever tab
  (`activeTab`) was already active underneath, rather than forcibly
  jumping back to `'chats'` the way today's `setRoute({ name: 'chats' })`
  does. **This is intentional and correct for a real tab navigator** — if
  someone opened a lesson from the Chats tab, exiting returns to Chats;
  there is currently no path that opens a lesson from any tab other than
  Chats, so in practice this is not observably different yet, but it's the
  architecturally correct behavior going forward
- `RealDeviceScreen`'s `onConfirm`: `setStack({ name: 'done', lessonId:
  lesson.id })`
- `HomeProfileScreen`'s `onLogout`: `logout(); setLineUser(null);
  setActiveTab('chats');`

### 4. Simplify `ChatsListScreen.tsx`
Remove its own `<BottomTabBar>` render and its own `useToast()` copy
entirely — this screen becomes a pure content pane (search bar, pinned
card, room list, top icons only). Remove the now-unused
`onPressHome`/tab-related props from its prop type. Keep `rooms`, `base`,
`pinned`, `onOpenRoom` exactly as they are.

### 5. Simplify `HomeProfileScreen.tsx`
Same — remove its own `<BottomTabBar>` render and `useToast()` copy, remove
`onPressChats` from its props. Keep `user`, `base`, `onLogout`. The
avatar/name/logout content in the middle of the screen is unchanged.

### 6. One shared toast at the root
Since the tab bar (and its Discover/Today/Wallet placeholder taps) now
lives in `App.tsx`, the toast that used to be duplicated inside each screen
needs exactly one home now. Either copy the existing `useToast()` hook
implementation directly into `App.tsx`, or extract it into a tiny shared
`src/ui/useToast.ts` if that reads cleaner to you — either is fine, use
your judgment, but there must be exactly **one** toast instance for the
whole tab area afterward (not one per screen as today), visually matching
the existing toast's appearance/position from `ChatsListScreen.tsx` today.

## Constraints
- **No new npm dependencies.** Do not add any navigation library. If you
  find yourself wanting one, stop and escalate instead — the answer will
  be no, per `CLAUDE.md`'s explicit zero-dependency policy, but flag it
  rather than silently working around it in a way that's worse
- Color layering unchanged — `ChatsListScreen`/`HomeProfileScreen` stay
  green (sim layer); this task is structural, not visual
- Don't change any screen's visual appearance, the tab bar's look, or the
  toast's look/timing — this is purely a state-ownership refactor
- If you need to decide any actual UI layout/appearance beyond what's
  specified above, stop and ask via escalation rather than deciding
  yourself — see the standing AI-boundary rule below
- Complete before finishing: `npx tsc --noEmit` must pass

如果你需要決定畫面上的 UI 位置、按鈕樣式、文案措辭以外的畫面呈現、或任何
「正確操作路徑」，停下來發 escalation/question，不要自己決定。

## Ownership
`App.tsx`, `src/sim/ChatsListScreen.tsx`, `src/sim/HomeProfileScreen.tsx`.
Sole task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web`; login is mandatory on web, so you may
  need to temporarily stub `lineUser` to reach the app without a real
  login — **revert any such stub before finishing**, confirm via `git diff`
  that only the intended refactor remains):
  - App opens on the Chats tab by default, exactly as today
  - Tapping "Home" in the tab bar switches to the Home content with no
    navigation/back-link chrome, tab bar stays visible and correctly shows
    "Home" selected; tapping "Chats" switches back the same way
  - Tapping Discover/Today/Wallet still fires the same "這個功能還沒做好。"
    toast, from both the Chats and Home tabs, and does **not** change which
    tab is marked active
  - Opening a lesson from the Chats tab still hides the tab bar and shows
    the lesson exactly as before; the back arrow / finishing a lesson
    returns to the tab bar with Chats still active
  - The practice session ("綜合練習") still opens full-screen with no tab
    bar and returns correctly on exit
  - Logout still returns to the Chats tab with the tab bar visible

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, committed**
- Escalation handled during the task: worker correctly flagged that
  `ChatsListScreen.tsx`'s `useToast()` also serves non-tab-bar interactions
  (好友 pill, the 4 top icons, non-actionable room taps) that the spec's
  literal "remove entirely" instruction would have silently regressed. PM
  resolved: keep a local toast in `ChatsListScreen.tsx` for its own
  non-tab-bar elements only; move the tab-bar-triggered toast calls to the
  new shared toast in `App.tsx`. `HomeProfileScreen.tsx`'s toast was 100%
  tab-bar-related and was removed entirely, as originally specified.
- PM-caused bug found and fixed post-dispatch: the spec incorrectly grouped
  `RealDeviceScreen`'s `onLater` ("等一下再做") together with the true exit
  actions (`onExit`/`onContinue`/practice `onExit`) as all becoming
  `setStack(null)`. `onLater` originally went to the same `done` stack
  destination as `onConfirm` (just without calling `recordRealDevice`) —
  it was never an abandon action, so mapping it to `setStack(null)` would
  have skipped the completion screen entirely when a learner chose to skip
  the real-device step. Caught during PM diff review (not by the worker,
  since it followed the spec as written); worker applied the one-line fix
  (`onLater={() => setStack({ name: 'done', lessonId: lesson.id })}`)
  after being told this was a spec error, not its mistake.
- Second bug found and fixed post-dispatch: moving `BottomTabBar` out of
  `ChatsListScreen.tsx` into `App.tsx` meant `ChatsListScreen`'s own `wrap`
  container no longer included the tab bar's height, so its retained local
  toast's `bottom: 78` (calibrated when the tab bar was a sibling inside
  the same box) put the toast about 60px too high. PM flagged this from
  static layout reasoning; worker confirmed via Playwright bounding-box
  measurement (toast y was 728 vs the shared toast's 788.5) and fixed by
  changing `bottom: 78` to `bottom: 18`, re-measured to y=788, pixel-aligned
  with the shared toast.
- PM verification: `npx tsc --noEmit` passed at each step; `git diff`
  confirmed the final change set is scoped to exactly `App.tsx`,
  `src/sim/ChatsListScreen.tsx`, `src/sim/HomeProfileScreen.tsx` (plus this
  spec file) — no new npm dependency added, no other files touched
- PM integration test: relied on the worker's own Playwright pass (default
  Chats tab, tab switching, placeholder-tab toasts not changing the active
  tab, lesson/practice full-screen with no tab bar, correct
  return-to-underlying-tab on exit) plus the two follow-up pixel-level
  checks above; did not independently re-run a browser session
- Outstanding: none. This unblocks revising `specs/26-continuous-stage-thread.md`
  (written against the old `Route`/`route.stageIndex` shape) to match the
  new `stack`-based state before it can be dispatched.
