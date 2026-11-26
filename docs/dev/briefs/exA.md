# Brief: exercise views A — Crowd, Far, Strange voices, Repair (wave 2)

Owner paths: js/ex/crowd.js, js/ex/far.js, js/ex/strange.js, js/ex/repair.js, js/ex/strategies.js,
tests/e2e/ex_a_*.py, docs/dev/progress/exA.md.
Read: docs/dev/CONTRACTS.md (§5 TrialSpec, §8 look, §11 exercise modules and tutorials), docs/dev/PLAN.md §6–7,
docs/research/R2 (feedback: degraded → text → degraded; text-first aid), R3 (masking, distance), the shell's
progress notes (Play screen and tutorial runner APIs) and the engine's progress notes (dials, items, score).

Build, per exercise, `ES.ex[id]` with:
- meta: name, one-line description for Home and the map, the transfer bet (wording from PLAN §6), betNew flag,
  venues it feeds (Night out map), feedback mode (crowd: intrusion message when a picked word came from another
  voice; far: replay at 1 m then far; strange: pop-out — degraded, then the text, then degraded again; repair: clear
  version then degraded with text);
- a Help sheet: the goal, what each dial means in plain words and real units, 2–3 tips;
- a two-minute tutorial (CONTRACTS §11 steps): play-to-learn with forced easy settings first (target alone or a
  quiet competitor), captions ≥ 3 s, the next action always stated, practice answers in varying slots, every foil
  type the real trials use shown once; the last step shows the Chimera link (via the shell's runner);
- strategy cards used by the plateau breaker (one or two per exercise, accurate to the research notes);
- the field picture mapping (who stands where; rooms as outlines; distances labelled).
Tests (Playwright, `flock /tmp/earshot-browser.lock`): a fresh profile completes each tutorial in ≤ 2 minutes of
simulated play; a trial at 360×640 needs no scroll; the right answer advances and a wrong one does not; light and dark
screenshots reviewed. Commit own paths only; never push; progress in docs/dev/progress/exA.md.
