# R7 — Progression, adaptive difficulty and scheduling variety (Earshot 1.1 research notes)

Started 2026-11-28 16:40 UTC. Builds on R1 (training efficacy), R5 (progression and game design) and PLAN §7;
sources already summarised there are only cross-referenced here ("R5 §2.3" etc.), not repeated.
Reading depth on every source: [full text], [partial full text: which part], [abstract only],
[secondary report: where]. Search budget for this note: 12 web searches (shared with other agents).

Status: complete 2026-11-28 17:00 UTC (12 of 12 searches used). Recommendations: §12; simulation tests: §13; gaps: §14.

## 0. What 1.0 does (from the code, for reference)
- Learner: per (context, dial) Gaussian posterior over a threshold on an 81-point grid; p = γ + (1−γ−λ)·Π F_i,
  one logistic bottleneck per active dial; random-walk drift per trial and per day (js/engine/learner.js).
- Controller (js/engine/controller.js, constants in js/engine/dials.js MODEL): edge target 0.72; non-focus dials
  at component F = 0.92 ("comfort"); anchors p ≈ 0.90 every 4th–5th trial and after 2 misses in a row; warm-ups
  p ≈ 0.85 that do not move thresholds; floor 0.65; lapse 0.04. Focus dial chosen by a learning-progress bandit
  with an uncertainty bonus and 20 % exploration.
- Breadth (variety) per exercise: starts 0.2; +0.10 when the last 20 edge trials ≥ 0.75 correct, −0.15 below
  0.55 (checked every ≥ 10 trials). Strange-voice families: a new family starts with a 7-trial block, counts as
  "acquired" at ≥ 8 trials and ≥ 62 % correct, then joins a rotation whose size grows with breadth.
- Plateau: 10-session windows, flat in 4 windows in a row, no personal best in ≥ 4 sessions; breakers in order:
  variety, focus switch, anchors, strategy card, sleep, rest (js/engine/plateau.js).

## 1. Roving, interleaving and blocking in perceptual learning (Q3, Q4)

