# Progress: shell (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 16:59 UTC — plan
Owned: index.html, css/**, fonts/**, js/core/**, js/ui/**, js/app.js, tools/build-*.mjs, tests/unit/run.mjs,
tests/unit/core*, tests/e2e/**. Lead's §11 (screen registry, ES.ex modules, tutorial runner) is part of the job.
`.gitignore` now ignores `dist/` (lead allowed this edit; `tests/out/` was already ignored).

File plan (each ≤ ~400 lines):
- js/core: ns, util, rng, store-schema (pure guard + 3-way merge), store, clock, router, ui, field, answer,
  chimera, playtest.
- js/ui: sound (tiny player; delegates to ES.audio), demo (tone trials, pure synth), trialview (keyword trial
  loop), tutorial (step runner), session (plan → sets → log), screens/{home, play, results, settings,
  settings-data, volume, about, placeholders}.
- js/app.js boot: store.init → theme → router → Chimera welcome.
- css: tokens, base, components, screens. fonts: Archivo 400/600/700, JetBrains Mono 400/600 (latin woff2) + OFL.
- tools/build-index.mjs (regenerates the script block in index.html from disk in CONTRACTS §9 order; honours an
  optional `js/<area>/load-order.txt` per owner), tools/build-single.mjs (dist/earshot.html, all inlined).
- tests/unit/run.mjs (vm contexts, window/localStorage shim, tolerant loading) + core.*.test.mjs;
  tests/e2e/run_all.py + harness + shell_*.py (file://, http, srcdoc, blocked storage, sizes, themes, two tabs).

Interpretations (logged here; lead may overrule):
- Azimuth in the field: 0° = ahead (up), +90° = right, ±180° = behind; distance in metres.
- Store envelope per key: `{rev, at, by, rec}`; record keeps `v`. Unknown fields pass through untouched.
- Extra store API: `hold()`/`release()` (no writes during a stimulus), key `playtest` (shell-owned record).
- Router `on(name, fn)` = listener for entering a route ('*' for any); screens come from `ES.ui.screens`,
  else the shell's placeholder registry `ES.ui.placeholders`.
- Custom exercise `api.rate()` opens the playtest rating (no-op Promise when playtest is off).

## 2026-11-26 17:59 UTC — status
Done (committed 4a38bd6 and later): core modules, store (envelope, schema guard, 3-way merge, quota probe, blocked →
memory, newer → read-only, corrupt → kept aside, hold/release), clock, router (+ ES.ui.screens registry, placeholders),
UI kit, field, answer panel, Chimera (welcome full/light, invites queued during sets), playtest (ratings, notes,
report, frame sampler), sound player, demo trials, trial view (+ exA hooks: prepare, prime, review/auto replays,
openHelp, tutorialTrial, Try again, step title/next/notes/replayOnMiss), tutorial runner, session runner (planner →
sets → results → log; real trials when planner + audio + clips exist, demo otherwise), screens (home, play,
results, settings + data, volume, about, placeholders), app boot, CSS (tokens/base/components/screens), fonts.
Tools: build-index.mjs (script block from disk; per-area load-order.txt), build-single.mjs (--test, --srcdoc).
Tests: unit run.mjs + core.* (45 pass); e2e harness + run_all + shell_open (36/36), shell_session (39/39),
shell_layout (172/172), shell_storage, shell_srcdoc, shell_ui (written; runs queued behind the browser lock).
Screens looked at: home 390/1366, trial + feedback 360×640 light/dark, 640×360, 1366×768, results, session done,
settings, pause, map placeholder. Fixed from them: landscape feedback overlap, heading focus ring, unreadable
labels on the home picture, "?:" in feedback lines, the "you" marker, title truncation in the trial bar.
Next: run storage/srcdoc/ui suites; look at their screenshots; final full run; commit.

## 2026-11-26 18:15 UTC — resumed after a restart
- Session runner now drives sets through ES.engine.flow (start/next/answer/end); learner load at boot, before each
  session and after other tabs' changes; saves only where the store-bound learner does not (set end, plateau).
- Real sessions start when planner + audio engine + voice clips exist (data/ and audio/ landed 18:10 UTC); shell
  suites force the demo with ES_CONFIG.demo; new suite tests/e2e/shell_real.py covers real trials.
- Pending: run storage, srcdoc, ui, real suites (the browser lock was held by another builder's test); final full
  run; look at real-trial screenshots; commit.

## 2026-11-26 18:39 UTC — verification round
- e2e (each suite under the shared lock): open 36/36, session 39/39 (now at 390×844 and 1366×768), layout 195/195
  (4 sizes × light/dark + tutorial at 360×640), ui 26/26, real 16/16 (real voice trials through flow + ES.audio),
  storage 21/21, srcdoc 17/17 (sandboxed preview: no console errors after the focus/clipboard guards).
- Unit: 57 with the core filter (45 core + lab-core), 96 across all owners' unit files.
- Interlude player (js/ui/interlude.js) fills the Results slot for planner sets with interlude (flow.exposure).
- Pausing during a replay now stops it. Learner saves skipped when the engine's learner is store-bound.
- Looked at: real trial 360×640 (Far, room outline), real feedback 390×844 (Voices), tutorial example 360×640,
  real results, sandboxed trial with Not-saved chip, storage-full banner, copy box, blocked banner.
Open for the lead: CLAUDE.md commands could list `node tools/build-index.mjs` (regenerate the script block after new
files land; `--check` in CI); Far rooms: the picture draws room {w, d, cx, cy} in metres (cy default 0.18·d ahead).

## 2026-11-26 19:24 UTC — done (wave 1 shell) and integration round
- Lead's blocker fixed (7d6081f): tutorial practice scored with plain ES.engine.score; the set's flow opens after
  the tutorial; regression test in shell_real. Replays use the trial's own seed (audio request).
- Playtest report saved to the artifact database in test builds (8672d30); Settings shows "Saved for the developer".
- Integration requests answered (64e57ff): game-started sessions (start(opts), plan.make, pins, titles, done route,
  log fields, set:done before the log write), Echo's held panel (question.delayMs), exercise help with actions,
  custom view handles + api.record/level/progress/flow, results:news and results:done hooks, Home module cards,
  Lab headphone check, own voices row and wipe, learner saved after every answer.
- Verified: e2e 420/420 in 8 suites (open, session ×2 sizes, layout 4 sizes × 2 themes + tutorial, ui, storage,
  srcdoc, real, playtest), 0 warnings with 111 scripts; unit: shell/core all pass; failures left are engine-owned
  solver tests in progress. Single file builds (3.15 MB test build with the starter pack).
- Next for whoever continues: rerun `node tools/build-index.mjs` whenever modules land; Far's room picture uses
  room {w, d, cx, cy} in metres; Lab card copy says "About 1 minutes" (lab's text).

## 2026-11-26 21:18 UTC — fix round 1 (docs/dev/reviews/FIX-ROUND-1.md)
Verified with tests/e2e/shell_round1.py (104 checks; 30 of its 53 reachable checks fail on the shell as committed
before the round, run on a copy with the old js/ui and js/core files) and tests/unit/core.round1.test.mjs (7 tests,
all failing before). Status per finding:
- H1 fixed: after plateau.check() returns a breaker, finishSet() calls plateau.apply(ex, result, {log}) and saves the
  learner (breadth +0.3 for variety, plat.k stored); only for sets that teach the learner and are not partial.
- H2 fixed (trial view): a play whose context never runs, or that returns ok:false, shows "The sound didn't play. Tap
  to try again." (state nosound, button data-retry that unlocks audio); no answer panel, no score, no learner update.
- M1 fixed (8f990f7): the store merges learner saves per record (dials/cond newest at, path/plat larger n, best/cast
  max, recent/edge/breadth with the newer dial side, n as a counter).
- M5 fixed: Delete everything (here or a wipe in another tab) drops the waiting session without writing, resets the
  learner and returns to Home.
- M6 fixed: a skipped trial goes through flow.skip (new item at the same level; 'error' avoids its clips); trials the
  flow did not draw get a new seed; past 3 replacements the set ends as partial. No switch to demo tones.
- M7 fixed: the first pause during the stimulus allows one replay; the second voids the trial, which is replaced by
  a new one and charged nothing (tutorial steps re-run with a new trial).
- M8 fixed (shell part): learn:false on the session or set, setting.noUpdate or meta.learn=false: a learn:false flow
  (or none for plan.make sets), no learner update or save, no plateau input; checked on real trials.
- M9 fixed (8f990f7): typed schemas for every key's nested fields; imports are all or nothing ('damaged',
  'newer-version').
- M10 fixed (8f990f7): log compaction (200 full sessions, older ones compact, size cap 2.2 M chars): 3,000 sessions
  stay under the near-full mark.
- M11 fixed: the session (plan, results, flow snapshot) is stored between trials and after each draw; Home offers
  "Resume session" after a reload (restored before the first route; a second tab does not take it over); the flow
  resumes from flow.snapshot(); End set with fewer than half answered is logged partial (no PB, not a completed set
  in the week ring; Results says so).
- L1 fixed: replays check a token that Pause bumps, so a replay still rendering never starts under the sheet.
- L2 fixed: the tutorial pauses its trial in a hidden tab and resumes on return.
- L5, L6, L8 fixed (8f990f7). L7 fixed: renders time out after 15 s into the error state with Skip
  (ES_CONFIG.renderTimeoutMs for tests). L9 (shell part) fixed: focus goes to the flow only as a dial id.
- L3, L4 and the rest of L9 belong to lab, audio and engine.
- C02 fixed: Credits screen (About → Credits and licence texts): ES.data.credits when present (data/credits.js now
  ships), else a fallback list; MIT and CC BY-SA 4.0 lines; the OFL, CMU and AudioMNIST notices from
  js/ui/licence-texts.js, generated by the new tools/build-licences.mjs (--check). The single file inlines both.
- C06 fixed: Settings → Free shows a picker (exercise, each dial within its range or left comfortable, a coach line
  with the current edge, "Use the coach's levels"); saved as profile.settings.free; the session plans that exercise
  and passes the dials as flow overrides. Seek is not offered (its own screen sets its levels).
- C01 (About lines) no change: LICENSE and LICENSE-TEXTS.md now exist (lead). C24 (home sleep note), C26 (interlude),
  C27 (volume: audiologist line, Seek exception; also the Settings level line), C28 (nickname), C29 (week ring 4–5,
  matching PLAN; the guide must say 4–5 too), C30 (invitations: built by the Chimera community on Discord + join us),
  C40 (Edge mode and About texts) fixed as RV-claims rewrote them.
- Fixlist shell items: Help CSS, openHelp actions, strategy-card memory, results:news and Home's game card were done
  in 64e57ff; run_all.py now runs every other owner's suite with --all (or --only=<name>), inside one browser slot.
- Also: harness.browser_lock() takes no second slot when the process inherits one from tools/with-browser.sh;
  session.js split (pure helpers in session-info.js, the stored session in session-store.js); shell_real.py leaves
  Seek sets out of its planner run; refused imports say why (damaged / newer version) and change nothing.
- M11 detail: headless Chromium under heavy CPU load sometimes dropped a page's localStorage writes across a reload
  (the record was there before, gone at the next document start; sessionStorage kept). The running session is
  therefore also kept in this tab's sessionStorage, which a reload restores from (case m11_drop removes the shared
  record before a reload; a real drop happened in one run and the session came back). Separately the test browser
  sometimes never commits the reload navigation (an idle new renderer; about 1 in 4 under load): the M11 cases
  repeat, up to three attempts, with a warning. Last run: shell_round1 117/117 (8d79e75 + test changes).

## 2026-11-26 23:28 UTC — round 2, item 1: one download helper
- js/core/download.js: `ES.core.download.save(name, data, mime, opts)`; claude.use('downloads') asked once at start-up
  (polls up to 4 s for window.claude.use; only that member is read; a request in flight is awaited up to 2 s by a save;
  null after ~12 s); toast with an optional button (js/core/ui.js, .toast.has-action). Call sites: Settings backup,
  Lab exports (ES.lab.exportUi.deliver), weekly card (ES.game.share.save). Test: tests/e2e/shell_download.py
  (fake window.claude Proxy: resolves; rejects with declined, rate_limited, host_unavailable, unavailable, no code;
  without it: anchor download, toast Copy, blocked Blob URLs).
