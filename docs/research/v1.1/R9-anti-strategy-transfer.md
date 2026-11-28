# R9 — Anti-strategy measures, transfer to real-world listening, and whether more stimulus variety helps

Research notes for Earshot 1.1. Started 2026-11-28 16:38 UTC; finished time on the last line.
Status: complete for this pass; gaps in §8.
Builds on docs/research/R1–R4 (read first; their findings are cited as "R1 §x" and not repeated).
Reading-depth tag on every source: [full text], [abstract only], [secondary report: where].
All wording is paraphrase. Paths are repository-relative. Budget: at most 12 web searches.

## 0. Search log
All 12 searches ran between 16:38 and 16:57 UTC on 2026-11-28; pages were opened only from search results.
- S1 Raviv, Lupyan & Green 2022 variability review → NSF public-access manuscript (read in two passes).
- S2 HVPT meta-analyses → Uchihara, Karas & Thomson 2025 (SSLA, open PDF); Zhang, Cheng & Zhang 2021 (JSLHR,
  abstract on a university page).
- S3 roving / identical-stimulus learning → Banai & Amitay 2012 (abstract); Micheyl et al. 2009 (full); an APP 2011
  attention study (full body); Jones et al. 2013 (full); PubMed Central primaries behind a browser check.
- S4 fuzzy scoring of typed transcripts → Bosker 2021 (full); Autoscore 2019 (abstract).
- S5 open- vs closed-set formats → Sommers, Kirk & Pisoni 1997 (abstract); Clopper et al. 2006 (Thieme) and an
  Indiana repository copy blocked; an ASHA 2019 hit refused.
- S6 recent transfer RCTs/reviews → Henshaw et al. 2021/22 Cogmed RCT (full to mid-Discussion); Chae & Bahng 2023
  (abstract); other hits already in R1/R3 or behind PubMed Central.
- S7 Whitton et al. 2017 → abstract via a library discovery record (PubMed and PMC refused).
- S8 lipreading training with feedback (Bernstein et al.) → only ASHA and PubMed Central hits; all refused.
- S9 rapid guessing detection → Soland, Kuhfeld & Rios 2021 (full); Kröhne, Deribo & Goldhammer 2020 (full).
- S10 learning of repeated noise → Agus et al. 2010 (abstract); Viswanathan et al. 2016 (full).
- S11 communication-strategy training → Hickson et al. 2019 I-ACE (full); Watson et al. 2021 ACE To HEAR (full).
- S12 implementation intentions → Gollwitzer & Sheeran review chapter (full, NCI construct page).

## 1. Task-specific strategies and shortcuts

### 1.1 Learning that needs no signal: task, attention and procedure
- **Amitay, Irwin & Moore 2006, Nature Neuroscience 9:1446–1448** [secondary report: Micheyl et al. 2009]. Listeners
  "trained" on an odd-one-out task with three identical tones (chance performance, no physical difference) improved
  frequency-discrimination thresholds about as much as listeners trained with real differences.
- **Micheyl, McDermott & Oxenham 2009, Attention, Perception & Psychophysics 71(1):5–7, doi:10.3758/APP.71.1.5**
  [full text, McDermott lab PDF]. A signal-detection model: internal noise (σ ≈ 15 Hz) makes identical tones sound
  > 8.5 Hz apart on half of trials, enough to drive learning, so no new mechanism is needed. Modelling only.
- **Attention, Perception & Psychophysics 2011, doi:10.3758/s13414-011-0148-0** [full text body; title page and
  author list not visible in the copy read; the study is from the Amitay/Moore group per its citations]. Same
  "impossible" identical-tone task, 8 × 100 trials with random feedback, n = 58: listeners told to attend to pitch
  improved frequency discrimination; listeners told to attend to loudness improved intensity discrimination and
  shifted their interval bias. **What the trainee attends to, not the stimulus, decided what improved.**
- **Jones, Moore, Amitay & Shub 2013, JASA 133(2):970–981, doi:10.1121/1.4773864** [full text, City University
  repository]. Frequency-discrimination learning (15 listeners, 4 × 1,600 trials) was mostly a fall in internal noise
  (≈ 4.5 → 2.9 Hz). The authors note in passing that learning is slower when training stimuli are randomly varied.
- Reading for Earshot: part of any on-task gain is learning the task itself (what to attend to, when, how to
  respond), which can happen without any perceptual change. This is why in-app scores must not be read as listening
  gains and why probes must be untrained (R4 §2). It also says instructions are a lever: telling the player which
  cue to attend to (voice pitch, location, timing) shapes what is learned.

### 1.2 Memorising the noise itself
- **Agus, Thorpe & Pressnitzer 2010, Neuron 66(4):610–618, "Rapid formation of robust auditory memories: insights
  from noise", doi:10.1016/j.neuron.2010.04.014** [abstract only, Queen's University Belfast portal]. Listeners
  detecting repetitions inside noise bursts (up to 4 s) implicitly learned noise samples that recurred unannounced
  across a block; performance jumped abruptly to near-perfect once a memory formed; several noises were remembered
  for weeks; learning was unsupervised, resisted interference from other noises, and relied on features local in
  time.
- **Viswanathan, Rémy, Bacon-Macé & Thorpe 2016, Frontiers in Neuroscience 10:490, "Long term memory for noise…",
  doi:10.3389/fnins.2016.00490** [full text, Frontiers PDF]. 25 adults; 500-ms Gaussian-noise segments heard
  repeatedly in one session were still recognised better than new noise about 4 weeks later; recognition survived
  shifting the loop start and even shuffling 10–20 ms chunks, so the memory is for very short patterns. Not about
  speech.
- Reading for Earshot (inference, not a speech finding): Earshot's 9 training beds are 10-s loops (≈ 90 s of bed
  audio in total, docs/dev/STIMULI.md) heard across thousands of trials, so specific stretches of each bed recur
  often enough to be learned. A gain that partly reflects familiarity with those exact stretches would not carry to
  a new noisy room. Fresh noise per trial (synthesised speech-shaped or modulated noise from a new random seed,
  babble assembled on the fly from many talker clips at random offsets) removes that shortcut at almost no byte
  cost. Felty, Buchwald & Pisoni 2009 (JASA Express Letters; "frozen" vs varying babble) would test this directly in
  speech but was not opened (§8).

### 1.3 Closed sets, item memory and guessing (collected from R1, R4 and §2.2)
- **The closed vocabulary is learned.** Matrix tests improve +1.1–1.2 dB from list 1 to 2 and +0.3–0.5 dB from 2 to
  3 (Puglisi et al. 2015); earlier exposure is still worth ≈ 1.5 dB months later, and ≈ 2 dB of improvement over a
  year of repeated use is reported (Schwarz et al. 2026) (R4 §2a, both full text).
- **The option list itself helps most when the masker is speech.** Closed-set matrix answers lowered the SRT by
  0.6 dB (n.s.) in steady noise but 1.2 dB (significant) with a speech-like fluctuating masker (Holube 2012, R4 §3,
  full text): with partial glimpses, four options let a listener finish the word.
- **Item-bound learning.** Small closed sets learn fast but stay tied to their items; larger sets learn slower
  (Humes 2009 vs Burk & Humes, R1 F12); in a 2019 RCT only trained items improved (R1 F1); 50–80 % lexical overlap
  between training and outcome lists made "transfer" look larger (R1 F9).
- **Closed sets hide the processes a party taxes**: talker normalisation and lexical competition (Sommers et al.
  1997, §2.2).
- **Guessing.** With k options a blind guess is right 1/k of the time; Earshot 1.0 draws foils from each slot's
  answer distribution and from masker, neighbour and context words, and its simulated shortcut responders stay
  within chance + 0.06 (docs/dev/STATE.md), so option-reading strategies do not pay. Guessing still adds noise to the
  staircase and the learner model (§6).

### 1.4 Level, timing and position cues
- **Level as a segregation cue.** In call-sign tasks with same-sex or same-voice interferers, most errors are the
  interferer's words (confusions, not inaudibility) (Brungart 2001 via Bronkhorst 2015, R3 §1 [secondary report]).
  R3 lists as unverified a plateau in that study's scores at negative target-to-masker ratios; our understanding
  (also unverified) is that listeners can then use the level difference itself to find the target. If the target is
  always the loudest voice at the easy end and always the quietest at the edge, "find the loudest/quietest voice"
  becomes a usable rule that real rooms do not offer.
