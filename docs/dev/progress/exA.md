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
