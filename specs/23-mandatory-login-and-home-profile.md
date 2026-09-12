# Task: Mandatory LINE login gate + Home tab profile screen with logout

## Context — read this before touching anything
Another concurrent session already built the LIFF integration this task builds
on top of: `src/auth/lineAuth.web.ts` (real LIFF SDK wrapper),
`src/auth/lineAuth.ts` (native no-op stub, Metro resolves `.web.ts` on web
automatically), and `src/storage/progress.ts` (progress keyed by
`user.userId` if logged in, else `'anon'`). Read all three before starting.

That existing code deliberately did **not** force a login redirect — the
comments in `lineAuth.web.ts` explicitly say the authorization screen "reads
like a phishing page" to an elderly user, and CLAUDE.md's founding principle
said "no login required." **The project owner has now explicitly, knowingly
overridden that decision** after being told the exact risk — this is recorded
in `CLAUDE.md` (search for "2026-09-13 更新" near the top). Do not second-guess
or partially-implement around this; the override is real and intentional.

## Target
- Modify: `src/auth/lineAuth.web.ts` (add `logout()`; update a stale comment)
- Modify: `src/auth/lineAuth.ts` (add matching no-op `logout()` for platform
  symmetry)
- New: `src/shell/LoginGate.tsx` (indigo teaching-shell screen, shown when not
  logged in, web only)