- **Knowing where and when.** Knowing the target's location is worth 10–40 points against knowing only its call
  sign (Kidd et al. 2005 via Bronkhorst 2015, R3 §1); location switches between turns cost ≈ 10 points and double
  masker confusions (Lin & Carlile 2015, R3 §5). A fixed lead-in before every target, a fixed target position in the
  phrase or a fixed spatial position are the timing/position analogues: they let a player attend a slot rather than
  follow a voice. A short room lead-in is still useful (room calibration within ≈ 0.5–3 s, R2 §1.6, R3 §10), so
  jitter it rather than drop it.
- **Earshot 1.0 status (code read for this note):** Crowd asks the word *and* the number on each trial when the
  build has ≥ 3 numbers (js/engine/items/crowd.js), so listening for one slot does not pay there; Echo asks two or
  three facts after a delay. The answer panel times responses from the moment its keys are enabled
  (js/core/answer.js `rts`), which is the right clock for §6. Not checked: whether option labels are visible
  while the audio plays (if so, the player listens for four known words, a prior that conversation never gives).

### 1.5 How much strategies and practice inflate gains
- Untrained retest/practice gains are as large as real training effects. Probe practice effects: ≈ 0.9 dB (steady
  noise), ≈ 2.0 dB (babble), ≈ 1.8 dB (AM noise) over six runs (Buss et al. 2015); 2.2–4.3 dB for modulated maskers,
  ≈ 0.3 dB for steady noise (Lie et al. 2024) (R4 §2a). Controlled training effects are ≈ 0.3–1.3 dB (R1 §3.8).
- Task practice alone moved a new same-accent talker from ≈ 65 to ≈ 82 RAU in Bradlow & Bent 2008, as much as
  single-talker training (R4 §4b). HVPT control groups gained ≈ 2.7 points (§3.2).
- Randomised and blinded studies of computer-based auditory training show ≈ 0 transfer to untrained speech in
  noise, while non-randomised studies show large effects (Fallahnezhad et al. 2023, R1 §2.2): design artefacts and
  task learning, not listening skill, drive much of the published "transfer".
- Effects are larger when the training and the test conditions match (Chae & Bahng 2023, §4) — the specificity
  signature that anti-strategy design has to break.

### 1.6 Audit of Earshot 1.0 against these risks
| Risk | 1.0 status (source) | Gap for 1.1 |
|---|---|---|
| Option-based guessing | foils from answer distributions; shortcut responders near chance (STATE.md) | none in the generator; logs not yet used for detection (§6) |
| Closed set only | every training answer is a tap among options | no open-set trials or probe (§2.2) |
| Learning the item set | 16 call signs, numbers one–nine, 125 nouns (STIMULI.md) reused across sessions | gains partly reflect the vocabulary, as in matrix tests; add open-vocabulary material |
| Learning the noise | 9 training beds of 10 s loops, 43 babble clips (STIMULI.md) | fresh noise per trial (§1.2) |
| Learning the synthesiser | 37 Kokoro + 20 Piper training voices from two neural TTS models; 10 natural LibriVox readers | model-wide regularities never vary; more natural speech (§3) |
| Learning the room generator | synthetic rooms only; late field carries no energy above ≈ 3.6 kHz (DECISIONS.md 2026-11-26) | measured rooms for heterogeneity (§3.6) |
| Level / onset regularities | not audited here | level-rank and onset roving (§7) |
| Probe vocabulary learning | Rooms, New voice and Matrix share the matrix vocabulary (DECISIONS.md) | practice lists before baselines (R4 §2) and report change against retest expectations |

## 2. Measures that block strategies and promote generalisation

### 2.1 Roving (trial-to-trial variation) and when it hurts
- **Banai & Amitay 2012, Vision Research 61:83–88, "Stimulus uncertainty in auditory perceptual learning",
  doi:10.1016/j.visres.2012.01.009** [abstract only, Israeli university research portal]. Review of speech and
  non-speech studies. Roving (unpredictable trial-to-trial changes in the stimulus to be judged) impedes perceptual
  learning in some conditions and not others. Two accounts: (a) uncertainty hurts when the interleaved stimuli or
  tasks are **similar** to each other and not when they are clearly distinct; (b) in Reverse Hierarchy Theory terms,
  uncertainty blocks the search down to fine-grained sensory detail. Uncertainty may even **help when the task is to
  sort stimuli into phonological or acoustic categories**; speech/non-speech differences are put down to the tasks
  usually used with each.
- PubMed Central blocked the related primaries with a browser check (see §8).
- Reading for Earshot: roving that is harmful in psychophysics is roving of the *judged* dimension between similar
  values (e.g., two nearby reference tones). Earshot's tasks are word identification (categorisation), where the
  review expects uncertainty to be neutral or helpful. The exception is the cue a player is trying to learn
  (the target–distractor voice difference in Crowd; a new accent's shifted cue in Strange): keep that steady within
  a block while it is new, rove the irrelevant dimensions (level, masker token, onset, room, sentence) freely.

### 2.2 Open-set responses: why, and how to score them automatically
- **Sommers, Kirk & Pisoni 1997, Ear and Hearing 18(2):89–99, "…I: The effects of response format",
  doi:10.1097/00003446-199704000-00001** [abstract only, Washington University profile]. Normal-hearing,
  noise-masked normal-hearing and cochlear-implant listeners. In **open-set** report, multi-talker lists were harder
  than single-talker lists and lexically "hard" words (many sound-alike neighbours) were harder than "easy" words. In
  **closed-set** formats neither effect appeared, even with maximally confusable alternatives. The authors conclude
  closed-set tests do not capture the talker normalisation and lexical discrimination that word recognition needs.
- Reading for Earshot: a 4-option tap removes lexical competition with the rest of the lexicon and the cost of
  talker variability — exactly the processes a noisy party taxes. Closed sets stay useful (fast, phone-friendly,
  steep and reliable for probes, R4 §1c), but at least part of training and one probe should be open-set.
- **Bosker 2021, Behavior Research Methods 53(5):1945–1953, "Using fuzzy string matching for automated assessment
  of listener transcripts in speech intelligibility studies", doi:10.3758/s13428-021-01542-4** [full text, MPI
  accepted manuscript]. Token Sort Ratio (lower-case, strip punctuation, sort words alphabetically, then
  2·matches/total characters × 100) correlated with human percent-words-correct at r = 0.89 (cocktail-party data) and
  0.94 (speech-in-noise data), overall 0.92; Autoscore 0.90 overall; plain Levenshtein −0.79, Jaro −0.80. Handles
  typos ("wayer" for "water" scores 80); ignores word order; orthographic only, so homophones fail; overestimates
  intelligibility below ≈ 25 % words correct; telling a typo from a real error ("waiter" for "water") is hard for any
  method. Dutch data only. Tool: a Python script on OSF built on a token-sort-ratio function from a third-party
  library (licence not stated in the copy read — reimplement, do not copy).
- **Borrie, Barrett & Yoho 2019, JASA 145(1):392–399, "Autoscore: An open-source automated tool for scoring
  listener perception of speech", doi:10.1121/1.5087276** [abstract only, Utah State University repository; rules
  via Bosker 2021]. About 99 % agreement with human scorers on three data sets. Word-by-word exact matching in any
  order, English-specific handling of grammatical variants (e.g., plural/singular) and a default list of ≈ 300
  common misspellings; misspellings outside the list count as wrong.
- Reading for Earshot: score **per keyword**, not per sentence; accept a non-word within a small edit distance of the
  keyword (typo), but reject a typed **real word** that differs (a mishearing such as "waiter"); accept listed
  homophones and number words ↔ digits; ignore order. All three need only the item's keyword list plus a small
  homophone/variant table generated at build time from CMUdict (already in the pipeline), so it runs offline.
- Phone practicalities (implementation notes, not research findings): switch off the keyboard's autocorrect,
  autocapitalisation and spell-check on the answer field so the phone does not turn a typo into a different real
  word; accept digits or number words; show the scored keywords after each answer. Typing takes a few seconds,
  unlike an immediate spoken repetition, which abolished learning of a new contrast in Baese-Berk & Samuel 2022
  (R1 §3.7; a 2.5–5.5 s delay restored it); whether typing itself interferes was not tested. Spoken
  answers would need a speech recogniser on the device; whether browser recognisers keep audio on the device was
  not researched here, and the data-on-device rule forbids anything else.

