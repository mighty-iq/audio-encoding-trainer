# R10 — Seven papers read in full (1.1 research pass)

Started 2026-11-28 17:35 UTC. Written as the work proceeds (resumable: sections are filled in order; a section
marked "pending" was not reached yet).
Source: full-text PDFs supplied by the owner for this pass (read where they were supplied; not copied into the
repository). Notes are in our own words; quotes are at most a short phrase.
Each section: reference with DOI, read level, what the paper did and found (with numbers), where Earshot's current
assumption lives (repository-relative file:line), verdict (confirms / corrects / overturns), recommended change and
how sure we are. A ranked table of changes closes the note.

## 1. Brungart 2001 — one competing talker: informational vs energetic masking

Brungart DS (2001). Informational and energetic masking effects in the perception of two simultaneous talkers.
J Acoust Soc Am 109(3):1101–1109. doi:10.1121/1.1345696. **Read level: full text** (all 9 pages, figures read
from page images; values below read off Fig. 1 to about ±3 points).

**Procedure.** 9 normal-hearing adults (21–55 y; 7 of 9 already practised on the call-sign corpus). Diotic
headphones; masker at 60–70 dB SPL, overall level roved over 6 dB. Target = a call-sign phrase (fixed call sign)
with a colour (4) and a number (8); masker = another phrase with a different call sign, colour and number, drawn from
8 talkers (4 m, 4 f), so trials fell into different-sex, same-sex and same-talker pairings. TMR −12 to +15 dB in
3-dB steps, random per trial; answers on a 4 × 8 grid. 2,000 trials per listener with a speech masker (blocks of
240, one or two a day), then 960 with steady speech-shaped noise (−18 to +15 dB) and 240 with speech-envelope-
modulated noise (−21 to 0 dB).

**Findings (both colour and number right).**

| TMR (dB) | −12 | −9 | −6 | −3 | 0 | +3 | +6 | +9 |
|---|---|---|---|---|---|---|---|---|
| different sex | 77 | 81 | 81 | 84 | 88 | 90 | 93 | 97 |
| same sex | 56 | 63 | 63 | 62 | 62 | 71 | 87 | 96 |
| same talker | 41 | 43 | 42 | 36 | 36 | 58 | 80 | 94 |
| steady speech-shaped noise | 14 | 38 | 76 | 92 | 96 | 97 | 98 | 98 |
| modulated noise | 62 | 76 | 90 | 98 | 99 | — | — | — |
(steady noise also −18: 4, −15: 5; modulated noise −21: 20, −18: 30, −15: 49.)

- Similarity: at negative TMRs, same-sex was 15–20 points below different-sex and same-talker another 15–20 below
  same-sex (gaps widest at 0 dB: 26 and 26 points). In d′ terms (from the 2003 paper), same-sex vs same-talker is
  worth 0.67 and a sex difference 1.91.
- **TMR is not a monotonic difficulty dial with one similar talker.** Same-sex and same-talker scores fall from
  +9 to 0 dB, then plateau from 0 to −12 dB well above chance; the number answers in the same-talker case even rise
  by up to 25 points as the target gets quieter. The listeners used the level difference to tell the voices apart
  and attended to the quieter one. Positive TMRs always helped more than negative TMRs of the same size. With a
  different-sex masker the curve is almost flat (about 1 point per dB below +9 dB; still ~77–80 % at −12 dB).
- Steady noise is a steep energetic curve: no effect down to about −3 dB, then a 90-point fall over 9 dB (≈ 10 %
  per dB). Modulated noise is shallower; from −6 dB up it scored above every speech masker
  (below −9 dB the different-sex masker scored higher).
- **Errors are confusions, not inaudibility.** At +9 dB, same talker, 66 % (colour) and 75 % (number) of wrong
  answers were the masker's word, against 33 % and 14 % expected by chance; at 0 dB virtually every response was the
  target's or the masker's word. Colour and number errors fell in the same trials (both words taken from the wrong
  voice), most strongly for the same talker.
- Talker and word effects: one distinctive talker was 11 % easier as target and 9 % easier as masker (r = +0.74
  across talkers); words that were easy as targets were strong maskers (r = −0.74 numbers, −0.80 colours).
  Listeners ranged 72–86 % overall.
- Level difference with the target equally likely to be either voice (Fig. 7): accuracy rose from 62 % (0 dB
  difference) to 80 % (9 dB) for same-sex pairs and from 37 % to 69 % for the same talker; the author equates the
  9-dB split with about +5 dB SNR on both channels.

**Earshot's current assumption and where it lives.**
- "Same-sex ≈ 20 points, same-voice ≈ 40 points harder" (docs/research/ACCESS.md:14–15; docs/research/
  R3-cocktail-party-distance-mechanisms.md:48–52, secondary via Bronkhorst 2015). R9 flagged the plateau and the
  level cue as unverified (docs/research/v1.1/R9-anti-strategy-transfer.md:88–93) and ranked level-rank roving 9th
  (same file :569). Plan 1.1 A1 "target not always the loudest" (docs/dev/PLAN-v1.1.md:21–22).
- Crowd's TMR dial runs from +12 to −15 dB as one monotonic logistic (slope 0.18 logit/dB, prior −3 ± 5 dB)
  (js/engine/dials.js:31); every other voice sits at the same −tmr level (js/engine/items/crowd.js:141) and the bed
  at −tmr − 10 dB (crowd.js:145). One other voice is the start level of the talkers dial (dials.js:32).
- Every other voice's word and number are always among the four options (js/engine/items/common.js:5–7, :121–126),
  but the model's guess rate per slot is 1/options = 0.25 (js/engine/dials.js:110; js/engine/learner.js:232, :275).

**Verdict.** Confirms the similarity gaps (≈ 20 and ≈ 40 points vs a different-sex masker at negative TMRs; up to
26 and 52 at 0 dB). Confirms R9's unverified plateau and level cue, now with numbers. **Corrects** the Crowd model in
two places: (a) with one other voice, TMR below 0 dB is not harder for same-sex or near-twin voices and barely
matters for other-sex voices, while it makes "follow the quieter voice" a winning rule because all maskers share one
level; (b) in an informational-masking trial the floor is attribution between the voices heard (≈ 1/(1 + other
voices) per slot when their words are options), not 1/4.

