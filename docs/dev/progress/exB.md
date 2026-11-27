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

## 2026-11-26 20:18 UTC — fix round 1 (docs/dev/reviews/FIX-ROUND-1.md)
- H2 (Seek) · fixed: begin() unlocks the audio context inside the grab or key gesture and starts the live scene only
  once the context runs; a release when no sound was playing (never started, stopped mid-search by a context change,
  or the context not running at release) is not scored: the same scene starts over with "The sound didn't play, so
  that search does not count"; ES.audio.ctx.onState stops a running scene when the context leaves 'running'; the
  preview and the replays say when they did not play. Test: tests/e2e/ex_b_sound.py 12/12 (4 fail on the previous code).
- C08 · fixed: "That bet is untested as far as we found." (no check-in claim). A measure would need hearings-until-
  known per cast voice (game.cast; suggested to the game in requests.md).
- C09 · fixed: Echo's why, tip and cards: context restores words in everyday sentences; names and numbers get no help.
- C17 · fixed: Seek's why uses the review's rewrite. C32 · fixed: card "turn the listener on screen"; "self-set
  thresholds improved by about 3 dB" (also in the turn30 mission). C23 · fixed: the ~10-minute voice and the
  pitch-and-size result reworded in Voices (tip, why, cards) and the newvoice mission. C37 · fixed: the card offers
  recording only when the voices-own screen is in the build ("stays on your device").
- SHIMs removed: Seek uses meta.preview only and the engine's spatial/seed; the Voices tutorial uses
  learner.noteMet; Echo's hold and Seek's DOM shims were already gone.
- M7 (pause replays) · not applicable to Seek: the voice repeats by design and a pause only stops the scene.
- index.html regenerated locally with node tools/build-index.mjs before the browser runs (left for the shell to commit).
- Runs after the fixes: ex_b_tutorial 58/58, ex_b_layout --quick 62/62, ex_b_own 21/21, ex_b_map 15/15, ex_b_sound 12/12.

## 2026-11-27 00:14 UTC — fix round 2 (docs/dev/reviews/FIX-ROUND-2.md)
- FRESH-B C2 (Seek scoring) · fixed: the tutorial, the help and every search prompt state the rule ("stop with the
  voice inside your ring (within N m), then tap its word; a scene counts when both are right"); the ring around your
  dot is drawn stronger; feedback marks the two parts separately ("Found ✓ · Named ✕", data-found/data-named); a
  location miss says how far the voice was and what radius counts; Results adds "Found the spot in a of n · named
  the word in b of n · both in c" (results:news). Tutorial captions say the practice scene starts over (three tries).
- ST-12 · fixed: a meeting never plays a call-sign phrase (manifest tag callsign); it plays the voice's intro, then
  one sentence or phrase (Node check: 38 cast voices, 0 call-sign clips, 4–13 s) and offers only the new name.
- P10 · fixed: Seek card and the turn30 mission say "could follow the talker with the noise about 3 dB louder".
- A3 · fixed: Home's mission link is a secondary button (≥ 44 px; layout test checks it).
- A7 · fixed: in short portrait screens Echo's picture stays in the tutorial; in feedback (3 questions or tutorial)
  it gives way to the words, which sit right above the marked keys (no empty band; fits() now flags bands).
- A1 · checked at 640×360 with the shell's working-tree landscape rules: Echo and Voices fit in every state; Seek
  gets a wider room (two equal columns) and keeps its reveal beside the feedback. ex_b_layout now runs 640×360.
- Voices tutorial · the meet steps say how to learn a voice (pitch, pace, voice quality; hear it again after the
  name); meet prompts say how long to listen ("Listen for about N s, then tap the name").
- Echo tutorial · each step plays a new message (practice steps never repeat the example's; Try again draws anew);
  tested in ex_b_tutorial ("every tutorial step plays a new message").
- Seek "finger" · device-neutral: "press on your dot (marked “you”) and drag"; keyboard line kept in the tutorial.
- Voices repeats · not reproduced on current data (40 simulated players × 3 sets: no voice met twice, no unmet voice
  offered). "You now know N voices" under "New voice" lines is game copy (js/game/record.js): request to game.
- Voices answer position · no bias: 1,785 two-name who trials 886/899 (χ² 0.09, df 1); four names 76/79/90/100
  (χ² 4.18, df 3). The tutorial's who step puts the answer second on purpose (practice answers in new keys).
- Runs: ex_b_tutorial 61/61 (also --miss 68/68, --real echo 18/18), ex_b_layout --quick 99/99, ex_b_map 15/15,
  ex_b_own 21/21, ex_b_sound 12/12; unit 220/220.