### 2.3 Uncertain targets and catch trials
- Uncertainty is one of the strongest informational-masking levers: knowing only *who* (call sign) and not *where*
  costs 10–40 points (Kidd et al. 2005, R3 §1); switching location between turns costs ≈ 10 points (Lin & Carlile
  2015, R3 §5). Conversations are full of both. Cued attention-switch practice is untested (R3 §14 item 10).
- **Catch trials** (the caller never speaks; only distractors talk) were not studied as a training factor in any
  source we found. The reasoning for them: (a) "always tap something" stops paying; (b) a false-alarm rate lets the
  app separate bias from sensitivity (detection-theory logic, as in the identical-stimulus studies of §1.1); (c) real
  listening includes monitoring for one's name or one's partner among talkers who are not addressing you. To keep
  the catch itself from becoming a cue, the "not there" key must be present on every trial and catch trials must be
  rare (our choice: about 1 in 12) and excluded from staircase steps.

### 2.4 Natural speech, connected speech and predictability (collected from R2, R3)
- Sentence context lets listeners skip the hard cue (Fu et al. 2005, R2 §3.7); semantically anomalous sentences
  force bottom-up listening and still transfer to meaningful sentences (Loebach et al. 2010, R2 §3.3); hard
  materials make learning specific to their type and the authors recommend varied materials (Loebach & Pisoni 2008,
  R2 §3.7). Context helps most at low-but-not-extreme SNRs and later words can repair earlier ones (R3 §6);
  narrative-in-babble training gave ≈ 2 dB in implant users without controls (Green et al. 2019, R3 §6).
- Learning synthetic speech is a skill of its own (Fenn/Nusbaum line of work, R2 §1.7). Earshot's training speech
  is almost all neural TTS (§1.6), so part of what players learn may be the synthesiser. Mixing in natural speech is
  the remedy (§3.6).
- Casual, reduced and conversational speech learning was never researched in R1–R4 or here (R2 gap list).

### 2.5 Feedback that teaches (collected from R2 §3.3, R3 Cross-cutting)
- The common active ingredient: hear the degraded item again while knowing what it says. Degraded–clear–degraded
  equals degraded–text–degraded and beats plain repetition (Davis et al. 2005); degraded replay with text beat
  clear-audio feedback (Loebach et al. 2010); text shown during the degraded audio left the only gains still
  present a week later (Borrie et al. 2012); feedback matters most when training accuracy is low, and an
  easy-to-hard ramp can replace it (Guediche et al. 2016); text shown just before the audio gives the largest
  momentary clarity boost (Sohoglu & Davis 2016).
- Earshot 1.0: Echo auto-replays a missed message in the noise with its words on screen (DECISIONS.md); Crowd
  replays the followed voice alone, then the crowd again, after a miss (js/ex/crowd.js header). 1.1: make "the same
  mix again, with the words on screen" the uniform after-miss replay in every exercise, and one tap away after hits.

### 2.6 Mixing tasks within a session
- Interleaving *similar* stimuli or tasks interferes, distinct ones much less (Banai & Amitay 2012, §2.1); updating
  two talker models at once needs double the exposure (Luthra et al. 2021, R2 §3.1); a second task inside a trial
  disrupts learning (Baese-Berk & Samuel 2022, R1 §3.7); alternating practice with task-free exposure matched
  continuous practice (Wright et al. 2015, R1 §3.7).
- The Cogmed trial's authors point to training dynamic cognitive control *inside* speech-in-noise listening rather
  than storage in isolation (Henshaw et al., §4) — an argument for listening tasks that carry a memory or switching
  load (Echo, Seek), not for separate memory games.
- Reading for Earshot: mixing distinct exercises in one session is safe; do not interleave trial by trial two
  similar versions of the same new judgement (two new accent families, two new rooms) while either is new.

## 3. VARIETY: does more variability help Earshot, and how much?

### 3.1 A framework: four kinds of variability (Raviv, Lupyan & Green 2022)
**Raviv, Lupyan & Green 2022, Trends in Cognitive Sciences, "How variability shapes learning and generalization",
doi:10.1016/j.tics.2022.03.007** [full text, NSF public-access accepted manuscript, par.nsf.gov/servlets/purl/10349008;
body read in two extraction passes; boxes and reference list only partly visible].
- Four sources, often confounded in studies: **numerosity** (how many examples: one talker vs several),
  **heterogeneity** (how different the examples are), **situational/context** variability (same items in more
  varied surroundings: rooms, noises), and **scheduling** (blocked/massed vs interleaved/spaced). The authors note
  numerosity and heterogeneity are usually confounded and rarely compared directly.
- Also separates variation on **task-irrelevant (non-discriminative)** dimensions from variation on **task-relevant
  (discriminative)** dimensions. Irrelevant variation teaches the learner what to ignore; relevant variation marks
  category edges but hurts novices (example given: infants fail minimal pairs when the diagnostic cue itself varies).
- Typical signature: variability slows early learning and lowers training accuracy, then improves generalisation.
- Three accounts (not exclusive): it highlights which dimensions matter; it covers the task space so new cases are
  interpolated, not extrapolated; it gives more retrieval cues (encoding variability; spacing forces reconstruction).
- When it hurts: early in acquisition, for novices with little prior knowledge, when variation is along the
  diagnostic dimension, and when training is short (blocked practice may then win). Prior knowledge lets learners
  profit from variability sooner.
- Dosing (no formal prescription): start low on diagnostic dimensions, vary irrelevant dimensions early, add
  variability as skill builds; adding it too late may be less effective because early hypotheses entrench. Few
  studies have tested the same variability introduced at different points in learning (a stated gap).
- Speech example: training with three talkers per dialect lowered training accuracy but improved dialect
  recognition for new talkers, versus one talker per dialect (Clopper & Pisoni, as reported in the review's Fig. 1).
- Two remarks useful to us: real-world variability is usually **skewed** (a few frequent sources, a long tail), yet
  lab work has mostly used even (symmetric) distributions; and proficient language users benefit from variability
  when tuning to accented speech (adults already "have the categories").
- Reading for Earshot: our players are adult native-level listeners with established categories, so most of what
  we vary (talker, room, masker, sentence) is variation the review expects to help; the exception is a dimension
  that is itself the cue being learned (e.g., the F0/VTL difference between target and distractor in Crowd, or the
  shifted cue in an accent family), which should be held steadier early.

### 3.2 High-variability phonetic training (HVPT): the meta-analytic picture
- **Uchihara, Karas & Thomson 2025, Studies in Second Language Acquisition 47:794–827, "High variability phonetic
  training (HVPT): A meta-analysis of L2 perceptual training studies", doi:10.1017/S0272263125100879** [full text,
  Cambridge open-access PDF; body read, appendices and references not].
  - 79 studies (99 pre–post groups, 35 treatment–control comparisons; mean group n ≈ 17). Training gain g = 0.92
    (0.71 after trim-and-fill); treatment vs control g = 0.67; gains held at delayed posttest (post→delayed g = −0.08,
    n.s.; lower-proficiency learners decayed a little, g = −0.23). Controls gained ≈ 2.7 points (g = 0.19).
  - Generalisation: no significant drop to new items from trained talkers; a small but significant drop to new
    talkers (g ≈ −0.25 for new item/new talker and old item/new talker — our reading: these compare
    generalisation tests with trained-item tests at posttest).
  - **Number of talkers (2–30, single-talker studies excluded by design): no overall effect.** In a follow-up,
    higher-proficiency learners gained more with more talkers up to about six (g = 0.66 at three, 1.44 at six);
    lower-proficiency learners showed no talker-number effect. The authors suggest "the vicinity of six talkers" as a
    starting point and warn that talker quality may be confounded with talker number.
  - Blocked (g = 0.99) vs intermixed talkers (g = 0.89): n.s. Feedback type: n.s. Real words vs nonwords: n.s.
    Identification training beat discrimination (0.95 vs 0.57). Total training time predicted gains only up to
    ≈ 400 min (≈ 6.7 h), then levelled off; average programme 8.9 sessions × 256 trials (≈ 2,043 trials).
  - Higher pretest accuracy went with smaller gains (r = −0.52) — headroom, as in R1 §4.
  - Limits: publication bias (Egger significant; effect fell after correction); moderators are correlational; 30 of
    79 papers had a control group; reliability reported in one study.
