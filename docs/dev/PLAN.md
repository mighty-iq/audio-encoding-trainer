# Earshot — plan (draft for the owner's go; times UTC)

Status: DRAFT, 2026-11-26. Becomes the approved plan when the owner says go (answers on the decision board).
Evidence: docs/research/R1–R6. Claims below cite the note that holds the source and its reading depth.

## 1. Concept
Real conversations fail in three ways: other voices bury the one you want (informational masking), distance and
echo smear it, or the talker sounds unfamiliar. Earshot trains each with short closed-set trials that adapt on
several dials at once (crowd level, voice similarity, talker count, spatial separation, distance, echo, degradation
severity), widens the variety of talkers, rooms, noises and words as the player succeeds, and gives informational
feedback after every trial (target alone, then the mix again; which voice you followed). Untrained probes with held-out
voices, natural recordings, new rooms and new formats measure carry-over weekly with a personal trend and its margin.
The game layer is a night out (venues, a cast of voices, growth in real units, a weekly seeded challenge), with no
streaks and no score on screen during trials.

## 2. Target ability and carry-over targets
- Trained ability: recognising words spoken by one talker when they are masked by other talkers and noise, degraded
  by distance and rooms, or produced in unfamiliar ways; and holding them in mind long enough to use them.
- Near: same formats with new talkers, words and rooms. Mid: untrained formats and materials (natural-voice digit
  triplets in steady noise; natural sentences against two talkers; measured rooms never trained; a degradation family
  never trained). Far: listening comprehension of a passage in café noise; everyday listening diary; strategy use.
- Real-life skills aimed at: parties, bars and restaurants; across a room, hall, station or outdoors; accented, fast,
  soft or mumbled talkers; phone and video calls; remembering names, numbers and plans heard in noise.

## 3. What research says (decision-relevant; details in the notes)
- Computer-based auditory training: on-task learning is robust; transfer is small and inconsistent; randomised,
  blinded or high-quality studies show about zero effect on speech-in-noise thresholds (R1: Fallahnezhad 2023 [full],
  Henshaw & Ferguson 2013 [full]). Failure modes to design around are listed in §4.
- Large independent trials were null against placebo (Saunders 2016, n = 279 [abstract]); small positive trials faded
  within weeks (Whitton 2017 [news release]; Lelo de Larrea-Mancera 2022 [full]; Anderson 2013/2014 [full]). Transfer was
  likelier when training ran in noise or competition close to the outcome, used several talkers or accents, kept
  difficulty within reach and totalled ~12–40 h (R1). Existing apps measure no untrained outcome, use no alternate
  forms, export nothing and mostly set difficulty by hand; the field's innovation is training on a partner's voice (R1).
- Unusual talkers: exposure to several accents generalised to a new accent (Baese-Berk 2013 [full], n = 10/group); a
  talker at ~55 % intelligibility produced no adaptation (Bradlow 2023 [full]); blocked practice beat interleaved for
  a hard new contrast and weaker learners were hurt most by interleaving (Fuhrmeister & Myers 2020 [full]); practice
  alternated with passive exposure matched continuous practice (Wright 2015 [abstract]); speaking a sound right after
  hearing it abolished learning (Baese-Berk & Samuel 2022 [full]) (R1, R2).
- Informational masking dominates multi-talker listening; same-sex and same-voice maskers are far harder; two-talker
  maskers are hardest for sentences (R3). Training reduces it but specifically to the trained masker language/talker
  (Van Engen 2012 [full]) → masker variety is the design response.
- Spatial release works with generic HRTFs over headphones; ILD alone gives most of it; ±15° gives large release
  against intelligible maskers; head turning is worth up to 8 dB and half of listeners never turn (R3).
- Rooms: prior listening in the same room helps (Brandewie & Zahorik, abstract); implicit training across three rooms
  carried to untrained rooms, one room did not (Vlahou 2019 [full]) (R3).
