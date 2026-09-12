# Task: Make "Home" a real peer tab (persistent tab bar), not a pushed screen

## Context — this is a correction to spec 23
Spec 23 built `HomeProfileScreen` as a full-screen route replacing the entire
screen (same pattern as `PracticeSession`) with its own "‹ 回到聊天列表" back
link at the top. The bottom tab bar disappears while viewing it. The project
owner has now clarified: **Home must behave like a real tab bar tab** — the
bottom tab bar (Home/Chats/Discover/Today/Wallet) stays visible and
interactive the whole time, and tapping between "Home" and "Chats" just
swaps the content area above it, the same way real LINE's tab bar works.
This means the tab bar rendering currently duplicated-by-being-inline-only in
`ChatsListScreen.tsx` needs to become shared so both screens can render the
same persistent bar.

## Target
- New: `src/sim/BottomTabBar.tsx` (extracted, shared tab bar component)
- Modify: `src/sim/ChatsListScreen.tsx` (use the shared bar instead of its
  own inline one; remove the now-duplicated `BottomTab` function and its
  styles)
- Modify: `src/sim/HomeProfileScreen.tsx` (render the shared bar instead of
  a "back to chat list" link at the top; drop the `onBack` prop)
- Modify: `App.tsx` (adjust the small amount of prop wiring this implies)
- **Do not touch**: `src/content/**`, `src/engine/types.ts`,
  `src/sim/ChatSim.tsx`, `src/sim/parts.tsx`, `src/sim/VoiceRecorder.tsx`,
  `src/sim/PhotoViewer.tsx`, `src/shell/PracticeSession.tsx`,
  `src/shell/LessonScreens.tsx`, `src/shell/LoginGate.tsx`,
  `src/auth/**`, `public/**`

Sole task, no parallel worker — this is a small, tightly-coupled refactor
across three files that all need to agree on the same new component's prop
shape.

## Change

### 1. Extract `src/sim/BottomTabBar.tsx`
Move the existing `BottomTab` sub-component and the 5-icon row currently
inline in `ChatsListScreen.tsx` (lines defining `BottomTab` itself, and the
JSX block rendering the 5 `<BottomTab>` instances plus the `s.bottomBar` /
`s.tabItem` / `s.tabLabel` / `s.tabLabelOn` styles) into this new file as an
exported `BottomTabBar` component. Suggested shape — feel free to adjust
naming, but keep the same idea (one `active` tab, one callback per tab, so
each screen decides what its own tabs do):

```ts
export type TabKey = 'home' | 'chats' | 'discover' | 'today' | 'wallet';

export function BottomTabBar({
  active,
  base,
  onPressHome,
  onPressChats,
  onPressDiscover,
  onPressToday,
  onPressWallet,
}: {
  active: TabKey;
  base: number;
  onPressHome: () => void;
  onPressChats: () => void;
  onPressDiscover: () => void;
  onPressToday: () => void;
  onPressWallet: () => void;
}): React.JSX.Element
```
Import the 5 tab icons (`HomeTab`/`ChatsTab`/`DiscoverTab`/`MoonTab`/
`WalletTab`) from `../ui/Icons` here instead of in `ChatsListScreen.tsx`.
Visual behavior unchanged from today — same icons, same selected-state
styling (green label + icon on the active tab), same 72px-ish touch targets.

### 2. `ChatsListScreen.tsx`
Replace the inline bottom bar block with:
```tsx
<BottomTabBar
  active="chats"
  base={base}
  onPressHome={onPressHome}
  onPressChats={() => {}}
  onPressDiscover={() => show('這個功能還沒做好。')}
  onPressToday={() => show('這個功能還沒做好。')}
  onPressWallet={() => show('這個功能還沒做好。')}
/>
```
Delete the now-unused local `BottomTab` function and its dedicated styles
from this file (they live in `BottomTabBar.tsx` now). Everything else in
this file (search bar, pinned row, room list, toast, top icons) is unchanged
— `onPressHome` prop stays exactly as it is today.

### 3. `HomeProfileScreen.tsx`
Remove the top "‹ 回到聊天列表" back link entirely — the persistent tab bar
now serves that purpose (tapping "Chats" takes you back), so a redundant
back-link doesn't belong here, matching how real tab bars work (a peer tab
is reached by tapping another tab, not by a back button).

Add the same `useToast()` pattern already used in `ChatsListScreen.tsx` (copy
the small hook — it's ~15 lines, duplicating it here is simpler than
threading a shared import for something this small) so the three
not-yet-built tabs can show the same "這個功能還沒做好。" toast when tapped
from this screen too.

Render `<BottomTabBar active="home" .../>` at the bottom, below the existing
avatar/name/logout content, wired as:
```tsx
<BottomTabBar
  active="home"
  base={base}
  onPressHome={() => {}}
  onPressChats={onPressChats}
  onPressDiscover={() => show('這個功能還沒做好。')}
  onPressToday={() => show('這個功能還沒做好。')}
  onPressWallet={() => show('這個功能還沒做好。')}
/>
```
Updated props for this screen (drop `onBack`, add `onPressChats`):
```ts
{
  user: LineUser;
  base: number;
  onPressChats: () => void; // switches back to the Chats tab
  onLogout: () => void;
}
```
The avatar/name/logout content in the middle of the screen is unchanged from
what spec 23 already built — this task only touches the top (remove back
link) and bottom (add tab bar) of the screen, plus the toast plumbing needed
for the three placeholder tabs.

### 4. `App.tsx`
`HomeProfileScreen`'s call site changes from `onBack={...}` to
`onPressChats={() => setRoute({ name: 'chats' })}` (same destination the old
`onBack` went to, just renamed to match the tab's real identity). No other
routing logic changes — `'home'` is still its own route name, tapping "Home"
from `ChatsListScreen` still navigates there exactly as it does today; the
only difference is what renders once there also carries the tab bar.

## Constraints
- Color layering unchanged: this is all still sim-layer green, nothing here
  touches shell/indigo screens
- Don't change the tab bar's visual design (icons, selected-state styling,
  sizing) — this is a structural extraction, not a redesign
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`src/sim/BottomTabBar.tsx` (new), `src/sim/ChatsListScreen.tsx`,
`src/sim/HomeProfileScreen.tsx`, `App.tsx`. Sole task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test (`npx expo start --web`, can stub `lineUser` briefly if needed
  to reach the Home screen without a real login — or just verify the Chats
  side, since the Home side requires being logged in): on the Chats tab, the
  bottom tab bar renders identically to before this change
- On the Home screen (verify once logged in, or via a temporary code-level
  check), the bottom tab bar is present with "Home" shown selected, tapping
  "Chats" returns to the chat list, and the tab bar persists throughout —
  there is no separate "back to chat list" link at the top of the Home
  screen anymore
- Tapping Discover/Today/Wallet from either screen shows the same "這個功能
  還沒做好。" toast as before

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, not yet committed** (committed separately by PM)
- PM verification: `npx tsc --noEmit` passed; changed/new files match ownership exactly
- PM integration test: temporarily stubbed `lineUser` in `App.tsx` to reach
  the Home screen without a real login (reverted before committing, confirmed
  via `git diff` that only the intended `onPressChats` rename remains).
  Verified: Home screen shows avatar/name/logout AND the persistent tab bar
  with no separate back link; tapping "Chats" from Home returns to the chat
  list; tapping "Discover" fires the same "這個功能還沒做好。" toast from
  both the Chats screen and the Home screen (confirmed via direct DOM check
  to avoid a timing race against the 2.2s auto-dismiss)
- Outstanding: not yet committed