- Dosher, Liu, Chu & Lu 2020, "Roving: the causes of interference and re-enabled learning in multi-task visual
  training", Journal of Vision 20(6):9, doi:10.1167/jov.20.6.9 [full text, eScholarship PDF; ~91 % read, end of
  the discussion not read].
  - Design: 48 observers in 4 groups of 12; 8 sessions × 960 trials (7,680 each); Gabor orientation
    discrimination at 4 peripheral locations, pre-cued; zero- and high-noise trials intermixed; staircases at
    75 % correct; tone feedback after correct responses. Groups: Single (one reference angle everywhere, no
    roving), Far (two dissimilar reference angles), Near (two similar angles), All (four angles).
  - Learning rate ordering All < Near < Far ≈ Single, fastest/slowest about 2:1 (power-law rate, zero noise:
    All 1.15, Near 1.38, Far 1.75, Single 2.31; high noise: 0.55, 0.79, 1.32, 1.28); group effect
    F(3,44) = 5.03, p < .005. Far and Single did not differ in high noise. Single and Far improved within
    session 1, Near from session 2, All latest; some All observers got worse in late sessions (authors suspect
    motivation).
  - Putting different tasks at different retinal locations did NOT remove roving interference (only partly).
  - Account (integrated reweighting theory): interference arises when similar stimuli need different response
    mappings, so updates of shared, location-invariant readout weights conflict from trial to trial. Rule of
    thumb from the model: mixing dissimilar variants costs little; mixing similar variants with conflicting
    mappings costs most. Model fit r² = 0.92 with six parameters.
  - Prior roving work summarised by the paper [secondary report: Dosher et al. 2020]:
    - Contrast-increment learning largely disrupted when the base contrast roves trial to trial, robust with a
      fixed base (Adini, Sagi & Tsodyks 2002; Yu, Klein & Levi 2004; Kuai et al. 2005).
    - Learning RE-ENABLED when the variants come in a fixed, predictable temporal order (Kuai et al. 2005;
      Zhang et al. 2008; Cong & Zhang 2014: cycling base contrasts in a fixed order).
    - Bisection under roving: slow and largely stimulus-specific (Parkosadze et al. 2008); interleaving bisection
      stimuli randomly or in sequence made learning harder but did not prevent it (Aberg & Herzog 2009).
    - Auditory: frequency-discrimination learning robust with a fixed standard, slow or absent with roving
      standards, worst with wide roving (Amitay, Hawkey & Moore 2005); temporal-interval learning occurred with
      two base intervals trained sequentially but not intermixed (Banai, Ortiz, Oppenheimer & Wright 2010).
    - Roving damages learning when stimuli/tasks are distinct but similar (overlapping neural populations:
      Tartaglia, Aberg & Herzog 2009a); reinforcement-learning account: the learner cannot keep separate reward
      expectations for similar stimuli of different difficulty (Tartaglia et al. 2009b; Herzog et al. 2012).
  - Reading for Earshot: roving is a risk when (a) the variants are perceptually similar, (b) they need different
    response mappings or criteria, and (c) they are not distinguishable before the trial. Earshot's dials vary
    mostly irrelevant dimensions (talker, room, masker) with one fixed mapping (report the target's words), which
    is the low-conflict case; the risky cases are Voices (similar voices, different labels) and Strange-voice
    families that change the same cue in opposite directions. Predictable order and pre-trial cues are the
    documented ways to restore learning under roving.

- Banai, Ortiz, Oppenheimer & Wright 2010, "Learning two things at once: differential constraints on the
  acquisition and consolidation of perceptual learning", Neuroscience 165(2):436–444,
  doi:10.1016/j.neuroscience.2009.10.060 [full text, PMC2797123].
  - Auditory temporal-interval discrimination (2AFC, adaptive 60-trial blocks at ~79 % correct), two standards
    (100 and 350 ms); 6 daily sessions × 720 trials (360 per condition). Interleaved (alternating every 120
    trials) n = 10; consecutive (all 360 of one, then all 360 of the other) n = 8; controls n = 11; comparison
    groups from other work: blocked single condition (n = 6), spaced (n = 9).
  - Interleaved: no significant learning on either trained condition or untrained ones (all ES < 0.48), and little
    within-session improvement. Consecutive: learning on both (ES 1.28 and 0.92), plus generalisation to the same
    intervals at an untrained frequency; no generalisation to untrained intervals.
  - Authors: interleaving disrupted acquisition (not consolidation); enough trials per condition per session,
    in a run, mattered. Caveat stated: other studies found learning with interleaved or randomised conditions,
    so it depends on the conditions, alternation rate and task; samples small.
- Maidment, Kang, Gill & Amitay 2015, "Acquisition versus consolidation of auditory perceptual learning using
  mixed-training regimens", PLoS ONE 10(3):e0121953, doi:10.1371/journal.pone.0121953 [full text, PMC4372427].
  - 120 adults (7 regimens × 15, plus 15 untrained controls); 2 daily sessions; primary task AM-depth
    discrimination (4 Hz on 1 kHz), 360 trials per session; mixed groups add 360 secondary trials either
    interleaved in 60-trial blocks or consecutively (360 then 360). Secondary tasks: same judgment with an
    irrelevant change (carrier 2 kHz), same judgment with a relevant change (rate 8 Hz), or a different judgment
    on the same sounds (AM-rate discrimination).
  - Interleaved acquisition was disrupted ONLY by the different judgment on the same stimuli (F = .002, p = .96);
    interleaving the same judgment with an irrelevant or a relevant stimulus change did not disrupt learning.
    Consecutive schedules: partial disruption of the primary task in all three (none significant after
    correction). Secondary tasks were learned in all regimens. The same-judgment-relevant-change mix (4 Hz with
    8 Hz) transferred to untrained 16-Hz conditions in both regimens.
  - Authors' scheduling advice: interleave tasks that share the same judgment and vary the task-relevant
    feature, in blocks short enough that consolidation of one does not start before the switch; do not mix
    tasks that ask different judgments of the same sounds. They flag that speech-in-noise training is untested.
- Wright lab (Northwestern University), 2023, "Evidence that anterograde learning interference depends on the
  stage of learning of the interferer: blocked versus interleaved training", Learning & Memory 30(5–6):101–?,
  doi:10.1101/lm.053710.122 [full text, learnmem.cshlp.org; author list and page range not shown on the page
  read].
  - ITD discrimination (task A) and ILD discrimination (task B), 3-down/1-up (79.4 %), 60-trial blocks; day 1
    training, day 2 test on B. B only (n = 24, 300 trials): learning (across-day 1.26 dB, offline 1.08 dB).
    A-then-B blocked (300 + 300, n = 11–12): NO learning on B (0.01 dB). A and B alternating every 60 trials
    (n = 10): learning restored (across-day 1.43 dB, offline 1.86 dB). Alternating every 180 trials (n = 10):
    intermediate (0.70 dB, p = .068; no offline gain).
  - Authors: interference with a following task arises once the preceding task has had enough consecutive trials
    to enter consolidation (critical run somewhere between 60 and 300 trials, perhaps 180–300); not interleaving
    as such. Notes that blocked-vs-interleaved direction varies across studies.
- Ortiz & Wright 2009, "Contributions of procedure and stimulus learning to early, rapid perceptual improvements",
  J Exp Psychol: Human Perception and Performance 35(1):188–194, doi:10.1037/a0013161 [full text, PMC2866737].
  ITD discrimination tested the day after one ~2-h session: ITD-trained d = 1.2 vs naive; training on a different
  task with different stimuli (temporal interval) or a different cue (ILD) also helped (d = 0.6 each). Five vs ~25
  threshold estimates of training made no difference (F = 0.61). Reading: early gains are partly
  procedure-general (learning the trial format and listening situation), partly stimulus-specific.
- Ortiz & Wright 2010, "Differential rates of consolidation of conceptual and stimulus learning following training
  on an auditory skill", Exp Brain Research 201(3):441–451, doi:10.1007/s00221-009-2053-5 [full text, PMC2967583].
  One session of 300 vs ~1,350 ITD or ILD trials; tests at 0, 10 or 24 h (n per group ~16–30 before exclusions).
  300 and 1,350 trials gave the same thresholds at 10 and 24 h (more practice in one sitting added nothing); the
  longer session even hid the gain immediately after training (fatigue/adaptation). Cross-cue ("conceptual")
  learning appeared by 10 h awake; stimulus-specific learning by 24 h (after sleep or simply time).
- Reading of this cluster for Earshot (my synthesis, not a claim of any one paper):
  - Mixing conditions that share one judgment and one response mapping but vary the stimulus (talker, room,
    masker, SNR) is the safe kind of interleaving (Maidment 2015; Dosher 2020's Far group). Mixing different
    judgments on the same sounds inside one block is the harmful kind (Maidment 2015), as is mixing similar
    stimuli with conflicting mappings (Dosher 2020).
  - Whether short alternation helps or hurts depends on the pair; long same-condition runs (≥ 180–300 trials)
    can block the next condition's learning (Wright lab 2023), and fast alternation of very similar conditions
    can block both (Banai 2010). Earshot's sets of 20–30 trials from different exercises sit at the short end;
    the 2023 result argues against making a whole session a single condition.
  - Per-session practice saturates: beyond a few hundred trials of one condition, more in the same sitting adds
    nothing measurable by the next day (Ortiz & Wright 2010; R5 §3.4 Molloy 2012 for 100-trial sessions).

## 2. How much practice per condition per day; exposure; breaks; generalisation lag (Q1, Q3)

- Wright & Sabin 2007, "Perceptual learning: how much daily training is enough?", Exp Brain Research
  180:727–736, doi:10.1007/s00221-007-0898-z [abstract only, Springer page]. 6 days of 360 or 900 trials/day.
  Frequency discrimination needed more than 360 trials/day to improve; temporal-interval discrimination learned
  with 360/day and 900 added nothing. Authors: a task-specific critical amount of practice per day must be met
  before improvement accumulates across days; beyond it, no extra learning on the trained condition.
- Little, Zhang & Wright 2017, "Disruption of perceptual learning by a brief practice break", Current Biology
  27(23):3699–3705, doi:10.1016/j.cub.2017.10.032 [full text, PMC5848209].
  - Frequency discrimination, n = 8 per group, 6–9 days: 360/day no learning (1 of 8 learned); 900/day learned
    (6 of 8); 720/day with one 30-min quiet break after 360 → NO learning (like 360/day; 1 of 8); 720/day with
    five 6-min breaks (one per 120 trials) → learning (6 of 8 by day 7). Phonetic classification (non-native VOT,
    n = 5 per group, 240 trials in one session): a 30-min break after trial 120 abolished next-day learning.
  - Authors: trials accumulate in a transient store toward a daily learning threshold; sub-threshold accumulation
    decays within 30 min but survives 6-min gaps. Prior estimates of daily thresholds they list: > 360 trials for
    frequency discrimination, > 160 for chevron discrimination, > 120 for phonetic classification.
  - Breaks are not automatically good: long breaks before the daily threshold is reached waste the trials.
- Wright, Baese-Berk, Marrone & Bradlow 2015, "Enhancing speech learning by combining task practice with periods
  of stimulus exposure without practice", JASA 138(2):928–937, doi:10.1121/1.4927411 [full text, PMC4545053;
  ~94 % read]. (R1 §3.7 had the abstract only; details now.)
  - Exp 1 (non-native VOT category, 31 adults, 2 days): per session 240 practice trials vs 240 exposures vs
    120 practice + 120 exposures in alternating ~6-min blocks vs 120 practice + 120 silence. Exposure = the same
    syllables in the background during a symbol-matching task, ~5 s apart. Practice+exposure beat all others
    (vs exposure-only d = 2.83; also beat 240 practice trials, p = .019); exposure alone: no learning.
  - Exp 2 (Mandarin-accented English sentences in white noise at +5 dB SNR, new test talker, 50 adults, two
    1-h sessions of ten ~1.5-min blocks): 40 practice + 40 exposure matched 80 practice trials and beat 40
    practice + silence (p = .011), exposure only (d = 2.14) and a native-accent control.
  - Authors: practice acts as a catalyst; exposure close in time can replace part of the practice trials;
    exposure alone does nothing. Small groups (7–10).
- Wright, Wilson & Sabin 2010, "Generalization lags behind learning on an auditory perceptual task", J Neurosci
  30(35):11635–11639, doi:10.1523/JNEUROSCI.1441-10.2010 [full text, PMC3089592].
  - Temporal-interval discrimination, 900 trials/day for 2, 4 or 10 days (n = 9, 8, 6 analysed). The trained
    condition improved equally in all groups and within 2 days. Generalisation to an untrained frequency: absent
    after 2 days (p = .58; about half the listeners), present after 4 (p = .009) and 10 days (p = .008; all but one
    listener). No group generalised to an untrained interval. Trained and untrained gains correlated r = .55.
  - Authors: learning and generalisation are partly distinct; the breadth of generalisation grows with training;
    a regimen that looks ineffective after a few sessions may work with more. Not tested: whether training past
    the trained-condition plateau is what drives it.
- Reading for Earshot:
  - A condition needs a minimum number of trials within one sitting (≤ ~30 min span) on a given day before
    across-day gains appear; the minimum is task-specific (~120–360+ trials in psychoacoustic and phonetic tasks;
    unknown for speech in noise, where 40–80 accented-sentence trials per session sufficed in Wright 2015).
    Spreading a day's trials thinly over many conditions, or over separate sittings with long gaps, risks
    staying below every condition's threshold. This is the strongest argument in this note against maximal
    variety per day.
  - Short pauses (≤ 6 min) between sets are fine; a 30-min gap resets the day's accumulation for that condition.
  - Listen-only exposure blocks alternating with practice (1.0's exposure interludes) are supported by two
    studies, one with accented sentences in noise. Their power is in replacing practice trials, not in adding
    exposure alone.
  - Generalisation can lag the trained condition by days: "mastered" should not mean "stop training this
    condition today"; keep it in rotation (anchors, maintenance) for several more days.

## 3. Optimal difficulty: what is new beyond R5 §2 (Q1)

- No human experiment that directly tests the 85 % rule in perceptual or speech learning was found in one
  targeted search (results returned only Wilson et al. 2019 itself and press coverage). R5 §2.1–2.3 remains the
  evidence base: Wilson 2019 (model optimum ~85 %, 75–82 % under heavier-tailed noise; binary gradient learners
  only); Liu, Lu & Dosher 2010/2012 (65 % training needs feedback; 85 % works without; a 50/50 mix of 65 % and
  85 % trials learns at both levels; model: > 25 % high-accuracy trials needed without feedback); Hung & Seitz
  2014 (near-threshold-only training raises specificity; many supra-threshold trials preserve transfer); Gabay
  2017 (constant-hard time-compressed speech gave the least learning; adaptive ≈ constant easy, adaptive
  generalised better to new tokens); Papoušek 2016 (field data: 65 % correct best for learning and returns,
  95 % best for first-session survival).
- New evidence bearing on difficulty from this pass is indirect:
  - Wright 2015 (§2): learning of accented sentences happened at +5 dB SNR, i.e. with mostly intelligible
    trials, and listen-only exposure could replace half the practice trials. Learning from speech does not need
    trials near 50 %.
  - Dosher 2020 (§1) used 75 % staircases throughout; roving cost was about the mix, not the accuracy.
  - Ortiz & Wright 2009 (§2): a large share of early gains is procedure-general (learning the format and the
    listening situation), so the first sessions can be easy without losing much.
- Synthesis for Earshot (mine; see recommendations): keep the mean planned accuracy over all scored trials near
  ~78–82 % (between Liu/Lu/Dosher's mix and Wilson's optimum), made of edge trials at ~70–75 % and a sizeable
  share (≥ 25–30 %) of easy trials at ≥ 88 %. 1.0 plans edge 0.72 and anchors 0.90 every 4th–5th trial
  (≈ 20–25 % anchors, plus warm-ups), so its mean is ≈ 0.76–0.77: slightly harder than this synthesis, and its
  anchor share sits right at the Liu/Lu/Dosher model's 25 % boundary.

## 4. Multi-dimensional adaptive models beyond a product of bottlenecks (Q2)

- Owen, Browder, Letham, Stocek, Tymms & Shvartsman 2021, "Adaptive nonparametric psychophysics",
  arXiv:2104.09549 [partial full text, ar5iv; first ~60 %: model, inference, acquisition; result tables not
  read]. Psychometric field as a Gaussian process with probit link, monotonic in the intensity dimension
  (derivative constraints), variational inference; acquisition by level-set estimation (LSE, threshold
  contour), BALD (whole field) or BALV; Sobol initial trials; must update within seconds. Claims up to 10×
  sample-efficiency over earlier adaptive methods. Open-source package AEPsych (licence not seen).
- Keeley, Letham, Tymms, Sanders & Shvartsman 2023, "A semi-parametric model for decision making in
  high-dimensional sensory discrimination", arXiv:2302.01187 (AAAI 2023 version exists) [full text, arXiv PDF].
  Classical sigmoid in the intensity dimension, p = σ(k(x)·(x_i + c(x))), with the threshold offset c and the
  slope k each a GP over the context dimensions; floor link for nAFC guessing. Reaches good accuracy with much
  less data than full-GP baselines (2-D and 8-D tests; exact counts only in figures); 5 human observers
  (200–3,000 trials). Notably, quasi-random (Sobol) sampling was often as good as clever acquisition functions,
  and active-learning gains were concentrated at small sample sizes.
- Reading for Earshot: these are measurement tools for a stationary observer, not schedulers, and a GP per player
  per exercise is heavier than needed. What transfers is the structure: one intensity dial (dB SNR/TMR/DRR)
  carries a classical psychometric function, and the other dials (talker, room, family, similarity) shift its
  threshold (and slope) by smooth, learnable offsets. That is a compensatory model in logit space, whereas 1.0's
  product of per-dial logistic bottlenecks is conjunctive (non-compensatory). Acoustic degradations (noise,
  reverberation, distance, band-limiting) plausibly trade off against each other in dB-equivalent terms
  (compensatory), while independent sub-skills (memory load in Echo, voice identity in Voices) plausibly act as
  bottlenecks. Which structure fits each exercise is an empirical question the 1.1 simulator and the pooled
  exports can answer by held-out log-likelihood (Keeley 2023 used cross-validated log-likelihood the same way).

- Bolsinova, Maris, Hofman, van der Maas & Brinkhuis 2022, "Urnings: a new method for tracking dynamically
  changing parameters in paired comparison systems", J Royal Statistical Society C 71(1):91–118,
  doi:10.1111/rssc.12523 [full text, UvA repository PDF].
  - Each learner and item is an urn of size n with R "green balls" (R/n estimates the probability). After an
    observed outcome, simulate a mock outcome from the current urnings; propose R + X − X* (and the opposite
    for the item); accept with a Metropolis–Hastings probability that also includes the ratio of selection
    probabilities when item selection is adaptive. Without change in the true values, the invariant
    distribution is a product of binomials (known standard errors).
  - Without the selection correction, adaptive matchmaking inflated rating variance (low learners
    underestimated, high overestimated); with it, urnings matched theory. Simulation: 1,000 players,
    n = 100, reliability 0.978. Urn sizes used: learners 20 (Math Garden), items 200. Small urns track change
    fast but noisily; tuning left open.
- Hofman, Brinkhuis, Bolsinova, Klaiber, Maris & van der Maas 2020, "Tracking with (un)certainty", Journal of
  Intelligence 8(1):10, doi:10.3390/jintelligence8010010 [full text, Utrecht repository PDF].
  - Elo gives no standard errors and suffers variance inflation under adaptive matchmaking. Urnings: 95 % CIs from
    urn size covered 95.2 % of person and 92 % of item ratings; correlations with truth 0.962 (persons, urn 60)
    and 0.981 (items, urn 200). After a sudden ability jump, the tracker was back inside the new 95 % CI after
    93 responses (urn 60). Urn size replaces Elo's K; suggestion: larger urns when observations are frequent.
- Reading for Earshot: (a) item and voice difficulty offsets can be calibrated online from responses, but a naive
  Elo update under Earshot's own adaptive selection inflates variance; either log the planned selection
  probability with each trial (the controller knows it) or calibrate items offline from pooled exports with a
  joint fit. (b) Earshot's per-dial Gaussian posterior with random-walk drift already plays the role of a
  tracker with known uncertainty; the Urnings result to borrow is the explicit precision-versus-tracking-speed
  dial (urn size ↔ drift SD), which 1.0 fixes per dial rather than tuning from how often the player trains.

## 5. Scheduling variety: progressive interference and variability (Q3, Q4)

- Porter & Beckerman 2016, "Practicing with gradual increases in contextual interference enhances visuomotor
  learning", Kinesiology 48(2):244–250 [full text, hrcak.srce.hr]. Rotary pursuit at 3 speeds, N = 78, 36
  trials on day 1; groups Blocked, Random, Increasing (12 blocked → 12 serial → 12 random). Acquisition:
  Blocked and Increasing > Random. 24-h retention (time on target): Increasing 6.04 s > Random 5.54 > Blocked
  5.11; transfer (new square path): Increasing 4.32 s > Random 3.76 ≈ Blocked 3.46. One session, one lab task.
  - Prior work it cites [secondary report: Porter & Beckerman 2016; Makaruk et al. 2024]: Porter & Magill 2010
    (novices; golf putting and basketball passing: increasing > fixed blocked or random), Porter & Saemi 2010
    (moderately skilled men, multi-day passing: same), Porter et al. 2011 (children, overarm throw: same).
- Makaruk, Makaruk, Starzak, Chmielewski & Porter 2024, "The learning of sprint hurdles: a comparative study on
  increasing contextual interference and blocked practice schedules", PLoS ONE 19(1):e0289916,
  doi:10.1371/journal.pone.0289916 [full text, PMC10781129]. 46 students, 5 practice sessions over ~3 weeks after
  familiarisation; increasing-variability vs blocked progression. No group difference in acquisition or 10-day
  retention; 40-day transfer favoured increasing CI on two technique measures (d ≈ 0.85), trends on others.
  The paper lists null or mixed applied studies of random or combined schedules (Jones & French 2007; Landin &
  Hebert 1997; Li & Lima 2002; Cheong et al. 2012: combined schedules neither better nor worse for complex
  skills; Bortoli et al. 1992) and the caution that high interference can overwhelm novices (Hebert et al. 1996).
- Wright, Verwey, Buchanan, Chen, Rhee & Immink 2016, "Consolidating behavioral and neurophysiologic findings to
  explain the influence of contextual interference during motor sequence learning", Psychonomic Bulletin &
  Review 23:1–21, doi:10.3758/s13423-015-0887-3 [partial full text, Springer PDF, first ~85 %]. Random practice
  costs acquisition performance and attention (secondary-task RT cost ~20 % vs ~7 %) and gives better delayed
  retention and transfer in lab sequence tasks; mechanisms: repeated retrieval/reconstruction of the action plan.
  No treatment of increasing schedules. Mostly discrete lab tasks.
- With R5 §3.2 (Czyż 2024: CI benefit SMD 0.75 in labs, ~0.1–0.37 n.s. in applied skills and under-18s) and
  R5 §3.3 (Raviv 2022: variability slows early learning and helps generalisation; start low and widen), the
  pattern is consistent: a blocked → serial (predictable order) → random progression is never worse than either
  fixed schedule in the studies found, and is better in several small motor studies. Evidence is small-sample
  and motor-skill based; no auditory or speech study of an increasing-interference schedule was found.
- Note the bridge to §1: "serial" (fixed, predictable cycling) is exactly the order that re-enabled perceptual
  learning under roving (Kuai 2005; Zhang 2008, secondary). A predictable order is a middle step between blocks
  and random mixing in both literatures.

## 6. Talker variability: dose, blocking and generalisation (Q4)

- Uchihara, Karas & Thomson 2025, "High variability phonetic training (HVPT): a meta-analysis of L2 perceptual
  training studies", Studies in Second Language Acquisition 47:794–827, doi:10.1017/S0272263125100879 [partial
  full text, Cambridge PDF, ~82 %].
  - 79 studies, 99 pre–post groups, 35 treatment–control comparisons. Pre–post g = 0.92 (0.71 after
    trim-and-fill); treatment–control g = 0.67. Gains ~13–14 points; controls ~2.7 points (g = 0.19).
  - Retention: posttest → delayed posttest g = −0.08 (n.s.); lower-proficiency learners declined slightly
    (g = −0.23).
  - Generalisation costs relative to trained items and talkers were small: new item + old talker −0.17 (n.s.),
    old item + new talker −0.26, new item + new talker −0.25.
  - Number of talkers did not predict gains overall (b = −0.0095, p = .28; single-talker studies excluded); for
    higher-proficiency learners gains rose up to ~6 talkers (4 studies only); lower-proficiency learners gained
    nothing from more talkers. Blocked vs intermixed talkers: g = 0.99 vs 0.89, n.s. (p = .36).
  - Dose: typical 8.9 sessions × 256 trials × 36 min (294 min total). Total time predicted gains below ~400 min
    and levelled off beyond. Identification training (g = 0.95) beat discrimination training (0.57). Higher
    pretest scores → smaller gains (r = −.52). Publication bias present; mean n = 17.
- Talker-variability meta-analysis, JSLHR 64(12):4802–4825 (2021), doi:10.1044/2021_JSLHR-21-00181 [abstract
  only, ASHA page; authors not shown on the page read; elsewhere attributed to Zhang, Cheng & Zhang 2021].
  18 studies, 549 participants, high vs low talker variability: trained items g = 0.46 [0.08, 0.84], which
  dropped to g = −0.04 [−0.46, 0.37] after removing outliers and correcting for publication bias; generalisation
  to new talkers g = 0.72 [0.15, 1.29]; long-term retention g = 1.09 [0.39, 1.78]. Moderators named: programme
  length and talker presentation format (results not in the abstract).
- Nagle, Bruun & Zárate-Sández 2025, "Comparing lower and higher variability multi-talker perceptual training",
  Applied Psycholinguistics 46:e14, doi:10.1017/S0142716425000141 [partial full text, Cambridge page, ~65 %].
  342 analysable classroom learners (L1 English, Spanish /p–b/), randomised: two talkers (20 tokens each), six
  talkers (10 tokens each), or control; 120 trials per session, blocked by talker, 6 sessions over 3 weeks at
  home. Both trained groups beat control (d ≈ 0.4–0.6); two vs six talkers did not differ (immediate d = 0.06,
  delayed d = −0.11). Generalisation to a new contrast with new talkers: six talkers beat control at both tests,
  two talkers only at the delayed test (a small hint for more talkers on the farthest transfer). Completing 4–6
  sessions beat 1–3.
- With R5 §3.1 (Brekelmans 2022 and Dong 2019: no multi-talker benefit; Perrachione 2011: mixing hurt
  low-aptitude learners, blocking rescued them) and R1 §4.3 (Baese-Berk 2013: multi-accent exposure generalised
  to a new accent), the picture for Earshot: more talkers is cheap insurance for transfer to new talkers, with a
  benefit that is small and conditional on the learner already doing well; blocking by talker does not reduce the
  benefit; beyond ~6 talkers per condition there is no evidence of further gain in phonetic training. Variety
  matters most for the farthest generalisation and least for trained-item gains.

## 7. Personalisation: what to train from the learner's profile (Q5)

- Whitton, Hancock, Shannon & Polley 2017, "Audiomotor perceptual training enhances speech intelligibility in
  background noise", Current Biology 27(21):3237–3247, doi:10.1016/j.cub.2017.09.014 [partial full text,
  PMC5997394, ~70 %; was "could not open" item 7 in R5].
  - Adaptation in the closed-loop game: the maximum SNR fell after every completed puzzle and shape complexity
    rose; tracing accuracy earned time for sub-games. No target-accuracy rule was described on the page.
  - Dose: goal 3.5 h/week × 8 weeks, sessions 30–60 min; median 35 h (control WM game 31 h); 24 of 32 completed.
  - Outcomes: ~25 % more words in sentences at low SNR (g ≈ 0.85–0.94), ~1.5 dB SRT; 62 % vs 9 % clinically
    meaningful SRT change; no change for words in isolation. Gone at 2 months without practice (g < 0.14).
  - Individual differences: baseline Stroop congruence cost predicted gains (R = 0.66); authors suggest matching
    game strategies to cognitive strengths (untested).
