# Earshot 1.1 — plan (draft for the owner's go; times UTC)

Status: draft 2026-11-28. Sources: docs/research/v1.1/R0 (internal audit), R7 (progression and variety dosing),
R8 (game features), R9 (anti-strategy, transfer, variety), R10 (seven core papers read in full, which corrected
A1, B1, B2 and several claims), R11 (papers fetched as full text). The 1.0 backlog is absorbed in §4.

## 1. Concept
Hear it, don't guess it — and see it grow. 1.0 trains the right situations, but the audit shows players can lean on
recall and option tricks (by week 4, 77–99 % of Far, Echo, Strange and Repair trials replay a known item; options on
screen while the sound plays settle 85–100 % of slots from one fragment), the daily dose per exercise is below what
produced learning in the studies, variety widens on a clock, and growth is spread over 32 charts with no headline.
1.1 makes every answer depend on hearing (fresh noise and items every trial, options after the sound, typed answers
at the top, rare "not there" trials), concentrates practice so it can consolidate, adds variety where the real world
varies (noise types, natural voices, real rooms, answer formats) and doses it by readiness, and shows growth as one
Earshot level built only from confirmed ability marks, never lost, with skill meters, seasons and a weekly plan.

## 2. Features (each tagged with its bet; numbers are targets to verify in simulation and review)

### A. Hear, don't guess (anti-strategy, transfer)
- A1 Fresh sound every trial (0 bytes). 1.0 already synthesises speech-shaped noise and builds babble live per
  trial; what recurs is the recorded ambience (10-s loops), heard on every Far trial and in early Echo, and a babble
  sample that recurs is learned within one sitting (≈ 10 points easier, gap growing; Felty 2009). So Far's and
  early Echo's noise becomes a per-trial mix: live babble + room-coloured synthetic noise + the recorded loop at a
  lower, jittered level from a random offset, spectral tilt jittered (±3 dB/octave); modulated and reversed-speech
  maskers join the mix; masker type, bed id and offset are logged. Level roving: each other voice ±4 dB around its
  planned level per trial; with one other voice, which voice is louder is drawn at random and the dial becomes the
  size of the level difference (12 → 0 dB), because when every other voice sits at one level below the target,
  "follow the quieter voice" wins (Brungart 2001: scores stop falling below 0 dB with a similar voice). A recurring
  noise is recognised after about 4–10 hearings, without feedback, and remembered for weeks (Agus 2010), so no
  0.5–2-s stretch of a recorded bed is heard more than about 4 times per player per fortnight (needs D4's longer
  beds). Lead-ins vary. Bet: maskers learned as types, not samples (Agus 2010; Van Engen 2012).
- A2 Hear first, then choose: options appear only after the sound ends in every exercise; Repair's missing word
  anywhere in the sentence (now always last, 156/156). Options come from real confusions (the pooled error log and
  phoneme confusions, not only one-sound neighbours), 6 at the hardest closed step: a closed set behaves like open
  recognition only when its options are many and truly confusable (6 real-error options: 67 % correct where typing
  gave 47 %; 12 random words: 92 %; Clopper 2006).
- A3 Fresh items: least-heard-first sampling with a spacing window; a memory responder added to tests/sim; item
  pools 3–5× larger (needs D1/D4). Acceptance: replays of a known item ≤ 25 % of week-4 trials for a typical player.
- A4 Type what you heard: typed answers at the top level of Repair and Echo, a "Type it" round in Crowd, Far, Strange
  and Voices, and one open-set Lab check; forgiving scoring per keyword (non-word typos accepted, a different real
  word is wrong, homophones and number words count; Bosker 2021 fuzzy matching r ≈ 0.92 with human scorers). A
  Settings switch keeps taps only for players who cannot type comfortably.
