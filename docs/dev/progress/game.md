# Progress: game layer (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 18:14 UTC — plan (intent, written before the code)
Owned: js/game/**, tests/unit/game*, tests/e2e/game_*.py, tests/fixtures/game-*.js, this file.
Read: brief docs/dev/briefs/game.md, CONTRACTS §0 §7 §8 §11 §12, PLAN §9, R5 §5–7.

Files (classic scripts on ES.game; pure parts load in Node; each ≤ ~400 lines; order pinned in js/game/load-order.txt):
- `data.js` (pure): the 12 venues (ids as exA uses them), three lines (Many voices: café → restaurant → bar → house
  party → club → concert; Far & echoey: lecture hall → station → park → stadium → cathedral; Phone line), each a
  family of dial settings (pins follow engine path.js STAGES where the venue has a stage), a headline condition
  ("your earshot here" in real units: dB voice-vs-others, metres, line quality), "also here" conditions, unlock
  rules on the previous venue's earshot, map geometry (rays from "you"; rings = steps).
- `core.js` (pure): learner view (live ES.engine.learner or one built from the stored record, whichever has more
  trials), dial estimates in real units, value formatting, the game record (store key `game`) with guards.
- `venues.js` (pure): earshot at a venue = level on the headline dial where the engine's model predicts p = 0.72
  with the venue's pins (learner.predict; bisection / per level); shown only when the dial has data; unlock state
  (once open, never closes), next venue, venue set plans; FALLBACK pinned-dial setting with the controller's
  exported helpers until the engine honours `ctx.set.pin` (requests.md 18:12).
- `cast.js` (pure): cast from ES.data.voices[v].cast {name, venue, blurb}; card states unmet → met → known
  (identified ≥ 3 times in Voices); synthetic voices labelled synthetic.
- `milestones.js` (pure): ability milestones (real-unit thresholds per dial; never for time spent), personal bests
  per dial (engine rule: ability up > 0.1 logit; the set entry's `pbs` win when present) and per venue,
  level-up lines in real units.
- `weekly.js` (pure): ISO week key (local calendar) → seed `weekly:<week>:<content version>`; four stops (Crowd,
  Far, Strange voices, Repair) at seeded venues, six trials each on a fixed easy → hard ramp; every trial built by
  the engine's generators from the seed with a fixed ctx (prior learner, fixed breadth and player seed, no
  headphones), so the set is identical for everyone on the same build; scoring, result record, share text with
  https://discord.gg/chmr and the build version; no leaderboards.
- `returns.js` (pure): fresh ears (≥ 2 days away; planner.freshEars) and the overnight check (planner.overnight)
  framed as chances to see retained skill; never a warning about absence; no streaks or lives.
- `record.js`: hooks — trial:done (cast met/identified, buffered), set:done (estimates before/after, level-ups,
  PBs, venue earshots and openings, milestones, fresh/overnight results → one store write; emits `pb` or
  `milestone` once per set so the shell's Chimera invitation shows between sets), session:done (weekly result).
- `share.js` (DOM): result card PNG on a canvas; copy image / download / show-image fallbacks; copy text.
- `style.js` (injected CSS on the shell's tokens), `ui.js` (news block, home card, small SVG charts, venue glyphs).
- Screens (ES.ui.screens): `map`, `venue`, `cast`, `weekly`, `progress`.
Fresh profile: no sample or fake data anywhere ("—", "play a set here to measure it").
Tests: tests/unit/game-*.test.mjs (venues, weekly determinism and independence from the player, share text
always has the link, milestones, cast, record hooks); tests/e2e/game_*.py (screens on fresh and long-term
profiles, phone 360×640 / 390×844 and desktop, light/dark; weekly identical across two browser runs).
Long-term fixture: tests/fixtures/game-longterm.js from simulated learners (engine flow), no real player data.