**Recommended change.**
- 1.0.x (small, high confidence for the one-masker case): when exactly one other voice is present, floor the TMR
  dial at 0 dB (difficulty then comes from similarity, space and talker count) and report the delivered value, as
  the generator already does for relaxed constraints (crowd.js:8–12, :86, :119). Caveat: Earshot's bed rises with
  the masker (−tmr − 10 dB), which adds energetic masking at negative TMRs and may partly restore a slope; the level
  rule stays usable either way.
- 1.1 A1 (concrete rule): rove each other voice's level independently (e.g. uniform ±4 dB around −tmr, re-drawn per
  trial) so the target is not always loudest or quietest; with one other voice, draw the sign of the level
  difference at random (50/50) and make the dial the size |ΔL| from 12 dB (easy) to 0 dB (hardest) — Brungart's
  Fig. 7 shows accuracy then rises monotonically with |ΔL| (62 → 80 % same sex, 37 → 69 % same talker over 0–9 dB).
  Log the realised level rank of the target per trial.
- 1.1 B6/M1 (medium confidence, my inference from the error analysis plus Earshot's option design): for Crowd
  slots whose options include other voices' words, set the per-slot floor to 1/(1 + number of those voices) in
  the learner (0.5 with one other voice, 0.33 with two, 0.25 with three), or fit it from pooled data; count masker
  intrusions separately (A7 already plans error profiles).
- Item calibration (B6): log the masker's words — easy target words are strong maskers (r ≈ −0.8).
- Lab "Two voices" probe (js/lab/probes.js:182–213): two same-sex maskers both at −tmr, TMR adaptive down to
  −24 dB, all sentence keys as options with guess = 1/options (probes.js:190). The same two issues apply in a
  milder form (two maskers): below 0 dB the target is the uniquely quiet voice, and the attribution floor is ≈ 1/3
  (the maskers' sentences are options), not 1/N. Do not change the released probe (continuity of baselines); check
  pooled thresholds, and if most fall below 0 dB, design 1.1's open-set check (E1) with the target's level rank
  roved from the start.
- Guide wording (docs/guide/guide.html:109): the 40-point case was the same talker, not a "near-identical" voice,
  and the source can now be cited directly instead of through Bronkhorst 2015.

## 2. Darwin, Brungart & Simpson 2003 — F0 and vocal-tract length differences

Darwin CJ, Brungart DS, Simpson BD (2003). Effects of fundamental frequency and vocal-tract length changes on
attention to one of two simultaneous talkers. J Acoust Soc Am 114(5):2913–2922. doi:10.1121/1.1616924.
**Read level: full text** (all 10 pages; values read off Figs. 1, 6–9 to about ±0.02).

**Procedure.** The same call-sign task, always two phrases by the same talker (8 talkers), one of them shifted with
PSOLA/resampling: Exp 1 F0 only (0, 1, 2, 3, 4, 6, 9, 12 st), Exp 2 vocal-tract length only (ratios 1.0–1.38; the
figure labels the top value 1.34), Exp 3 both together along a male↔female continuum (quarter, half, almost,
full, super). TMR −6 to +9 dB in 3-dB steps; diotic; level roved 6 dB. n = 9, 8 and 8 listeners (mostly the same
people), 3,840 / 3,840 / 3,360 trials each, blocks of 168–192 trials (~10 min), 2–3 blocks a day over 2 weeks.

**Findings** (proportion with both words right, averaged over TMR −6 to +3 dB unless stated).
- F0 alone: 0 st 0.49, 1 st ≈ 0.51 (barely detectable), 2 st ≈ 0.60 (+12 points), 3–4 st ≈ 0.62–0.66, 6 st ≈ 0.67,
  9 st ≈ 0.72, 12 st ≈ 0.74 (+24). Maximum gain at 0 dB: 28 points — half the gap between same-talker and
  different-sex pairs in 2001. With ≥ 3 st the below-0-dB plateau disappears (scores fall again from 0 to −6 dB);
  with 0–2 st it stays. No octave dip at 12 st with natural intonation (the dip in older work came from monotone
  speech). Higher- or lower-pitched target: no difference.
- Vocal-tract length alone: ratios ≤ 1.08 gave nothing (0.47–0.50); 1.13 ≈ 0.55, 1.16 ≈ 0.55–0.57, the largest
  ratio ≈ 0.67 (about 50 → 70 % at 0 dB, comparable to 9 st of F0). The abstract says gains start at 1.08; the
  results show them from 1.13. A target with the shorter vocal tract was followed far better; when the masker had
  the shorter tract, the ratio hardly mattered (listeners lean towards the "smaller" voice when nothing else helps).
- Both together: the unshifted pair plateaued near 0.45 below 0 dB; the larger joint shifts lifted 0 dB scores by
  ≈ 35 points (45 → 80 %), close to real different-sex pairs. Nearly all of the benefit was reached at the
  "almost" step (≈ 7.2–7.4 st plus a 12 % tract change); a quarter step (2.7 st + 4 %) already gave +5 to +25 points
  depending on talker sex and which voice was shifted. Shifting the target helped more than shifting the masker
  (an unusual voice draws attention). Joint changes were super-additive: 11 of 12 conditions beat the prediction
  from Exps 1–2. d′ at 0 dB: sex change 1.91, 12 st of F0 0.97, ratio 1.16 0.46.
- Talkers differed as much as the manipulations did: the gain from 12 st correlated r² = 0.93 with how little a
  talker's intonation naturally differed between utterances (flat, repetitive talkers gained most; one lively
  talker gained nothing). Natural F0 differences between two utterances of one talker were ≈ 5–17 % (≈ 1–3 st).
- Only 1.8 % (Exp 1) and 2.7 % (Exp 2) of errors were not the masker's words.

**Earshot's current assumption and where it lives.**
- "Steps up to 12 st and ratio 1.34, super-additive" (docs/research/ACCESS.md:16–17; R3:114–118, secondary);
  R3:119–121 states a dip at exactly one octave.
- Crowd similarity ladder: 0 other sex; 1 same sex ≥ 2 st apart (no upper bound); 2 same sex, closest pitch
  (< 2 st where possible); 3 near-twin = the target's own voice resampled by 1.06 or 0.94 (≈ 1 st of F0 and a 6 %
  tract change together), the first such masker always 1.06 (js/engine/items/data.js:106–133). One slope (0.6 logit
  per level) for all steps (js/engine/dials.js:34–35), under the header claim that ladder steps cost roughly equal
  intelligibility (dials.js:5–6). Training voices span 11.4 st (female, 140–271 Hz) and 11.8 st (male, 85–167 Hz)
  (data/voices.js), so level 1 can mean 2 st or 11 st.