- A5 Hear it again with the words: after every miss, the same mix replays with the words on screen (Davis 2005).
- A6 "Not there" trials (rare, ≤ 5 %) and occasional uncertainty about where or who the target is (bet; Kidd 2005).
- A7 Strategy spotting, never punishing: taps faster than the player's own guessing threshold are set aside, not
  scored; error profiles (intrusions, sound-alikes, wrong voice) feed tips between sets and plateau reasons. An
  "I didn't catch it" key in Crowd and Far replays the same mix once, a little easier, and counts a miss without a
  guess (LiSN & Learn had such a key; its own effect is untested).

### B. Progress that is real (progression)
- B1 Concentrated dose: a sitting trains ≤ 3 exercises, ≥ 60 scored trials for the one at its edge and ≥ 40 for
  the others, sets of one exercise within about 30 minutes, the rest on other days; the daily amount is a model
  parameter. Learning builds between days once a per-day amount is reached, and trials per day matter more than the
  total (Wright & Sabin 2007, principle only: its numbers are for tones); the 40–80 sentences and the listen-only
  half-trials (6–8 items right after a set) rest on Wright et al. 2010 and 2015.
- B2 Variety by readiness, counted in days. Confusable conditions within an exercise (fine steps of one dial,
  spatial layouts, small pitch gaps, sound-alike options) go blocked → runs → random: runs of ≥ 5 trials of one
  condition, each trial labelled with the condition's name (runs of 3 gave no learning, 5 did, 8 more; a named label
  restored learning even in random order, a preview of the stimulus did not, and uneven timing broke fixed cycles,
  so self-paced play cannot rely on them; Kuai 2005; Zhang 2008). Each stage starts after ≥ 2 training days on the
  one before (≥ 40 trials as a floor), and the runs stage is not judged on its first day (Nahum 2010). A sitting that
  teaches a new condition never ends with a random mix of its neighbours (a random run straight after practice
  erased that day's gain; safe after ≥ 8 h; Zhang 2008). Distinct, nameable conditions (other-sex voices, rooms,
  exercises) and sentences mix freely: random mixing did not slow general learning (Nahum 2010). New target voices
  for an accent or unusual speech come one voice per set at first, rotated across sets and days, mixed within sets
  later (the many-talker benefit was larger with talkers blocked, and it shows in tests with new talkers and in
  retention rather than in session scores; Zhang, Cheng & Zhang 2021). Crowd with headphones holds the spatial dial
  for whole sets with no scene rotation on the first ≥ 2 headphone days; the focus dial is also held in runs of
  ≥ 5. Widening only when thresholds are flat or improving and the switch cost is ≤ 0.05; each mixed condition keeps
  its own staircase at the same target accuracy (a model's prediction, not a tested result; Herzog 2012); variety is
  paid for with easier settings; difficulty or variety rises, never both in one set (Raviv 2022; Uchihara 2025).
- B3 Mastery across days: a condition counts as mastered after ≥ 2 days and a night, then returns in 10–15 % of
  trials for ≥ 4 training days (Wright, Wilson & Sabin 2010).
- B4 Plateau diagnosis before breakers: dose → schedule stage → anchors and listen-only → strategy → rest → switch the
  focus dial; at most one card per session; breakers get real levers (new material, a typed round, a new room set).
- B5 Raise ceilings: when a dial sits at its maximum (Repair 66–78 % of edge trials by week 8), combine conditions.
- B6 Calibration data: item, voice, condition, masker, planned accuracy and stage in every exported trial, plus the
  masker's words, bed id and offset, the target's level rank and the closest voice's pitch gap; offline item
  calibration from pooled exports, shrunk toward current offsets (weight n/(n+100)); a pooled check of whether
  accuracy rises with how often a bed has been heard.
- B7 (optional bets) Seeded assignment, recorded in the pooled export: blocked-first vs serial-first, and 40 vs 80
  scored trials per exercise per day (nobody has measured the daily amount for speech in noise).
- B8 Keep it: in the one placebo-controlled game study with transfer, the gain was gone two months after play
  stopped (Whitton 2017), so a finished season offers a lighter rhythm (two sittings a week) and a Lab re-check
  after 4–6 weeks off.
- B9 Honest guessing floor: in Crowd nearly every error is another voice's word (Brungart 2001; Darwin 2003), so a
  slot whose options include k other voices' words has a floor of 1/(1 + k) (0.5 with one other voice), not 1/4;
  tested in simulation first.
- B10 Even steps on Crowd's voice ladder: step 1 (same sex) capped at 2–6 semitones, the near-twin's shift
  direction drawn at random (Darwin 2003: below ≈ 2 st and a 13 % tract change two voices act as one talker).

### C. Levels and tracking (game)
- C1 Earshot level: one number built only from confirmed ability marks (a mark counts once passed on two different
  days), never lost; a break widens an uncertainty band instead (Glicko-style). Levels never come from time spent.
- C2 Skill meters per family with a "next mark" bar, marks measured against the player's own start (everyone can
  earn them), an occasional "how sure were you?" tap (Long & Aleven 2013, 2017). Every ~2 weeks a yardstick set per
  exercise (fixed settings, fresh items) measures in-game growth apart from the adaptive track and feeds the marks
  (Whitton 2017's fixed boards). In-game dB and Lab results stay apart: in LiSN & Learn the in-game gain was about
  twice the gain on its nearest test.
- C3 Honest start: the first week is "measuring your start"; personal bests and milestones only on the careful
  estimate (non-learners now get a PB in 67–98 % of sessions).
- C4 Seasons of about six weeks as chapters: a goal the player picks, a season card at the end; nothing resets or
  expires (Rodrigues 2022 novelty curve).
- C5 Weekly plan the player sets (e.g. four sittings) and a welcome-back gift after a missed week (a new voice or
  room); no counter of weeks in a row, only cumulative counts that never reset, because the harm of streaks comes
  from a log that shows a break (Silverman & Barasch 2023; Milkman 2021: +27 % for a small return bonus; Lally 2010).
- C6 Ghost race (new bet): race your own best run, or a friend's share code, set one step ahead; results only after
  the set (Feltz 2012 inverted U). Crew card: friends' share codes added together, no ranking.
- C7 Encore marks for mastered venues; surprise firsts (real firsts only, never random prizes); a weekly variety recap
  ("5 rooms, 9 voices, 4 noise types").
- C8 Daily minute: one seeded one-minute challenge per day, identical for everyone, no streak, never counted in a row.
- C9 Fix the claims the code does not keep: "10/20 voices" unreachable (at most 6 of 38 met); "a voice from one
  word" without word clips; Repair "early or late".

### D. Variety where the real world varies (content)
- D1 Lazy sound packs on Pages: a session loads what it needs (first session ≈ 3.7 MB instead of 11 MB); the single
  offline file keeps every pack.
- D2 Natural voices: about 40 LibriVox readers (public domain, ≈ 0.9 MB) for open-set sentences and maskers;
  AudioMNIST talkers (MIT) for natural digits, including non-native speakers.
- D3 Measured rooms: about 20 impulse responses (AIR, MIT; HybridReverb2, CC BY-SA 4.0; ≈ 0.3 MB) next to the
  synthetic rooms (Vlahou 2019: several rooms transfer to new rooms).
- D4 Bigger pools: Far 37 → ≥ 150 sentences, Echo 56 → ≥ 150 messages, Repair 156 → ≥ 300; Voices sentences said by
  every voice so the words do not reveal the talker; ≥ 20 recorded beds of ≥ 60 s.
- D5 Rotate the cast: players meet voices beyond the first six; the Voices goal becomes reachable. A voice heard
  often helps by about 10–17 points against a competing talker without the listener having to recognise it
  (Holmes 2018), so the cast's benefit is measured as familiar-minus-new voice accuracy at matched settings, both
  kinds interleaved, and is never gated on naming the voice.
- D6 Real-life bridges: missions beyond 8 (no loop at week 9), if-then plans (d ≈ 0.6 for health and personal goals
  outside student samples, no listening study yet, so a bet; Gollwitzer & Sheeran 2006), a three-tap "just now"
  diary, practice at asking for repair and other tactics (the ACE course improved self-reported everyday
  communication for six months; Hickson 2007), measured by the player's own goal rating.
- D7 Conversation (new exercise): two or three talkers take turns in party noise; follow who is speaking and answer
  gist questions; typed answers at the top.
- D8 Seek "Trace" board (bet): keep a finger on a hidden path along which the target voice is clearest, scored by
  tracking error (Seek's meter); a ratchet lowers the noise ceiling after each finished board and paths gain
  corners; the search board stays as the second game. Seek weeks for players who opt in, and the app says that
  1.0's Seek dose is far below the study's (median 35 h in 30–60-minute sittings; transfer followed the tracing
  game, which 1.0 lacks; Whitton 2017).

### E. Lab
- E1 An open-set check (type the sentence, natural held-out voices; the target's level rank roved from the start);
  E2 Two voices gets new sentences each week, and pooled data show whether its thresholds sit below 0 dB, where the
  quieter-voice cue could help; E3 response time on correct trials as a listening-effort trend (same device only);
  E4 a headphone spatial-release check: our sentences and voices with two same-voice distracters together with the
  target vs at ±90°, reported as the difference (difference scores barely move on retest; Cameron & Dillon 2011);
  probes also score whole sentences, where the one controlled transfer appeared (Whitton 2017); E5 probe items never
  repeat for a player (a repeated sentence list gained 2.7 dB from item learning, unique lists 0.3 dB; Yund & Woods
  2010); sentence probes count from the third run, digits from the second (Smits 2013), the first week's runs
  serving as practice; a real gain must exceed the ≈ 0.1–0.2 dB per session of procedural drift.

## 3. Milestones and acceptance checks
- M0 (1.0.1, small): C9 claim fixes; Crowd with one other voice floored at 0 dB target-to-masker ratio (until A1's
  roving lands) and the near-twin's direction drawn at random; guide fixes from the papers (Whitton's dose, what
  improved and the fade; the 40-point case is the same talker, cited directly; Far's growth described as growth in
  Earshot's rooms, with the Lab as the listening evidence); options after the sound (A2 core); "hear it again with
  the words" (A5). Check: unit + browser suites; a quieter-voice responder within chance + 0.05 in Crowd; fresh-player
  test of one exercise.
- M1 Engine: B1–B5, B9, B10 with the sim learners extended (daily dose threshold, random-mix penalty for
  confusable conditions, switch cost, stage gates in days, runs ≥ 5). Check: sims compare 1.0 vs 1.1 schedules; shortcut, memory and level responders within
  chance + 0.05 per bin.
- M2 Sound: A1 per-trial noise mixes and level roving; D1 lazy packs. Check: levels within 0.5 dB of plan; no bed
  heard on more than its planned share of trials; first session loads ≤ 4 MB on Pages; single file still
  offline-complete.
- M3 Content: D2–D5 packs, D4 pools, D6 missions; licence ledger. Check: recogniser pass on every clip; budget; no
  0.5-s stretch of a recorded bed heard more than 4 times per fortnight by a simulated daily player.
- M4 Answers: A4 typed answers (scorer with ≥ 200 test cases), A2 confusion-based options, A6 catch trials, A7
  strategy spotting. Check: scorer
  agreement with hand-scored cases ≥ 95 %; phone typing fits 360×640 with the keyboard open.
- M5 Game: C1–C8, B8. Check: calibration sims (level overclaim ≤ 5 %, non-learner PBs ≤ 10 % of sessions); no
  counters in a row anywhere; two-minute start unchanged.
- M6 Conversation exercise (D7), Seek Trace (D8) and Lab E1–E5. Check: two-minute start on a fresh agent; Lab sims.
- M7 Reviews (stimuli, play/a11y, fresh players, claims), fixes, guide 1.1, release.

## 4. Absorbed from the 1.0 backlog
Lazy packs (D1); natural non-native talkers (D2, AudioMNIST); measured rooms (D3); longer stories (E, if budget);
40 Piper voices (dropped: R9 finds talker count already above the useful floor); human difficulty ratings (B6 via
pooled exports); missing matrix words and Anouk's intro (done in 1.0).
