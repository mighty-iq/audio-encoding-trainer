# Progress: engine (resumable notes; times UTC)

Owner paths: js/engine/**, tests/unit/engine*, tests/sim/**, tests/fixtures/{data-fixture,rng}.js. Never pushes.

## Status (2026-11-26 20:40 UTC)
CONTRACTS §5 implemented for all seven exercises (missions has no dials). Unit tests: 38 engine tests pass with
`node tests/unit/run.mjs engine` (whole suite green). Full verification: `node tests/sim/run.mjs --real` (results in
the Results section). Engine files load in the order of tools/build-index.mjs (items/adapt.js loads via `items/*`).
Lead follow-ups of 19:40 UTC done in 61c3b41 (Seek live fields and preview, noteMet, foil types, plateau retune),
plus game's 19:16 request (venue sets keep their Strange family). Fix round 1: every engine finding fixed (section
"Fix round 1"); 46 engine tests, whole suite green.

## Files
- dials.js — dials per exercise (real units; ordinal ladders easy → hard, model unit = level index), slope priors
  (R4: 4 × %/dB / 100), threshold priors, drift; `ES.engine.dialMeta` (guess rate, slots, primary dB dial, set
  length), `ES.engine.model` (target 0.72, anchor 0.90, warm-up 0.85, floor 0.65, lapse 0.04, comfort F 0.92,
  driftScale 1.5). `comfort` = fixed easy level (= start; null for Strange family dials); `margin` = how far below
  a player's edge the other dials sit.
- learner.js — model p = γ + (1−γ−λ)·Π F_i(x_i), one logistic component per active dial; θ_i = level where p = 0.72
  with the other typical dials at comfort (z* per context). Posterior per (context, dial) stored {m,s,n,at,h,f,lf,u};
  each trial updates the FOCUS dial only, on a 61-point grid (per-slot likelihood, slots discounted k^0.7), then
  moment-matches; drift per trial (×1.5) and per day away (cap 1.5 × prior SD). New-condition (< 3 items), warm-up,
  tutorial and `noUpdate` trials do not move thresholds. Crowd with headphones keeps its own posteriors
  ('crowd@hp', seeded from the plain ones). Breadth: +0.1 when the last 20 EDGE trials ≥ 0.75, −0.15 below 0.55.
  `E.lrOf(x)` accepts an instance or a stored record; the default instance loads lazily from the store; the
  shell saves. `noteMet(id | [ids])` counts voices met outside trials (Voices tutorial; the app's learner saves at
  once), `met()` lists them.
- controller.js — `next(exId, ctx)` → {dials, focus, anchor, warmup, p, target, breadth, ctxKey, family, floor?,
  saturated?, overnight?, pinned?, eased?, coach?}. Edge: focus at p 0.72, others at comfort; anchors every 4th–5th
  and after two misses (prop < 0.5); warm-ups: first 2 trials of a set (3 after a break) and new conditions; focus by
  learning-progress bandit + uncertainty + staleness, 20 % exploration; floored dials re-tested 12 % of the time.
  Variety: uniform focus, breadth 1. Focus: 60 % on the dial behind `ctx.lab.weakest` (PROBE_MAP), else the dial
  furthest below its prior. Free: overrides + coach suggestion. Pins (`set.pin`, `set.focus`): `supports.pin`.
  A venue set keeps its Strange family (`set.family`, or the family of `set.focus`), and venue sets (pins, a focus
  dial or a family) run at the edge in Path mode too. Direct callers (shell style: plain set object + index + prev)
  get a hidden per-set memo that carries pin/focus/family.
- path.js — STAGES per exercise (venue, fixed dials, primary ladder) → blocked steps then a mixed step; mastery at 5
  fully right in a row or ≥ 80 % of the last 15; floor eases the primary dial; 15 trials < 50 % → one step back.
- items/common.js (option builder, memo), items/data.js (index, voice pools, maskers by similarity, beds, rooms),
  items/adapt.js (reads the stimulus schema as built; ready(ex)), items/{crowd,far,strange,repair,echo,seek,voices}.js.
  Seek's audio.live = {bed, target, decoys, found (field units = the locate radius), spatial, seed, start, headTurn}
  (no `radius`: the live scene reads that as metres per field unit); meta.preview = another clip by the target
  voice with none of the scene's words (relaxed: none of the called words; null + 'no preview'), never an option.
- score.js, plateau.js, planner.js, flow.js (set runner: start/next/answer/skip/end/snapshot/resume/exposure; `end`
  = log entry with end/avg/sd/idx/foci/pb/pbs, plus partial/planned/why, replaced, learn:false when they apply).
  flow.start(…, {learn:false}) leaves the learner untouched; flow.skip(sc, {reason:'error'|'void'|'skip', bad})
  drops the pending trial unscored and draws a NEW one at the same level (same decision, new item, failing clips
  avoided), cap 3 per set, then {ended:true} and a partial record; flow.end(sc, {early:true}) is partial below half
  the planned trials; flow.snapshot(sc) is plain JSON, flow.resume(snap, {learner}) continues after a reload (the
  trial in flight is replaced, not charged). Partial and learn:false sets never set a personal best and stay out of
  plateau windows and the overnight check.

## Option design (shortcut-proof)
Foils come from each slot's own answer distribution (item-sampled: the same slot's answer in a random other
eligible item), neighbours only when they can be answers for that slot, symmetric similarity structure: no maskers
→ (T, T') (R, R') with T', R' sound-alikes of the SAME length and R drawn among words that have one (when T has
none: four unpaired words that have none either); one masker → (T, nT) (M, nM); two → T, M1, M2, R; three → all
spoken. Neighbour lists are symmetric (either word listing the other), and a pair partner is the neighbour
closest in length. Homophones never shown.
A slot is asked only if the build has ≥ 3 different answers for it. Foil types: 'masker' (another voice said it),
'neighbour' (sound-alike from vocab neighbours), 'context' (fits the sentence / said in Echo's message for another
question), 'number' (another number: numbers are never called sound-alikes; set by number slots and inferred when
answer and foils are all numbers), 'similar' (Voices: a voice of the same sex < 2 semitones away), 'random'. Cue and
preview clips never say an option.

## Decisions for the lead to log (DECISIONS.md is lead-owned)
- Product of per-dial logistic components (bottlenecks) instead of an additive logit: per-dial abilities are not
  identifiable in an additive model. Limitation: a secondary dial limits accuracy even when the primary dB dial is
  very easy (e.g. talkers at +12 dB TMR); a cost-per-level model on the primary dial is the candidate fix once pooled
  data exist.
- Focus-only updates: updating non-focus dials made confounded posteriors wander below their easiest level.
- Plateau operating point (retuned 20:00 UTC on simulated learners, replaying dumped logs of 200 learners × 60 days
  in Edge, Path and Focus, then confirmed with breakers in all four modes): windows of 10 sessions with the
  exercise, each holding ≥ 80 scored trials or six sets' worth (Seek: 36), widened up to 16 sessions;
  focus-weighted index over a fixed dial set, set-average posterior means, residual SD floor 0.35 dB-eq, slope prior
  N(0, 0.5²); flat = one-sided 80 % bound < +0.15 dB-eq/session in 4 windows in a row (earliest call at the 13th
  session); no personal best in 4 sessions; ≥ 3 sessions between breakers. Longer windows were the one change that
  cut false alarms without losing detection (6 → 10 sessions); persistence 3 → 4 halved the band-edge alarms; the
  old 80-trial minimum with a 12-session cap made Seek (4 scored trials a session) undetectable. Rejected: a
  stricter bound (90 %), a lower band, a slope-estimate cap, a second short rule (each traded detection for FA).
  The literal two-sided "within ±0.15" never fires on training data.
- Foil types 'number' and 'similar' (CONTRACTS lists four types; views treat unknown types generically).
- Venue sets in Path mode run at the edge with their pins (Path's staged steps are for normal sets).
- Babble beds: 6 talkers (4–8 at wide variety), one sentence each, never the target's or a talker's voice; the
  recorded crowd bed only as an ambience (it cannot be split into talkers).
- Replacements keep the trial's decision (same level), draw a new item, and avoid a failed trial's clips; 3 per
  set, then the set ends as partial. A reload is not charged against the cap. "End set" below half = partial.
- Option pairs are same-length sound-alikes (symmetric neighbour lists), so option length carries no information.
- Personal bests per dial (≥ 0.10 logit beyond the best), in real units, so a dial joining the index cannot fake one.
- Breadth judged on edge trials only (anchors and warm-ups would make it saturate at once).
- Distance ladder tops at 30 m; room size always fits the distance (CONTRACTS §12 R1).
- Held-out family for the New-voice probe: tone-vocoded speech (never generated by the engine).
- Trials planned below p 0.65 happen only when even the easiest levels are predicted below it (flagged `floor`).

## Verification
- Independent solver (tests/sim/solver.mjs; own index of ES.data, never the generators' helpers): one correct option
  per slot, answer once among unique options, ≥ 2 options, no homophone, maskers' asked words differ from the
  target's, foil labels true, no probe clip/voice/word, room seeds < 10000, dials in range and on step, audio matches
  the dials (masker levels, talker count, separation, rt60/dist/room fit, noise, family fx, mask fraction, details,
  decoys, radius, cast size); number slots typed 'masker'/'context'/'number' only; Voices foils 'similar' exactly
  when close in pitch; Crowd cue and Seek preview by the target voice and never saying an option; Seek live.found
  = locate radius, live.spatial, live.seed, no live.radius; preview words none of the called (or scene) words;
  babble beds ≥ 3 sentence clips from distinct voices, none the target's; bed ids only on ambience beds.
- Shortcut responders (tests/sim/shortcuts.mjs): first, last, most frequent past answer, only options seen as answers,
  most different, most typical (bigram similarity), longest, shortest, heard-word (vs 1/heard), answer position per
  option count; per generator and per dial level; flag beyond max(0.04, 3.5 SE).
- Simulated learners (tests/sim/learners.mjs, run.mjs): improver 60 %, early (stalls after ~2 weeks) 15 %,
  stalled 20 %, weak 5 %; true slopes ×0.75–1.3, lapse 1–6 %, day offsets, rapid-adaptation dips for new
  conditions, item effects only partly known, correlated slots; adherence 45–85 % of days, sometimes 2–3 sessions a
  day. Most trials use a synthetic spec; every 25th trial and all Voices trials use the real generators.

## Results after the follow-ups (2026-11-26 20:05 UTC, commit 61c3b41; same commands, modes run in two processes)
- Solver: fixture 7 × 10,000 seeds, 0 failures; real build (vocab of c562c20) 7 × 10,000, 0 failures, with the new
  checks (number/similar types, cue and preview words, Seek live fields).
- Shortcuts, fixture: 1 flagged bin of 163 (Strange fast=0, 'shortest' +0.08 at n 418; 0.251 at 30,000 seeds, so
  sampling noise). Real build: the most-frequent-answer bias is gone in Crowd/Far/Strange/Echo/Seek (0.25–0.26)
  after stimuli's vocab fix; left: option length in the call-sign fallbacks of Far (longest 0.279, shortest 0.227;
  4/25 bins) and Repair (0.288 / 0.218; 6/17 bins), Voices most-frequent 0.298 (1/18), Seek 1/20.
- Plateau, new operating point, with breakers, 200 learners × 60 days:

  | mode    | flat stretches detected | false alarms (improving ≥ 0.15) | latency median / p90 |
  |---------|-------------------------|---------------------------------|----------------------|
  | Edge    | 73.6 % (483/656)        | 5.6 % (22/392)                  | 9 / 17 sessions      |
  | Path    | 68.7 % (531/773)        | 6.2 % (23/370)                  | 9 / 19               |
  | Variety | 86.0 % (607/706)        | 6.3 % (22/347)                  | 9 / 18               |
  | Focus   | 46.9 % (211/450)        | 3.3 % (14/424)                  | 8 / 17               |
  | pooled  | 70.9 %                  | 5.3 %                           |                      |

  Before (window 6, 3 in a row, 80 trials ≤ 12 sessions): Edge 61.1 % / 13.3 %, Path 57.8 / 15.4, Variety 63.2 /
  14.7, Focus 49.3 / 11.6. Seek was never detected before (0 of 144 stalled Edge pairs: 4 scored trials a session
  never reached 80 within 12 sessions). Focus stays lower in both: its other exercises get few sessions (most missed
  pairs have < 16 sessions with the exercise; none can be called before the 13th).
- Accuracy, edge-trial accuracy, anchors, warm-ups, Variety and Focus shares in every mode: within ±0.001 of the run
  below; calibration median within 0.01 logit; Variety breadth 0.97 (was 0.95: more variety breakers fire);
  controller.next median 0.006–0.027 ms, p99 ≤ 0.1 ms.

## Results (full run 2026-11-26 18:51 UTC: `node tests/sim/run.mjs --seeds 10000 --learners 200 --days 60 --real`)
- Solver, fixture: 7 generators × 10,000 seeds, 0 failures. Real starter build: 0 failures × 10,000 for the six
  generators ready then (Far became ready after the clips-only fix; covered by engine-realdata.test.mjs since).
- Shortcut responders, fixture: 0 flagged bins in 163 (worst |acc − chance| 0.014–0.07 within the 3.5 SE tolerance;
  heard-word responder at 1/heard). Real starter build (3,000 seeds, after the fixes): most-frequent-answer responder
  0.27–0.285 in Crowd/Far/Strange/Echo/Seek, longest-option 0.297 in Repair's call-sign fallback — uneven answer
  frequencies in the starter phrases (balance requested from stimuli).
- Edge (200 learners × 60 days, ~3,960 trials each): accuracy from day 7 mean 0.779 (5th–95th pct 0.740–0.818);
  edge trials 0.749 (planned 0.727: improving learners stay ahead of the estimate); anchors 18.4 %; warm-ups 10.7 %;
  posterior vs true threshold median 0.31 logit (95th pct 1.05; 56 of 5,240 dials > 1.5); breadth mean 0.93.
- Plateau (old operating point, superseded above): 61 % of truly flat stretches detected in Edge, false alarms
  11–16 % across modes. Breakers used in order (variety 44 %, focus 24 %, anchors 17 %, strategy 9 %, switch 5 %,
  sleep < 1 %; similar shares now).
- Path: mean step reached crowd 24/28, far 19/28, strange 33/41, repair 16/18, echo 9/15, seek 7/15, voices 17/19;
  ≥ 3 steps advanced by 94–100 % of learners; accuracy 0.726.
- Variety: a new target voice on 94.5 % of consecutive real-generator trials, a new family on 79 %; accuracy 0.776.
- Focus (weakest probe = rooms): Far 60 % of sets, distance the focus on 65.5 % of Far edge trials; accuracy 0.773.
- controller.next over 3.2 M calls: median 0.03 ms, p99 0.1 ms, p99.9 0.7–2.6 ms; maxima 16–229 ms are garbage-
  collection pauses of the simulation process (unit test: p99 < 5 ms in a clean process).
- Trials planned below p 0.65: 0.1–0.3 % of trials, all flagged `floor` (the easiest levels are predicted below the
  floor for weak simulated dimensions; asserted in engine-controller.test.mjs).

## Fix round 1 (docs/dev/reviews/FIX-ROUND-1.md; snapshot e079caf; 2026-11-26 20:40 UTC)
Each finding in engine files or assigned to the engine, with its test (tests/unit/engine-*.test.mjs unless noted):
- M2 fixed: a 'find' trial only for a met voice with a call-sign phrase (or a word clip of the noun pool); else
  'who' with two met voices, else 'meet' (meta.relaxed 'find → who' / 'find → meet'); 61c3b41 had still allowed an
  unmet friend. Test: realdata "M2" (the review's case, 40 seeds, plus a Variety set with phrase-less met voices).
- M3 fixed: X.bedSpec — a babble bed is {kind:'babble', clips:[one train sentence per talker], db} from voices other
  than the target's (and the other talkers'); bed ids only on ambience beds; < 3 talkers in the build → the recorded
  crowd bed as an ambience, else speech-shaped noise. Talkers: 6, 4–8 once variety is wide (no dial sets the bed's
  talker count; Crowd's talkers dial counts the competing voices, which are parts). Solver check + realdata "M3".
- M4 fixed: overnight() returns null once a session has started today. Test: planner (M4…).
- M6, M11 (flow support) fixed: flow.skip / end({early}) / snapshot / resume as in Files; stale answers to a
  skipped trial change nothing. Tests: flow (M6), flow (M11). Wiring is the shell's.
- M8 fixed: flow learn:false (spec.setting.learn = false on every trial) and learner.update ignores such trials on
  any path (the shell's record() too). Test: flow (M8) — learner byte-identical after a set and its replay.
- M9 (engine part) fixed: learner.load keeps only well-formed entries per map (recent/edge arrays of 0–1 numbers
  capped 30/20, cond {n, acc, at}, path {i, hist, run, n, best}, plat fields, numeric best/breadth/cast, dials with
  finite m and s > 0); path clamps a step index out of range. Test: learner (M9) with the review's four bad values.
- H1 (engine part): plateau.js documents that the caller applies the breaker right after check().
- C03, C33 fixed (strategy texts); C05 fixed (anchors text promises no replay with words); C10 fixed (reason: "no
  new best in 4 sessions, and its level moved less than 0.15 dB a session over the last N" / "has slipped a little"
  / no unit for Strange and Repair); C24 fixed (variety, sleep, switch texts; planner sleep note); C04 fixed
  (plateau ordinal(today) since the current session is in the log; planner "You have trained three times today"
  at the fourth session); C19 fixed in the planner ("Yesterday's" only for the previous calendar day, else "Your
  last day's hardest"; "a voice that was not in that set"). Tests: plateau texts (…), planner (M4, C04, C19, L9).
- L9 fixed: Focus-mode plan sets carry focusEx:true (flow ignores a non-string focus).
- fixlist [engine] items fixed in 61c3b41 (number foil types; chooseFamily honours the set's family).
- Option-length bias (lead's request) fixed in the option builder (see Option design); Repair foils now follow the
  answers of the item's own voice pool. Real build, 10,000 seeds: Far longest/shortest 0.255/0.247 (were
  0.279/0.227, 4/25 bins flagged → 0/25), Repair 0.255/0.249 (were 0.288/0.218, 6/17 → 0), Repair most-frequent
  0.265 (was 0.266–0.278). Fixture: 0 flagged bins in 163; solver 0 failures × 7 on both.
- Sanity simulation after the round (100 learners × 60 days per mode): accuracy, edge accuracy, anchors and
  warm-ups as before; plateau false alarms 5.5–7.2 % and detection 51–83 % across modes (sampling noise ±2 %).

## Log
- 2026-11-26 17:05 UTC — Started; requests to stimuli/audio/shell.
- 2026-11-26 17:40 UTC — Core engine, generators, solver, shortcut responders landed; foils made answer-matched.
- 2026-11-26 18:10 UTC — Simulated learners; focus-only updates; plateau and drift tuned; shell-style callers.
- 2026-11-26 18:40 UTC — Adapter for the built stimulus schema (call-sign phrases, 8 voices); ready() per exercise;
  pins for venue sets; unit tests.
- 2026-11-26 19:00 UTC — No throws on small real pools (stated relaxation ladders, call-sign fallbacks for Strange,
  Repair, Echo; clips-only content); real-data unit test on the build, one voice per sex and a single voice; full run.
- 2026-11-26 20:05 UTC — Lead follow-ups (61c3b41): Seek live fields + preview, noteMet, number/similar foil types,
  Crowd cue words never options, venue families held (game 19:16), Voices find without call-sign voices (the new
  build's first voices have sentences only), plateau retuned (tuner: replay of dumped logs; numbers above).
- 2026-11-26 20:40 UTC — Fix round 1: M2, M3, M4, M6/M11 flow support, M8, M9 (engine part), H1 doc, C03–C05, C10,
  C19, C24, C33, L9, option-length bias; tests per finding.

## Open issues
- Starter pack: Strange, Repair and Echo run on the call-sign fallback until their own clips land; residual
  answer-frequency biases on the real build (see Results). Re-run `node tests/sim/run.mjs --real` on every new pack.
- Voices length dial has no effect on phrase-only builds (no word or sentence clips).
- Strange text-first aid trials (exA's "Same or different?") not implemented; exposure interludes are text-first.
- Plateau: Focus mode detects 47 % of flat stretches (structural: few sessions for its other exercises); the
  earliest call is at the 13th session with an exercise. All false alarms are at the band edge (0.15–0.3).
- Real build: Voices most-frequent responder 0.30 (cast names; 1 bin of 18), single flagged bins in Strange and Seek;
  re-check when the full packs land.
- Shell wiring of flow.skip / end({early}) / snapshot / resume (M6, M7, M11) and of learn:false (game, M8).