- Biagianti et al. 2020, "Specificity and durability of changes in auditory processing efficiency after targeted
  cognitive training in individuals with recent-onset psychosis", Frontiers in Psychiatry 11:857,
  doi:10.3389/fpsyt.2020.00857 [full text, eScholarship PDF]. RCT n = 125, auditory vs executive training, 30 h;
  difficulty adapted within exercises and blocks ended when improvement plateaued. Baseline auditory processing
  speed correlated with peak training performance (r ≈ .42–.72). No personalised-vs-standard comparison; the
  authors call for one.
- Bruno, Shaw & Hosseini 2024, "Toward personalized cognitive training in older adults: a pilot investigation of
  the effects of baseline performance and age on cognitive training outcomes", J Alzheimer's Disease
  97(1):327–343, doi:10.3233/JAD-230619 [full text, PMC10984557]. 31 completers, three domain groups, no control.
  Inhibitory-control group: higher baseline → larger trained gains, but lower baseline → larger Flanker
  transfer gains; memory group: baseline did not predict. Mixed, uncontrolled.
- From earlier notes: Magits 2023 (R1 §4.6): personalised CI training equalled non-personalised training with
  the same materials. R1 §4.8: poorest baselines gained most, also in placebo arms (regression to the mean).
  Uchihara 2025 (§6): higher pretest → smaller gains (r = −.52). Clement 2015 ZPDES (R5 §1.3): steering practice
  to where learning progress is highest matched an expert sequence and helped heterogeneous learners most.
