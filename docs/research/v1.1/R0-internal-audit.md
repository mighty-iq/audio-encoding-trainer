# R0 — Internal audit of Earshot 1.0 for 1.1 planning

Started 2026-11-28 16:37 UTC. Auditor: internal subagent, no web research. Evidence: code, data, simulations, reviews.
Source: working tree at commit 6059504 (`build`); line numbers refer to that tree; paths are repository-relative.
Status: complete (see the end). Ranked list at the end.

## Method and what the numbers are

- Read: js/engine (dials, learner, controller, planner, plateau, path, flow, score, items/*), js/game, js/ui/screens,
  js/ex (feedback), data/*.js, docs/dev (PLAN-v1.1, progress/engine.md, progress/game.md, reviews/*).
- Ran (scratch scripts outside the repository, read-only on the tree; outputs reproduced twice, identical):
  - `EARSHOT_CMUDICT=… node tests/sim/run.mjs` (10,000 seeds; 200 learners × 60 days × 4 modes).
  - `--modes edge --learners 60 --days 90 --dump` (a longer Edge run).
  - Item repetition with REAL generators: 24 simulated learners × 56 days, Edge, real planner/flow/controller and the
    real data build (no synthetic specs). A "memory responder" answers a trial from the answer it was shown for the
    same item before (feedback shows the answers), else guesses. Perfect memory: an upper bound. It is realistic for
    small pools (Far, Echo, Strange) and generous for Crowd's ~400 random call-sign triplets.
  - Game signals through tests/unit/game-calibrate.mjs `simulate()` (60 mixed learners × 56 days, Edge).
  - Pools per exercise and breadth from the engine's own index (items/data.js, items/adapt.js) on the real build.
  - Instrumented Edge runs (80 learners × 84 days, synthetic specs as run.mjs): saturation per dial, breakers per
    week, breadth at each breaker; first visible gain from the 90-day dump; weekly voice/item counts and met cast
    (real generators); a partial-listening check of 4-option slots with CMUdict phonemes; real-data shortcut checks
    (`run.mjs --real --skip-sim --skip-checks`, 10,000 seeds).
- Simulated learners (tests/sim/learners.mjs) are an engine-validation model: improver 60 %, early (stalls after
  ~2 weeks) 15 %, stalled 20 %, weak 5 %; their learning depends only on trial count, so the sim can show how the
  engine tracks and reports learning, never whether a breaker or variety helps a human.

## Material inventory (data/*.js, built 2026-11-27 00:55 UTC)

- 1,200 clips (928 train, 272 probe); 89 voices (70 train, 19 probe).
- Train clips by kind: phrase 589 (call-sign triplets 441, SUS 148), sentence 292, intro 38, bed 9; no train word,
  name, number or digit clips (so Voices' "one word" level and word-level material do not exist in training).
- Target-capable train voices: 57, all synthetic text-to-speech (Kokoro 37, Piper-LibriTTS 20). The 10 natural
  LibriVox readers (1 sentence each) only appear in babble; no natural human voice is ever a target in training.
- Per exercise (items × voices; every sentence item is spoken by ONE voice):

| Exercise | Items | Voices with items | Pool at breadth 0.2 → 0.5 → 1 (player order) |
|---|---|---|---|
| Crowd / Seek | 441 call-sign phrases (16 names × 125 words × 9 numbers; 2–20 per voice, median 5) | 52 | 14 voices / 126 phrases → 28 / 264 → 52 / 441 |
| Far | 37 sentences in 8 carrier frames ("I left the _ right next to the _" …), 37 clips | 18 | 7 voices / **14 sentences** → 11 / 22 → 18 / 37 |
| Strange, accent family | 89 accented SUS clips; 15 accented voices, 5 per tier, 4–8 clips each | 15 | tier 1: 2 voices / 12 clips; **tier 2: 1 voice / 7 clips**; tier 3: 2 / 12 → all tiers 5 / ~30 at breadth 1 |
| Strange, other 5 families | 59 SUS clips shared by fast, whisper, phone, muffled, vocoded | 20 | 6 voices / **17 sentences** → 12 / 36 → 20 / 59 |
| Repair | 156 sentences (76 high-, 80 low-context; 20 low-context frames hold 80 sentences) | 20 | 7 / 52 → 12 / 93 → 20 / 156 |
| Echo | 56 messages (3 details: 14, 4: 37, 5: 5) | 23 | all voices at every breadth (by design), but the level fixes the message count |
| Voices | 38 cast voices, ~558 utterances; 99 % of utterance texts are said by that voice only | 38 | met voices only (2 → 6 in the first sessions) |

- Rooms: synthetic only, 4 sizes, seeds 1–9999 (items/data.js:203-212); measured responses deferred (PLAN-v1.1).
- Recorded beds in training: 9 (café 1, hall 1, station 2, street 2, recorded babble 1, hum 1, synthetic party 1);
  babble beds are otherwise built from 6 (4–8 at wide variety) train sentences (items/data.js:187-199).
- Repair: the lost word is the LAST word in 156 of 156 items (key position 1.00), although items/repair.js:5 says
  "Variety: early or late lost words" and items/repair.js:50 filters for late words at low variety.

## A. Progression

### A1. How the engine moves (code)
- Edge holds ONE focus dial at p 0.72 and the other active dials at "comfort" (component 0.92) (js/engine/controller.js:1-9,
  dials.js:121). Each trial updates the focus dial's posterior only (learner.js:259-288).
- 29 % of trials are easy by design: anchors every 4th–5th trial and after two misses (p 0.90; controller.js:223,
  flow.js:114) = 18.4 %; warm-ups (first 2–3 trials of a set, new conditions; p 0.85) = 10.9 % (full sim, Edge).
- Dial choice inside an exercise: learning-progress bandit + uncertainty + staleness with 20 % random exploration
  (controller.js:145-155). What to train ACROSS exercises is not adaptive in Edge, Path or Variety: fixed weights
  crowd 0.20, far 0.22, strange 0.18, repair 0.12, echo 0.12, seek 0.08, voices 0.08, drawn without replacement per
  session (planner.js:13, 130-139). Only Focus (60 % of sets on the Lab's weakest probe) and plateau rests change it.
- Planner mix after the first week (15-minute sessions, 4,000 plans): Crowd in 85 % of sessions (≈ 92 trials a week at
  4.5 sessions), Far 87 % (78), Strange 83 % (74), Repair 69 % (68), Echo 69 % (31), Seek 53 % (14), Voices 54 % (54).
- Variety ("breadth") starts at 0.2 and moves +0.1 when the last 20 edge trials average ≥ 0.75, −0.15 below 0.55
  (learner.js:293-302). Because edge trials are planned at 0.72 and the observed edge accuracy is 0.75 (estimates lag
  real learning), the rule drifts upward for everyone: breadth means (Edge sim) w1 0.41, w2 0.57, w4 0.78, w8 0.92 for
  improvers and w1 0.38, w2 0.56, w4 0.80, w8 0.90 for STALLED learners. Variety is maxed in 4–6 weeks whatever the
  skill, so it is a clock, not a skill signal, and leaves no headroom later.

### A2. How fast a simulated learner shows progress
- Estimate vs truth (mean change of each exercise's index since the first session, dB-equivalent, improvers n = 47):
  w1 crowd +0.4 (true +0.5), far +0.5 (+0.3), strange +0.1 (+0.3), repair +0.1 (+0.2), echo −0.1 (+0.1); w4 crowd +2.1
  (+2.7), far +1.5 (+1.9), strange +0.7 (+1.6), repair +0.6 (+1.3), echo 0.0 (+0.5); w8 crowd +3.9 (+4.7), far +2.8
  (+3.4), strange +2.0 (+2.9), repair +1.7 (+2.6), echo +0.5 (+1.1). Displayed gains trail true gains by 20–55 %,
  most in Strange, Repair and Echo (many dials share few focus updates).
- First visible gain (index ≥ +1 dB-eq over the first session's, held for 3 sessions; 90-day Edge run, 60 learners):

| Exercise | Improvers: by day 14 / by day 30 / median day | Stalled learners (no true change) showing a "gain" by day 30 |
|---|---|---|
| Crowd | 66 % / 88 % / day 11 | 11 % |
| Strange | 38 % / 56 % / day 20 | 56 % (by day 7: calibration of new families) |
| Repair | 16 % / 50 % / day 24 | 0 % |
| Far | 41 % / 50 % / day 26 | 33 % |
| Echo | 16 % / 44 % / day 26 | 11 % |
| Voices | 19 % / 47 % / day 29 | 0 % |
| Seek | 9 % / 9 % / day 44 (47 % ever) | 33 % |

  Only Crowd shows a gain inside two weeks for most improvers; elsewhere the first robust gain takes 3–6 weeks, and
  in Strange, Far and Seek non-learners see "gains" about as often as learners in the first month.
- Weak learners (5 %): the estimated index FALLS 3–5 dB-eq over weeks 1–2 while the truth rises (+0.1–0.2): the
  estimate is calibrating down from the population prior, and every chart is relative to that prior
  (flow.js:21-32), so a weak beginner's first weeks read as decline.

### A3. Where plateaus come from
- Dial ceilings. Share of edge trials whose focus dial is already at its hardest level (improvers + early, 80 learners
  × 84 days): weeks 1–2 / 4 / 8 / 12 — Repair 33 / 43 / 66 / 78 %, Voices 38 / 33 / 39 / 51 %, Crowd 22 / 38 / 45 / 40 %,
  Strange 3 / 16 / 22 / 31 %, Echo 0 / 4 / 17 / 33 %, Far 2 / 5 / 8 / 15 %, Seek 0 / 0 / 2 / 6 %. Top dials: repair.fill
  87→97 % (4 levels), repair.context 56→91 % (the data have only "hi" and "lo" items, so 2 of its 3 levels exist),
  crowd.talkers 58→90 % (max 3 other voices), voices.length 99 % (no word clips exist: the dial changes nothing),
  voices.similar 99→82 % (3 levels), echo.delay 75 % by week 12, crowd.space 68 %. Even stalled learners hit
  repair.fill/context and voices.length/similar ceilings in week 1.
- In Strange each family is a single 6–8-step ladder: 22 % of Strange edge trials at week 4, 31 % at week 8 and 42 % at
  week 12 sit at the TOP of their family with nothing left to raise (14 % planned above p 0.80 by week 12).
- Path mode ends: mean step reached after 60 days crowd 24.2/28, repair 16.4/18, voices 16.6/19, strange 33.2/41 (full
  sim); the last step repeats forever (path.js:107-109) and the results card offers Edge.
- Material exhaustion (section C2): by week 4, 77–99 % of Far, Strange, Repair and Echo trials replay an item already
  heard, so level gains increasingly mix listening with recall.

### A4. Plateau detection and breakers
- Earliest call at the 13th session with an exercise (window 10 + persist 4; plateau.js:34). At 4.5 sessions a week
  that is week 3.3 (Far, Crowd) to 5.5 (Seek); first breaker per (learner, exercise) median week 7.
- Detection (full sim): Edge 74.7 % of truly flat stretches, false alarms 6.1 %, latency median 9 / p90 18 sessions
  with the exercise; Path 68.1 %; Variety 82.2 %; Focus 48.9 % (its other exercises get too few sessions).
- Volume: breakers per learner and week, weeks 5–12: improvers 1.4–2.2, stalled 3.4–6.8 (≈ one plateau card in most
  sessions for a stalled player; 45.8 breakers in 12 weeks).
- What breakers change: variety (+0.3 breadth), focus (force the least-used dial for 30 trials), anchors (gap ≤ 2 for
  40 trials), strategy (a card), sleep (same-day only), switch (draw weight × 0.2 for three sessions)
  (plateau.js:170-180). None changes the material, the task or the dial ranges.
- The most frequent breaker is mostly a no-op: 540 of 1,643 firings were "variety"; breadth was ALREADY 1.0 in 66 % of
  them and rose < 0.15 in 70 % (mean breadth before 0.86), yet the text promises "Next sets bring in more voices, rooms
  and noises" (plateau.js:151, 175). That text is false two times in three (an S1-type claim under the rules).
- The simulated learners cannot respond to a breaker (their learning depends on trial count only), so 1.0 has no
  evidence that any breaker helps; the log could test it (A/B by breaker order) once pooled exports exist.

### A5. After the first week and after a month (Edge, simulated improver)
- Week 1: every exercise met by session 3 (100 %), ≤ 3 new a session; breadth 0.41; ~10 milestones; PB in 97 % of
  sessions; index gains < 0.5 dB-eq except Crowd.
- Month 1: breadth ~0.8 (no variety headroom left); 16–38 % of Crowd/Repair/Voices edge trials on a topped-out dial;
  first plateau cards; most Far/Echo/Strange items heard 3+ times; venues: median 7 of 12 open by day 30.
- Month 2–3: breadth 0.92–0.95; Repair 66–78 % at ceiling, Strange 31–42 % of trials at the top of a family; breakers
  ~2 a week, two thirds of the "variety" ones change nothing; Path players reach the end of most paths.

## B. Game and tracking

### B1. What the player sees (js/game, js/ui/screens)
- Between sets: "N of M right", ✓/✕ glyphs, end levels of up to three dials in units, news (PBs, milestones, venue
  openings, cast), plateau card, Chimera invitation (js/ui/screens/results.js:79-116).
- Home: session start, a weekly ring of five segments ("four or five sessions make a good rhythm"; resets weekly,
  never punishes: js/ui/widgets.js:24-47), the Lab card, the overnight/fresh-ears card, the weekly challenge, the
  mission, the next venue (js/ui/screens/home.js).
- Progress: one chart per dial with data, up to 29 charts (32 with headphones), "Now … · best … · N sessions", then
  milestones and weekly nights (js/game/screen-progress.js). No per-exercise summary line, no overall level.
- There is NO player level, rank, XP or single headline number anywhere. Growth is spread over 12 venues (3 lines),
  ~80 dial milestones (crowd 15, far 11, strange 19, repair 7, echo 10, seek 9, voices 7) plus cast and line
  milestones (js/game/milestones.js:17-49), per-dial PBs and per-dial charts.

### B2. Growth signals over time (game-calibrate simulate(), 60 mixed learners × 56 days, Edge)

| Signal | Improvers (n 39) | Stalled, no true learning (n 11) |
|---|---|---|
| Sessions with a personal best, w1 / w2 / w4 / w6 / w8 | 97 / 98 / 88 / 88 / 87 % | 98 / 89 / 82 / 67 / 36 % |
| Milestones (median, cumulative) by day 1 / 7 / 14 / 30 / 56 | 4 / 10 / 16 / 23 / 30 | 4 / 11 / 16 / 20 / 22 |
| Venues open of 12 (the 3 start venues included), by day 1 / 7 / 14 / 30 / 56 | 3 / 4 / 5 / 7 / 9 | 3 / 5 / 6 / 6 / 7 |
| Sessions with no news at all (no PB, milestone or opening), w1 / w4 / w8 | 1 / 9 / 9 % | 2 / 11 / 64 % |

- PBs fire on estimate noise: the rule is "posterior mean ≥ 0.10 logit beyond the stored best" (flow.js:162-169), far
  inside the posterior's own spread (median calibration error 0.31 logit); for five weeks a non-learner gets a PB in
  67–98 % of sessions. Milestones in weeks 1–2 measure calibration (the careful claim m − 1.28 SD rises as SD shrinks),
  so learners and non-learners collect the same 16 by day 14. Honest per number, but the sum says "you improved" to
  everyone in the first month, and the signal then dries up for real learners too (2–3 milestones a week, ~0.5
  venue openings a week after week 2).
- Venue openings for an improver: about one every 1–2 weeks after the first week (table above; game.md fix round 2:
  median 8 of 12 open at day 41; club 38 %, stadium 35 %, concert 25 %, cathedral 23 % of learners by day 41). A
  stalled learner opens almost as many by day 14 (6 vs 5): openings also track calibration first.
- Cast: the Voices generator meets new voices only while met < max(2, cast-dial size ≤ 6) (js/engine/items/voices.js:55).
  Measured: median 4 voices met in week 1, 5 by week 4, 6 by week 12, never more than 6 of the 38 cast voices. So the
  "You know 10 voices" and "You know 20 voices" milestones (js/game/milestones.js:49, 154-158) are unreachable, the
  Cast gallery stays mostly unknown, and the Voices bet "meeting many new voices makes you quicker at learning the next
  one" (js/ex/voices.js:40) is not what the engine does.
- Voices "one word" level: no train word clips exist, so length level 2 plays phrases or sentences (812 of 8,629 "who"
  trials in the repetition run); the milestone "A voice from one word" (milestones.js:47) can be awarded for phrases.

### B3. Reasons to come back tomorrow
- Daily: only the overnight check (the day's first set re-tests the last day's hardest condition with other voices)
  and fresh ears after ≥ 2 days away (planner.js:49-88). Nothing new appears on a given day otherwise.
- Weekly: the seeded Night Out (4 stops × 6 trials, identical for everyone; no leaderboard), one mission a week
  (8 missions, so they repeat from week 9: js/ex/missions.js:22-46), the weekly ring.
- Unlocks: venues (sparse after week 2), milestones (2–3 a week later on), cast (capped at 6 known).
- Missing: a daily seeded challenge, a visible long arc (season, story, rank), collections that keep growing, any
  social comparison beyond the weekly card, and surprise (new content). The streak-free rule is respected.

### B4. Where the game layer is thin
- No single level or rank to grow; growth lives in up to 32 small charts and ~80 milestones.
- Signals are front-loaded and noise-driven in month 1, sparse in month 2+.
- The map's 12 venues are dial settings, not places with their own content: the same items play in every venue.
- Two playtest reports reached the owner's private database so far; both record no answered trial (audio never
  started): no human fun rating of the real audio exists yet.

## C. Strategy and transfer

### C1. Option-only cues: closed (verified)
- Real build, 10,000 mixed seeds (`run.mjs --real --skip-sim`): solver 0 failures in all 7 generators; option-only
  responders (first, last, most frequent, seen, most different, most typical, phonetic hub, longest, shortest,
  heard-word) within chance + 0.04 overall everywhere; flagged bins: Echo "most frequent past answer" 0.29 vs 0.256
  overall (4 of 17 bins: details 1–2, delay 3, snr ~0; worst +0.048), Strange 1/43 (muffled 6, "seen"), Seek 1/20.
  Answer positions unbiased. 1.0 did this part well.
- The responders see only the prompt and options (tests/sim/shortcuts.mjs:1-5). None remembers an ITEM's answer,
  and none listens partially, so the two largest remaining shortcuts below are invisible to the suite.

### C2. Item memory: the largest open shortcut (real generators, 24 learners × 56 days, Edge)
Share of trials whose item (same sentence, message or clip) was heard before with its answer shown, and the accuracy
of a perfect-memory responder that answers from that memory and otherwise guesses (chance 0.25; Voices 0.37–0.46):

| Exercise | Repeats w1 → w2 → w4 → w8 | Memory responder w1 → w4 → w8 | Distinct items heard by w1 / w2 / w4 / w8 |
|---|---|---|---|
| Far | 79 → 90 → 99 → 100 % | 0.85 → 1.00 → 1.00 | 24 / 34 / 37 / 37 |
| Echo | 54 → 91 → 96 → 97 % | 0.57 → 0.79 → 0.80 | 13 / 15 / 15 / 25 |
| Strange | 50 → 74 → 88 → 96 % | 0.63 → 0.91 → 0.97 | 47 / 74 / 93 / 114 |
| Repair | 42 → 62 → 77 → 92 % | 0.56 → 0.83 → 0.94 | 39 / 70 / 94 / 147 |
| Voices | 36 → 62 → 81 → 94 % | 0.65 → 0.87 → 0.96 (chance 0.46 → 0.38 → 0.37) | 31 / 51 / 76 / 105 |
| Crowd | 28 → 40 → 58 → 83 % | 0.46 → 0.68 → 0.87 | 94 / 163 / 268 / 381 |
| Seek | 4 → 18 → 35 → 38 % | 0.29 → 0.51 → 0.57 | 17 / 29 / 51 / 96 |

- Why recall is easy: one key fixes the other in 97 % of Far sentences (37 sentences, 8 carrier frames such as "I left
  the _ right next to the _"); in SUS, subject + verb fix the object in 95 % (141 pairs); one Echo detail identifies
  its message in 50 % (3-detail), 22 % (4-detail), 80 % (5-detail); every high-context Repair frame fixes its word
  (by design) and the lost word is always the sentence's last; FRESH-A saw Echo answers "come from memory of earlier
  trials" by trial 5 (since eased within a set, not across sets).
- Voices: 99 % of utterance texts are said by one cast voice only, so "Who is talking?" can be answered from the words
  (the memory responder's 0.87 vs 0.38 chance by week 4).
- Consequence: from week 2–4 on, level gains in Far, Echo, Strange, Repair and Voices can come from recall of the
  item, which inflates the training index and plateaus nothing visible (the Lab probes use other items and voices).

### C3. Partial listening: what a 4-option slot demands (real generators, 2,500 random-level trials each)
Expected accuracy of a listener who catches only one fragment of the answer word (unique share among the options):

| Exercise | Onset (first phoneme) | Stressed vowel | Rhyme (stressed vowel → end) | Syllable count |
|---|---|---|---|---|
| Crowd | 0.88 (76 %) | 0.82 (66 %) | 0.95 (90 %) | 0.25 |
| Far | 0.85 (71 %) | 0.80 (60 %) | 0.94 (88 %) | 0.25 |
| Seek | 0.88 (77 %) | 0.81 (63 %) | 0.94 (88 %) | 0.25 |
| Strange | 0.93 (85 %) | 0.77 (59 %) | 1.00 (99 %) | 0.25 |
| Repair | 0.90 (82 %) | 0.88 (76 %) | 1.00 (100 %) | 0.57 (25 %) |

- The options are on screen (disabled) WHILE the sound plays in every exercise except Echo (js/ui/trialview.js:97-99;
  css/screens.css:164 hides them only for a question delay). The player listens for four known words, and one
  fragment usually decides. Strange and Repair options are almost never sound-alikes (their words have no neighbour
  lists), so a rhyme or an onset alone is enough in 82–100 % of slots. Thresholds are therefore 4AFC-with-preview
  thresholds, easier than understanding the same speech open-set.
- Crowd's masker words are options (intrusions are scored), which keeps its attribution demand real.

### C4. Predictable structure and positions
- Crowd: every phrase is [call sign, word, number] (CRM-like); all talkers start within ±0.25 × breadth s
  (items/crowd.js:137-141); > 80 % of trials are cued by the call sign (preview 20 % only at breadth ≥ 0.5, location
  15 % with headphones); numbers are 1–9.
- Far: a carrier sentence, then the target; 8 carrier frames; the two asked words sit in fixed frame positions.
- Repair: the lost word is the final word in 156 of 156 items (key position 1.00), so the gap's timing is known.
- Echo: 56 messages from 8 templates of 5–8 messages each ("Message from Charlie. Your table for eight is booked for
  Monday at noon.").
- Seek: the start point is fixed (bottom centre); positions are random.

### C5. Closed set vs open set
- Closed set everywhere: 4 options per slot (Crowd, Far, Strange, Repair, Echo, Seek's word), 2–6 names (Voices),
  locate within a radius (Seek). No exercise asks for an open response (typing, speaking, free recall), and no Lab
  probe is open-set either.
- Distance from real conversation: targets are 100 % synthetic text-to-speech (57 voices; natural readers only in
  babble); utterances are short (call-sign phrases 1.5 s, sentences 2.7 s, Echo messages 4–5 s); no turn-taking,
  topic, talker changes or faces; the "accent" family is other-language TTS voices reading US-English phonemes
  (RV-stimuli ST-08); rooms are synthetic; audio is 16 kHz, 24 kbps (data/manifest.js header).
- Bridging exists (missions, diary, Echo's real-life messages, strategy cards), but it is weekly text, not practice.

### C6. Transfer bets as built
- Each exercise names its bet in js/engine/items/*.js headers and the views. Gaps between bet and build: Voices bets on
  meeting many voices, but at most 6 are ever met (B2); Strange bets on adapting to new voices, but the accent family
  has 7–12 clips at a tier at low variety (D); Far bets on room adaptation across many rooms (49–76 room seeds a week,
  good) but on 37 sentences; Repair claims early and late lost words, but all are final.

## D. Variety

### D1. A typical week (median learner-week, Edge, real generators, 24 learners × 56 days)

| Exercise | Trials | Target voices | Busiest voice | Distinct items | Most repeated item | Other measures |
|---|---|---|---|---|---|---|
| Crowd | 96–120 | 26–39 | 7–14 trials | 79–87 | 2–3× | 4–5 bed kinds, 29–49 masker voices |
| Far | 60–80 | 11–18 | 7–15 | 21–34 | **4–10×** | 49–76 room seeds, 3–4 bed kinds |
| Strange | 60–80 | 14–24 | 6–12 | 39–48 | 4–5× | 2 bed kinds |
| Repair | 66–88 | 9–20 | 7–9 | 32–55 | 3–4× | no background noise at all |
| Echo | 20–30 | 7–8 | 5–6 | **13–14** | 2–3× (same voice too) | 1–3 bed kinds |
| Seek | 6–12 | 6–10 | 2–3 | 6–12 | 1–2× | 5–7 decoy voices |
| Voices | 40–66 | **4–5** | 10–18 | 28–38 | 3–4× | met cast never above 6 of 38 |

### D2. Where variety is thin and where it is fine
- Thin in ITEMS: Far (37 sentences = 80 s of speech in all; 14 sentences at breadth 0.2), Echo (56 messages, 13–14 a
  week), Strange (accent tier 2 = 1 voice / 7 clips at breadth 0.2; 89 accented clips in all; the other five
  families share 17 → 59 sentences), Repair (one gap position), Voices (≤ 6 voices). Total training speech in 1.0 is
  ~31 minutes (data/packs.js durations, probe pack excluded).
- Thin in TALKER TYPE: all targets synthetic; accents synthetic; talker age is neither varied nor recorded (no age field
  on any train voice); one French voice.
- Thin in SCENES: 9 recorded beds, 4 room sizes, Repair without noise, Strange's families one at a time (no
  combinations such as fast + phone or accent + room).
- Fine: Crowd's voices and maskers (26–39 targets a week), Far's room seeds, Seek's scenes, option balance.
- The breadth dial is not the bottleneck: it reaches 0.8 by week 4 for every player (A1). "More variety" in 1.1 means
  more material and more combinations, and a breadth rule that tracks skill, not more breadth.
- Is more variety good here? On internal evidence: yes where it removes recall (C2) and the content→voice shortcut,
  and where it adds talker types the owner cares about (real accents, real voices, distance + noise + crowd at once).
  The low start (breadth 0.2, blocked family starts, warm-ups for new conditions) is the part to keep, so early
  sessions stay learnable. The sim cannot say how much variety slows early learning; the log could.

## E. Other

- Load: index.html loads all 10 packs as script tags before the app runs (index.html:48-57): 11.03 MB of base64
  (data/packs.js), of which the Lab-only probe pack is 2.88 MB (26 %). A first session needs about starter + far +
  strange + babble + beds = 3.74 MB. Single file 12.98 MB vs the 12 MB goal (STATE.md).
- Deferred in docs/dev/PLAN-v1.1.md: lazy packs; AudioMNIST training digits; speechocean762 accented speech; measured
  rooms; 45–60 s stories; 40 Piper voices for bulk renders; human-rated difficulty; two missing matrix words; natural
  non-native talkers and a second French voice.
- Review items left open: ST-06 one talker per probe (Matrix and Rooms all af_kore; New voice bm_lewis), so probe
  gains may be talker-specific; RV-claims C14: the Two voices probe reuses 12 CREMA-D sentences every week (item
  learning can pass for gain); ST-08 synthetic accents; ST-09 size; ST-15 speaker ids in voice ids; engine open issues
  (Strange text-first aid trials not built; Voices length dial without effect; Echo 5-detail level has 5 messages).
- Path: no anchors at all (anchors 0 %), calibration median 0.44 logit (p95 1.59; 150 dials > 1.5) vs 0.31 in Edge,
  planned p 0.664 vs observed 0.724 (full sim): Path's pinned steps update the primary dial only.
- Echo's residual frequency cue (+0.03 overall) and Seek's "0 of 6 right" scoring (FRESH-B C2) are small.
- Missing exercise ideas (none in 1.0): open-set report (type or speak the words; fuzzy scoring), conversation
  following (two or three talkers taking turns, talker switches, gist and "who said what"), real recorded scenes,
  combined scenes (crowd + distance + echo in one trial, as the venues imply), natural accented talkers, speech in
  modulated noise as a dial (glimpsing), audiovisual cues (a face; costly), the player's own recorded voices beyond
  Voices' "add a voice" (js/ex/voices-own.js).

## Ranked improvements (15)

Ranked by value for the owner's goals (loud places, distance, unusual speech first; then fun and visible progress),
with rough cost: S = days, M = about a week of build and verification, L = new material or a new exercise.

1. **Fresh items instead of recall** (C2, D1–D2). Problem: by week 4, 77–99 % of Far, Echo, Strange and Repair trials
   replay a heard item; a perfect-memory responder scores 0.80–1.00 there (Voices 0.87); Far has 37 sentences (14 at
   breadth 0.2), Echo 56 messages (13–14 a week). Change: (a) S: a per-player exposure count with least-heard-first
   sampling and a cool-down, plus an item-memory responder in tests/sim (gate: memory responder ≤ chance + 0.05 by
   week 4); (b) L: combinatorial renders (Far frames × noun pairs, Echo templates × slot values, more SUS per accented
   voice, Repair sentences) so pools reach several hundred items per exercise. (b) needs item 11 for the budget.
2. **Listen first, then choose; add an open-set step** (C3, C5). Problem: options are visible during the sound in six
   exercises; one fragment (rhyme or onset) decides 85–100 % of slots, and in Strange and Repair the options are
   almost never sound-alikes. Change: hide options until the sound ends (Echo's mechanism) as the default or as a dial
   level; sound-alike foil sets for SUS and Repair words; an open-set top level per ladder (type the words, fuzzy
   match, γ ≈ 0). Cost M.
3. **Raise the ceilings and combine conditions** (A3). Problem: Repair 66–78 % of edge trials on topped-out dials by
   weeks 8–12, Crowd 40–45 %, Voices 39–51 %, Strange 31–42 % at the top of a family. Change: Crowd up to 5–6 other
   talkers and the bed level as a dial; Repair gaps at any position, a background-noise dial, two lost words, a real
   middle context level; Echo longer delays with a filler task and 6–7 details; Strange top tiers that combine
   families (fast + phone, accent + babble + room); Voices "few words"/"one word" cuts from word times. Cost M.
4. **Fix claims the code does not keep** (A4, B2, C6). The variety breaker promises more variety but breadth was
   already 1.0 in 66 % of firings; "You know 10 / 20 voices" is unreachable (≤ 6 voices ever met); "A voice from one
   word" can be awarded for phrases (no word clips); Repair "early or late lost words" (all final); Voices' bet on
   meeting many voices. Change: guard texts and milestones by what the build and state can deliver. Cost S.
5. **Honest early growth** (A2, B2). Problem: PBs fire in 67–98 % of a non-learner's sessions for five weeks (rule
   0.10 logit inside a 0.31-logit error), milestones are equal for learners and non-learners to day 14, weak
   beginners see their index fall 3–5 dB-eq, and in Strange, Far and Seek non-learners show a +1 dB "gain" by day 30
   as often as many learners. Change: a "measuring your start" phase per exercise, progress relative to the player's
   own first-week level, PBs on the careful side (claim beats the best claim), and one summary line per exercise. S–M.
6. **Real voices and real accents as targets** (C5, D2). Problem: 57 of 57 target voices are synthetic; the accent
   family is other-language TTS reading US-English phonemes, 7–12 clips per tier at low variety. Change: the
   PLAN-v1.1 items (natural L2 talkers, AudioMNIST training digits, a second corpus), natural readers as targets, and
   at least two voices per accent with ≥ 20 clips each. Cost L (licences and access first).
7. **A growth spine: level or rank plus an arc** (B1, B4). Problem: no level, rank or headline number; growth is
   split over up to 32 charts and ~80 milestones; news dries to 2–3 milestones and < 1 venue a week after month 1.
   Change: one "earshot" rank from the careful claims across exercises (never falls on absence), named tiers that map
   to venues, and a season of venue content. Cost M.
8. **Plateaus: fewer cards, real levers, measured effect** (A4). Problem: breakers start in week ~7, come 1.4–2.2 a
   week for improvers and 3.4–6.8 for stalled players, and none changes material or task. Change: at most one
   plateau card per session (grouped); breakers that switch item pools, add a combined condition, or move to the
   open-set step; log breaker kind and outcome in the pooled export so breaker order can be tested. Cost M.
9. **Breadth that tracks skill** (A1). Problem: breadth reaches 0.8 by week 4 for stalled and improving learners
   alike (upward-biased rule at 0.75 vs a 0.72 target). Change: widen on accuracy with first-exposure items or
   voices at the edge, narrow on misses there; let breadth go beyond 1.0 into new pools and combinations. Cost S.
10. **Voices: an open cast and content-neutral clips** (B2, C2). Problem: ≤ 6 of 38 cast voices are ever met, 4–5
    a week; 99 % of utterance texts belong to one voice, so the words name the talker. Change: rotate in a new voice
    every few sessions and retire known ones; render a shared sentence set for every cast voice and use only shared
    texts in "Who is talking?". Cost M (renders).
11. **Lazy sound packs** (E). Problem: 11.03 MB of packs load before the app starts; the Lab-only probe pack is 2.88 MB;
    a first session needs ~3.7 MB. Change: load packs per exercise and the probe pack on the Lab's first use (also
    frees budget for item 1). Cost M.
12. **A reason to open the app tomorrow** (B3). Problem: daily novelty is only the overnight re-test; the weekly Night
    Out and 8 missions repeat on a weekly clock. Change: a seeded daily one-minute "tonight's table" with a share card
    (no streak, no penalty), venue scenes with their own content, and a mission pool that does not loop at week 9. M.
13. **Allocate sessions by learning, not fixed weights** (A1, A2). Problem: weights are fixed (Seek 14 trials a week,
    first visible gain day 44; Echo 31 trials); only Focus mode reacts to the Lab. Change: an exercise-level
    learning-progress bandit with the owner's priorities as the prior and the Lab's weakest probe as a bonus. Cost M.
14. **Measurement that can show carry-over** (E). Problem: Matrix and Rooms run on one talker, New voice on another;
    Two voices reuses 12 sentences weekly; no probe is open-set while all training is closed-set. Change: 2–3 probe
    talkers per probe, fresh Two-voices items, and one open-set sentence probe. Cost M.
15. **A conversation exercise** (C5, E). Problem: no trial has turn-taking, talker switches, topic or gist; Crowd is
    CRM-like and Echo one talker. Change: short two- or three-talker exchanges in party noise at a distance, with
    "who said what" and gist questions, built on items 1 and 6. Cost L.

Not ranked but urgent as process: no human has played the real audio yet (both playtest reports: no answered trial),
so fun and clarity are unverified; every change above should ship to a test build with playtest mode on.

Status: COMPLETE (2026-11-28 UTC). Scratch scripts and outputs stayed outside the repository.
