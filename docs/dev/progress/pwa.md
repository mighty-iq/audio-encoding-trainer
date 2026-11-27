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

## 2026-11-27 00:15 UTC — done (e501113, fa00e7f, e3b4ad2, 1bc3cb0)
Built:
- `js/core/pwa.js`: registers `sw.js` only on https or localhost, top-level, a real origin, from its own script
  file (the single file inlines it: reason 'inline'), not in test builds, not under automation unless
  `ES_CONFIG.pwa === true` (`false` turns it off); registers 0.5 s after the load event. Update banner 'update'
  (info, Reload → skipWaiting → reload on controllerchange, plain reload after 5 s); in-app notice 'inapp'
  (warn, Dismiss → localStorage `earshot.v1.$inapp`). Both wait while ES.ui.inSet, html.in-trial or quiet mode
  (hooks set:done, session:done, route, app:ready, lab:run, plus a 4 s poll while something waits). Looks for a
  new version when the app comes back into view, at most every 30 min. `ES.core.pwa.state()` for support.
- `sw.js`: cache `earshot@<scope path>#<VERSION>`; install copies files with matching hashes from older caches
  of the same scope and fetches the rest (no-cache, then reload), each checked against its SHA-256 prefix;
  activate deletes older caches of the scope only; fetch: precached files cache-first, the app's folder and
  index.html (any query) → cached index.html; message 'version' answers the version.
- `tools/build-sw.mjs` (`--check`, `--rev REV`, `--root DIR`, `--list`); pre-push runs `--check --rev HEAD`.
- `tools/make-icons.mjs` (`--check`): any 192/512 (RGBA, rounded), maskable 192/512 (RGB, mark at 0.8 inside
  the safe zone), apple-touch-icon 180 (RGB, mark at 0.88).
Verified: unit 220/220 (pwa.test.mjs 9 tests, 28 user agents); `tools/with-browser.sh python3 tests/e2e/pwa.py`
57/57 in 25 s (install, every precached URL cached, CDP manifest parse without errors and no installability
errors, icons decode at their sizes, update waits during a set and shows after, Reload brings the new version and
deletes the old cache, mismatched bytes never install, file:// and the single file (http and file://) never
register, notice shown/dismissed/remembered, none for the Claude app webview or file://, offline boot with the
server stopped); shell suites open/srcdoc/storage/ui 110/110; privacy check clean. Screenshots in tests/out/pwa/.
Open: Discord's mobile in-app user agent is unverified (see requests.md 00:13); sw.js must be regenerated before
every push (`node tools/build-sw.mjs --rev HEAD`, commit sw.js); README/guide could say how to install.