- Dip listening and interrupted speech improve fast; interrupted-speech training with clear-then-degraded feedback
  transferred across gap types and held ~3 months (Benard & Başkent 2013 [full]); text before degraded audio speeds
  learning (Sohoglu & Davis 2016 [full]) (R3).
- Voice familiarity builds in 10–60 minutes (Holmes 2021 [full]); a familiar masker gives no benefit (R3).
- Music training and pitch-discrimination training: weak or null for speech in noise (R3) → not used.
- Progression (R5): staircases (2-down/1-up 70.7 %); engagement best around 65–75 % success; consecutive errors
  raise quitting; many easy trials improve transfer (Hung & Seitz 2014 [full]); easy-to-hard beats hard; on-screen
  score and lives cut n-back gains (Katz 2014 [full]); informational feedback helps motivation; ~8-minute blocks learn
  fastest per trial (Molloy 2012 [full]); same-day repetition degrades and sleep restores (Mednick 2002 [full]);
  talker variability helps strong learners and can hurt weaker ones, blocking fixes it (Perrachione 2011 [full]);
  variability slows early learning and widens generalisation (Raviv 2022).
- Measurement (R4): matrix-style closed-set sentences in steady speech-shaped noise retest SD 0.5–0.6 dB;
  digit triplets ~0.7–1 dB in 3 min; practice effects concentrate in the first 1–2 runs; fluctuating maskers learn
  fast and are volume-sensitive without calibration; reliable change = 2.77 × SD (÷√k for k averaged runs).
- Stimuli and licences (R6): only GitHub/PyPI/npm hosts are reachable; clean sources listed in §10.

## 4. Failure modes of earlier trainers and our response
| Failure mode (R1, R3, R5) | Response in Earshot |
|---|---|
| Fixed materials and talkers → item and talker learning | Thousands of voice×word tokens, held-out voices and words for probes, widening variety |
| Gains specific to the trained masker | Masker variety: talker count, sex, voice, language-like babble, ambiences, rooms |
| Generic training not aimed at the person's weak spot | Focus mode targets the weakest probe condition; per-dial thresholds show the profile |
| Outcomes measured on trained tasks only | Near/mid/far probes with untrained formats and natural voices |
| Practice effects mistaken for gains | Practice runs before baseline; alternate forms; trend with error margin |
| Low adherence | Short sets, game layer, no punishment for missed days, return bonus |
| Too hard, too long, too monotonous | 70–75 % edge trials mixed with easy anchors; ~3-minute sets; four modes |
| Points and lives during trials hurt learning | Results only between sets; growth in real units (dB, m) |
| Too little dose (4 days gave nothing) | A suggested programme of ~15 min, 4–5 days a week for 8–10 weeks (~10 h), shown as a weekly ring that never punishes |
| Exposure too degraded to adapt to | Adaptation trials kept above ~70 % intelligibility; severity rises only as accuracy holds |
| Gains fade after training stops | Retention checks after breaks; a maintenance suggestion in the guide |

## 5. Owner's hunches
- Kept: exercises for loud places, distance and non-standard speech; strong progression; interleaving; variability.
- Changed: variability and interleaving are dosed, not maximal — variety widens as accuracy holds and narrows when it
  collapses; similar conditions are interleaved back to back, dissimilar ones blocked at first (R5).
- Added: voice familiarity, head-turn and positioning strategies, memory under listening load, real-world missions.
- Dropped: music and pure-tone/pitch drills, standalone working-memory drills (null transfer for speech in noise; the
  Long-Horizon tool covers working memory).

## 6. Exercises (8) — each tagged with its transfer bet
Common trial anatomy: a short context cue (room, voice or call sign) → stimulus (rendered offline into one buffer,
played once) → closed-set answer (taps) → feedback (right/wrong per slot, intrusion flag) → optional replays
(target alone, then the mix). Answer options are shuffled; foils include the masker's words and phonetic neighbours.
1. **Crowd** — follow the call-sign talker among 1–3 others plus a babble bed; report 1–2 keywords (word + number).
   Dials: target-to-masker ratio; talker count; voice similarity (other sex → same sex → near-twin voice); spatial
   separation (headphones only: 90° → 15° → 0°); cue type (call sign, voice preview, location); onset jitter.
   Bet: attention control and voice/spatial cue use against informational masking; masker variety for generality.