**Verdict.** Confirms the ranges and the super-additivity (now with numbers). **Corrects** three details:
(a) the near-twin (≈ 1 st + 6 %) is below both thresholds (F0 needs ≈ 2 st, tract length ≈ 1.13), so level 3 is
effectively the same talker — fine as the top step, but it sits at the attribution floor at TMR ≤ 0 dB (≈ 36–45 %
both words) and only reaches the 0.72 edge at about +3 to +6 dB; (b) level 1 is heterogeneous: from 2 st (+12) to
≈ 11 st (+24), so its trials differ by ≈ 12 points of expected accuracy and the steps are not equal; (c) R3's octave
dip does not apply to natural or TTS speech with intonation.

**Recommended change.**
- 1.0.x (low cost): randomise the near-twin shift direction for a single masker (0.94 or 1.06 at 50/50), so "follow
  the lower/darker voice" is not a fixed rule (Darwin: the shorter-tract voice draws attention; a constant direction
  is a constant cue). Log the closest masker's ΔF0 in semitones in every Crowd trial's meta.
- 1.1 (medium confidence; TTS voices also differ in timbre and timing): give level 1 an upper bound (same sex,
  2–6 st) so the ladder steps stay near even; if the pool cannot supply it, use the next voice out and log ΔF0.
  Optionally add a synthetic similarity continuum built from the target's own voice — resample plus WSOLA (both are
  in js/audio/dsp) gives a joint F0 + tract shift at constant duration: ratios ≈ 1.06 (same talker), ≈ 1.12, ≈ 1.19
  (≈ 3 st + 16–19 %) — calibrated against Exps 1–3, independent of which voices a player has met (bet; Darwin did
  not test 1:1 coupled shifts).
- R3 text: drop or qualify the octave-dip line (monotone speech only).

## 3. Cameron & Dillon 2011 — LiSN & Learn spatial training (children)

Cameron S, Dillon H (2011). Development and evaluation of the LiSN & Learn auditory training software for
deficit-specific remediation of binaural processing deficits in children: preliminary findings. J Am Acad Audiol
22(10):678–696. doi:10.3766/jaaa.22.10.6. **Read level: full text** (19 pages incl. appendices; Figs. 3–5 read
from page images). Developer-run; the authors disclose a commercial interest.

**Procedure.**
- Sample: 9 children aged 6;9–11;4 (6 boys) diagnosed with a spatial processing disorder on the LiSN-S (66
  referred, 12 diagnosed, 1 declined, 2 withdrew). Pre–post design, children as their own controls (no control
  group); re-tested 3 months after training stopped.
- Scene: everything spoken by one female talker, so only spatial cues separate the voices. Target sentences from
  0°, two different looped children's stories from +90° and −90°, rendered with non-individual HRTFs recorded at
  the authors' lab, plus an inverse headphone filter for the one headphone model used. **The azimuths never
  change; only the target level adapts.** Distracters fixed at 55 dB SPL combined; target starts at 62 dB SPL
  (+7 dB). The stories start 2 s before the target and end ~1 s after; a 200-ms 1-kHz beep and 500 ms of silence
  announce each sentence.
- Task and rule: hear a six-word sentence (matrix-like, 131,220 possible sentences from 4 master lists; 90
  pictureable target words), then pick the picture of one of its words from four, or a "?" for unsure.
  Weighted up-down on target level: −1.5 dB after a correct pick, +2.5 dB after a wrong one, +1.5 dB after "?"
  (the same sentence is then replayed at the easier level once; a second "?" moves on). Ignoring "?" this
  converges near 62.5 % correct in a four-option task (≈ 50 % after guessing correction). Practice: ≥ 5 sentences
  in 3-dB steps until the first upward reversal; game SRT = mean SNR of the scored sentences.
- Dose: 40 sentences per game, 2 games a day, 5 days a week, until 120 games (≈ 12 weeks; 15–20 min a day;
  4,800 trials, ≈ 80 a day of one task).
- Game layer: bell or buzzer per answer; a sticker for every 5 correct; a certificate when a game's SRT beats the
  previous session's by ≥ 1 dB; progress charts. Two of nine children grew bored (the authors call the games
  repetitive by design); the commercial version added a shop, an avatar and another game.

**Findings.**
- In-game SRT improved 9.7 dB (−11.6 → −21.3 dB). The curve (Fig. 3, 5-day running mean) fell ≈ 5 dB over the
  first ~40 games, ≈ 2 dB more by game ~70, and flattened near −20 to −21 dB from game ~95.
- Near transfer on the LiSN-S (same-voice ±90° condition, closest to training): ≈ −7.5 → −12 dB (≈ 4.5 dB), against
  ≈ 7.8 dB in the game over the same span (first vs last 30 games); the interaction was significant — in-game gains
  were about twice the test gains (task-specific practice).
- Spatially separated LiSN-S measures (z-scores): high-cue SRT −2.50 → −0.11 (η² 0.84), spatial advantage
  −2.22 → −0.18 (η² 0.87), total advantage −2.21 → −0.24 (η² 0.69); 7 of 9 children beat the test's critical
  difference. **Co-located measures did not change**: low-cue SRT −0.56 → 0.11 (p = .07), talker advantage
  −0.35 → −0.28 (p = .86). All nine ended within normal limits.
- Retention: no group change after 3 months without training; one child (low IQ, language disorder) fell back to
  near baseline on the spatial measures only.
- Other measures: auditory memory z −0.86 → −0.39 (η² 0.57); attention commission errors −0.99 → 0.00 (η² 0.75),
  omissions unchanged; self-rated listening in noise 3.10 → 1.78 on a 0–4 difficulty scale (η² 0.93).
- LiSN-S reliability quoted: test–retest r 0.3 (talker advantage) to 0.8 (high-cue SRT); mean retest change up to
  −1.1 dB (high-cue SRT) but 0.1 dB for spatial advantage — difference scores between separated and co-located
  conditions cancel most practice and language effects.

**Earshot's current assumption and where it lives.**
- "Azimuths, steps, dB changes · headphone spatial dial adaptive on target level" (docs/research/ACCESS.md:20–21);
  R3 summary and notes (docs/research/R3-cocktail-party-distance-mechanisms.md:24, :205–210, :223–224, :797, :802);
  R9 transfer table (docs/research/v1.1/R9-anti-strategy-transfer.md:416).
