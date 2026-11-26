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
  (once open, never closes), next venue, venue set plans (the engine's flow honours `pin`/`focus`).
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

## 2026-11-26 19:00 UTC — status (resume from here)
Committed 9bc5f91: pure layer + unit tests. Since then (uncommitted until the browser suites pass): style.js, ui.js,
share.js, screens (map, venue, cast, weekly, progress), tests/e2e/game_common.py, game_screens.py, game_weekly.py,
tests/fixtures/game-longterm.js; fallback.js removed (engine now has controller.supports.pin and flow.start {pin, focus}).

Decisions (each cheap to change; reasons):
- Venue pins and unlock marks calibrated with simulated learners (tests/unit/game-calibrate.mjs: tests/sim learners
  through the real planner and flow, Edge mode, 30 learners × 42 days): the path.js STAGES pins for club/concert and
  for every far venue but the first were out of reach for the simulated population after 6 weeks ("below 1 m").
  Result: café, lecture hall, phone open at start; restaurant opens in session 1 for 87 %, park s2, bar and station
  s3, house party and stadium s6, club s10, concert s15, cathedral s10 for 30 % by day 42; a median improver opens
  10 of 12 in six weeks, stalled learners 7. A venue also needs its own earshot to exist (status 'in') before it
  opens, so a newly opened venue never shows "below 1 m".
- Earshot = 72 % point (the engine's target) on the venue's headline dial with the other dials pinned, computed with
  the stored posterior WITHOUT the engine's day-drift (core.est): time away never shrinks a number on a game screen.
- Map: rays from "you" (Many voices up-right, Far & echoey up-left, Phone line down), one ring per step, the reach in
  ink to the furthest open venue; open venues show the earshot, the next one its mark (≤ 0 dB / ≥ 3 m), later ones
  only their names. The same facts as a list (accessibility; the map is not the only channel).
- Milestones: per-dial ladders in real units, reached when the threshold estimate (≥ 6 updates) is at least that
  hard; cast "know N voices"; whole line / all venues open. Shown as reached + the next per dial only (R5 §5.2).
- PBs: the engine's flow decides dial PBs (the shell emits `pb`); the game adds venue bests (≥ 1 dB or one level
  beyond the stored best) to the news and emits `pb` for them only when the engine's did not fire for the set.
- Weekly: ISO week of the local calendar; seed `weekly:<week>:w1`; four stops (Crowd, Far, Strange, Repair), venue
  per stop seeded among the reachable ones, six fixed rungs easy → hard (calibrated from the same simulation);
  generators get a fresh prior learner, breadth 0.5, player seed `weekly:<week>`, no headphones → identical for
  everyone on one build (identity string `v<app> · w1 · <data version>` on the card). First complete run = the
  card; later runs are practice and never change it. No leaderboard.
- Share card: 1200×675 PNG, light lab paper in both themes, ✓/✕ only (spoiler-free), optional nickname the player
  types (profile.nickname), discord.gg/chmr on the image and the Chimera link on every text.
- Shell integration pending (requests.md 18:12 and 18:52): session.start(plan) with plan.pin/focus to flow.start and
  plan.make for the weekly; `results:news` hook; Home appends ES.game.homeCard(). Until then: Play buttons say the
  feature arrives with the next build; ui.js inserts the news block before `.invites` on route 'results' and the
  home card into `.home-cards` (FALLBACK, marked in code).

Browser tests: run WITHOUT an outer `flock` (harness.browser_lock takes /tmp/earshot-browser.lock itself; wrapping
it deadlocks). Logs: tests/out/game-screens.log, screenshots tests/out/game/.

## 2026-11-26 19:21 UTC — state at hand-off (commits 9bc5f91, b3b9706, f1a6f81, 365e9fd)
Done and verified:
- Unit: `node tests/unit/run.mjs game-` → 30/30 (venues, weekly, growth, hooks; engine flow sets answered in Node).
- Browser: `python3 tests/e2e/game_all.py` (one browser slot via harness.browser_lock; no wrapper) → screens on a fresh
  profile (nothing invented anywhere) and the simulated long-term profile at 390×844 light, 360×640 dark, 1366×768
  light (no horizontal scroll, map fits, charts with tooltip and table view); weekly identical in two separate
  browser runs and for a long-term profile (data fixture page), card image 1200×675, copy text carries the Chimera
  link, PNG download, blocked download → image shown to save by hand; a real session through the shell (real
  packs, audio rendered): nothing from the game during a set, news block between sets, cast met, home card; a venue
  set holds the café pins and returns to the venue; a weekly stop plays exactly the seeded trials and records marks.
- Shell picked up 18:12/18:52: session.start(plan) with pin/focus to flow, plan.make for the weekly, done route,
  plan.title in the trial bar, supports {plan, make, pin}.
Open (requests.md):
- 19:16 game → engine: chooseFamily should take the family of `set.focus` (Phone line venue and every Strange
  "Also here" row currently play a family the bandit picks).
- 18:12 (5)(6) game → shell: `results:news` hook and Home appending ES.game.homeCard(); FALLBACK insertion in
  js/game/ui.js works meanwhile (route 'results' → before `.invites`; route 'home' → `.home-cards`).
- index.html: regenerate with `node tools/build-index.mjs` when files change (shell); all game files are listed now.
Notes for whoever resumes:
- Recalibrate venue pins/marks and weekly ramps with `node tests/unit/game-calibrate.mjs` if the engine's priors or
  dials change; `--fixture` rewrites tests/fixtures/game-longterm.js (simulated learner, no real data).
- The cast follows data/voices.js `cast` fields (20 voices in the current packs); nothing to change when it grows.
- Lesson: `git rm` leaves a staged change in the shared index that another builder's commit can sweep up; stage and
  commit in one command.

## 2026-11-26 20:14 UTC — fix round 1 (docs/dev/reviews/FIX-ROUND-1.md; RV-code, RV-claims on e079caf)
- M8 fixed (game part): weekly plan and every set carry `learn:false`; every weekly trial carries setting.noUpdate
  and meta.learn = false (generators drop extra setting fields, so it is set on the returned spec), so no threshold
  moves on a first run or a replay. Tests: tests/unit/game-weekly.test.mjs "M8 …" (fails on the old weekly.js);
  browser: tests/e2e/game_session.py checks the dial records are unchanged across a real weekly stop. recent/edge/n
  still change until the shell honours `learn:false` (its part of M8; the suite warns until then).
- C19 fixed: overnight lines say "Your last day's hardest (…), retested with other voices where possible", nothing
  about "yesterday" or "voices new to you"; the Home card's added sentence follows R2 (accent learning carried over
  to a new talker only after a night's sleep). The planner's own sentence is the engine's (C19 planner.js part).
- C25 fixed: fresh-ears texts name the source as online training games ("…skill mostly survived breaks and came back
  within a game or two"), not a rule about listening.
- C31 fixed: map intro says "a level in decibels, metres or line quality, never a guess".
- C10 (game part, js/game/returns.js:49-52) fixed: the fresh-ears line no longer prints the engine's index number
  (its sign and units read the wrong way for dB dials); it says held / rose / a little rust.
- C12 (game part, js/game/data.js:28, js/game/weekly.js:21) fixed: venues.condAvailable() hides the Café "Accents" row
  (and ES.game.venues.forExercise('strange') leaves the café out) and the weekly never draws the accent stop when the
  build has no accented voices (engine adapt.isNative). Test: game-weekly "C12 …".
- M4 (game part, the Home card via returns.upcoming) fixed: the overnight card shows only before the day's first
  session. Test: game-growth "returns: the overnight card shows only before the day's first session (M4)".
- FALLBACK removed: the shell's `results:news` hook and Home's ES.game.homeCard() call (64e57ff) host the news block
  and the home card; js/game/ui.js keeps only the hook listener.
- Every new or changed test was run against the pre-fix files (they fail) and the fixed ones (they pass).
- Browser runs now go through `tools/with-browser.sh python3 tests/e2e/game_all.py --held` (one slot).