2. **Far** — a room cue (≥1 s of the room) then a phrase at distance in a simulated room with room noise.
   Dials: distance (direct-to-reverberant ratio and level), reverberation time, room noise, room switching, talker set.
   Bet: room adaptation, trained across many rooms (multi-room generalisation).
3. **Strange voices** — accented voices (synthetic VCTK-style accents, natural non-native talkers), fast
   (time-compressed), whisper-like, phone-band, muffled, noise-vocoded, emotional. Keyword answers; pop-out feedback
   (text, then the same audio again); text-first trials as an aid level. Dials: severity per family; number of
   families in rotation; interleaving pattern. One family is held out for probes. Bet: variety that trains adapting to
   new voices (learning to learn). Details to be refined from R2.
4. **Repair** — sentences with words lost under bursts or gates; choose the lost word; context before or after the gap.
   Dials: gap fraction and rate; filler noise level; context strength; position of the gap. Bet: a general strategy —
   hold the sentence, then repair it — plus dip listening.
5. **Echo** — a message heard once in café or party noise (names, numbers, places, times), a short pause, then 2–3
   questions. Dials: details per message, SNR, speech rate, delay, content type. Bet: listening under memory load on
   real-life content (bridging).
6. **Seek** (new bet) — drag through a noisy scene to find a faint repeating voice that grows clearer with proximity,
   then name its word; later levels add a head-turn view where turning toward the talker improves the better ear.
   Dials: SNR range, decoy voices, scene density, target size, time. Bet: sound-guided movement (audiomotor loop;
   Whitton 2017, not replicated, gains faded) and head-turn practice (under-tested in simulated scenes).
7. **Voices** (new bet) — meet a cast of voices; identify who is talking (quiet → noise); find your friend's voice in
   a crowd; optional recordings of people the player knows (on device only, never exported). Dials: cast size, voice
   similarity, noise, utterance length. Bet: fast voice familiarity and learning to familiarise faster, bridged to
   voices from the player's life.
8. **Missions** — one real-world listening task a week (stand with your back to the noise, turn ~30°, watch faces,
   ask targeted repeats, close the distance) and a 20-second check-in. Bet: explicit bridging; feeds the diary.

## 7. Engine and progression modes (one learner record)
- Dial model: each exercise has dials; each dial has a level and a per-player threshold estimate (Bayesian grid over
  threshold with a material-specific slope prior). A trial pushes one focus dial to its edge while the others sit a
  margin below their thresholds; the focus dial is chosen by recent learning progress (bandit). Item and voice
  difficulty offsets (from build-time objective intelligibility, later from pooled data) correct the prediction.
- Edge trials target ~72 % correct; every 4th–5th trial is an anchor at ~90 %; after two consecutive errors the next
  trial is an anchor. Variety (talker pool, rooms, families) is a dial that widens when accuracy holds.
- Exposure interludes: between some sets, 20–30 s of listen-only examples of the condition just trained (with text),
  after Wright 2015 (practice plus exposure); never a production or repeat-aloud step (Baese-Berk & Samuel 2022).
- Sessions: sets of ~3 minutes (20–30 trials) from different exercises; default session ≈ 15 minutes; after three
  sessions in a day the app suggests coming back after sleep (no penalty).
- Modes: **Edge** (default; no configuration) — all of the above. **Path** — venues in order, blocked conditions then
  mixed, mastery at 5 in a row or 80 % of the last 15; right for beginners and anyone who wants clear goals or finds
  mixing confusing. **Variety** — every trial a new talker, room or family across exercises; right after a plateau or
  for players already doing well who want breadth. **Focus** — 60 % of time on the weakest probe condition; right
  when one situation bothers you most. **Free** — any exercise and dial settings, with a coach suggestion.
