# Progress: engine (resumable notes; times UTC)

Owner paths: js/engine/**, tests/unit/engine*, tests/sim/**, tests/fixtures/{data-fixture,rng}.js. Never pushes.

## Status (2026-11-26 19:05 UTC)
CONTRACTS §5 implemented for all seven exercises (missions has no dials). Unit tests: 30 engine tests (126 in the
whole suite) pass with `node tests/unit/run.mjs engine`. Full verification: `node tests/sim/run.mjs --real`
(results in the Results section). Engine files load in the order of tools/build-index.mjs (items/adapt.js loads
via `items/*`).

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
  shell saves.
- controller.js — `next(exId, ctx)` → {dials, focus, anchor, warmup, p, target, breadth, ctxKey, family, floor?,
  saturated?, overnight?, pinned?, eased?, coach?}. Edge: focus at p 0.72, others at comfort; anchors every 4th–5th
  and after two misses (prop < 0.5); warm-ups: first 2 trials of a set (3 after a break) and new conditions; focus by
  learning-progress bandit + uncertainty + staleness, 20 % exploration; floored dials re-tested 12 % of the time.
  Variety: uniform focus, breadth 1. Focus: 60 % on the dial behind `ctx.lab.weakest` (PROBE_MAP), else the dial
  furthest below its prior. Free: overrides + coach suggestion. Pins (`set.pin`, `set.focus`): `supports.pin`.
  Direct callers (shell style: plain set object + index + prev) get a hidden per-set memo.
- path.js — STAGES per exercise (venue, fixed dials, primary ladder) → blocked steps then a mixed step; mastery at 5
  fully right in a row or ≥ 80 % of the last 15; floor eases the primary dial; 15 trials < 50 % → one step back.
- items/common.js (option builder, memo), items/data.js (index, voice pools, maskers by similarity, beds, rooms),
  items/adapt.js (reads the stimulus schema as built; ready(ex)), items/{crowd,far,strange,repair,echo,seek,voices}.js.
- score.js, plateau.js, planner.js, flow.js (set runner: start/next/answer/end/exposure; `end` = log entry with
  end/avg/sd/idx/foci/pb/pbs).

## Option design (shortcut-proof)
Foils come from each slot's own answer distribution (item-sampled: the same slot's answer in a random other
eligible item), neighbours only when they can be answers for that slot, symmetric similarity structure: no maskers
→ (T, nT) (R, nR); one masker → (T, nT) (M, nM); two → T, M1, M2, R; three → all spoken. Homophones never shown.
A slot is asked only if the build has ≥ 3 different answers for it.

## Decisions for the lead to log (DECISIONS.md is lead-owned)
- Product of per-dial logistic components (bottlenecks) instead of an additive logit: per-dial abilities are not
  identifiable in an additive model. Limitation: a secondary dial limits accuracy even when the primary dB dial is
  very easy (e.g. talkers at +12 dB TMR); a cost-per-level model on the primary dial is the candidate fix once pooled
  data exist.
- Focus-only updates: updating non-focus dials made confounded posteriors wander below their easiest level.
- Plateau operating point (tuned on simulated learners): window 6 sessions (widened to ≥ 80 scored trials, ≤ 12),
  focus-weighted index over a fixed dial set, set-average posterior means, residual SD floor 0.35 dB-eq, slope prior
  N(0, 0.5²), flat = 80 % upper bound < +0.15 dB-eq/session for 3 windows in a row, no personal best in 4 sessions,
  ≥ 3 sessions between breakers. The literal two-sided "within ±0.15" never fires on training data: six sessions of
  shallow-slope trials cannot resolve 0.15 dB/session.
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
  decoys, radius, cast size).
- Shortcut responders (tests/sim/shortcuts.mjs): first, last, most frequent past answer, only options seen as answers,
  most different, most typical (bigram similarity), longest, shortest, heard-word (vs 1/heard), answer position per
  option count; per generator and per dial level; flag beyond max(0.04, 3.5 SE).
- Simulated learners (tests/sim/learners.mjs, run.mjs): improver 60 %, early (stalls after ~2 weeks) 15 %,
  stalled 20 %, weak 5 %; true slopes ×0.75–1.3, lapse 1–6 %, day offsets, rapid-adaptation dips for new
  conditions, item effects only partly known, correlated slots; adherence 45–85 % of days, sometimes 2–3 sessions a
  day. Most trials use a synthetic spec; every 25th trial and all Voices trials use the real generators.

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
- Plateau (Edge; similar in the other modes): 61 % of truly flat stretches detected, median 8 sessions after the
  flattening began (90th pct 18); false alarms on 13 % of pairs improving at ≥ 0.15 dB-eq/session (11–16 % across
  modes); clearly improving pairs (≥ 0.3) 0–2 % in the tuning runs. Breakers used in order (variety 44 %, focus 24 %,
  anchors 17 %, strategy 9 %, switch 5 %, sleep < 1 %).
- Path: mean step reached crowd 24/28, far 19/28, strange 33/41, repair 16/18, echo 9/15, seek 7/15, voices 17/19;
  ≥ 3 steps advanced by 94–100 % of learners; accuracy 0.726.
- Variety: a new target voice on 94.5 % of consecutive real-generator trials, a new family on 79 %; accuracy 0.776.
- Focus (weakest probe = rooms): Far 60 % of sets, distance the focus on 65.5 % of Far edge trials; accuracy 0.773.
- controller.next over 3.2 M calls: median 0.03 ms, p99 0.1 ms, p99.9 0.7–2.6 ms; maxima 16–229 ms are garbage-
  collection pauses of the simulation process (unit test: p99 < 5 ms in a clean process).
- Trials planned below p 0.65: 0.1–0.3 % of trials, all flagged `floor` (the easiest levels are predicted below the
  floor for weak simulated dimensions; asserted in engine-controller.test.mjs).

## Log
- 2026-11-26 17:05 UTC — Started; requests to stimuli/audio/shell.
- 2026-11-26 17:40 UTC — Core engine, generators, solver, shortcut responders landed; foils made answer-matched.
- 2026-11-26 18:10 UTC — Simulated learners; focus-only updates; plateau and drift tuned; shell-style callers.
- 2026-11-26 18:40 UTC — Adapter for the built stimulus schema (call-sign phrases, 8 voices); ready() per exercise;
  pins for venue sets; unit tests.
- 2026-11-26 19:00 UTC — No throws on small real pools (stated relaxation ladders, call-sign fallbacks for Strange,
  Repair, Echo; clips-only content); real-data unit test on the build, one voice per sex and a single voice; full run.

## Open issues
- Starter pack: Strange, Repair and Echo run on the call-sign fallback until their own clips land; residual
  answer-frequency biases on the real build (see Results). Re-run `node tests/sim/run.mjs --real` on every new pack.
- Voices length dial has no effect on phrase-only builds (no word or sentence clips).
- Strange text-first aid trials (exA's "Same or different?") not implemented; exposure interludes are text-first.
- Plateau false alarms near the band edge (true gain 0.15–0.3 dB-eq/session) stay ~10–15 %; clear improvers ~0–2 %.