- State of evidence: no controlled study found (in this pass or in R1/R5) that targeting a learner's weakest
  sub-skill beats balanced or strength-based training on transfer. "Weak areas gain most" is confounded with
  regression to the mean and with room to improve. The one direct test in hearing (Magits 2023) was null.

## 8. Auditory stimulus uncertainty and the reverse hierarchy (Q1, Q4)

- Nahum, Nelken & Ahissar 2010, "Stimulus uncertainty and perceptual learning: similar principles govern
  auditory and visual learning", Vision Research 50(4):391–401 [abstract only, Hebrew University research
  portal]. Discriminating two similar words in noise, where two configurations differed only in low-level
  binaural information (null or maximal). Separate blocks: optimal use of the binaural cue already in session 1;
  consistently interleaved (predictable alternation): needed more than one session to get there; randomly
  mixed: never optimal, even after several sessions. Training with blocks or consistent interleaving
  transferred to the mixed condition. Account: variability obstructs the top-down search for fine low-level cues
  (reverse hierarchy theory).
- Nahum, Nelken & Ahissar 2008, "Low-level information and high-level perception: the case of speech in noise",
  PLoS Biology 6(5):e126, doi:10.1371/journal.pbio.0060126 [partial full text, PMC2386842, ~67 %; was
  "could not open" item 6 in R5].
  - Binaural benefit (dichotic minus diotic threshold) for word pairs in noise. Phonologically different pairs:
    ~9–11 dB in every condition (ideal-listener level). Similar pairs (one phoneme apart): 9.1 dB when the
    binaural configuration was consistent within blocks and the task was identification, but only ~3.6–4.7 dB
    when configurations were mixed unpredictably or the task was semantic. Larger word sets raised thresholds
    without changing the benefit; adaptive tracks at 80 % vs 60 % correct did not change access to the fine cue
    (difficulty alone was not the cause).
  - Reading: fine acoustic cues (here, binaural ones) are used fully only when the listening configuration is
    consistent and the task asks for identification; unpredictable trial-to-trial switching of the
    configuration blocks their use, at any difficulty. The paper did not test training.