- **Zhang, Cheng & Zhang 2021, JSLHR 64(12):4802–4825, "The role of talker variability in nonnative phonetic
  learning: A systematic review and meta-analysis", doi:10.1044/2021_JSLHR-21-00181** [abstract only, University of
  Minnesota experts page]. 18 studies, 549 participants, high- vs low-variability comparisons. Immediate training
  outcome g = 0.46, but **−0.04 after removing outliers and correcting for publication bias**; immediate perception
  g = 0.56; production n.s.; **generalisation to new talkers g = 0.72**; long-term retention g = 1.09. Programme
  length and talker presentation format were possible moderators.
- **Brekelmans et al. 2022** (pre-registered, n = 166; R2 §2.1 [full text]): five talkers vs one gave +8.5 vs +7.6
  points on new talkers, an ambiguous difference; no aptitude × variability interaction.
- **Perrachione et al. 2011** (R2 §2.2 [secondary report]): trial-by-trial talker switching hurt low-aptitude
  learners of pitch-contour words; blocked high variability did not.
- Net: the talker-variability benefit is real but modest and mostly shows on **new talkers**, not on trained
  material; it is smaller in better-controlled and pre-registered work; it may need a minimum talker set (≈ 5–6) and
  proficient learners; mixing talkers trial by trial costs weaker learners on hard new contrasts. None of this was
  in noise, and the learners were acquiring new categories, which Earshot's players mostly are not (3.1).

### 3.3 Variability in speech-in-noise, accent and room learning (collected from R2, R3, R4)
| Dimension | Evidence of benefit | Evidence of cost or no benefit |
|---|---|---|
| Talkers of one accent | 5-talker training lifted a new same-accent talker to ≈ 90 RAU vs ≈ 82 after one talker (= task practice) (Bradlow & Bent 2008, R4 §4b); interleaved accented talkers beat blocked ones for new talkers at 90–98 % training accuracy (Tzeng et al. 2016, R2 §3.1) | single-talker training can generalise as well, depending on the talker pair; similarity to the test talker matters more than count (Bradlow et al. 2023; Xie & Myers 2017, R2 §2.3) |
| Accents | multi-accent exposure generalised to a new accent (Baese-Berk et al. 2013, R1 §4) | no training reached a different accent in Bradlow & Bent 2008; weak, inconsistent cross-accent effects (Alexander & Nygaard 2019, R2 §2.3) |
| Unfamiliar talker patterns | two shifted (synthetic) talkers generalised briefly to a new talker, one did not (Aoki & Zellou 2025, R2 §2.3) | — |
| Consistent distortions (vocoding, shifts) | learning already crosses talkers (Huyck et al. 2017, R2 §2.3); multi-talker helped shifted speech (Stacey & Summerfield 2007) | talker variability slowed compressed-speech learning without improving transfer (Tarabeih-Ghanayim et al. 2020; Banai et al. 2022, R2 §2.3) |
| Rooms | multi-room training generalised to new rooms (Vlahou et al. 2019, R3 §10) | switching rooms trial by trial costs; listeners calibrate to a room within ≈ 1–3 s, worth ≈ 2.7 dB (Brandewie & Zahorik 2010, R2 §1.6) |
| Maskers | — (masker variability against informational masking is untested, R3 §14 item 8) | babble-training effects are specific to the masker language and talkers (Van Engen 2012, R3 §1); dip-listening learning did not transfer between masker conditions (Lie et al. 2024, R4 §2a) |
| Materials | varied materials recommended; easy materials transfer across types (Loebach & Pisoni 2008, R2 §3.7) | hard materials (anomalous sentences, rhyme words) learn type-specifically (same source) |
| Speaking rate / style | — | fast-speech learning did not carry to babble (Shechter Shvartzman et al. 2022, R1 F16) |
| After sleep | cross-talker generalisation appeared only after sleep (Xie, Earle & Myers 2018); a 2026 review finds post-sleep generalisation most consistent when training variability supports abstraction (R2 §3.6) | — |

Pattern: variability on a dimension buys transfer **along that same dimension** (new talkers, new rooms) and
little beyond it; specificity is the default for maskers. So a variety plan has to name the dimension each
addition is meant to generalise along, and the probes should test that dimension with held-out instances.

### 3.4 What variety can cost
- **Lower training accuracy.** Expected from every source (Raviv et al.; Brekelmans et al.; Bieber 2021 via R1 §4:
  variability lowered in-training accuracy without slowing adaptation). In Earshot's staircases, more variety will
  settle the edge at an easier SNR. Without bookkeeping this reads as decline and can trip the plateau detector.
- **Novices and weaker learners.** Trial-by-trial talker switching hurt low-aptitude learners (Perrachione et al.
  2011); more talkers helped only higher-proficiency learners (Uchihara et al. 2025); interleaving a hard new
  contrast hurt, most for low-aptitude learners (Fuhrmeister & Myers 2020, R2 §3.1). The large pre-registered
  replication found no aptitude interaction (Brekelmans et al. 2022), so treat this as a risk to manage adaptively,
  not a rule.
- **Similarity interference.** Interleaving similar stimuli disrupts learning (Banai & Amitay 2012); two talker
  models at once need double exposure (Luthra et al. 2021).
- **Too little per instance.** Accent adaptation needs ≈ 12 sentences to a few minutes per talker (R2 Summary 6);
  room calibration needs ≈ 1–3 s of that room. Variety that never repeats a talker or room within a run trains
  first-impression listening only.
- **Intelligibility floor.** Material understood about half the time or less stalls adaptation (Bradlow et al. 2023;
  Guediche et al. 2016, R2 Summary 4). New hard voices need the existing tier check before they enter training.

### 3.5 Dosing rules for Earshot (a synthesis; untested as a package)
1. **Rove irrelevant dimensions from the first trial**: noise sample, overall presentation level (a few dB), lead-in
   length, sentence, talker within a tier, room within a type. Raviv et al. expect early variation on
   non-diagnostic dimensions to help.
