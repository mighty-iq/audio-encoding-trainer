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