- Crowd's spatial dial adapts the separation itself, 90° → 0° in 8 steps, prior at 15° (js/engine/dials.js:36–37),
  with the TMR as the adaptive dB dial (dials.js:31, :110); maskers sit at rot ± sep, a third at half sep, with a
  random rotation of the whole scene at breadth ≥ 0.5 (js/engine/items/crowd.js:134–139).
- No Lab probe is spatial: every probe renders `spatial: 'mono'` (js/lab/probes.js:98, :145, :195, :211;
  js/lab/probes-more.js:44, :86, :133).

**Verdict.** Confirms the dose (15–20 min a day, 12 weeks), the ~10 dB in-game and ~3 dB (≈ 2 SD) test gains, the
retention at 3 months and the specificity to separated conditions. **Corrects** one premise: LiSN & Learn did not
train with an azimuth dial — separation was fixed and wide (±90°, symmetric) and only the level adapted; Earshot's
adaptive separation is its own, untested bet (fine to keep, but it should not cite LiSN & Learn as precedent). Adds
two facts the plan does not use: in-game gains ran ≈ 2× the near-transfer gain, and an "unsure" key with a replay
at an easier level was part of the loop. Evidence is weak (n = 9, no control group, developer-run, children with a
diagnosed deficit — not Earshot's adult players).

**Recommended change.**
- Wording (now): Earshot's texts and guide must not present in-game dB gains as listening gains; this study's
  in-game gain was about twice the gain on its nearest test. Keep reporting growth in-game and in the Lab
  separately (1.1 C1/C2 already build the level from confirmed marks).
- 1.1 Lab (medium confidence, cheap with headphones): an original spatial-release check — the same Earshot
  material with two same-voice distracters co-located vs at ±90° (generic HRTF, already in js/audio), reporting the
  difference in dB. A difference score is the reliable form (0.1 dB mean retest change here); it is the only way
  Crowd's headphone training could show transfer, and the co-located condition doubles as a control. Use our own
  sentences and voices and our own name (no LiSN-S clone).
- 1.1 Crowd headphones (optional bet): a fixed ±90° symmetric block with a level staircase as an "anchor" layout
  between adaptive-separation sets; it is the one spatial schedule with any transfer data.
- 1.1 A7 (low-medium confidence): an "I didn't catch it" key in Crowd and Far that replays the same mix once at an
  easier level and scores as a miss without a guess (γ = 0 for that trial); it removes forced guesses from the
  staircase and is a non-punitive way out (LiSN & Learn used +1.5 dB vs +2.5 dB for a wrong pick). Its own effect
  on learning was not tested.
- Dose check for B1: one task at ≈ 80 trials a day, 5 days a week, produced the curve above; most of the in-game
  gain came in the first ~40 sessions (≈ 1,600 trials), the rest over the next ~55.

## 4. Whitton, Hancock, Shannon & Polley 2017 — closed-loop audiomotor training (older hearing-aid users)

Whitton JP, Hancock KE, Shannon JM, Polley DB (2017). Audiomotor perceptual training enhances speech
intelligibility in background noise. Current Biology 27(21):3237–3247.e6. doi:10.1016/j.cub.2017.09.014; trial
NCT02147847. **Read level: full text** (article and STAR methods, 18 pages; Figs. 1–4 read from page images).
The six supplementary figures and two supplementary tables were not in the file.

**Procedure.**
- Sample: 48 consented, 36 eligible, 32 randomised (stratified by baseline sentence-in-noise score, automated
  allocation, double-blind), 24 completed (closed-loop game n = 13, 77 % women; memory game n = 11), 21 at the
  2-month follow-up. Age 50–89 (mean 70), mild to moderately severe loss, bilateral hearing aids for ≈ 7 years,
  aided during training and testing. Home tablets with an external speaker at 1 m (camera-checked placement; the
  tablet microphone locked training when room noise exceeded 60 dBA; mean 43 dBA).
- Dose: goal 3.5 h a week for 8 weeks (= 28 h); a session counted only if 30–60 min long; a weekly-goal progress
  display. Achieved median 35 h (closed loop) and 31 h (memory). Two people were dismissed for low compliance, four
  dropped out after a few days.
- The closed-loop game: trace the outline of a hidden polygon with a fingertip; the sound's level, frequency or
  modulation rate changed logarithmically with distance from the outline (the gradient saturated beyond ≈ 2 cm, so
  the fine information was near the edge). Sounds were not speech — modulated tones, ripple noise, tone clouds —
  at 20–40 dB above each player's aided threshold, under continuous 1–6-talker babble (20 talkers, sentences kept
  out of the test lists). Tracing accuracy bought time for two sub-games: find an invisible target spot by a radial
  sound gradient (like Earshot's Seek), and rotate a piece until the sound flips to a target sound. Progression was a
  ratchet, not a staircase: the maximum SNR dropped after every completed puzzle and shapes gained vertices. Mean
  in-game SNR fell from ≈ +3.5 to ≈ 0 dB over training. A fixed "yardstick" board (18 dB SNR) every so often
  measured in-game learning apart from the adaptive track: tracing error fell ≈ 1.12 → 0.86–0.88 cm (≈ 22 %; the
  authors report 20–30 % for both games' yardsticks).
- Placebo: a speech working-memory game (call-sign phrases from 8 talkers, 3–16 s delays, rising memory load),
  same puzzle skin, rated equal for immersion, difficulty and expected benefit (≈ half of both groups believed
  their hearing had improved). During puzzle assembly it also played the closed-loop game's sounds unlinked to
  movement — a passive-exposure control.
- Outcomes (spoken answers recorded and scored blind): monosyllables in 6-talker babble; low-context (IEEE) and
  high-context (BKB) sentences in 4-talker babble; four-digit streams (target male 115 Hz against a male 90 Hz and
  a female 175 Hz, analysed at +3 dB because 32 % were at chance at 0 dB), scored as first digit or whole stream;
  FM detection; letter–number sequencing; auditory and visual Stroop.

**Findings.**
- Sentences improved only after the closed-loop game: +28.5 % (low context) and +21.7 % (high context) within the
  steep part of the curve — relative increases in words correct (≈ +12 and ≈ +10 rationalised-arcsine points from
  ≈ 43 on the figure), ≈ 1.5 dB of SRT — vs +4.7 % and +4.0 % (n.s.) after the memory game. Hedges' g (closed loop vs memory) 0.88, 0.85 and 0.94 (digit streams) after training;
  < 0.14 at the 2-month follow-up (≈ 7 weeks without play): **the transfer was gone**.
- Isolated words did not improve in either group; digit streams improved only when scored whole (first digit: no
  group difference). Stream gains correlated with sentence gains (R = 0.72). The authors read this as better
  attentional focus on a target stream that builds over time.
- Clinically meaningful SRT change (≥ 1.3 dB): 62 % in the text, 7 of 13 = 54 % on the histogram (closed loop) vs
  9 % (memory). At 0–6 dB SNR the hearing aids gave ≈ 4 points over unaided, aids plus training ≈ 14.
- Predictors of gain: reduction of in-game tracing error (R = 0.60) and baseline inhibitory control (combined
  Stroop congruence cost, R = 0.66; it predicted gain but not baseline SRT and did not change with training). FM
  detection and memory span predicted baseline SRT (R ≈ 0.44–0.45) but neither changed nor predicted gain.
- Both groups improved 20–30 % on their own task's yardstick; memory-game gains did not reach an untrained memory
  test.

**Earshot's current assumption and where it lives.**
- Seek's bet: "sound-guided movement (audiomotor loop; Whitton 2017, not replicated, gains faded)"
  (docs/dev/PLAN.md:119–122; js/engine/items/seek.js:1–6); Seek is a search for one spot whose voice grows louder
  as 1/distance (js/ex/seek-scene.js:5), dials snr, decoys, size, gap (js/engine/dials.js:88–96); a Seek set is
  6 scenes of ≈ 30 s (dials.js:115), i.e. ≈ 3 minutes when it is drawn.
- Guide: "about 28 hours over eight weeks … about 25 % more words in noise … known to us from a news release"
  (docs/guide/guide.html:504; also :135, :152). R7 (partial read) has most numbers right
  (docs/research/v1.1/R7-progression.md:325–334); R3 says "~28 h" (R3:803).
- Suggested programme ≈ 15 min, 4–5 days a week for 8–10 weeks (≈ 10 h) (docs/dev/PLAN.md:77).

**Verdict.** Confirms the headline (placebo-controlled transfer to sentences in noise, g ≈ 0.85–0.94, lost by
2 months) and R7's predictors. **Corrects**: (a) dose — 28 h was the goal, the median was 35 h, in 30–60-min
sittings; (b) "25 % more words" is a relative gain in sentences and digit streams, ≈ 1.5 dB; single words did not
improve; (c) what predicted transfer was the continuous *tracing* loop (keep on a contour by fine moment-to-moment
cues), whereas Earshot's Seek copies only the radial search sub-game; (d) the dose gap: Seek gets ≈ 3 minutes in a
sitting, roughly 15–20× less audiomotor play per week than the study, so Seek is a token test of this bet.

**Recommended change.**
- Guide and texts (1.0.x, high confidence): "about 35 hours (goal 28) over eight weeks … about 25 % more words in
  sentences (≈ 1.5 dB), not in single words … gone two months after play stopped"; drop "known to us from a news
  release".
- 1.1 Seek (bet, medium-low confidence that it carries over): add a "Trace" board — keep the finger on a hidden
  path along which the target voice is clearest, scored by mean tracking error, with a ratchet (the
  SNR ceiling drops after each completed board; paths gain corners); keep the search board as the sub-game. Show
  tracing error as Seek's skill meter.
- 1.1 B1 dose for bets: if Seek's bet is to be tested at all, give it concentrated weeks (e.g. one Seek-heavy
  sitting of ≥ 15 min, 2–3 times a week, for players who opt in) and say in the app that 1.0's Seek dose is far
  below the study's.
- 1.1 C2 / measurement: a fixed in-game "yardstick" set per exercise (fixed dials, fresh items) every ~2 weeks
  measures in-game learning separately from the adaptive track — cheap, and it feeds confirmed marks (C1).
- Maintenance (all exercises; high confidence that it is needed, no data on how much): after a season, propose a
  light maintenance plan (e.g. two sittings a week) and re-run the Lab check after 4–6 weeks off; say plainly that in
  this study the transfer vanished within two months without play.
- Probes: score whole sentences/streams as well as words — the study's transfer appeared only at that level.
  (Earshot's Digits probe already scores whole triplets: js/lab/probes.js:155.)
- Optional pooled covariate: a 2-minute auditory Stroop (pitch–word conflict) in the Lab as a predictor of who
  gains from which exercise (bet; it did not change with training, so it is not a training target).

## 5. Wright & Sabin 2007 — how much daily training is enough?

Wright BA, Sabin AT (2007). Perceptual learning: how much daily training is enough? Experimental Brain Research
180(4):727–736. doi:10.1007/s00221-007-0898-z. **Read level: full text** (10 pages; group values from the text,
curves from Figs. 1–2).

**Procedure.** 27 young normal-hearing adults new to psychoacoustics (28 recruited, one outlier excluded), in four
groups: frequency discrimination at 360 trials a day (n = 7) or 900 a day (n = 8); temporal-interval
discrimination at 360 (n = 6) or 900 (n = 6). Stimulus: two 15-ms 1-kHz pips 100 ms apart, one ear; two-interval
forced choice; 3-down/1-up staircases (79.4 %) in 60-trial blocks with feedback after every trial. One hour of
familiarisation, a pretest (1,800 trials over six conditions), then 6 analysed training days of 6 or 15 blocks on
one condition, usually on consecutive days. The groups' data came from separate experiments (so generalisation
could not be compared).

**Findings.**
- Frequency discrimination: 900/day improved (15.9 → 9.9 Hz over 6 days); 360/day did not (22.2 → 18.3 Hz,
  n.s.). The difference held when total trials were equated (first 2,460 trials of each group): the number of
  trials **per day** mattered, not the total.
- Temporal-interval discrimination: both groups learned equally (360/day 25.5 → 12.2 ms; 900/day 23.1 → 10.7 ms);
  the extra 540 trials a day added nothing to the trained condition.
- No systematic learning **within** sessions; the gains appeared **between** days (step-wise). Within-session
  performance did not predict the daily amount needed.
- Thresholds already dropped from the pretest to day 1 (familiarisation and procedure).
- Authors' reading: consolidation is triggered all-or-none once a task- and stimulus-specific daily amount is met;
  it differs between tasks even with the same sounds (here 360 was enough for one task and not the other) and
  between stimuli on one task (they cite learning with 350/day using a longer tone, and none with 50/day for
  20 days on interval discrimination). Trials beyond the threshold may still help generalisation or retention —
  untested. Difficulty was the same (79.4 %) in both tasks, so its role is unknown.

**Earshot's current assumption and where it lives.**
- Plan 1.1 B1: a sitting trains ≤ 3 exercises with ≥ 2 sets each (≥ 40 trials), listen-only items count as
  half-trials, cited to this paper and Wright et al. 2015 (docs/dev/PLAN-v1.1.md:37–38); ACCESS: "sets the 1.1
  session shape (≥ 2 sets per exercise per sitting)" (docs/research/ACCESS.md:48–49). R7's abstract-based summary
  is accurate (docs/research/v1.1/R7-progression.md:128–132); its T_ex ≥ 40 is derived from Wright 2015, not from
  this paper (R7:165–167, :465–478).
- 1.0 planner: 5 sets of ~3 minutes from 5 different exercises, no exercise repeated except in Focus mode
  (js/engine/planner.js:1–2, :97, :126–144), i.e. ≈ 20–24 scored trials per exercise per day (set sizes in
  js/engine/dials.js:110–117).

**Verdict.** Confirms the principle behind B1 (a per-day threshold per condition; trials per day, not total
trials; extra trials beyond it do not help the trained condition) and 1.0's choice to show overnight gains (first
set of the day) rather than within-session trends. **Corrects** the citation: the paper gives no number usable for
speech — its thresholds were 360–900 two-interval trials of a pip discrimination, and it says nothing about
listen-only exposure, so the half-trial rule must rest on Wright 2015 (and Wright 2010) alone. Our ≥ 40 trials is
an untested floor: one task in this paper needed more than 360.