2. **Hold a new cue steady, then interleave**: a new accent family, room type or masker type is first met in a
   short block (one talker or room for several trials), then mixed with familiar ones ("block to acquire,
   interleave to generalise", R2 §3.1).
3. **Make variety a dial**: raise variety when the player holds the edge on the other dials, lower it after a run of
   failures, and log the variety level of every trial. Raviv et al. note that introducing the same variability at
   different points of learning has rarely been tested; an adaptive variety dial is a **new bet** Earshot can test on
   its own logs.
4. **Numerosity floor, then heterogeneity**: HVPT showed no overall talker-number effect, and gains rose with talker
   number up to about six only for higher-proficiency learners (Uchihara et al. 2025); five talkers gave
   talker-independent accent adaptation in Bradlow & Bent 2008. Earshot is far above that (68 training voices).
   Beyond the floor, spend on **heterogeneity**: natural vs synthetic speech, different synthesisers, ages, rates,
   recording channels, real vs simulated rooms.
5. **Skewed exposure**: a few "regulars" (the cast) heard often plus a long tail of rare voices mirrors real life;
   Raviv et al. note that most lab work used even distributions. Untested in training — a second new bet.
6. **Keep probes fixed**: probes are not roved (fluctuating-masker SRTs depend on absolute level, R4 Summary 6),
   use held-out instances of each varied dimension, and keep alternate forms.
7. **Show variety as progress**: report the edge together with the variety it was held at, so "−3 dB with six kinds
   of noise" counts as better than "−4 dB with two".

### 3.6 Concrete additions for 1.1, with byte costs
Byte facts (docs/dev/STIMULI.md): clips are 16 kHz mono MP3 at 24 kbps, ≈ 3.3 kB per second of audio (starter pack:
342 s in 1.134 MB), plus ≈ 34 % in the base64 JS packs; 8.24 of 8.5 MB are used. Lazy packs work only on the Pages
build (the single offline file keeps the core set; lazy loading is already a 1.1 backlog item).

| # | Addition | Dimension (what it should generalise along) | Bytes | Evidence | Value / cost |
|---|---|---|---|---|---|
| V1 | Fresh noise every trial: speech-shaped and modulated noise synthesised from data/ltas.js with a new seed per trial; babble assembled live from the training speech clips (1–8 talkers, mixed sexes, random offsets); time-reversed speech maskers | masker samples; masker type | 0 | noise memory (§1.2); masker specificity (§3.3); talker-count effects (R3 §1) | high / low |
| V2 | A masker-type mix: steady, modulated, 8-talker, 2-talker, one competing voice, environmental bed; each logged | masker type | 0 (uses V1 and existing beds) | specificity is the default for maskers, so cover the types players meet | high / low |
| V3 | More recorded beds (true new samples, since noise memory survives chunk shuffling, §1.2) | environmental noise | ≈ 33 kB per 10-s bed; 20 beds ≈ 0.66 MB MP3 | §1.2 | medium / low (lazy pack) |
| V4 | Natural voices: more LibriVox readers (public domain) as open-set sentence material and maskers | natural vs synthetic speech; talker | 40 readers × 2 sentences × ≈ 3.5 s ≈ 0.9 MB | synthetic-speech learning is its own skill (R2 §1.7); heterogeneity (§3.5) | medium-high / medium (lazy pack) |
| V5 | Measured rooms: ≈ 20 impulse responses from a clean licence source in R6 (AIR, MIT; HybridReverb2, CC BY-SA 4.0), late field at 8 kHz as the engine already uses | rooms | ≈ 16 kB per second of response at 8 kHz/16-bit; 20 × 1 s ≈ 0.3 MB | multi-room transfer (Vlahou 2019); breaks synthetic-room regularities (§1.6) | medium / medium |
| V6 | Speaking-rate and style variety: selected items rendered at slower and faster synthesis speed (not playback rate, which shifts pitch) | rate | per clip, as now | weak (rate learning is specific, R1 F16) | low-medium / medium |
| V7 | Natural accented speech (speechocean762, backlog) next to the synthetic accent family | accents | backlog estimate | accent learning needs talkers spanning the type (R2 §2.3) | medium / medium |
| V8 | Bulk sentences on 40 Piper voices instead of 20 (backlog) at the same clip count | talker count | ≈ 0 | numerosity is already above the HVPT floor (§3.5) | low / medium |
| V9 | Task-format variety: typed answers, "not there" catch trials, unexpected questions after the audio | task | 0 | §2.2, §2.3 | high / medium |

### 3.7 Answer to the owner's question
Yes, more variety is good for Earshot's goals, in a specific form. Variety buys transfer along the dimension that
varies, so it is worth adding where the real world varies and the app does not yet: noise samples and noise types,
natural (non-synthetic) voices, real rooms, and answer formats. More of what Earshot already has plenty of (more
voices from the same two synthesisers) adds little. Every addition lowers in-app accuracy for a while, so it must
come with dosing (block new cues first, raise variety with skill) and with bookkeeping that credits the player for
holding the edge under more variety. The strongest additions (V1, V2, V9) cost no audio bytes.

## 4. Transfer evidence: what reached untrained tasks or daily life

R1 §2–§5 holds the main picture (reviews, the big null RCTs, small positive trials, fading); R3 "Cross-cutting"
holds mechanism-level transfer. Added or deepened here:

- **Henshaw, Heinrich, Tittle & Ferguson 2021/2022, Ear and Hearing 43(3):741, "Cogmed training does not generalize
  to real-world benefits for adult hearing aid users: results of a blinded, active-controlled randomized trial",
  doi:10.1097/AUD.0000000000001096** [full text to mid-Discussion, Nottingham repository; R1 had it only via abstract].
  Preregistered (NCT01892007), phase II, participants and assessors blinded; 57 hearing-aid users aged 50–74.
  Adaptive working-memory span training (target ≈ 60 % correct) vs the same tasks fixed at 3 items; 25 sessions
  over 5 weeks, 35–45 min/day, adherence 100 %. Large on-task gains; a trained-type task outside the software
  (backward digit span) improved (d = 0.59, kept at 6 months); **no untrained working memory, attention or
  speech-in-noise benefit**; a self-report change under 1 %. Better baseline working memory predicted more on-task
  learning, not more transfer. Authors' pointer: train dynamic cognitive control *within* speech-in-noise listening
  rather than storage in isolation.
- **Chae & Bahng 2023, Clinical Archives of Communication Disorders 8(3):192–210, "Effective duration of auditory
  training for speech perception in hearing-impaired listeners: a systematic review and meta-analysis",
  doi:10.21849/cacd.2023.01004** [abstract only, journal page]. 24 studies (1996–2021), hearing-aid and implant
  users. Larger effects with more than 600 min (10 h) of training than with less; no significant loss at follow-up;
  larger effects when **training and measurement conditions matched** (a specificity signature) and in children.
- **Whitton, Hancock, Shannon & Polley 2017, Current Biology 27(21):3237–3247.e6, doi:10.1016/j.cub.2017.09.014**
  [abstract only, library discovery record; R1/R3 had press releases]. Randomised, double-blind, placebo-controlled;
  older hearing-impaired adults; 8 weeks. The game: move a fingertip through a virtual soundscape and detect small
  mismatches between the sound the player's movement should produce and what is heard (prediction-error loop, "like
  an instrument"). Control: auditory working-memory training with matched expectations of benefit. ≈ 25 % more words
  in sentences or digit strings at high noise levels; the control did not change. **Individual gains were predicted
  by in-game accuracy and by baseline inhibitory control.** Gains faded without continued practice.

### 4.1 What transferred and what did not (one table; read levels in the cited notes)
| Training | Reached (untrained) | Did not reach / caveat | Where |
|---|---|---|---|
| Closed-loop audiomotor game, ≈ 8 weeks | words in sentences and digits in high noise (≈ +25 %) | faded without practice; one lab | §4; R1 §7 |
| Mixed psychoacoustic phone game (spectro-temporal, spatial, n-back; partly in noise), young adults at home | spatial release and digits in noise (between-group d ≈ 0.7) | gone at 1 month; high attrition | R1 §7, R3 §9 |
| Digits in noise and babble (implant users) | sentences in babble | no control group | R1 §4 |
| Five talkers of one accent | a new talker with that accent | not a different accent | R4 §4b |
| Several accents | a new accent | tiny samples | R1 §4 |
| Several rooms | new rooms | — | R3 §10 |
| Interrupted speech, 5 sessions | other gap types, kept ≈ 3 months | — | R3 Cross-cutting |
| Connected narrative in babble (implant users) | sentence SRTs with new talkers (≈ 2 dB, kept 4 weeks) | uncontrolled | R3 §6 |
| Spatial training (LiSN & Learn, children with a spatial deficit) | spatial measures (≈ 3 dB) | co-located conditions unchanged | R3 §3 |
| HVPT (L2 contrasts) | new items; retained at delay | small drop to new talkers; publication bias | §3.2 |
| Communication-strategy group course | self-reported disability, kept 6 months | self-report only | §5.1 |
| Working-memory training (blinded RCT; also the active control in audiomotor and F0 studies) | the trained task type | no speech in noise, no untrained cognition | §4; R3 Cross-cutting |
| Quiet phoneme-continua training | attention dual-task, a group-conversation item | no change in speech-in-noise SRTs | R4 §4a |
| Adaptive auditory brain-fitness suite (quiet) | ≈ 0.3 dB net in near-normal hearing | lost by 6 months | R1 §4 |
| Commercial hybrid programme (large RCT) | — | equal to placebo | R1 §2 |
| Music lessons (6 months piano, RCT) / choir | ≤ 0.4 dB / ≈ 1.3 dB (not randomised) | cross-sectional advantage shrinks to ≈ 0 after bias adjustment | R1 §3.4, R3 §8 |

What the transferring programmes share: training in noise or competition, close to the outcome; variety on the
dimension of the outcome (talkers → new talkers, rooms → new rooms, gap types → new gaps); about 10–30 hours; a
loop that makes the player predict or act; and loss without continued practice. Individual predictors: in-game
accuracy and inhibitory control (Whitton et al. 2017); poorest baselines gain most in every arm (regression to the
mean, R1 §4). Daily-life outcomes rarely moved in controlled trials (R1 F10) — the exceptions are the strategy
course (self-report) and isolated questionnaire items.

## 5. Bridges to real life

### 5.1 Communication-strategy training (the best-tested non-perceptual bridge)
- **Hickson, Worrall & Scarinci 2007 ACE randomised trial** [secondary report: Hickson et al. 2019 and Watson et al.
  2021, both full text]. 178 adults (mean age 74) with mild–moderate loss; Active Communication Education, a 5-week
  group course in problem-solving and communication strategies with practice in daily life; half had a 5-week
  placebo social group first. Self-reported hearing disability fell and stayed lower at 6 months. Adherence was high
  in the earlier ACE studies (> 90 % attended at least 3 of 5 sessions); Swedish versions improved goal attainment
  and activity/participation.
- **Hickson, Worrall, Scarinci & Laplante-Lévesque 2019, International Journal of Audiology 58(8):504–509,
  "Individualised active communication education (I-ACE)…", doi:10.1080/14992027.2019.1587180** [full text, University
  of Queensland PDF]. A self-paced written home version (5 modules: objectives, reflection, exercises, application to
  the client's own goals; significant others invited), single group, n = 23. 78 % reported better hearing on their own
  goals (client-oriented goal scale), stable at 3 months; a standard hearing-disability questionnaire did not change.
  The authors judge the solo version weaker than the group course and credit face-to-face practice with peers.
- **Watson et al. 2021, BMJ Open 11:e043364, "Randomised controlled feasibility trial of an Active Communication
  Education programme plus hearing aid provision versus hearing aid provision alone (ACE To HEAR)",
  doi:10.1136/bmjopen-2020-043364** [full text, White Rose repository]. Recruitment failed (8 randomised of 88
  planned); attendance averaged 60 %; no effects analysable. Participants found the course acceptable; some tried
  strategies, and **some were reluctant to ask others for help** — the social cost of repair requests is a barrier.
- Reading for Earshot: strategy teaching has its best evidence when it is (a) tied to the person's own situations
  and goals, (b) practised in real life between sessions, and (c) social. Missions already cover (b); 1.1 can add
  (a) with goal-linked Missions chosen from the player's diary and (c) through the community (posting a Mission
  result card), and should rehearse *asking* for repair, since reluctance to ask is a named barrier.

### 5.2 Implementation intentions (if-then plans)
- **Gollwitzer & Sheeran, "Implementation intentions"** (review chapter, c. 2008–2009, summarising their 2006
  meta-analysis "Implementation intentions and goal achievement: a meta-analysis of effects and processes"; the
  meta-analysis's venue was not verified here) [full text, US National Cancer Institute construct page PDF; venue of
  the chapter not printed]. Meta-analysis of 94 studies: if-then plans improved goal attainment by d = 0.65; getting
  started d = 0.61; staying on track against derailment d = 0.77. Format: "If situation Y occurs, then I will do Z",
  specific and viable; a reworded non-if-then statement worked much less. Mechanisms: the planned situation becomes
  more noticeable, and the response starts automatically. Largest effects when the goal is wanted and acting on it is
  hard.
- No hearing-specific study of if-then plans was searched or found in this pass (budget).
- Reading for Earshot: Missions can carry a plan the player picks once from a menu, built only from strategies with
  evidence in the notes: "If I can't follow the person across the table, then I'll turn my head a little (about 30°)
  and keep watching their face" (instructed head turns gave 1–3 dB and did not hurt lip-reading, R3 §3 and §11); "If I
  miss a name, then I'll ask for just the name" (repair; §5.1). This targets exactly the two failure points the
  meta-analysis covers (not starting a strategy in the moment; dropping it). Listening-specific benefit is untested: a
  **new bet**, measured with the Mission report and the diary.

### 5.3 Real-world assignments and in-the-moment reports (R4 §7b-2, plus §5.1)
- EMA in hearing research: about one week at 7–8 prompts a day captures most of a person's listening situations;
  speech-in-noise moments are under-reported (about a third captured with random prompts, two thirds with
  level-triggered prompts), and people stop reporting in social settings (R4 §7b-2). Self-initiated reports after
  speaking situations are an accepted alternative. Level triggers would need the microphone; even level-only
  processing raises consent questions (R4 §7b-2 notes that recording bystanders is illegal in many places), so the
  default stays self-initiated.
- I-ACE tied every module to the client's own goals and daily-life application (§5.1).
- Reading for Earshot: a three-tap "just now" diary entry (where, how much I followed, what I tried) after real
  conversations, linked to the week's Mission plan, gives the far-transfer measure a daily-life anchor without
  prompts that interrupt social moments.

### 5.4 Audiovisual (lip-reading) components — not opened in this pass
- What the notes hold: seeing the talker cut spontaneous head turns about sixfold, a ≈ 30° head turn did not hurt
  lip-reading, and head orientation plus lip-reading together were reported to improve SRTs by up to 9 dB in
  implant users (Grange et al. 2018 and Grange & Culling 2016a, R3 §11).
- The lip-reading training papers on feedback and transfer to audiovisual speech in noise (Bernstein, Auer &
  Eberhardt; American Journal of Audiology 2021/2022) were found but the publisher refused every fetch (§8). No
  design claim is made from them. Video also costs bytes and needs a licensed talking-face source (not checked).

### 5.5 Listening effort as an outcome (R4 §4c)
- Verbal response time was ≈ 150 ms faster per 3 dB SNR improvement and tracked effort ratings (r = 0.76); response
  time keeps falling as SNR improves where intelligibility is already near ceiling (Houben et al. 2013; Reinten et
  al. 2019). Device timing differs by tens of ms, so only within-device comparisons hold (R4 Summary 10).
- Reading for Earshot: on easy trials (and in the diary) "same accuracy, faster and less effort" is real-life-relevant
  progress at ceiling. Use only correct, non-flagged trials (§6) on one device.

## 6. Strategy detection from the app's own logs, and non-punitive responses

### 6.1 Rapid guessing: the educational-measurement toolkit
- **Soland, Kuhfeld & Rios 2021, Large-scale Assessments in Education 9:8, "Comparing different response time
  threshold setting methods to detect low effort on a large-scale assessment", doi:10.1186/s40536-021-00100-w**
  [full text, Springer open access]. Rapid guessing = answering too fast to have processed the item (vs "solution
  behaviour"). Threshold methods compared:
  - visual inspection of a bimodal response-time histogram (Wise & Kong 2005 [secondary report, here]);
  - **normative threshold NT10**: 10 % of the item's mean response time, capped at 10 s (Wise & Ma 2012 [secondary
    report, here]); NT30 also used;
  - **cumulative proportion correct (CUMP)**: the threshold is where accuracy rises above chance;
  - mixture log-normal: two-component mixture on log response times.
  Validation criterion: responses flagged as rapid should be correct at about chance (0.25 for four options).
  Consequences: low effort can bias scores down by up to ≈ 0.2 SD; **effort-moderated scoring** treats flagged
  responses as missing, which removes bias at some cost in precision. The paper mentions real-time effort
  monitoring with proctor notification but evaluates no intervention.
