# Progress: pwa (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 23:50 UTC — plan
Brief: installable, offline Pages build (manifest, icons, service worker with a content-hashed precache,
whole-version updates offered between sets) and a one-time notice inside in-app browsers (lead decision
2026-11-26 23:37 UTC in DECISIONS.md).

Owned (new): `manifest.webmanifest`, `icons/*`, `sw.js`, `tools/build-sw.mjs`, `tools/make-icons.mjs`,
`js/core/pwa.js`, `tests/unit/pwa.test.mjs`, `tests/e2e/pwa.py`, this note.
Small edits in others' files (one line each, said in requests.md): `index.html` head (manifest link,
apple-touch-icon) + the generated script block, `tools/build-single.mjs` (strip both links),
`tools/githooks/pre-push` (sw.js check), `tests/e2e/run_all.py` (STANDALONE entry).

Order of work (the working tree is shared): inert files first (icons, manifest, sw.js, generator, tests);
`js/core/pwa.js` and the index.html lines last, in one commit, so nobody's `build-index --check` goes red
while a file exists on disk that index.html does not list.