- Plateau: per exercise, no personal best for ≥4 sessions and a flat Bayesian trend over the last 6 sessions
  (80 % interval within ±0.15 dB per session). Breakers, in order, each announced with its reason: widen variety;
  switch focus dial; add anchors and pop-out feedback; a strategy card; suggest sleep after same-day runs; switch
  exercise. Chimera invitation shown at plateau screens (never inside a set).

## 8. Measurement (Lab)
- Probes (alternate forms by seed; never training content):
  - Matrix (near–mid): original 5-slot word matrix (name, verb, number, adjective, object), held-out synthetic voices,
    steady speech-shaped noise, 20 sentences, word scoring, Bayesian adaptive; ~4 min; target SD ≈ 0.6 dB.
  - Digits (mid): natural talkers held out from training, digit triplets in steady noise, 24 triplets, 1-up/1-down
    2 dB, SRT from trials 5–25; ~3 min; volume-robust.
  - Two voices (mid): natural sentences (held-out actors) against two other talkers; adaptive TMR; ~3 min.
  - Rooms (mid): held-out rooms (measured responses where licences allow); distance ladder; ~2 min.
  - New voice (mid–far): a held-out degradation family; accuracy and adaptation slope over 16 items; ~3 min.
  - Story (far): a 45–60 s passage in café noise at a fixed SNR, 5 questions; ~2 min.
  - Diary (far, real life): 5 original items weekly + optional event check-ins (no copied questionnaire items).
- Baseline: each core probe gets a practice run and two measured runs within the first 3–5 days, spread one block a
  day after training starts on day 1 (two-minute start kept). Weekly check-in ≈ 8 minutes after that.
- Change: per probe, a Bayesian estimate per run; the trend is reported as gain ± 90 % interval with a verdict
  ("clear gain", "likely", "not yet clear") against the smallest detectable change; averaging weekly runs makes
  ≈1–1.5 dB gains visible in 3–4 weeks.
- Headphone check: anti-phase test (generic method) unlocks spatial dials; manual override with a note.
- Safe listening: fixed output loudness regardless of SNR, a comfortable-level setup, a daily listening-time note.
- Export: versioned JSON (full record) and CSV (probe runs); a pooled format with no name (optional nickname), no
  user-agent, locale or timezone unless switched on. Import accepts all older versions.

## 9. Game layer and Chimera
- Night out map: ~12 venues (café, restaurant, bar, house party, club, concert, station, stadium, cathedral, park,
  phone line, lecture hall), each a family of conditions; venues unlock by thresholds; each shows your earshot there.
- Cast: ~40 named voices with cards that fill in as you meet them (also used by Voices and the weekly challenge).
- Growth in real units: "followed a voice at −6 dB", "heard across 12 m in a cathedral". Milestone badges for
  abilities, not time. Personal bests per venue.
- Weekly Night Out: seeded set everyone plays identically; result card (image + text) with https://discord.gg/chmr.
- Return without punishment: a "fresh ears" set after ≥2 days away that shows retained skill; an overnight check of
  yesterday's hardest condition. No streaks, lives, timers against the player, leaderboards or running score.
- Chimera: full welcome on first launch, light one-tap later; permanent link; README line 1, guide, tutorial end,
  every share text; invitations at personal bests, milestones, plateaus and exports.

## 10. Stimuli (all rendered at build time; nothing GPL ships)
- Synthetic voices: Kokoro-82M (Apache-2.0, 28 English voices + other-language voices for accents); clean
  multi-speaker VITS models with CC BY 4.0 VCTK/LibriTTS data and no research-only base (Piper en_US-libritts-high,
  Mimic 3 vctk_low, Coqui en/vctk/vits) — final pick by listening proxies (ASR accuracy, objective intelligibility).
- Natural voices: AudioMNIST (MIT; 60 talkers, mostly non-native), CREMA-D (ODbL/DbCL; 91 actors, 12 sentences),
  speechocean762 (CC BY 4.0 per its listing; 250 talkers incl. children; medium-high licence confidence), LibriVox
  read speech (public domain; ASR-transcribed, kept only where two recognisers agree).