- Banai & Amitay 2012, "Stimulus uncertainty in auditory perceptual learning", Vision Research 61:83–88,
  doi:10.1016/j.visres.2012.01.009 [abstract only, University of Haifa research portal]. Review: uncertainty
  impedes auditory learning under some but not all conditions; it hinders learning when the interleaved
  stimuli or tasks are similar (not when distinct) and when it blocks the top-down search for fine-grained
  information; it may help when stimuli are to be grouped into phonological or acoustic categories.
- Reading for Earshot: the spatial (headphone) and room cues in Crowd and Far are exactly the kind of fine,
  low-level cues whose use suffers under unpredictable switching (Nahum 2008/2010), and whose learning a
  predictable order rescues partly. Category-level variation (talkers, accents) is the kind that can help.
  So variety should be scheduled differently for cue-type dials (block, then predictable alternation, then
  random) than for content and talker dials (can rove early).

## 9. Mixing easy and hard versions: reward-based accounts of roving (Q1, Q4)

- Herzog and colleagues (EPFL), c. 2012, "Perceptual learning, roving, and synaptic drift" [abstract only,
  EPFL Infoscience record 181648 (file name suggests a Vision Sciences Society 2012 abstract); a second
  Infoscience record (174040) carries the same abstract without a citation]. Builds on the analysis of
  Frémaux, Sprekeler & Gerstner 2010 (J Neurosci 30(40):13326–13337; not opened): reward-modulated learning can
  learn two interleaved tasks only when their mean rewards are equal ("unsupervised bias"). Test: bisection
  with 20' and 30' outer distances at ~70 % and ~87 % correct, roved: no learning of either. Conclusion: an easy,
  undemanding task interleaved trial by trial can block learning of a hard one.