- Reading for Earshot (our design, not tested in listening apps): Earshot already logs each trial; the same logic
  applies per player and per exercise. Flag a response as a rapid guess when it comes faster than a floor
  (relative to the player's own median response time for that exercise and option count, as NT10 does per item),
  and confirm the flag empirically: in the player's log, accuracy in the fast bin should sit near chance (CUMP
  logic). Flagged trials then count as "not answered" for the staircase and the learner model (effort-moderated
  scoring), never as errors, so guessing neither lowers difficulty nor inflates it. Response times are only
  comparable within one device (R4 §6d), which per-player thresholds respect.
- **Kröhne, Deribo & Goldhammer 2020, Psychological Test and Assessment Modeling 62(2):147–177, "Rapid guessing rates
  across administration mode and test setting", doi:10.25656/01:23630** [full text, peDOCS]. University students;
  thresholds NT10–NT20 and visual inspection. Rapid guessing was higher in **unproctored online** testing than in
  supervised group testing (d ≈ 0.13–0.28) and higher for a test taken second in a session (d ≈ 0.10–0.12); the
  authors suggest that telling test-takers about their engagement may help. Earshot is always unsupervised and its
  later blocks come late in a session, so rapid guessing should be expected and handled, not treated as rare.

### 6.2 Signals Earshot's logs already support (our designs; the 1.0 log fields are cited)
| Signal | How to compute | Likely meaning | Non-punitive response |
|---|---|---|---|
| Rapid taps | RT from key enable (js/core/answer.js `rts`) below a per-player, per-exercise threshold: where the player's own accuracy rises above chance (CUMP logic), with NT10-style 10 % of the median as a fallback for new players | guessing, impatience, a missed sound | trial set aside (not an error, no staircase step); one line between blocks if several occur |
| Masker intrusions | share of errors that are another voice's word (score.js counts `intr`; Crowd, Seek and Voices already name the decoy per trial) | attending the wrong voice: informational masking, not cheating (R3 §1) | strategy card on locking onto the call-sign voice; more practice on the voice-difference dial |
| Sound-alike errors | foil type `neighbour` (js/engine/items/common.js) | audibility / energetic masking | glimpsing tips; hold SNR |
| Context / binding errors | foil type `context` in Repair and Echo | memory binding, over-use of context | Echo-style replay with the words; recall practice |
| Position bias | chosen key position vs uniform over the last ≈ 40 trials, among errors | blind guessing (answer positions are random, so bias cannot pay) | none beyond the rapid-tap line |
| Answer-frequency bias | picks of the player's most frequent past answer | a vocabulary prior (foils follow the answer distribution, so it cannot pay) | none; diagnostic only |
| Late-session decline | accuracy or RT falling across blocks of one session | fatigue, disengagement (§6.1, Kröhne et al.) | offer to stop on a high point; never extend the session |
| Catch-trial false alarms | "picked something" when the caller never spoke (§2.3) | response bias | show the false-alarm rate as a skill ("you noticed when it wasn't your caller") |

