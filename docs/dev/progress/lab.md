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

## 2026-11-26 18:30 UTC — pure layer done and committed; UI written; browser tests queued on the lock
Committed (cc3144f, 19ce01e): stats, materials, procedures, probes, probes-more, schedule, records, export, hpcheck,
unit tests (tests/unit/lab-core|lab-plan|lab-export|lab-sim.test.mjs: 28 tests pass), lab-data fixture, simulation
(tests/unit/lab-simlib.mjs, report: `node tests/unit/lab-simreport.mjs 400`).
Written since (uncommitted until the e2e run passes): style.js (injected CSS on tokens), widgets.js, charts.js,
runner.js (screen 'probe'), export-ui.js, screen-lab.js ('lab' + ES.lab.homeCard/afterSession), screen-report.js
('report'), screen-diary.js ('diary' + ES.lab.logEvent for Missions), tests/e2e/lab_common.py, lab_e2e.py,
lab_fixture_build.py → tests/fixtures/lab-audio.js.

Design decisions (for the lead's DECISIONS.md; each cheap to change, all in one place per probe in probes*.js):
- Probe parameters: Matrix 20 sentences, grid θ −22…12 dB × slope 0.08–0.26/dB × lapse, guess 0.1, untempered word
  scoring (simulation: reported run SD 0.53 vs true 0.51 dB), sweet points F = 0.7 / 0.5 alternating, first sentence
  +8 dB above the prior. Digits 24 triplets, 1-up/1-down 2 dB, SRT = mean of trials 5–25, SD from a grid fit
  (0.80 reported vs 0.79 true). Two voices 24 trials, 6-AFC keyword, fixed target talker per run with a preview,
  two same-sex maskers. Rooms 12 matrix sentences, log2 distance 0.5–17 m in a held-out 'large' room (rt60 1.4 s,
  seed 10007, levels 'source', room noise −12 dB re the talker at 1 m), stats in dB* (6.02 per doubling), shown
  in metres. New voice 16 tone-vocoded (6 bands) matrix sentences from the two spare probe voices. Story: one
  passage at +3 dB SNR in the probe café bed, 5 questions (4 options) + effort 1–5. Diary: 5 original items, 1–5
  plus "did not happen"; it has no practice run (self-report, not a test).
- Trend priors (literature, R4 table B): practice deficit at the first measured run c0/sd = Matrix 0.5/0.4 dB,
  Digits 0.3/0.4, Two voices 0.8/0.8, Rooms 1.5/1.5 dB*, New voice 8/6 points, Story 5/8, decay 0.35 per run;
  extra day-to-day SD (σx) 0.3 / 0.4 / 0.8 dB …; slope prior N(0, 1 per week); noise scale on a grid with a
  scaled inverse-χ²(6) prior. Literature σw for the displayed 2.77 × σ / √k: Matrix 0.6, Digits 0.9, Two voices 1.8.
- Verdicts: clear = gain ≥ 1.96 × its posterior SD (the detectable change; with k runs averaged before and after
  this is 2.77 × σ / √k) and the 90 % interval above 0; likely = P(gain > 0) ≥ 0.9; below baseline = the mirror of
  clear; otherwise not yet clear. No verdict before a measured run ≥ 5 days after the baseline.
- Schedule: five baseline blocks (one a day, after the first session): M·D practice | M D measured + TV practice |
  M D TV measured | TV measured + Rooms, New voice practice | Rooms, New voice measured + Story practice + Diary.
  Weekly (≥ 6.5 days after the last): Matrix + Two voices + rotating (Digits → Rooms → New voice → Story) + Diary,
  ≈ 8–9 min; retention check after ≥ 14 days away; optional second Matrix run when its trend is not clear yet.
- Provisional references for Focus mode's "weakest" (not norms): Matrix −6 ± 2 dB, Digits −9 ± 2, Two voices −2 ± 3,
  Rooms 14 ± 5 dB*, New voice 60 ± 15 %, Story 70 ± 15 %; the player's own pick in the Lab wins.
- Headphone check: own 200 Hz tones, 1 s, 100 ms ramps, 0.5 s gaps, quiet tone −6 dB, RMS −20 dBFS, 6 rounds,
  pass ≥ 5 (chance 13/729); writes profile.settings.headphones + hpCheck {at, result, score, note, ver 'ap-1'}.
- Chart colour: one series hue validated with the dataviz checks: light #2A56CF, dark #6F8EF0 (the dark token
  #86A6FF fails the lightness band for marks); status colours only on verdict chips with ✓ / ! glyphs + text.

Simulation (real probe code and schedule; listener model in lab-simlib.mjs; n = 400 Matrix, 300 others):
| probe | true gain | shape | clear at check-in 1–4 | ever clear by 4 | likely or clear at 4 | 90 % covers | run SD true / reported |
|---|---|---|---|---|---|---|---|
| matrix | 1.5 dB | ramp | 1 · 6 · 26 · 52 % | 56 % | 80 % | 96 % | 0.51 / 0.54 dB |
| matrix | 1.5 dB | exp (τ 10 d) | 2 · 23 · 39 · 51 % | 63 % | 82 % | 96 % | 0.50 / 0.53 dB |
| matrix | 1.5 dB | step | 13 · 36 · 40 · 33 % | 64 % | 72 % | 96 % | 0.50 / 0.53 dB |
| matrix | 0 dB | — | 0 · 0 · 1 · 1 % | 2 % | 8 % | 95 % | 0.51 / 0.53 dB |
| digits | 1.5 dB | ramp | 0 · 6 · 17 · 34 % | 41 % | 67 % | 93 % | 0.79 / 0.80 dB |
| digits | 0 dB | — | 0 · 2 · 2 · 3 % | 5 % | 12 % | 92 % | 0.77 / 0.80 dB |
| two voices | 1.5 dB | ramp | 0 · 0 · 0 · 0 % | 0 % | 4 % | 99 % | 1.93 / 2.73 dB |
| two voices | 0 dB | — | 0 % | 0 % | 2 % | 100 % | 1.93 / 2.73 dB |
Reading: on the Matrix a true 1.5 dB gain reads "clear" by the 4th weekly check-in for 56 % of simulated players
(ramp; 63–64 % when the gain comes earlier) and "likely or clear" for 80 %; a zero gain reads clear for 2 %. Digits
needs larger gains or more weeks; Two voices (σ ≈ 1.9 dB, like published speech-on-speech tests) detects only gains
of ~5 dB within 4 weeks and is for longer trends and pooled data. The 56 % is near the information limit of one
20-sentence run a week (gain SD ≈ 0.7 dB at week 4).
