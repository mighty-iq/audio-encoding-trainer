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