### 6.3 How to respond without punishing
- Barrier evidence: in a survey of training-app users, interrupting or negative feedback and low confidence were
  named barriers (Huang et al. 2025, R1 §6). Effort-moderated scoring (§6.1) removes the payoff of guessing with no
  penalty at all.
- Principles for 1.1 (design, untested): never deduct points or declare a player "caught"; nothing appears during a
  timed stimulus or inside a block (standing rule); one plain line between blocks that states the fact and the
  reason ("Several quick taps landed at chance, so Earshot set them aside; a second's thought before tapping costs
  nothing"); offer an optional "listen first" setting that keeps the keys disabled until a short pause after the
  audio; turn diagnostic patterns (intrusions, sound-alikes, binding errors) into the plateau breaker's
  stated reason for a change, since they describe how the player hears, not how they behave.

## 7. Ranked design changes for Earshot 1.1

Ranked by expected transfer value first, then by implementation cost (browser-only, offline; phone-first). "Bet"
marks a change whose listening benefit is untested anywhere we found.

| Rank | Change | Expected transfer value | Cost | Evidence in one line |
|---|---|---|---|---|
| 1 | **Fresh maskers every trial and a masker-type mix** (V1, V2): synthesised speech-shaped and modulated noise from a new seed, babble assembled live from training clips (1–8 talkers), reversed speech, plus existing beds; masker type logged per trial | high | low, 0 bytes | masker learning is specific (Van Engen 2012; Lie 2024) and noise samples are memorised implicitly for weeks (Agus 2010; Viswanathan 2016) |
| 2 | **Open-set typed answers** in Repair, Echo and a "Type it" round, plus one open-set Lab probe; per-keyword scoring: typo within a small edit distance accepted for non-words, a different real word rejected, homophones and number words accepted, order ignored | high | medium (input UI, build-time variant tables, tutorial) | closed sets hide talker and lexical-competition effects (Sommers 1997); automatic fuzzy scoring tracks human scoring (r ≈ 0.92, Bosker 2021; ≈ 99 % for Autoscore) |
| 3 | **Variety as an adaptive dial with dosing rules** (§3.5): rove irrelevant dimensions from the start, block a new cue then interleave, raise variety when the edge holds, credit the edge at its variety level, plateau detector conditions on variety (bet) | high | medium (controller, log, display) | variability helps generalisation along its own dimension but lowers training accuracy and can overload novices (Raviv 2022; Tzeng 2016; Perrachione 2011; Uchihara 2025) |
| 4 | **Uniform "same mix again, with the words" replay** after every miss (one tap after hits); text preview at the easy end of a new condition | medium-high | low (Echo already does it) | degraded replay plus text is the strongest feedback effect in degraded-speech learning (Davis 2005; Loebach 2010; Borrie 2012) |
| 5 | **Heterogeneity packs (lazy, Pages build)**: natural LibriVox voices (≈ 0.9 MB), ≈ 20 measured rooms (≈ 0.3 MB), more recorded beds (≈ 0.66 MB); natural accented speech later | medium | medium (pipeline runs, lazy loading from the 1.1 backlog) | multi-room training reaches new rooms (Vlahou 2019); synthetic-speech learning is its own skill (R2 §1.7); voice count is already far above the ≈ six talkers the HVPT meta-analysis suggests (Uchihara 2025) |
| 6 | **Strategy-aware logs and non-punitive coaching** (§6): rapid-tap flags confirmed at chance, effort-moderated staircases, error profiles (intrusion / sound-alike / binding) feeding strategy cards and plateau reasons; tips only between blocks | medium (protects the training signal and the measurement) | low | rapid-guess thresholds and effort-moderated scoring (Soland 2021); more guessing unsupervised and late in sessions (Kröhne 2020); negative feedback is a barrier (Huang 2025) |
| 7 | **Uncertainty and catch trials**: rare "your caller never spoke" trials with a permanent "not there" key; occasional location or voice uncertainty in Crowd and Seek; questions shown only after the audio | medium | low | uncertainty about where costs 10–40 points (Kidd 2005); switching costs ≈ 10 points (Lin & Carlile 2015); catch trials themselves untested (bet) |
| 8 | **If-then Missions and a "just now" diary**: the player picks a plan for a named situation, including asking for repair; three-tap reports after real conversations; optional result card for the community | medium for daily life | low | if-then plans d = 0.65 across 94 studies (Gollwitzer & Sheeran 2006); strategy courses moved self-reported disability (ACE 2007); reluctance to ask for help is a barrier (Watson 2021); untested for listening (bet) |
| 9 | **Level-rank and onset roving**: with two or more distractors, keep the target neither always loudest nor always quietest; jitter the lead-in; probes stay un-roved | low-medium | low | level differences let listeners pick a voice in call-sign tasks (Brungart 2001 via R3); room calibration needs a lead-in (Brandewie & Zahorik 2010) |
| 10 | **Effort at ceiling**: response time on correct, non-flagged easy trials shown as "same accuracy, less effort" (one device only) | low-medium | low | response time tracks SNR even at ceiling intelligibility (Houben 2013; Visentin et al., R4 §4c) |
| 11 | **Skewed talker exposure**: regulars plus a long tail of rare voices (bet) | unknown | low | real-world input is skewed; lab work used even distributions (Raviv 2022) |

Not recommended: trial-by-trial switching of a new accent family or of the target–distractor voice difference while
it is new (§3.4); more voices from the same two synthesisers as the main variety step (V8); spoken answers through a
recogniser that may leave the device; roving inside probes; counting variety-driven accuracy drops as decline.

## 8. Could not open

Ranked by how much the ranked changes lean on them. "Need" = what to extract; "Meanwhile" = the assumption used.

1. **Felty, Buchwald & Pisoni 2009, JASA Express Letters (adaptation to "frozen" vs varying babble)** — not returned by
   the search (budget). Need: size of the frozen-babble advantage and whether it transfers to new babble. Meanwhile:
   change 1 rests on the non-speech noise-memory work (§1.2) and masker-specificity findings (§3.3).
2. **Banai, Ortiz, Oppenheimer & Wright 2010 and other auditory roving primaries** (PubMed Central browser check,
   e.g. PMC2882662, PMC2843743, PMC2811126, PMC3117994, PMC4340624). Need: which roving conditions blocked learning,
   with numbers. Meanwhile: the Banai & Amitay 2012 abstract (similar interleaved stimuli interfere; categorisation
   tasks may gain).
3. **Clopper, Pisoni & Tierney 2006, J Am Acad Audiol 17(5):331–349, doi:10.3766/jaaa.17.5.4** (Thieme bot check;
   an Indiana University copy blocked). Need: how option count and option similarity change closed-set word
   recognition. Meanwhile: Sommers et al. 1997 abstract.
4. **Lip-reading training papers returned for a query on Bernstein, Auer & Eberhardt, Am J Audiol 2021,
   doi:10.1044/2021_AJA-21-00112 and doi:10.1044/2021_AJA-21-00034** (ASHA refused; titles and authors not visible
   in the results, so the attribution is assumed) and the trial record
   NCT05012774 "Speech perception training: advanced scoring and feedback methods" (page renders by script). Need:
   feedback types, scoring of typed responses, transfer to audiovisual speech in noise. Meanwhile: no audiovisual
   design claim.
5. **Wise & Kong 2005; Wise & Ma 2012; Wise, Kuhfeld & Soland 2019 (proctor notification)** — known here only through
   Soland et al. 2021. Studies of engagement warnings shown to the test-taker were not found by the search. Need:
   whether in-test engagement messages reduce rapid guessing and by how much. Meanwhile: change 6 uses
   effort-moderated scoring, which needs no message.
6. **Whitton et al. 2017 full text** (PMC5997394; PubMed also refused). Need: game mechanics, adaptive rule, dose,
   decay curve. Meanwhile: abstract (§4).
7. **Hickson, Worrall & Scarinci 2007 ACE randomised trial** — secondary only (§5.1). Need: outcome measures, effect
   sizes, the placebo comparison.
8. **Gollwitzer & Sheeran 2006 meta-analysis itself** — read through the authors' later review chapter. Need:
   moderators relevant to skill practice; any hearing or rehabilitation studies.
9. **Zhang, Cheng & Zhang 2021 full text** (JSLHR) — abstract only. Need: the talker-presentation and programme-length
   moderators.
10. **Yund & Woods 2010, Ear and Hearing (content vs procedural learning in repeated sentence tests)** — not searched
    (budget; R4 also could not open it). Need: how much of repeated-test gain is content vs procedure.
11. **Agus, Thorpe & Pressnitzer 2010 full text** — abstract only. Need: repetitions to learn, decay.
12. Not identified: an AJSLP 2024 hit on transcript scoring (doi:10.1044/2024_AJSLP-24-00276), the eLife article 56073
    and PMC5121232 from the noise-memory search, PMC8126633 from the audiomotor search, PMC10672233 and PMC6664071
    from the rapid-guessing search.

## 9. References

Read in this pass (read level as tagged in the text):
- Agus TR, Thorpe SJ, Pressnitzer D (2010). Rapid formation of robust auditory memories: insights from noise.
  Neuron 66(4):610–618. doi:10.1016/j.neuron.2010.04.014 [abstract only]
- (Author list not visible) (2011). Dimension-specific attention study with identical tones. Attention, Perception &
  Psychophysics. doi:10.3758/s13414-011-0148-0 [full text body; title page not visible]
- Banai K, Amitay S (2012). Stimulus uncertainty in auditory perceptual learning. Vision Research 61:83–88.
  doi:10.1016/j.visres.2012.01.009 [abstract only]
- Borrie SA, Barrett TS, Yoho SE (2019). Autoscore: an open-source automated tool for scoring listener perception of
  speech. JASA 145(1):392–399. doi:10.1121/1.5087276 [abstract only; rules via Bosker 2021]
- Bosker HR (2021). Using fuzzy string matching for automated assessment of listener transcripts in speech
  intelligibility studies. Behavior Research Methods 53(5):1945–1953. doi:10.3758/s13428-021-01542-4 [full text]
- Chae SR, Bahng J (2023). Effective duration of auditory training for speech perception in hearing-impaired
  listeners: a systematic review and meta-analysis. Clinical Archives of Communication Disorders 8(3):192–210.
  doi:10.21849/cacd.2023.01004 [abstract only]
- Gollwitzer PM, Sheeran P (c. 2008–2009). Implementation intentions (review chapter summarising their 2006
  meta-analysis "Implementation intentions and goal achievement: a meta-analysis of effects and processes"; title
  from a WorldCat record, venue not verified here). NCI construct page PDF [full text]
- Henshaw H, Heinrich A, Tittle A, Ferguson M (2021/2022). Cogmed training does not generalize to real-world benefits
  for adult hearing aid users: results of a blinded, active-controlled randomized trial. Ear and Hearing 43(3):741.
  doi:10.1097/AUD.0000000000001096 [full text to mid-Discussion]
- Hickson L, Worrall L, Scarinci N, Laplante-Lévesque A (2019). Individualised active communication education
  (I-ACE). International Journal of Audiology 58(8):504–509. doi:10.1080/14992027.2019.1587180 [full text]
- Jones PR, Moore DR, Amitay S, Shub DE (2013). Reduction of internal noise in auditory perceptual learning. JASA
  133(2):970–981. doi:10.1121/1.4773864 [full text]
- Kröhne U, Deribo T, Goldhammer F (2020). Rapid guessing rates across administration mode and test setting.
  Psychological Test and Assessment Modeling 62(2):147–177. doi:10.25656/01:23630 [full text]
- Micheyl C, McDermott JH, Oxenham AJ (2009). Sensory noise explains auditory frequency discrimination learning
  induced by training with identical stimuli. Attention, Perception & Psychophysics 71(1):5–7.
  doi:10.3758/APP.71.1.5 [full text]
- Raviv L, Lupyan G, Green CS (2022). How variability shapes learning and generalization. Trends in Cognitive
  Sciences. doi:10.1016/j.tics.2022.03.007 [full text, accepted manuscript; boxes partly visible]
- Soland J, Kuhfeld M, Rios J (2021). Comparing different response time threshold setting methods to detect low
  effort on a large-scale assessment. Large-scale Assessments in Education 9:8. doi:10.1186/s40536-021-00100-w
  [full text]
- Sommers MS, Kirk KI, Pisoni DB (1997). Some considerations in evaluating spoken word recognition by normal-hearing,
  noise-masked normal-hearing, and cochlear implant listeners. I: The effects of response format. Ear and Hearing
  18(2):89–99. doi:10.1097/00003446-199704000-00001 [abstract only]
- Uchihara T, Karas M, Thomson RI (2025). High variability phonetic training (HVPT): a meta-analysis of L2 perceptual
  training studies. Studies in Second Language Acquisition 47:794–827. doi:10.1017/S0272263125100879 [full text
  body]
- Viswanathan J, Rémy F, Bacon-Macé N, Thorpe SJ (2016). Long term memory for noise: evidence of robust encoding of
  very short temporal acoustic patterns. Frontiers in Neuroscience 10:490. doi:10.3389/fnins.2016.00490 [full text]
- Watson J, Coleman E, Jackson C, et al. (2021). Randomised controlled feasibility trial of an Active Communication
  Education programme plus hearing aid provision versus hearing aid provision alone (ACE To HEAR). BMJ Open
  11:e043364. doi:10.1136/bmjopen-2020-043364 [full text]
- Whitton JP, Hancock KE, Shannon JM, Polley DB (2017). Audiomotor perceptual training enhances speech
  intelligibility in background noise. Current Biology 27(21):3237–3247.e6. doi:10.1016/j.cub.2017.09.014
  [abstract only]
- Zhang X, Cheng B, Zhang Y (2021). The role of talker variability in nonnative phonetic learning: a systematic review
  and meta-analysis. JSLHR 64(12):4802–4825. doi:10.1044/2021_JSLHR-21-00181 [abstract only]

Secondary reports in this pass (known only through the source named):
- Amitay S, Irwin A, Moore DR (2006), Nature Neuroscience 9:1446–1448 — via Micheyl et al. 2009.
- Hickson L, Worrall L, Scarinci N (2007), ACE randomised trial — via Hickson et al. 2019 and Watson et al. 2021.
- Wise SL, Kong X (2005); Wise SL, Ma L (2012) — via Soland et al. 2021.
- Clopper & Pisoni dialect-talker study — via Raviv et al. 2022.

Cited from earlier notes (their read levels are recorded there): R1 (Fallahnezhad 2023; Humes 2009/2019; Saunders
2016; Lelo de Larrea-Mancera 2022; Baese-Berk 2013; Baese-Berk & Samuel 2022; Wright 2015; Huang 2025; Shechter
Shvartzman 2022; Bieber 2021; Oba 2011; Anderson 2013/2014; Hennessy 2022 and music trials); R2 (Brekelmans 2022;
Perrachione 2011; Tzeng 2016; Luthra 2021; Fuhrmeister & Myers 2020; Bradlow 2023; Aoki & Zellou 2025; Alexander &
Nygaard 2019; Huyck 2017; Xie & Myers 2017; Stacey & Summerfield 2007; Banai 2022; Tarabeih-Ghanayim 2020; Davis 2005;
Loebach 2010; Loebach & Pisoni 2008; Borrie 2012; Guediche 2016; Sohoglu & Davis 2016; Fu 2005; Xie, Earle & Myers
2018; Brandewie & Zahorik 2010; Fenn/Nusbaum work via Reis 2023); R3 (Brungart 2001 and Kidd 2005 via Bronkhorst 2015;
Lin & Carlile 2015; Rosen 2013; Van Engen 2012; Vlahou 2019; Green 2019; Grange 2018; Grange & Culling 2016; Gao 2020;
Benard & Başkent 2013; Cameron & Dillon 2011); R4 (Puglisi 2015; Schwarz 2026; Holube 2012; Buss 2015; Lie 2024;
Bradlow & Bent 2008; Ferguson 2014; Houben 2013; Reinten 2019; Visentin et al. c. 2022; Schinkel-Bielefeld 2024).

Finished 2026-11-28 17:06 UTC.
