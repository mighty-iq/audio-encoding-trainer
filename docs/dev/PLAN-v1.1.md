# Earshot 1.1 — plan (draft for the owner's go; times UTC)

Status: draft 2026-11-28. Sources: docs/research/v1.1/R0 (internal audit), R7 (progression and variety dosing),
R8 (game features), R9 (anti-strategy, transfer, variety). The 1.0 backlog is absorbed in §4.

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
- A1 Fresh sound every trial (0 bytes): speech-shaped and modulated noise synthesised per trial (new seed), babble
  built live from training clips (1–8 talkers, mixed sexes, random offsets), reversed-speech maskers, beds; masker
  type logged and mixed (steady, modulated, 8-talker, 2-talker, one voice, environment). Target not always the
  loudest; lead-ins vary. Bet: maskers learned as types, not samples (Agus 2010; Van Engen 2012; Brungart 2001).
- A2 Hear first, then choose: options appear only after the sound ends in every exercise; sound-alike options in
  Strange and Repair; Repair's missing word anywhere in the sentence (now always last, 156/156).
- A3 Fresh items: least-heard-first sampling with a spacing window; a memory responder added to tests/sim; item
  pools 3–5× larger (needs D1/D4). Acceptance: replays of a known item ≤ 25 % of week-4 trials for a typical player.
- A4 Type what you heard: typed answers at the top level of Repair and Echo, a "Type it" round in Crowd, Far, Strange
  and Voices, and one open-set Lab check; forgiving scoring per keyword (non-word typos accepted, a different real
  word is wrong, homophones and number words count; Bosker 2021 fuzzy matching r ≈ 0.92 with human scorers). A
  Settings switch keeps taps only for players who cannot type comfortably.
- A5 Hear it again with the words: after every miss, the same mix replays with the words on screen (Davis 2005).
- A6 "Not there" trials (rare, ≤ 5 %) and occasional uncertainty about where or who the target is (bet; Kidd 2005).
- A7 Strategy spotting, never punishing: taps faster than the player's own guessing threshold are set aside, not
  scored; error profiles (intrusions, sound-alikes, wrong voice) feed tips between sets and plateau reasons.

### B. Progress that is real (progression)
- B1 Concentrated dose: a sitting trains ≤ 3 exercises with ≥ 2 sets each (≥ 40 trials), the others on other days;
  6–8 listen-only items right after a set count as half-trials (Wright & Sabin 2007; Wright et al. 2015).
- B2 Variety by readiness: blocked → announced alternation → random; the focus dial is held 5–6 trials; widening
  only when thresholds are flat or improving and the switch cost is ≤ 0.05; variety is paid for with easier settings;
  difficulty or variety rises, never both in one set (Nahum 2008/2010; Raviv 2022; Uchihara 2025).
- B3 Mastery across days: a condition counts as mastered after ≥ 2 days and a night, then returns in 10–15 % of
  trials for ≥ 4 training days (Wright, Wilson & Sabin 2010).
- B4 Plateau diagnosis before breakers: dose → schedule stage → anchors and listen-only → strategy → rest → switch the
  focus dial; at most one card per session; breakers get real levers (new material, a typed round, a new room set).
- B5 Raise ceilings: when a dial sits at its maximum (Repair 66–78 % of edge trials by week 8), combine conditions.
- B6 Calibration data: item, voice, condition, masker, planned accuracy and stage in every exported trial; offline item
  calibration from pooled exports, shrunk toward current offsets (weight n/(n+100)).
- B7 (optional bet) Seeded schedule assignment: blocked-first vs serial-first, recorded in the pooled export.

### C. Levels and tracking (game)
- C1 Earshot level: one number built only from confirmed ability marks (a mark counts once passed on two different
  days), never lost; a break widens an uncertainty band instead (Glicko-style). Levels never come from time spent.
- C2 Skill meters per family with a "next mark" bar, marks measured against the player's own start (everyone can
  earn them), an occasional "how sure were you?" tap (Long & Aleven 2013, 2017).
- C3 Honest start: the first week is "measuring your start"; personal bests and milestones only on the careful
  estimate (non-learners now get a PB in 67–98 % of sessions).
- C4 Seasons of about six weeks as chapters: a goal the player picks, a season card at the end; nothing resets or
  expires (Rodrigues 2022 novelty curve).
- C5 Weekly plan the player sets (e.g. four sittings) and a welcome-back gift after a missed week (a new voice or
  room); no counter of weeks in a row (Milkman 2021: +27 % for a small return bonus; Lally 2010).
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
  every voice so the words do not reveal the talker; ≥ 20 recorded beds.
- D5 Rotate the cast: players meet voices beyond the first six; the Voices goal becomes reachable.
- D6 Real-life bridges: missions beyond 8 (no loop at week 9), if-then plans, a three-tap "just now" diary, practice
  at asking for repair (Gollwitzer & Sheeran 2006; communication-strategy courses).
- D7 Conversation (new exercise): two or three talkers take turns in party noise; follow who is speaking and answer
  gist questions; typed answers at the top.

### E. Lab
- E1 An open-set check (type the sentence, natural held-out voices); E2 Two voices gets new sentences each week;
  E3 response time on correct trials as a listening-effort trend (same device only).

## 3. Milestones and acceptance checks
- M0 (1.0.1, small): C9 claim fixes, options after the sound (A2 core), "hear it again with the words" (A5). Check:
  unit + browser suites; fresh-player test of one exercise.
- M1 Engine: B1–B5 with the sim learners extended (daily dose threshold, random-mix penalty, switch cost). Check:
  sims compare 1.0 vs 1.1 schedules; shortcut and memory responders within chance + 0.05 per bin.
- M2 Sound: A1 synthesised maskers and roving; D1 lazy packs. Check: levels within 0.5 dB of plan; first session
  loads ≤ 4 MB on Pages; single file still offline-complete.
- M3 Content: D2–D5 packs, D4 pools, D6 missions; licence ledger. Check: recogniser pass on every clip; budget.
- M4 Answers: A4 typed answers (scorer with ≥ 200 test cases), A6 catch trials, A7 strategy spotting. Check: scorer
  agreement with hand-scored cases ≥ 95 %; phone typing fits 360×640 with the keyboard open.
- M5 Game: C1–C8. Check: calibration sims (level overclaim ≤ 5 %, non-learner PBs ≤ 10 % of sessions); no counters
  in a row anywhere; two-minute start unchanged.
- M6 Conversation exercise (D7) and Lab E1–E3. Check: two-minute start on a fresh agent; Lab sims.
- M7 Reviews (stimuli, play/a11y, fresh players, claims), fixes, guide 1.1, release.

## 4. Absorbed from the 1.0 backlog
Lazy packs (D1); natural non-native talkers (D2, AudioMNIST); measured rooms (D3); longer stories (E, if budget);
40 Piper voices (dropped: R9 finds talker count already above the useful floor); human difficulty ratings (B6 via
pooled exports); missing matrix words and Anouk's intro (done in 1.0).