- Modelling preprint, bioRxiv doi:10.1101/383398 (2018) [partial full text, bioRxiv PDF; authors and title not
  shown on the part read]. Argues the simple unsupervised-bias account cannot explain roving failure when task
  representations do not overlap, and proposes a single-critic hypothesis (reward prediction suppressed under
  task uncertainty); in simulation, switching to a separate critic per task restored learning quickly. Cites
  Parkosadze et al. 2008: under extended roving (18,000 trials) performance worsened for ≥ 3,600 trials before
  learning began.
- Reconciling with R5 §2.3 (Liu, Lu & Dosher 2012: mixing 65 % and 85 % trials of the SAME stimulus and task
  enabled learning; with feedback all mixtures learned; Hung & Seitz 2014: many supra-threshold trials kept
  transfer): the harmful case is interleaving different stimulus types or conditions whose expected accuracy
  differs, presented without a cue that tells the learner which condition is coming. Easy trials of the same
  condition (1.0's anchors), with trial-by-trial feedback, are the supported case.
- Reading for Earshot: (1) keep anchors inside the condition being trained (same family, room type, voice
  set), eased on the dials, rather than borrowing an easy trial from another condition; (2) when conditions
  are interleaved, equalise their planned accuracy (1.0's controller already plans each edge trial at the same
  target whatever the condition, which satisfies this); (3) show the condition cue before each trial (the
  trial anatomy's context cue already does this) so each condition can carry its own expectation.

## 10. Speech-specific review: older adults, challenging speech (Q1, Q3)

- Bieber & Gordon-Salant 2021, "Improving older adults' understanding of challenging speech: auditory
  training, rapid adaptation and perceptual learning", Hearing Research 402:108054,
  doi:10.1016/j.heares.2020.108054 [full text, PMC7880302, ~92 % read in two parts].
  - Difficulty in the reviewed studies: adaptive SNR at 50 % (Adank & Janse 2010: young listeners kept
    adapting for ~30 min, older ones plateaued after list 1) and at 70 % (Karawani et al. 2016); a 2-down/1-up
    rule over 300 trials (Manheim et al. 2018, who note that group differences in adaptation rate may reflect
    different starting levels). Interspersing slower or natural-rate sentences, or silence, during adaptation to
    fast speech did not reduce learning (Golomb et al. 2007) — easy items mixed in did no harm.
  - Rapid adaptation appears within ~10–20 items (time-compressed and non-native speech); longer-term
    learning (across days) is a separate measure. Lexical knowledge and attention-switching control predict
    adaptation; hearing sensitivity did not predict learning rate or size in the non-native and vocoded studies.
  - Dose and retention: learning may saturate (Banai & Lavner 2014; Wright & Sabin 2007); massed vs spaced
    training did not differ in older adults (Tye-Murray et al. 2017) [secondary report: this review]; transfer was
    seen more often with multiple sessions or multiple forms of challenging speech (Karawani 2016; Sweetow &
    Sabes 2006; Whitton 2017); multi-talker non-native training gave day-1 gains, none added on day 2, and none
    retained at one week (Bieber & Gordon-Salant 2017).
  - Feedback: clear-then-distorted replay helped vocoded-speech adaptation (Davis et al. 2005), auditory and
    visual feedback alike.
  - Design advice: combined auditory–cognitive load "holds promise" for transfer; analyse trial-level data with
    growth-curve or GAM models rather than block averages (block averages miss group differences).

## 11. Arithmetic and code checks on 1.0 (not research evidence; reproducible)

- Breadth rule acts as a timer. Simulation of js/engine/learner.js breadthRule with a controller that holds true
  accuracy at p (script kept outside the repository; 400 runs per cell): at p = 0.72, breadth goes from 0.2 to
  1.0 after a median of 144 edge trials (IQR 114–183) for single-slot, 150 (127–193) two-slot, 161 (131–193)
  three-slot exercises; mean breadth 0.64–0.67 after 100 edge trials and 0.96–0.99 after 300. At p = 0.68 the
  median is 228–330; at p = 0.65 it is ~500–1,600. Because the edge target (0.72) sits just below the widening
  threshold (0.75) and the check slides every trial once 10 trials have passed, chance alone widens variety
  for any learner the model tracks well, stalled or not. (The simulation ignores any cost of variety; a real
  cost would lower accuracy after each widening and slow it.)
- Focus dial is chosen per edge trial (softmax bandit, temperature 0.25, 20 % random exploration;
  js/engine/controller.js `bandit` and the edge branch of `nextRaw`), unless a venue set pins a focus. So within
  a set the configuration (which dial sits at the edge, e.g. spatial separation vs voice similarity in Crowd)
  changes unpredictably from trial to trial: the "randomly mixed" protocol of Nahum et al. 2008/2010 for
  cue-type dials.
- The session planner draws a different exercise for each set and does not repeat an exercise within a session
  (except in Focus mode): a default 15-min session = 5 sets × ~20 trials from 5 exercises, so each exercise gets
  about one ~20-trial set per training day. That is below every daily dose that produced across-day learning in
  §2 (40–80 accented-sentence trials per session in Wright 2015; 120–360+ in psychoacoustic tasks).
- Switch-cost estimation precision (binomial arithmetic): the SE of (mean residual on switch trials − on repeat
  trials) ≈ 0.45·√(1/n_s + 1/n_r) for single-slot trials at p ≈ 0.72: 0.10 with 40 + 40 trials, 0.071 with
  80 + 80, 0.05 with 160 + 160 (multi-slot trials ~20–25 % smaller). A per-player switch cost therefore needs a
  prior (pooled data; Vlahou 2021's 1–7-point room-switch cost, cited in PLAN §6) and shrinkage.

## 12. Recommendations for Earshot 1.1 (ranked by expected effect × strength of evidence)

Parameter values marked (E) come from a study's numbers; (D) are derived by me from the evidence and need the
simulation or pooled data to confirm. Keep every new constant in js/engine/dials.js MODEL (one place to correct).

1. Concentrate each day's dose per exercise; move variety from within the day to across the week.
   - Planner: a sitting trains at most 3 exercises; every exercise trained in a sitting gets ≥ 2 sets
     (T_ex ≥ 40 scored trials (D)); a condition new that day gets ≥ 60 trials (D) or 40 trials plus exposure
     blocks (item 7). A B A B C and A A B B C are both safe at 20–30 trials per set: runs of 40–60 trials stay far
     below the 180–300-trial runs that blocked the next task's learning, and alternation every 60 trials did not
     (E, Wright lab 2023); prefer A B A B for within-sitting variety. Sets of one exercise stay
     within 30 min of each other; pauses ≤ 6 min between sets are harmless (E, Little 2017). Rotate exercises
     across days (weights as today) so each is trained on 2–4 days a week. A 2-set session trains one exercise
     twice, with talkers and rooms varied inside it.
   - Evidence: daily learning thresholds and their decay within 30 min (Wright & Sabin 2007; Little, Zhang &
     Wright 2017); more than a few hundred trials in a sitting adds nothing (Ortiz & Wright 2010); accented
     sentences learned with 80 practice or 40 + 40 exposure per session (Wright 2015). 1.0 gives each exercise
     ~20 trials per day (§11). Risk if wrong: none for trained gains (same weekly trials); only less within-day
     variety.
2. Two kinds of variety, two schedules.
   - Content variety (talker within a condition, sentence, masker talkers, room instance within a room type):
     rove from the start; keep ≥ 6 talkers per condition in the pool (E: gains rose up to ~6 talkers for stronger
     learners, none beyond tested; Uchihara 2025); blocked-by-talker and mixed talkers do equally well (E, same
     meta-analysis), so for a new player or a high measured switch cost, block talkers within a set
     (Perrachione 2011, R5).
   - Cue and condition variety (Crowd spatial layout and cue type; Far room type and room switching; Strange
     family; Voices similarity): per condition, three stages — blocked (whole sets) → serial (fixed, announced
     alternation inside a set in runs of 3–5 trials, cue shown before each trial) → random (trial by trial, cue
     shown). Gates (D): blocked → serial after ≥ 40 scored trials of the condition on ≥ 2 days; serial → random
     when the switch cost (item 3) is ≤ 0.05 with its 80 % interval below 0.10; one stage back when it exceeds
     0.10 or a plateau is called at the random stage.
   - Make the focus dial sticky: in Edge mode choose it per mini-block of 5–6 edge trials (anchors inside the
     block), not per trial, until that exercise reaches the random stage; announce the block's focus in the
     pre-trial cue. The bandit then scores mini-blocks.
   - Evidence: random trial-by-trial switching of a binaural configuration prevented full use of binaural cues
     for similar words, consistent blocks gave it in session 1, consistent interleaving after > 1 session, and
     both transferred to mixed (Nahum 2008, 2010); fixed temporal order re-enabled learning under roving (Kuai
     2005, Zhang 2008: secondary); fast alternation of similar conditions blocked learning of both (Banai 2010);
     similar variants interfere most, dissimilar little (Dosher 2020); same judgment with different stimuli does
     not disrupt acquisition (Maidment 2015); blocked → serial → random beat fixed schedules in motor learning
     (Porter & Beckerman 2016; Porter & Magill 2010, secondary).
3. Replace the breadth rule (a timer today, §11) with readiness plus a measured cost of variety.
   - Model a switch cost s (logit offset on trials whose condition differs from the previous trial's) and a
     variety cost v per breadth step, per exercise, with a pooled prior and shrinkage (§11 precision). Planned p
     includes them, so the controller pays for variety by easing the focus dial, and accuracy stays at target
     (Wilson 2019, R5).
   - Widen one step only when (a) the focus-dial posteriors have been flat or improving over the last 2
     sessions, (b) s ≤ 0.05 (accuracy units), and (c) no difficulty push happens in the same set ("one notch at a
     time": alternate difficulty pushes and variety pushes). Narrow one step when s > 0.10 or accuracy over 20
     edge trials < 0.55 (D).
   - Evidence: variability slows early learning and helps generalisation; start low and widen (Raviv 2022, R5);
     variability helps stronger learners and not weaker ones (Perrachione 2011; Uchihara 2025; Fuhrmeister &
     Myers 2020, R1); room switching costs 1–7 points (Vlahou 2021, PLAN §6).
4. Easy trials: keep them, keep them inside the condition, and keep conditions level.
   - Edge target 0.72 and floor 0.65 stay. One anchor (0.90) after every 3 edge trials, i.e. 25 % of trials
     (E: Liu, Lu & Dosher 2012 model > 25 % high-accuracy trials for learning without feedback; 1.0 alternates
     gaps of 3 and 4 edge trials, i.e. 20–25 %), plus the after-two-misses anchor. An anchor is always the current condition with its dials eased,
     never an easy trial borrowed from another condition. When conditions interleave, their planned p stays equal
     (1.0 does this; make it a tested invariant: spread of planned p across interleaved conditions ≤ 0.05).
   - Evidence: an easy and a hard version of different stimuli roved together blocked learning of both (Herzog
     c. 2012, abstract); mixing easy and hard trials of the same task enabled learning (Liu, Lu & Dosher 2012);
     supra-threshold share preserves transfer (Hung & Seitz 2014); easy sentences interspersed did not reduce
     adaptation (Golomb 2007 via Bieber 2021).
5. Mastery = consolidated, then maintained.
   - Path mastery: today's rule (5 in a row or 80 % of the last 15) AND the condition was trained on ≥ 2 days AND
     its first-set-of-the-day accuracy is ≥ planned p − 0.05 (it survived a night) (D). After mastery it keeps
     ≥ 10–15 % of that exercise's trials for ≥ 4 more training days, then a 5 % maintenance share with anchors (D).
   - Evidence: generalisation to an untrained condition appeared after 4 days, not after 2, although the trained
     condition improved within 2 (Wright, Wilson & Sabin 2010); stimulus-specific learning appeared by 24 h
     (Ortiz & Wright 2010); gains vanished 2 months after training stopped (Whitton 2017); 5 correct in a row
     predicted transfer better than 3 (Kelly 2015, R5).
6. Diagnose a stall before choosing its breaker. Order: (i) dose — the exercise got < T_ex trials per sitting
   → "concentrate" (new breaker: two sets in one sitting for a week); (ii) schedule — stall at the random stage
   with s > 0.05 → one stage back; stall after long blocked runs → move to serial (this replaces "widen variety"
   as the unconditional first breaker); (iii) difficulty mix — more anchors plus exposure blocks; (iv) strategy
   card; (v) sleep after same-day runs, then rest; (vi) switch the focus dial. Each keeps its player-facing
   reason. Evidence: items 1–4; R5 §4.3. Parkosadze 2008 (secondary, bioRxiv 383398): under heavy roving,
   performance worsened for ≥ 3,600 trials before learning began — roving stalls can look like true asymptotes.
7. Exposure interludes sized as practice partners. Replace 20–30 s examples with blocks of 6–8 items
   (~60–90 s) of the condition just trained, right after its set, words shown; count each exposure item as
   half a trial toward T_ex (D). Never exposure alone. Evidence: 40 practice + 40 exposure = 80 practice for
   accented sentences in noise; exposure alone did nothing (Wright 2015 Exp 2; ~1.5-min blocks of 8 sentences).
8. Personalise the schedule first, the content second.
   - Best-supported personalisation is of variability: set each player's stage and talker blocking from their
     measured switch cost (items 2–3), because variability helped stronger learners and hurt or did not help
     weaker ones (Perrachione 2011; Uchihara 2025).
   - Content: Edge keeps choosing by learning progress (ZPDES, R5) within the owner's priority weights; it does
     not chase the weakest probe by default (personalised CI training = non-personalised: Magits 2023, R1; weak
     areas "gain most" partly by regression to the mean: R1 §4.8). Focus mode (60 % on the weakest probe) stays
     opt-in and says it is a bet.
9. Calibrate item and voice difficulty from pooled data, and log what is needed for it. Add to each exported
   trial: item id, voice id, condition, planned p, schedule stage and mode. Calibrate offsets offline by a joint
   fit, shrunk toward today's recogniser-based offsets with weight n/(n + 100) responses (D; ~100 learners for good
   item difficulties: Pelánek 2016, R5). An online Elo-style update under Earshot's own adaptive selection would
   inflate variance unless it uses the logged selection probability (Bolsinova 2022; Hofman 2020). Tie each
   dial's drift SD to time away and trial rate (Urnings: precision vs tracking speed is one dial).
10. Test the dial structure. Fit a compensatory variant (one logistic over the weighted sum of dial distances,
   i.e. dB-equivalent trading) next to 1.0's conjunctive product, per exercise, by held-out log-likelihood
   (Keeley 2023's criterion). Expectation (D): acoustic dials (SNR/TMR, distance, reverberation, room noise,
   band-limit) trade off compensatorily; memory load (Echo) and voice similarity (Voices) act as bottlenecks.
11. Optional new bet: seeded per-player randomisation of one schedule choice per condition (e.g. blocked-first
   vs serial-first for a new Strange family, or 20 % vs 30 % anchors), with the arm in the pooled export and the
   next-day first-set residual as outcome. Turns items 2–4 into community data within weeks (D).

Answer to the owner's question "is more variety good?" (from the progression side): yes for content and talker
variety (cheap; helps the farthest generalisation for players already doing well; no cost to trained gains when
blocked by talker; no evidence of extra gain beyond ~6 talkers per condition); yes for condition variety when it
arrives in stages (blocked → predictable → random) and is paid for with easier settings rather than lower
accuracy; no for variety that thins the daily dose per exercise or switches fine cues (spatial layout, room)
unpredictably trial by trial — the two forms that stopped learning in the studies above.

## 13. What to test in simulation (tests/sim) before shipping

The simulated learners (tests/sim/learners.mjs) have no daily threshold, no roving penalty and no switch cost,
so today's sims cannot see items 1–3. Add each as a switchable assumption and require that a change helps when
the assumption is true and costs little when it is false.
1. Breadth trajectories per learner type under the 1.0 rule and the new rule (expected: 1.0 saturates after
   ~150 edge trials for every type, §11; the new rule should separate fast, early-stalling, stalled and weak).
2. Daily consolidation threshold: a condition's day gain consolidates only if it got ≥ T trials within a
   30-min window (T ∈ {0, 20, 40, 80}); compare the 1.0 planner (5 exercises × 1 set) with the concentrated
   planner (≤ 3 exercises × ≥ 2 sets) on trained thresholds after 30/60 days. Pass: concentrated ≥ 1.0 at T = 0,
   clearly better at T ≥ 40.
3. Roving penalty: learning-rate multiplier for a condition when similar conditions alternate at random
   (1.0, 0.75, 0.5) or serially (0.9); switch cost on accuracy (0, 0.25, 0.5 logit, decaying with practice).
   Compare per-trial focus with sticky 5–6-trial focus, and the three-stage schedule with 1.0's.
4. Switch-cost estimator: trials needed before the stage gates act; rate of wrong step-backs when s = 0;
   detection delay when s = 0.10 (target: < 3 sessions, false step-backs < 10 %).
5. Planned-p invariant: spread of planned p across interleaved conditions and between anchors and their own
   condition's edge trials (target ≤ 0.05) over 200 learners × 60 days.
6. Breaker diagnosis vs the fixed 1.0 order on learners with injected stall causes (low dose, roving, true
   asymptote): share of plateaus followed by renewed progress within 6 sessions; false actions.
7. Compensatory vs conjunctive learners: generate from each, fit both; planned-vs-observed calibration, threshold
   bias, plateau false alarms.
8. Anchor share 20 / 25 / 33 %: cost in time-to-threshold only (the simulated learners have no easy-trial
   benefit; the benefit needs human data, e.g. item 11).

## 14. Could not open, or read only in part (ranked by how much the recommendations lean on them)

1. Kuai, Zhang, Klein, Levi & Yu 2005 (Nature Neuroscience; temporal patterning re-enables learning under
   roving) and Zhang et al. 2008 (PLoS Biology; stimulus coding rules) [secondary report: Dosher 2020]. Need:
   which orders (fixed cycle, ascending) restored learning, run lengths, whether a pre-cue alone sufficed.
   Item 2's serial stage leans on them. Meanwhile: runs of 3–5 trials in a fixed announced cycle.
2. Nahum, Nelken & Ahissar 2010 (Vision Research 50:391–401) [abstract only]. Need: trials per protocol, number
   of sessions, size of the consistent-interleaving lag, transfer numbers. Item 2.
3. Herzog et al. 2012 "Perceptual learning, roving and the unsupervised bias" (Vision Research 61:95–99,
   details unchecked) [only a related conference abstract read]; Frémaux, Sprekeler & Gerstner 2010 (J Neurosci
   30:13326–13337) [not opened]; Tartaglia, Aberg & Herzog 2009a/b [secondary]. Need: whether roving tasks of
   EQUAL difficulty learn normally (the prediction behind item 4's invariant). Meanwhile: equalise planned p.
4. Wright & Sabin 2007 (Exp Brain Res 180:727–736) [abstract only]. Need: group sizes, learning amounts, and
   whether the per-day threshold scales with task difficulty. Item 1's T_ex.
5. Wright lab 2023 (Learning & Memory 30(5–6), doi:10.1101/lm.053710.122) [full text, author list not shown].
   Need: authors and pages for the reference list.
6. Talker-variability meta-analysis, JSLHR 64(12):4802–4825 (2021) [abstract only]. Need: moderator results for
   presentation format (blocked vs mixed) and programme length.
7. Porter & Magill 2010 (J Sports Sciences; increasing CI) [secondary: Porter & Beckerman 2016; Makaruk 2024].
   Need: schedule details and effect sizes.
8. Ahissar et al. 2009 "Reverse hierarchies and sensory learning" (Phil Trans R Soc B; PMC2674477) [PMC
   returned a browser check page]. Need: RHT predictions for speech-in-noise training order.
9. Owen et al. 2021 AEPsych [results and tables not read]. Need: trial counts per dimension vs classic methods.
10. Banai & Amitay 2012 (Vision Research 61:83–88) [abstract only]; Amitay, Hawkey & Moore 2005 [secondary];
    Parkosadze et al. 2008 [secondary]; Tye-Murray et al. 2017 massed vs spaced [secondary: Bieber 2021];
    Little, Cheng & Wright 2019 (practice + exposure, musical intervals) [not opened].
11. Not found: any human experiment testing the 85 % rule directly in perceptual or speech learning (one
    search); any auditory or speech study of an increasing-interference (blocked → serial → random) schedule;
    any controlled test of weakest-skill vs balanced training on transfer.
12. Not opened, no claims made from them: cognitive-load "variability effect" work (Paas & van Merriënboer),
    Bjork's desirable difficulties, Guadagnoli & Lee's challenge point (R5 has secondary reports).

## 15. Sources read for this note (read level in the section where each is used)
Banai et al. 2010; Banai & Amitay 2012; Bieber & Gordon-Salant 2021; Biagianti et al. 2020; Bolsinova et al.
2022; Bruno et al. 2024; Dosher et al. 2020; Herzog et al. c. 2012 (abstract); Hofman et al. 2020; Keeley et
al. 2023; Little, Zhang & Wright 2017; Maidment et al. 2015; Makaruk et al. 2024; Nagle et al. 2025; Nahum et
al. 2008, 2010; Ortiz & Wright 2009, 2010; Owen et al. 2021; Porter & Beckerman 2016; talker-variability
meta-analysis JSLHR 2021; Uchihara et al. 2025; Whitton et al. 2017; Wright & Sabin 2007; Wright, Wilson & Sabin
2010; Wright, Baese-Berk, Marrone & Bradlow 2015; Wright lab 2023 (Learning & Memory); Wright et al. 2016 (PBR
review); bioRxiv 10.1101/383398 (roving model). Searches used: 12 of 12.
