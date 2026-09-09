# Task: GitHub Pages Deployment Plumbing (config + CI workflow only)

## Target
- Modify: `.gitignore`
- Modify: `app.json`
- Modify: `package.json`
- New: `.nvmrc`
- New: `.github/workflows/deploy.yml`
- **Do not touch**: anything under `src/**`, `App.tsx`, `specs/**` other than
  this file, any of the four reference screenshots (`line_chats.png`,
  `照片編輯.png`, `voice.png`, `clicked_voice.png` — see below, they must
  stay untracked, not be deleted)

This is pure repo/deploy plumbing, not application code — no lesson content,
no `sim/`, no `shell/` involved. Nothing else is in flight in parallel this
round, so there is no ownership overlap to worry about.

## Change

### 1. `.gitignore` — add the four reference screenshots explicitly
These are real LINE app screenshots used only as local design reference; they
must never enter version control (the repo is about to go public). Append:
```
line_chats.png
照片編輯.png
voice.png
clicked_voice.png
```
Do not touch the existing entries (`node_modules/`, `.expo/`, `.DS_Store`,
`*.log`, `dist/`, `web-build/`).

### 2. `app.json` — pin web output mode and set the Pages subpath
Add a top-level `experiments.baseUrl` and an explicit `web.output`:
```json
{
  "expo": {
    "...": "...",
    "web": {
      "favicon": "./assets/favicon.png",
      "output": "single"
    },
    "experiments": {
      "baseUrl": "/elder-tutor"
    }
  }
}
```
Merge this into the existing `web` object (don't remove the existing
`favicon` line) and add `experiments` as a new top-level sibling of `web`
inside the `expo` object. `elder-tutor` matches the existing `slug` in
`app.json` and `name` in `package.json` — this is deliberately the same
string as the GitHub repo name that will be created (`<owner>.github.io/elder-tutor`).

### 3. `package.json` — add two scripts
```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "export": "expo export --platform web",
  "typecheck": "tsc --noEmit"
}
```
Don't change anything else in the file.

### 4. `.nvmrc` — pin the Node version CI and local dev both use
File contents (single line):
```
22
```

### 5. `.github/workflows/deploy.yml` — build and deploy to GitHub Pages on push to main
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run export
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Constraints
- Don't add a PR-triggered workflow, branch protection, or any other file —
  that's a separate, later decision (Phase 4 in the deployment memo), not part
  of this task
- Don't create a `public/` directory or a `.nojekyll` file — not needed for
  the `upload-pages-artifact`/`deploy-pages` deploy method used here
- Don't remove or rename any of the four screenshot files — just make sure
  git no longer tracks them going forward (they're already untracked today;
  confirm with `git status` that they stay that way after your changes)
- `npx tsc --noEmit` must still pass after your changes (it should be
  unaffected, since none of this touches `src/**`, but confirm)
- `npm run export` must succeed and produce `dist/index.html` plus a
  content-hashed JS bundle

## Ownership
`.gitignore`, `app.json`, `package.json`, `.nvmrc` (new),
`.github/workflows/deploy.yml` (new). Sole task this round, no other worker
running in parallel.

## Observable acceptance
- `npx tsc --noEmit` passes
- `npm run export` succeeds and produces `dist/index.html`
- `git status` shows the four screenshot PNGs as ignored (not just untracked
  — e.g. `git check-ignore -v line_chats.png` reports a match against the
  new `.gitignore` line), and does NOT show them as deleted
- `app.json` has both `web.output: "single"` and
  `experiments.baseUrl: "/elder-tutor"`
- The workflow YAML is valid (no syntax errors — a quick way to sanity-check
  without a real CI run is `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
  or equivalent)

## Completion record
- Date: 2026-09-09
- Executor: worker (config/CI plumbing only, no app code touched)
- PM verification: `npx tsc --noEmit` passed; a genuine clean `git clone` +
  `npm ci` + `npm run typecheck` + `npm run export` all succeeded against the
  committed state; all four screenshots confirmed `git check-ignore`d, not
  deleted; export log confirmed `Using (experimental) base path: /elder-tutor`
- Deployed: repo created public at `github.com/eliliao0515/elder-tutor`,
  pushed, GitHub Pages enabled with `build_type=workflow` via `gh api`, first
  Actions run (triggered by the push itself) went green end to end (build 37s,
  deploy 11s). Live site verified both via `curl` (200, correct HTML, correct
  subpath) and by opening it in a real browser tab — the chat list, all four
  lessons, and the practice session all render and are interactive at
  **https://eliliao0515.github.io/elder-tutor/**
- Status: **done, deployed, live**
- Outstanding: real low-end Android device check (CLAUDE.md requires this,
  only the user can do it); repo-visibility judgment call (b) was resolved by
  the user directly (public, accepted the UI-exposure risk as revisable) —
  see chat log for the memo this overrode
