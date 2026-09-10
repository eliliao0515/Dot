# Task: Rename project to "Dot" (both display names, package name, bundle IDs)

## Target
- Modify: `package.json`
- Modify: `app.json`
- Modify: `README.md` (title line only)
- **Do not touch**: `package-lock.json` (regenerates from `package.json` on
  next `npm install`/`npm ci` — do not hand-edit it), anything under `src/**`,
  `App.tsx`, `.github/workflows/deploy.yml`, `specs/**` other than this file

Nothing else is in flight in parallel this round.

## Context
The GitHub repo and live deployed site are being renamed from `elder-tutor`
to `Dot` by the PM directly (a `gh repo rename` operation, since it changes a
live public URL — not part of this task). This task is purely the in-repo
config/text changes so they stay consistent with that new name once the PM
renames the repo.

## Change

### 1. `package.json`
```json
"name": "Dot",
```
(was `"elder-tutor"`). Leave every other field untouched.

### 2. `app.json`
Four fields change, everything else stays:
```json
{
  "expo": {
    "name": "Dot",
    "slug": "Dot",
    "...": "...",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.example.dot"
    },
    "android": {
      "...": "...",
      "package": "com.example.dot"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "output": "single"
    },
    "experiments": {
      "baseUrl": "/Dot"
    }
  }
}
```
- `name`: `"長輩手機練習"` → `"Dot"`
- `slug`: `"elder-tutor"` → `"Dot"`
- `ios.bundleIdentifier`: `"com.example.eldertutor"` → `"com.example.dot"`
- `android.package`: `"com.example.eldertutor"` → `"com.example.dot"`
- `experiments.baseUrl`: `"/elder-tutor"` → `"/Dot"` (must match the new
  GitHub Pages subpath exactly, case-sensitive — the PM is renaming the repo
  to `Dot`, not `dot`)

### 3. `README.md`
Only change the title line:
```md
# Dot — MVP
```
(was `# 長輩手機練習 — MVP`). Don't touch anything else in the file — it has
unrelated staleness (mentions the old long-press mic gesture and the removed
"開始練習" screen) that's out of scope for this task; don't fix it as a
drive-by.

## Constraints
- Don't rename `android.adaptiveIcon` image file paths or any other asset
  references — only the four fields listed above change in `app.json`
- Don't touch `package-lock.json` — it will pick up the new `package.json`
  name automatically next time someone runs `npm install`
- `npx tsc --noEmit` must still pass (unaffected by this change, but confirm)
- `npm run export` must still succeed and the export log must show
  `Using (experimental) base path: /Dot`

## Ownership
`package.json`, `app.json`, `README.md`. Sole task this round.

## Observable acceptance
- `npx tsc --noEmit` passes
- `npm run export` succeeds and logs `Using (experimental) base path: /Dot`
- `grep -rn "elder-tutor\|eldertutor\|長輩手機練習" package.json app.json README.md`
  returns nothing
- `git diff --stat` shows only the three intended files changed

## Completion record
- Date: 2026-09-10
- Executor: worker (file edits only, no repo/GitHub actions)
- PM actions (outside this task's scope, done directly since it touches a
  live public URL): `gh repo rename Dot --repo eliliao0515/elder-tutor`,
  local `git remote set-url origin` updated to match, confirmed reachable
  with `git fetch`
- PM verification: `npx tsc --noEmit` passed; `git diff --stat` confirmed
  only the three intended files changed; grep confirmed zero residue of
  `elder-tutor`/`eldertutor`/`長輩手機練習`; pushed to the renamed remote,
  watched the triggered Actions run go green end to end (build 34s, deploy
  10s); confirmed the new live URL both via `curl` (200, `<title>Dot</title>`)
  and a real browser tab (chat list renders and is interactive)
- Status: **done, deployed, live** at **https://eliliao0515.github.io/Dot/**
- Outstanding: the old URL (`.../elder-tutor/`) may still be reachable via
  GitHub's repo-rename redirect for a while, but is not guaranteed to serve
  the Pages site correctly going forward — nothing else depended on it yet
  per the earlier deployment memo, so this wasn't treated as a blocker