- New: `src/sim/HomeProfileScreen.tsx` (green sim-layer screen, the "Home" tab
  content — shows the logged-in user's avatar/name + a logout button)
- Modify: `src/sim/ChatsListScreen.tsx` (Home tab's `onPress` currently shows
  a hardcoded "還沒做好" toast — replace with a new `onPressHome` prop)
- Modify: `App.tsx` (wire the login gate in front of the whole app on web;
  add a `'home'` route; wire logout)
- **Do not touch**: `src/content/**`, `src/engine/types.ts`,
  `src/sim/ChatSim.tsx`, `src/sim/parts.tsx`, `src/sim/VoiceRecorder.tsx`,
  `src/sim/PhotoViewer.tsx`, `src/shell/PracticeSession.tsx`,
  `src/shell/LessonScreens.tsx`, `public/**`

Sole task this round, no parallel worker — the login-gate wrapper and the
Home-tab route both touch the same handful of lines in `App.tsx`'s `Root()`
function, so splitting this across two workers would just create a merge
conflict for no benefit.

## Change

### 1. Login gate (web only, app-wide)
Today `App.tsx`'s `Root()` calls `initLineAuth()` on mount, and renders the
normal app regardless of whether a `LineUser` came back (anonymous is a fully
supported path). Change this so that **on web**, if `initLineAuth()` resolves
to `null`, the app renders `LoginGate` instead of the normal app — nothing
else in the app becomes reachable until login succeeds.

**Native (iOS/Android) is explicitly out of scope for the gate** — there is
no real LIFF wiring on native at all yet (the stub always returns `null`), so
gating there would just brick the native build for no reason. Only gate when
`Platform.OS === 'web'`.

Add a small `authChecked` boolean state, set `true` once `initLineAuth()`
resolves (regardless of outcome). While `authChecked` is `false`, render
nothing but the bare `SafeAreaView`/status bar (a brief blank frame is fine —
do not render the chat list speculatively before you know whether to gate,
and do not add a spinner or loading message, consistent with the project's
existing "no loading chrome" look elsewhere).

`LoginGate` itself does **not** auto-redirect on render. It shows a screen
with an explanation and one button; tapping the button calls
`requestLineLogin()` (already implemented in `lineAuth.web.ts`, currently
unused dead code reserved for "future caregiver mode" — that comment is now
stale, update it to reflect that this is the real, active login path). This
is a deliberate choice over auto-firing the redirect the instant the gate
renders: a button requires a human tap, which makes the whole thing
loop-safe by construction (if login fails or is declined, the user just
lands back on the same gate and can try again) and doesn't yank the screen
out from under someone the moment the app opens.

`LoginGate` props:
```ts
{
  onPressLogin: () => void;
}
```
Design: indigo teaching-shell colors (this is shell chrome, not the
simulated app), centered layout, a headline, one short reassuring line tying
login to a concrete benefit (this app already ties login to progress-saving
— see `src/storage/progress.ts`'s own comments — so say something like "登入
後我們會記住你上次做到哪裡" rather than presenting it as a bureaucratic
gate), and one `BigButton` (reuse the existing component,
`src/shell/BigButton.tsx`, `tone="primary"`) labeled something like「使用
LINE 登入」that calls `onPressLogin`. Exact wording is yours to pick
sensibly — this is new shell-chrome copy, not a real-LINE-screen fidelity
question.

### 2. Home tab → real profile screen
`src/sim/ChatsListScreen.tsx`'s "Home" bottom-tab button currently does
`onPress={() => show('這個功能還沒做好。')}`. Replace this with a new
required prop `onPressHome: () => void`, called instead of the hardcoded
toast. The other three placeholder tabs (Discover/Today/Wallet) are
unaffected — leave their toasts exactly as they are.

`App.tsx` adds a `'home'` route (sibling to the existing `'chats'` /
`'sim'` / `'practice'` / etc. route variants) and wires
`onPressHome={() => setRoute({ name: 'home' })}`.

New screen `src/sim/HomeProfileScreen.tsx`, rendered for that route. This is
**sim-layer green**, not teaching-shell indigo — it's reached through the
simulated app's own bottom tab bar (same bar as "Chats"), so it stays in the
green color family even though its actual content (a real profile card) has
no real-LINE-screen to visually match. **Do not reuse `BigButton`
as-is for the logout button** — that component is hardcoded indigo
(`src/shell/BigButton.tsx`), which would violate the project's color-layer
rule if dropped into a green screen; build a same-project-styled button
locally in this file using the green/ink palette from `src/ui/theme.ts`
instead, sized consistently with the 72px-minimum-height convention used
elsewhere.

Layout (single vertical screen, no tab bar duplication — same "full-screen
route with its own back link" pattern the codebase already uses for
`PracticeSession`, not a persistent bottom-bar-preserving tab switch):
- A back link at the top, same visual pattern as existing back links
  elsewhere in the sim layer (e.g. "‹ 回到聊天列表"), calling a new
  `onBack: () => void` prop
- A circular avatar: render the real `user.pictureUrl` via React Native's
  `Image` component (this is the **first real network image** in this
  project — everywhere else uses hand-drawn `View` icons or colored
  placeholder blocks, deliberately, per CLAUDE.md; this case is different
  because it's the authenticated user's own real account photo, not
  fabricated content standing in for a third party, so an actual `<Image>`
  is appropriate here). If `pictureUrl` is missing, or the image fails to
  load (`onError`), fall back to the existing hand-drawn `Person` icon from
  `src/ui/Icons.tsx` inside a colored circle — never show a broken-image
  placeholder or crash
- The user's `displayName`, bold, below or beside the avatar
- A logout button lower on the screen, calling a new `onLogout: () => void`
  prop

`HomeProfileScreen` props:
```ts
{
  user: LineUser; // guaranteed non-null — this screen is only reachable
                  // after the login gate has already passed
  base: number;
  onBack: () => void;
  onLogout: () => void;
}
```

### 3. Logout wiring in `App.tsx`
Add `onLogout` handling: call the platform's `logout()` (see below), then
`setLineUser(null)` and `setRoute({ name: 'chats' })`. Setting `lineUser` to
`null` is what makes the existing gate condition (`Platform.OS === 'web' &&
lineUser === null`) re-trigger and show `LoginGate` again — no separate
"logged out" route/state is needed, the same gate condition covers it.
Don't reset `progress` state manually on logout; it's harmless to leave the
previous in-memory value around since nothing renders it while the gate is
showing, and a fresh `loadProgress()` naturally happens the next time
`initLineAuth()` resolves after the person logs back in (which happens on
a full page load, since `requestLineLogin()` navigates away to LINE and
back — see below).

### 4. `logout()` in the auth modules
`src/auth/lineAuth.web.ts`: add
```ts
export function logout(): void {
  try {
    const liff = (window as any).liff;
    if (liff?.isLoggedIn?.()) liff.logout();
  } catch {
    // 靜默失敗，不擋使用者。
  }
  cached = null;
}
```
(match the file's existing defensive style — nothing in this file may throw
outward). `src/auth/lineAuth.ts` (native stub): add a matching no-op
`export function logout(): void {}` so `App.tsx` can call `logout()` without
platform-specific branching.

Also update the stale comment above `requestLineLogin()` in
`lineAuth.web.ts` — it currently says this is "reserved for future
caregiver/child dashboard use" and warns not to call it for the elderly
user's flow. That's no longer true: this task makes it the real, active
login path, called from `LoginGate`. Rewrite the comment to reflect that,
without deleting the underlying reasoning about why auto-firing on load
would be bad (still relevant: that's exactly why `LoginGate` requires an
explicit tap rather than firing `requestLineLogin()` in a `useEffect`).

## Note on why this doesn't infinite-loop
`requestLineLogin()` triggers a real browser navigation to LINE's OAuth
page and back (`liff.login({ redirectUri: ... })`), which reloads the page.
Because the gate only calls this from a button's `onPress` — never from an
effect that fires automatically on render — there's no path where the app
redirects itself in a loop. If login fails or is declined, the person just
lands back on the same gate screen and can tap the button again. Do not
change this to an automatic effect-driven redirect.

## Constraints
- Gate applies to web only (`Platform.OS === 'web'`); native is unaffected
  and keeps working exactly as it does today (always anonymous, no gate)
- Color layering: `LoginGate` is indigo (shell), `HomeProfileScreen` is
  green (sim) — do not mix, and do not reuse `BigButton` inside
  `HomeProfileScreen`
- No confirmation dialog on logout — it fires immediately, consistent with
  how every other "leave/exit" action in this app already works (e.g. the
  existing "先離開" link during a lesson doesn't ask "are you sure?")
- The avatar's network-image fallback (missing URL or load failure) must
  never show a broken-image icon or throw
- Complete before finishing: `npx tsc --noEmit` must pass

## Ownership
`src/auth/lineAuth.web.ts`, `src/auth/lineAuth.ts`, `src/shell/LoginGate.tsx`
(new), `src/sim/HomeProfileScreen.tsx` (new), `src/sim/ChatsListScreen.tsx`,
`App.tsx`. Sole task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- Manual test on web (`npx expo start --web`): opening the app in a browser
  with no existing LIFF session shows `LoginGate`, not the chat list
- Tapping the login button navigates toward LINE's login flow (this can't be
  fully completed in a local dev sandbox without a real LINE account +
  network access to LINE's servers — verifying the redirect actually fires
  and points at a LINE domain is sufficient; full end-to-end login success
  should be checked once by the user on a real deployment)
- After a successful login (real device/account test, by the user): the app
  shows the normal chat list; tapping the "Home" bottom tab shows the new
  profile screen with the real avatar (or the fallback icon if no picture)
  and display name; tapping "登出" returns to `LoginGate`
- The other four bottom tabs (Chats/Discover/Today/Wallet) are unaffected —
  Discover/Today/Wallet still show their placeholder toast, Chats still
  works as it does today

## Completion record
- Date: 2026-09-13
- Executor: worker (existing Claude Code terminal, working directly in main worktree)
- Status: **feature complete, not yet committed** (committed separately by PM)
- PM verification: `npx tsc --noEmit` passed; changed/new files match ownership
  exactly, no overlap with the other in-flight files (app.json/assets from an
  unrelated concurrent session, left untouched)
- PM integration test: started a fresh `expo start --web` dev server (the
  prior one had stopped running), confirmed `LoginGate` — not the chat list
  — is what renders on a fresh, unauthenticated web session; confirmed via
  direct `liff.login()` invocation in the live page that the redirect
  genuinely navigates to `access.line.me` (a real LINE domain) with the
  correct LIFF channel ID — the 400 response is solely because `localhost`
  isn't a registered redirect URI for this LIFF channel, which is a
  real-deployment configuration step (see Outstanding below), not a code
  defect
- Outstanding: not yet committed; **the user must register the production
  callback domain (`https://eliliao0515.github.io/Dot/` or whatever the
  final URL is) as an allowed redirect URI for LIFF ID `2011571629-iO0TXxLh`
  in the LINE Developers Console**, or every real login attempt will hit the
  same 400 error in production; full end-to-end login/logout with a real
  LINE account still needs to be checked once by the user on the real
  deployment, as noted in the spec's own acceptance criteria