**Recommended change.**
- 1.1 B1 (medium confidence): keep concentration, make T_ex a parameter in js/engine/dials.js MODEL, default
  ≥ 60 scored trials (≈ 3 sets) for the one exercise whose condition is new or at its edge in that sitting, ≥ 40 for
  the others; sets of one exercise within ~30 min of each other (Little 2017 via R7). Cite Wright 2015 for 40–80
  sentences per session, this paper for the principle only.
- 1.1 B7 (new bet, cheap): seeded assignment of T_ex (40 vs 80 scored trials per exercise per training day) with
  the next-day first-set residual as the outcome, logged in the pooled export. Nobody has measured the daily
  threshold for speech-in-noise training; community data could, within weeks.
- Game and plateau texts (confirms 1.0): never judge progress by within-session trends; show growth across days.
  Expect day-1 gains to be partly procedure (C3's "measuring your start" week is right).

## 6. Nahum, Nelken & Ahissar 2010 — stimulus uncertainty and the use of a fine binaural cue

Nahum M, Nelken I, Ahissar M (2010). Stimulus uncertainty and perceptual learning: similar principles govern
auditory and visual learning. Vision Research 50(4):391–401. doi:10.1016/j.visres.2009.09.004. **Read level:
full text** (11 pages; numbers from the text, curves from Figs. 3–6).

**Procedure.**
- Task: two-alternative identification of two Hebrew pseudo-words one phoneme apart (/barul/–/parul/; control pair
  /dilen/–/tilen/), one female talker, two tokens per word, in speech-shaped noise fixed at 66 dB SPL over
  headphones (noise 1.4 s, word 0.8 s). Word level adaptive, 3-down/1-up (79.4 %), steps 2 → 0.1 dB, 75 trials per
  configuration per block, separate staircases per configuration; face feedback after every answer.
- Two binaural configurations that sound the same: diotic (signal and noise identical at both ears) and dichotic
  (signal phase-inverted at one ear). Binaural benefit = diotic minus dichotic threshold, i.e. how much of the fine
  low-level binaural cue is used. Listeners did not notice the manipulation.
- Protocols: consistent (separate 75-trial blocks per configuration), 1–1 (diotic on odd, dichotic on even trials:
  variable but fully predictable, unannounced), mixed (random). Exp I: 90 students (30 per protocol), one block.
  Exp II: 14 per protocol trained 7 sessions (1–3 days apart), 3 × 150 trials a day (~25 min); 10 per group then
  tested on another protocol (day 8), their own again (day 9) and a new word pair (day 10); a control group trained
  /dilen/–/tilen/.

**Findings.**
- Session 1: binaural benefit 7.8 ± 0.5 dB with consistent blocks, but only 5.2 ± 0.8 with 1–1 alternation and
  4.9 ± 0.4 random — **predictable alternation was no better than random on day 1**. Diotic thresholds (overall task
  difficulty) did not differ between protocols. Staircases settled by about trial 40.
- Training: diotic thresholds improved 4–5 dB in all three groups alike — random mixing did not slow the general
  learning. Binaural benefit: consistent 7.2 → 7.6 dB (already full), 1–1 5.4 → 8.4 dB (most of it between day 1 and
  day 2, a little more to day 5), random 5.0 → 6.1 dB (still below the others on day 7).
- Transfer to the random protocol after 7 days of consistent or 1–1 training was complete (benefit 7.4 and 7.9 dB vs
  4.9 dB for naive listeners in random; diotic thresholds also carried). Random-trained listeners moved to 1–1 kept
  their diotic gain; their benefit rose to 7.2 dB (trend, p = .06). Once learned, trial-to-trial uncertainty no
  longer hurt.
- Learning was specific to the trained phonological contrast: no transfer of thresholds or binaural benefit to the
  other word pair, in either direction.
- Authors' reading (reverse hierarchy theory): random variation of a fine low-level cue blocks the top-down search
  for it; patterning or "tagging" lets each configuration be found separately, but only if the configurations are
  distinct enough to be told apart; explicit labels were proposed, not tested. Their earlier work: with words that
  differ widely, protocol does not matter.

**Earshot's current assumption and where it lives.**
- R7 summary from the abstract (docs/research/v1.1/R7-progression.md:356–363) and recommendation 2 (R7:479–500):
  cue-type dials go blocked → serial (announced runs of 3–5) → random; focus dial sticky for 5–6 trials; gate
  blocked → serial after ≥ 40 trials on ≥ 2 days. Plan 1.1 B2 (docs/dev/PLAN-v1.1.md:39–41); ACCESS 1.1 item 3
  (docs/research/ACCESS.md:52).
- 1.0 behaviour: the focus dial is chosen per edge trial by a softmax bandit with 20 % exploration
  (js/engine/controller.js:145–153, :249–273), so in Crowd with headphones the spatial dial's role switches
  unpredictably trial by trial; at variety ≥ 0.5 the whole scene is also rotated at random by up to ±30° per trial
  (js/engine/items/crowd.js:134).

**Verdict.** Confirms the core of B2: blocked practice gives full use of a fine binaural cue at once, random mixing
keeps it partial even after 7 days, and blocked or patterned training transfers fully to random. **Corrects** three
details: (a) a predictable alternation stage costs as much as random on its first day and pays off from the second —
the unit of the gate is days, not trials; (b) the cost of random mixing is confined to the fine cue — overall
speech-in-noise learning was the same in every protocol, which supports roving content and talkers early;
(c) run lengths of 3–5 and announced cues are not tested here (alternation was every trial and unannounced).
Evidence: binaural phase cue (N0Sπ) with nonsense words, young adults, lab headphones; Earshot's spatial cue is
HRTF-based ITD/ILD — related, not identical.

**Recommended change.**
- 1.1 B2 gates (medium confidence): blocked → serial after the condition has been trained on ≥ 2 days (keep ≥ 40
  trials as a floor); serial → random only after the serial stage itself has run on ≥ 2 days (then the switch-cost
  test). Do not judge the serial stage on its first day.
- 1.1 Crowd with headphones (medium confidence; uses the existing `set.focus` pin): for a player's first ≥ 2
  headphone days, hold the spatial dial as the focus for whole sets and fix the scene rotation at 0°; only then
  allow per-trial focus choice and rotation (crowd.js:134).
- Strictness follows fineness: apply the staged schedule where the answer needs a fine cue — spatial layout,
  voice similarity at small ΔF0, and the sound-alike options planned in A2 — and rove freely where options differ
  widely (Nahum's earlier work: no protocol effect for dissimilar words).
- Item variety (confirms A3): a trained contrast did not carry to a new one; keep foils and contrasts varied.

## 7. Felty, Buchwald & Pisoni 2009 — adaptation to frozen babble

Felty RA, Buchwald A, Pisoni DB (2009). Adaptation to frozen babble in spoken word recognition. J Acoust Soc Am
125(3):EL93–EL97. doi:10.1121/1.3073733. **Read level: full text** (5 pages of letter; Figs. 1–3 read from page
images).

**Procedure.** 96 native-English undergraduates, headphones at 77 dB SPL; 1,428 English words sampled to match the
lexicon, one male talker; 6-talker babble (3 m, 3 f) at S/N 0, 5 and 10 dB, word centred with 420 ms of babble
before and after; each listener heard 357 words (a third at each S/N), self-paced, **open-set typed answers**.
The first 48 listeners heard one fixed babble segment that always started at the same point ("frozen"); the next 48
heard randomly chosen segments. Not randomised: the groups ran one after the other, and the level-equalising
procedure changed at the same time (the authors acknowledge it). A by-product of a larger study.

**Findings.**
- Mean accuracy 57.7 % (frozen) vs 48.0 % (random), t = 9.75; split halves of each group agreed (58.3/57.5 vs
  46.2/47.1).
- The gap grew with exposure (50-trial moving windows): frozen ≈ 50 → 61–63 %, random ≈ 44 → 49–50 %; the fitted gap
  rose from ≈ 8 to ≈ 15 points (r = 0.77 with trial window). Per S/N, first → last window: 10 dB frozen ≈ 72 → 79–81 vs
  random ≈ 64 → 69–71; 5 dB ≈ 54 → 67–69 vs ≈ 46 → 51–52; 0 dB ≈ 22 → 37–40 vs ≈ 20 → 26–28 — at 0 dB the groups
  started nearly level, so the divergence there is learning, not the level procedure. Most of the frozen group's
  rise came within ~100–150 trials. Per-listener learning slopes 0.033 vs 0.012 (p < .01), with no S/N effect.
- Not tested: whether adaptation to the frozen babble carries to new babble.

**Earshot's current assumption and where it lives.**
- "Fresh noise every trial" (docs/research/ACCESS.md:53); R9's inference that the 9 training beds (10-s loops,
  ≈ 90 s in all) recur often enough to be learned (docs/research/v1.1/R9-anti-strategy-transfer.md:62–68, ranked
  first at :561, "could not open" at :581–583); Plan 1.1 A1 (docs/dev/PLAN-v1.1.md:19–22) and D4's ≥ 20 recorded beds
  (PLAN-v1.1.md:77–78); R3's unverified mention (docs/research/R3-cocktail-party-distance-mechanisms.md:772–773).
- What 1.0 actually renders: speech-shaped and pink noise are synthesised per trial from a generator forked from
  the trial seed, and babble beds are assembled live from 4–8 training sentence clips at random offsets
  (js/audio/render-prep.js:110–157; js/audio/render.js:40, :136–142; js/engine/items/data.js:181–199). Only the
  recorded ambience beds (café, hum, party, street, station: 10-s loops, docs/dev/STIMULI.md:59, :120) are reused,
  from a random offset (render-prep.js:158–167). Far uses one of them on **every** trial (js/engine/items/far.js:53–54);
  Echo uses only the café bed below variety 0.4 (js/engine/items/echo.js:163); Crowd adds them from variety 0.3
  (js/engine/items/crowd.js:145–146). Lab probes use fresh speech-shaped noise (js/lab/probes.js:98, :145).

**Verdict.** Confirms the direction of A1 with numbers: a repeated babble sample is learned within one sitting and
lifts word scores by ≈ 10 points on average (≈ 15 by the end of 357 trials). **Corrects** the premise of A1: 1.0
already renders fresh noise and live babble; the reused audio is the recorded ambience, concentrated in Far (the
owner's second priority) and early Echo. Our loops are random-offset windows into 10-s recordings, not one frozen
segment, so the effect in Earshot is likely smaller — unknown. Evidence quality is modest (non-randomised groups,
a level-procedure confound; the 0-dB curves are the cleanest part).

**Recommended change.**
- 1.1 A1, retargeted (medium-high priority, low cost): make Far's room noise a per-trial mix — live babble as in
  Crowd + fresh room-coloured pink or speech-shaped noise + the recorded ambience at a lower, jittered level with a
  random offset; jitter spectral tilt (e.g. ±3 dB/octave) per trial. Give Echo's low-variety list babble and
  synthesised noise next to the café bed. D4's ≥ 20 recorded beds still helps.
- Measurement (cheap, new): log bed id and offset per trial; in pooled data, test whether accuracy rises with how
  often that bed has been heard (controlling for the dials) — a direct check for noise-memory inflation in
  Earshot's own data. Count confirmed marks (C1) on fresh-noise trials.
- Wording: until A1 lands, describe Far's in-game growth as growth in Earshot's rooms; the Lab's fresh-noise
  probes are the evidence for listening gains.

## 8. Recommended changes, ranked by impact (expected effect on validity or transfer × confidence)

| # | Change | Source | Where now | When | Confidence |
|---|---|---|---|---|---|
| 1 | Crowd with one other voice: floor TMR at 0 dB now; in 1.1 rove each masker's level (±4 dB) and, with one other voice, randomise which voice is louder and adapt the size of the level difference (0 dB = hardest) — removes "follow the quieter voice" and the non-monotonic region | Brungart 2001 (Figs. 1, 7); Darwin 2003 (plateau below 0 dB for < 3 st) | js/engine/dials.js:31; js/engine/items/crowd.js:141, :145; PLAN-v1.1 A1 (docs/dev/PLAN-v1.1.md:21–22) | 1.0.x floor; 1.1 A1 roving | high (phenomenon), medium (size in Earshot, bed rises with masker) |
| 2 | Correct claims: Whitton ≈ 35 h median (goal 28) in 30–60-min sittings; ≈ 25 % relative gain in sentences/digit streams (≈ 1.5 dB), none for single words; transfer gone at 2 months; full text read. Brungart: the 40-point case is the same talker; cite directly. LiSN & Learn: in-game gains ≈ 2× test gains; separation was fixed, not adaptive | Whitton 2017; Brungart 2001; Cameron & Dillon 2011 | docs/guide/guide.html:109, :135, :152, :504; R3:803 | 1.0.x (guide 1.0.1) | high |
| 3 | Far's (and early Echo's) noise fresh per trial: live babble + room-coloured synthetic noise + the recorded loop at a lower, jittered level, random tilt; log bed id/offset | Felty 2009 (≈ 10-point frozen advantage, growing within a sitting) | js/engine/items/far.js:53–54; echo.js:163; render-prep.js:158–167 | 1.1 A1 (retargeted: SSN and babble are already fresh in 1.0) | medium |
| 4 | Maintenance after a season (e.g. two sittings a week) with a Lab re-check after 4–6 weeks; say that transfer vanished within 2 months without play in the one placebo-controlled study | Whitton 2017; Cameron 2011 (one child regressed) | PLAN.md:79 ("maintenance suggestion in the guide"); PLAN-v1.1 C4/B3 | 1.1 | high (need), low (dose) |
| 5 | B2 gates counted in training days (≥ 2 days per stage; the serial stage is not judged on its first day); Crowd with headphones starts with spatial-focus sets and no scene rotation for ≥ 2 headphone days; staging strictness follows cue fineness (spatial, small ΔF0, sound-alike options) | Nahum 2010 | js/engine/controller.js:145–153, :249–273; crowd.js:134; PLAN-v1.1.md:39–41; R7:479–500 | 1.1 B2 | medium |
| 6 | Learner floor for Crowd slots that show other voices' words: 1/(1 + those voices) per slot (0.5 / 0.33 / 0.25), or fitted from pooled data; count intrusions separately | Brungart 2001 (nearly all errors at 0 dB were the masker's words) and Darwin 2003 (97–98 %) + Earshot's option design | js/engine/learner.js:232, :275; dials.js:110; common.js:5–7 | 1.1 M1 (sim-tested first) | medium |
| 7 | T_ex as a MODEL parameter: ≥ 60 scored trials for the exercise at its edge in a sitting, ≥ 40 for others; cite Wright 2015 for the numbers; seeded 40-vs-80 assignment in the pooled export to measure the daily threshold for speech | Wright & Sabin 2007 (principle only: per-day threshold, task-specific, 360–900 pip trials) | js/engine/planner.js:1–2, :97, :126–144; PLAN-v1.1.md:37–38 | 1.1 B1/B7 | medium-low |
| 8 | Similarity ladder: randomise the near-twin shift direction (0.94/1.06); log the closest masker's ΔF0; cap level 1 at 2–6 st; optional synthetic similarity continuum (resample + WSOLA) | Darwin 2003 | js/engine/items/data.js:106–133; dials.js:34–35 | 1.0.x (direction, logging); 1.1 (cap, continuum) | medium |
| 9 | Seek: add a "Trace" board (keep on a hidden path, tracking error as the skill meter, ratchet on SNR ceiling and path corners); offer concentrated Seek weeks; state that 1.0's Seek dose is ≈ 15–20× below the study's | Whitton 2017 | js/engine/items/seek.js:1–6; dials.js:88–96, :115; PLAN.md:119–122 | 1.1 (bet) | medium-low |
| 10 | Fixed "yardstick" sets per exercise every ~2 weeks (fixed dials, fresh items) to measure in-game learning apart from the adaptive track; feed C1 marks | Whitton 2017 | PLAN-v1.1 C1/C2 | 1.1 | medium |
| 11 | Lab spatial-release check (headphones): own sentences and voices, two same-voice distracters co-located vs ±90°, report the difference | Cameron & Dillon 2011 (difference scores retest-stable, 0.1 dB) | js/lab/probes.js (all probes mono) | 1.1 E | medium |
| 12 | Pooled test of noise-memory inflation: accuracy vs times that bed was heard | Felty 2009 | B6 export fields | 1.1 B6 | medium |
| 13 | "I didn't catch it" key: replay once easier, score as a miss without a guess | Cameron & Dillon 2011 | js/core/answer.js; PLAN-v1.1 A7 | 1.1 | low-medium |
| 14 | Two-voices probe: keep as released; check pooled thresholds — if most fall below 0 dB, the level cue and a ≈ 1/3 floor are part of what it measures; design E1 with level-rank roving | Brungart 2001 | js/lab/probes.js:182–213, :190 | pooled-data check; 1.1 E1 | medium |
| 15 | Small text fixes: R3's octave dip applies to monotone speech only; optional auditory Stroop as a pooled predictor | Darwin 2003; Whitton 2017 | R3:119–121 | any | high / low |

Not changed by these papers: Crowd's similarity gaps (≈ 20 and ≈ 40 points) and super-additive F0 + tract cues;
the concentrated-dose principle; roving content and talkers early (random mixing did not slow general learning in
Nahum 2010); fresh speech-shaped noise in the Lab probes.

Finished 2026-11-28 17:51 UTC. Scratch text and page images were made outside the repository and deleted after
reading; nothing from the PDFs is in the repository.
