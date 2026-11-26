# Progress: exercise views B — Echo, Seek, Voices, Missions (resumable notes; newest at the bottom; UTC)

## 2026-11-26 19:12 UTC — plan (intent, written before the code)
Owned: js/ex/echo.js, js/ex/seek.js, js/ex/voices.js, js/ex/voices-own.js, js/ex/missions.js, tests/e2e/ex_b_*.py,
this file. Copy for Home/map = the decision-board wording the owner approved (trains + bet).

Module shape: as exA (CONTRACTS §11 + exA's optional hooks): `ES.ex[id] = { id, name, short, card, bet, betNew,
view, feedback, tips, strategies, helpData(), helpBody(el), openHelp(opts), tutorial:{steps}, venues (getter),
prepare?, review?, tutorialTrial?, custom? }`. Shared helpers: exA's `ES.ex._kit` (js/ex/strategies.js), touched
inside functions only (alphabetical load order puts echo/missions/seek before strategies.js). My strategy cards
are pushed into `ES.ex.strategies.cards` at load and on `app:ready` (pick() reads that array).

- Echo (keyword): prepare → prompt "listen once, answer from memory after a short pause", picture (the caller in a
  café/party), replays [message alone, again in the noise]; review → per-slot lines (binding errors = 'context'
  foils: "was in the message, but answers another question"), the message text (static), auto replay in the noise
  on a miss. The pause: SHIM until trialView supports `question.delayMs` — the target voice id `echo-msg-d<s>` lets
  CSS (`:has()`) hide the answer panel and status while the sound plays and for the delay after it; a capture
  key handler swallows digit keys during the hold. Switches off when `ES.ui.trialView.supports.delay` is true.
- Seek (custom view in Play; drives ES.engine.flow itself): field = top-down square scene (−1…1, 10 m per unit),
  lab grid, scale bar, "you" cursor with the found-radius ring. Grab yourself (pointer down near you) and drag;
  live scene (ES.audio.live) follows; release after moving = the answer point; sound stops; word question
  (ES.ui.answerPanel); then reveal (target red + radius, decoys blue with words, your path) + replays (voice
  alone, up close in the noise). Keyboard: arrows walk (Shift = bigger steps), Enter answers here. With decoys a
  preview of the target voice (another clip by it, SHIM until the engine sends meta.preview) plays first. Head-
  turn view (spec live.headTurn): a turn knob on your ring (drag to turn; releasing the knob does not answer),
  Q/E or [ ] keys; feedback names where the voice sat relative to your nose. First-ever Seek: guided practice
  scenes (easy forced dials, plain score, not in the set, Try again ×3). Integration SHIMs (requests filed): the
  view sets `set.sc` to its flow context and calls ES.ui.session.record (no double learner update; log entry via
  flow.end), stops sound on Pause/Help clicks, hidden tab and route changes; returns a {pause, resume, abort,
  state} handle for when play.js adopts it.
- Voices (keyword; engine tasks meet/who/find): meet → name + blurb shown, up to 3 clips of the voice, "tap the
  name"; who → pitch hint after a miss and the picked voice for comparison; find → the crowd drawn, intrusion
  line. Tutorial: meet, meet, who (own tutorialTrial with ctx.task/met); voices met in the tutorial are noted
  (learner.state.cast SHIM + hook `cast:met`).
- Voices from your life (voices-own.js, screen 'voices-own'): consent line + name, record (getUserMedia only when
  allowed; ≤ 20 s) or import a file; decoded, trimmed, resampled to 16 kHz mono WAV (original file metadata not
  kept), stored in IndexedDB `earshot-own` (memory only where storage is blocked, with a message); list, play,
  delete, delete all; never exported. "Find your friend" practice: two short crowds of cast voices, one with the
  friend's recording; which one? 2-down/1-up on the friend's level; level kept in IndexedDB.
- Missions (screen 'missions' + custom view): 8 missions from the notes (R3 §3, §5, §6, §7, §10, §11), one per
  ISO week (same for everyone), swappable; 20-second check-in (tried? followed 0–10, did it help?) → store
  `missions` {v, weeks:{wk:{id, at, done, rating, helped}}} + ES.lab.logEvent(source 'mission'); share line with
  the Chimera link; Home card (FALLBACK insert until the shell appends ES.ex.missions.homeCard()).

Tests: tests/e2e/ex_b_common.py (page = index script list + my files + fixtures + alias, like exA),
ex_b_tutorial.py (fresh profile per exercise within 120 s of simulated play), ex_b_layout.py (360×640 light/dark,
390×844, 1366×768), ex_b_own.py (import on file://, sandboxed srcdoc). All runs via tools/with-browser.sh.

## 2026-11-26 19:58 UTC — modules built, first test rounds
Done (commits da2c548, ea610c8 + working tree): js/ex/echo.js, voices.js, seek.js + seek-scene.js (split to keep files
≤ ~400 lines; lead asked to count it as exB's), missions.js, voices-own.js. Replies used: the shell (19:18) supports
question.delayMs (Echo's own hold shim removed), adopts a custom view's handle (pause/resume/abort/state) and gives
api.flow/record/level/progress (Seek's DOM shims removed); Settings opens voices-own and wipes it; Home appends
ES.ex.missions.homeCard(); the game (19:16) put Play buttons on "Also here" rows; the engine sends audio.live.found,
spatial, seed and meta.preview, and learner.noteMet (Voices uses it when present).
Decisions (cheap to change):
- Echo: a miss auto-replays the message in the noise with its words on screen; the feedback explains only what the
  marked keys cannot (binding errors = 'context' foils, sound-alikes); names in name slots are capitalised; on
  screens ≤ 720 px tall three-question trials use 44 px keys and the picture steps aside in feedback (and in the
  tutorial, whose caption takes room) — the overlap check in ex_b_common.fits found the clipping.
- Seek: grab your own dot (52 px radius) and drag; release after ≥ 0.8 m of movement answers; scene levels shifted
  −8 dB with nothing louder than at 1 m (the live scene has no ceiling); the found ring around you shows the
  scorer's radius (1.15 × target size); a preview of the target voice plays when there are decoys; head-turn view:
  a knob on your ring, feedback = share of the search with the voice 15–70° to one side (one ear toward it);
  first Seek ever: one guided practice scene (not counted, Try again ×3).
- Voices: meet trials play up to three clips of the new voice with its name and role; a 'who' miss auto-plays the
  right voice then the picked one, with a pitch line from voices.f0; the tutorial meets two voices, then 'who'.
- Voices from your life: name + consent tick required; record (≤ 20 s) only where the permissions policy allows
  the microphone, else a plain message; import any decodable file; stored as trimmed 16 kHz mono WAV (no file name
  or metadata); memory-only with a message where IndexedDB is blocked; practice = 2-interval "which crowd had X",
  2-down/1-up from +6 dB, level stored per voice in IndexedDB; never in exports (test checks the backup JSON).
- Missions: 8 missions (R3 §3, §5, §6, §7, §10, §11), same for everyone per ISO week, swappable before check-in;
  check-in = tried? / followed 0–10 / helped?; diary event once per week (v = 1 + round(0.4 × rating)).
Tests (tools/with-browser.sh): ex_b_tutorial.py [--miss] [--real] (Echo 21.6 s, Voices 30.2 s, Seek 10.7 s to
playing correctly, fixture world), ex_b_layout.py (136/136 at 360×640 light/dark, 390×844, 1366×768 dark),
ex_b_own.py (21/21 incl. sandboxed srcdoc), ex_b_map.py (venue "Also here" sets).
Open: index.html lacks js/ex/missions.js and voices-own.js until build-index reruns (asked); my test pages add them.