- Noise: MS-SNSD (CC0 babble; DEMAND scenes under CC BY-SA 3.0) and synthesised beds. Rooms: own synthetic
  responses; measured sets with clean licences for held-out probe rooms.
- Pipeline: phrases with pauses → cut words; ASR check of every clip against its text (re-render or drop on
  mismatch); active-level normalisation; per-item difficulty offsets from an objective intelligibility model;
  MP3 16 kHz mono ~24 kbps in base64 packs; licence ledger per file. Budget: single HTML ≤ ~12 MB.

## 11. Audio engine
Offline rendering of every trial (mixer, maskers, rooms, spatial HRTF, degradations: time compression, vocoder,
whisper-like, band-limit, tilt; exact TMR/SNR from active levels; constant output loudness; limiter), one buffer
played per trial; real-time graph only for Seek. Decoding is lazy with a small cache; nothing renders during playback.

## 12. Architecture
Plain JavaScript classic scripts on one namespace (`ES`), no modules, no fetch of local files; audio packs are JS files.
In-memory routing; versioned storage with migration, two-tab merge and lasting "not saved" states; one active-time
clock. Tools: Python audio pipeline (tools/audio/), build-single, build-pdf, privacy check. Tests: Node unit tests for
pure engines and DSP, Python Playwright e2e (desktop 1366×768, phone 390×844 and 360×640, light/dark, srcdoc,
storage blocked, two tabs), simulated learners for every mode, long runs and journeys.

## 13. Visual concept
Audiogram: a lab sheet with a fine grid; the one voice you follow in signal red, every other voice in audiogram blue;
the earshot field (range rings around you) as the recurring picture; Archivo for text and JetBrains Mono for numbers
(both OFL, embedded); a graphite night theme. Avoided: gradient heroes, emoji badges, mascots, confetti, streak
flames, glass cards, icon-card grids, purple gradients, amber on navy, cartoon ears. Nothing moves during a stimulus.

## 14. Milestones (Phase 2 build → Phase 3 release); acceptance check after each
- [ ] M1 Skeleton and contracts — opens from disk, on Pages-like http and in sandboxed srcdoc; storage-blocked mode;
      Chimera pop-up; shell fits 360×640; unit tests pass.
- [ ] M2 Stimulus pipeline — ≥98 % of clips pass the ASR check; held-out sets disjoint; budget met; licence ledger.
- [ ] M3 Audio engine — TMR/SNR within ±0.25 dB; loudness constant ±1 dB; no clipping; render ≤250 ms per trial at
      4× CPU throttle; deterministic by seed.
- [ ] M4 Engine — every generator solver-checked on ≥10,000 seeds; shortcut responders near chance per level;
      200 simulated learners × 60 days per mode.
- [ ] M5 Crowd, Far, Strange voices, Repair with tutorials — fresh-agent start ≤2 min; no scroll at 360×640.
- [ ] M6 First playable build to the owner with playtest mode.
- [ ] M7 Echo, Seek, Voices (recording), Missions.
- [ ] M8 Lab probes, change statistics, exports and import.
- [ ] M9 Game layer, weekly challenge, share cards, Chimera touchpoints.
- [ ] M10 Integration — long runs, two tabs, journeys, storage full, phone sizes.
- [ ] Phase 3 — independent reviews (code, play-through, claims vs code, stimuli validity, texts and accessibility),
      fresh-player tests, fix rounds, guide PDF, Discord post, release checklist page, build log, playbook merge,
      release zip, verification table; merge to `main` only with the owner's yes.

## 15. Defaults where the brief is silent
Players mixed level on phones and desktops; headphones recommended, never required (spatial dials need them);
English only; adults (no child mode); default session ~15 minutes, suggested 4–5 days a week for 8–10 weeks; synthetic voices labelled as synthetic; not a
hearing test or medical device — the guide says when to see an audiologist.
