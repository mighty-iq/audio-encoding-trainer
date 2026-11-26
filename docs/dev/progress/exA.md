# Progress: exercise views A — Crowd, Far, Strange voices, Repair (resumable notes; newest at the bottom; UTC)

## 2026-11-26 17:20 UTC — plan (intent, written before the code)
Owned: js/ex/crowd.js, js/ex/far.js, js/ex/strange.js, js/ex/repair.js, js/ex/strategies.js,
tests/e2e/ex_a_*.py, this file.

Module shape (CONTRACTS §11 plus optional hooks, requested from the shell in requests.md 17:19):
`ES.ex[id] = { id, name, short, card:{trains, bet}, bet, betNew, venues, view:'keyword', feedback, tips,
tutorial:{steps}, strategies:[cardId], help(), openHelp(), prepare(trial), review(trial, result),
field(trial, phase, result), tutorialTrial(step, i, rng) }`.
- Files are independent at load time (alphabetical load puts strategies.js after crowd/far/repair/strange):
  shared helpers live in strategies.js as `ES.ex._kit` and are only touched inside functions.
- Copy for Home/map: the decision-board wording the owner approved (short + bet).
- Help sheet text is generated from ES.engine.dials at call time, so ranges always match the code.
- prepare(): exercise prompt, field picture (who stands where; room outline; distance labels; colocated
  voices fanned ±10° with "same place"), replay labels, derived replay audio when the generator gives none
  (Crowd: target alone + the mix; Far: at 1 m + from the real distance; Strange: degraded again; Repair:
  clear + degraded), text-first prime for aid trials.
- review(): Crowd intrusion message (which voice the picked word came from); Far DRR line (−6 dB per
  doubling: direct sound vs the room's echo); Strange pop-out (words shown, then the degraded clip again,
  always); Repair (clear version, then degraded with the words, on a miss).
- Tutorials: play-to-learn, easy forced settings first, captions ≥ 3 s with the next action stated,
  answers at varying key positions, foil types annotated after the first practice, end caption (the shell's
  runner adds the Chimera link). Shim generators (marked SHIM) used only when ES.engine.items[id] is absent.
- Strategy cards (plateau breaker), each from the notes: R3 §1/§3/§5 (Crowd), §10 (Far), R2 §1.0/§1.11/§3.3
  (Strange), R3 §4/§6 (Repair).

Tests: tests/e2e/ex_a_*.py under `flock /tmp/earshot-browser.lock`, outputs in tests/out/.

## 2026-11-26 18:03 UTC — modules, tests, first review
Done (commit 0605c4a + this one): js/ex/{crowd,far,strange,repair,strategies}.js. The shell adopted prepare, prime,
review, tutorialTrial and "Try again" (js/ui/trialview.js, tutorial.js); Results renders strategy cards via
ES.ex.strategies.pick. Help: the shell's Play sheet still uses short/tips/bet; helpBody() + styles requested.
Engine TrialSpecs read: crowd meta.cue/items/maskers (who said a borrowed word), far audio.room {rt60, dist,
size word} + meta.text, strange meta.family/text/synthetic, repair meta.items/keyPos + bracketed feedback.text.
Rooms drawn from CONTRACTS §12 R1 sizes; rings fitted to the far wall. Crowd: voices without a direction cue
are drawn as a group at one distance, 32° apart (no fake level difference).
Tests (Playwright, under flock): tests/e2e/ex_a_common.py builds tests/out/exa/page.html from index.html's script
list + fixtures (data-fixture, audio-fixture aliased so the real renderer runs; adds js/ex files the index lacks).
- ex_a_tutorial.py [--miss]: fresh profile → Home plan → tutorial → set. Last run: 76/76 pass; tutorial time of
  simulated play: crowd 28.5 s, far 48.7 s, strange 31.9 s, repair 29.6 s (limit 120 s); a miss shows "Try again"
  and stays on the step; every practice/set trial fits 360×640 in answer and feedback states.
- ex_a_layout.py [--quick]: 360×640 light/dark, 390×844, 1366×768 dark; miss feedback fits; Help ranges = code;
  strange text-first prime shows the words ≥ 1 s before the sound. Last run: all pass except a transient Far
  render error seen once while other builders were editing (passed on rerun).
Open: Help sheet styles/adoption (shell); index.html lacks far/strange/repair until the shell reruns build-index.

## 2026-11-26 18:29 UTC — after the restart
- Real starter pack landed (data/*, audio/pack-starter.js: 133 phrase clips, 8 voices; covers crowd, far, seek,
  voices). In phrase mode the generators ask for one word, so every exA caption, prompt and Help goal is now
  slot-count agnostic (Far builds its prompt from the slot labels: "two words" / "the word and the number" /
  "the word"); Far says "phrase". Node check of both data worlds: /tmp scripts only (not committed).
- Tests: default = fixture world (real data/ and audio/ scripts dropped from the test page, data/ltas.js kept);
  `--real` = index.html's own data and packs (Crowd and Far only for now).
- Copy review against the notes: claims narrowed to their sources (same-sex study, 30-sentence block, implicit
  multi-room result, babble language); Help sheets de-duplicated; Crowd tips trimmed to three.
- Browser lock is shared by every builder (shell run_all, audio, lead play-tests); queue long runs in the
  background with a long flock wait (e.g. timeout 3400 flock …) — a 600 s wait timed out once.
