# Progress: lab — probes, statistics, exports (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 17:43 UTC — plan (intent, written before the code)
Owned: js/lab/**, tests/unit/lab*, tests/e2e/lab_*.py, tests/fixtures/lab-*.js, this file.

Files (classic scripts on ES.lab; pure logic loads in Node; each ≤ ~400 lines; order pinned in js/lab/load-order.txt):
- `stats.js` (pure): logistic psychometric model with guess/lapse, grid posteriors (threshold × slope), staircase
  summaries, the trend model (Bayesian linear regression: level + weekly slope + practice term with a literature
  prior, noise scale on a grid, mixture posterior), gain ± 90 % interval, smallest detectable change, verdicts.
- `procedures.js` (pure): Bayesian adaptive word-scored track (matrix-style), 1-up/1-down 2 dB staircase (digits:
  SRT = mean of trials 5–25), binary Bayesian track (two voices), distance ladder (rooms, log2 distance), fixed-level
  scoring with an adaptation slope (new voice), question scoring (story), rating scales (diary).
- `materials.js` (pure): index over ES.data that takes only probe-set voices, clips, beds and rooms; availability.
- `probes.js` + `probes-more.js` (pure): ES.lab.probes[id] = {id, name, distance, minutes, core, unit, better,
  available(), make(form, rng, opts) → run {next(), record(trial, resp), progress(), finish()}}; ids match the
  engine's PROBE_MAP: matrix, digits, twovoices, rooms, newvoice, story, diary.
- `schedule.js` (pure): baseline (practice + 2 measured runs per core probe, one block a day over 3–5 days, after
  training) then a weekly check-in (~8 min, rotating); retention check after a break; never blocks training.
- `records.js` (pure-ish): run records in store key `lab`, normalisation of older run shapes, weakest probe for
  Focus mode (ES.lab.context()).
- `export.js` (pure parts): JSON backup (store.exportAll), CSV (runs, sessions), pooled community format (no name
  unless the nickname box is ticked; no user agent, language or time zone unless switched on; relative days only),
  import of every older shape (backup fv 1, bare records, localStorage dumps), damaged files handled.
- `hpcheck.js`: anti-phase headphone check (generic method after Woods et al. 2017; own synthesised tones),
  6 trials, pass ≥ 5/6; manual override with a note; writes profile.settings.headphones/hpCheck.
- UI: `style.js` (injected CSS on tokens), `widgets.js` (matrix grid, keypad, choice list), `runner.js` (probe
  runner: intro → trials without feedback → saved estimate), `charts.js` (trend chart with interval band),
  `screen-lab.js` (lab: due block, headphones, trends, data), `screen-report.js` (report per probe),
  `screen-diary.js` (diary week form + event check-ins), `export-ui.js` (download → copy box, Chimera invite).
Tests: tests/unit/lab-*.test.mjs (stats, procedures, schedule, materials disjointness, export/import round trips,
damaged files, the simulation with reported rates); tests/e2e/lab_*.py (every probe end to end on fixtures,
360×640 fit, light/dark phone/desktop screenshots, exports with downloads blocked, import).
Fixtures: tests/fixtures/lab-data.js (probe materials with the schema requested from stimuli in requests.md),
tests/fixtures/lab-audio.js (short synthetic clips for e2e, built by tests/e2e/lab_fixture_build.py).
