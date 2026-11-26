# R5 — Progression and game design: research notes

Scope: (a) how to progress difficulty in perceptual and skill training; (b) which game and
motivation elements help or hurt learning in cognitive/perceptual training. Evidence only, no design.
Started 2026-11-26 (UTC). Reading depth is tagged on every source:
[full text], [abstract only], or [secondary report: where].
Method: about 50 web searches (then the shared search budget ran out) and about 70 page fetches.
PubMed Central pages returned a browser check, so PMC papers were read from author, repository
or journal copies where one existed. Items 7 and 8 got no dedicated searches (see the end).

## Summary

1. Target accuracy: theory gives ~85% correct as the learning-speed optimum for binary gradient learners (75–82% under heavier-tailed noise); field data found harder targets (50–65%) gave more learning and returns, easy (95%) better first-session survival; Math Garden defaults to 75% (60/90 options).
2. Staircases: 1-up/2-down 70.7%, 1-up/3-down 79.4%, 1-up/4-down 84.1%; weighted step ratios reach any target; a staircase level is a lagging, noisy readout (~60–80 trials per threshold estimate).
3. Bayesian/multi-dimensional: QUEST+ handles many dimensions but assumes a stationary observer; learning-progress bandits (ZPDES) steer practice to where the learner is improving; Elo with a decaying K gives r ≈ 0.8 skill estimates after ~10 answers.
4. Near-threshold vs easy: long near-threshold practice raises specificity, easy trials favour transfer; mixing high-accuracy trials enables hard-trial learning without feedback; constant-hard training was worst for compressed speech; easy-to-hard beat constant-hard and hard-to-easy in auditory learning.
5. Feedback: essential at 65% accuracy, optional at 85%; feedback that contradicts felt difficulty produced "unlearners"; learners complain when feedback mismatches how they think they did.
6. Interleaving: g = 0.42 overall; helps similar categories (paintings 0.67), hurts words (−0.39) and dissimilar categories; works by comparing neighbours. Mixed talkers helped high- and hurt low-aptitude learners in one study (blocking rescued), but replications found no multi-talker benefit.
7. Contextual interference: strong in labs (SMD 0.75), weak or n.s. in applied/sport tasks (0.11–0.34) and under-18s; variability slows early learning and aids generalisation, so start low and widen (Raviv 2022).
8. Sessions/spacing/sleep: 100-trial (~8 min) sessions learned fastest per trial early; between-session gains largest early; repeated same-day testing degraded performance 52% (stimulus-local) and a nap or a new stimulus location restored it; sleep restored speech-learning gains.
9. Plateaus: 78–86% of individual learners show step-like curves, not smooth ones; dips often precede leaps (new strategies); detectors: breakpoint fits, quantile banding, Bayesian curve fits, windowed learning progress, prediction-stability stopping; wheel-spinning 9–38% by definition.
10. Game elements: points are safe and liked; an on-screen score and lives display cut n-back gains (slope 0.10 vs 0.35); themes that change stimuli hurt validity; sound effects slow responses; points/levels/leaderboards raise quantity, not quality or intrinsic motivation.
11. Meta-analysis (gamified learning): cognitive g = 0.49, robust; motivational/behavioural effects not robust in rigorous studies; competition alone n.s., competition plus collaboration better.
12. Rewards: expected tangible, completion- and performance-contingent rewards undermine free-choice motivation (d −0.28 to −0.44; −0.88 if not all can earn); informational positive feedback helps (+0.33 to +0.66); unexpected rewards are neutral.
13. Absence: broken streaks lower later engagement versus intact ones (worse with self-blame, softened by repair); one missed day did not harm habit formation; a ~US$0.09 bonus for returning after a miss was the best of 53 gym interventions (+27%).
14. Adherence: real-world completion is low (12% finished a 144-session programme; ~44% attrition in a remote auditory game); skill largely survives long breaks and recovers within a session or two.
15. Gaps: items 7–8 (seeded daily challenges, existing ear-training apps) were not searched (search budget exhausted); no direct study of streak-related anxiety found; several method papers (Kaernbach, García-Pérez, psi) not opened.

## 1. Adaptive procedures

### 1.1 Transformed up-down staircases

- Levitt 1971 [full text, course-hosted PDF]. Transformed up-down rules converge on fixed points of
  the psychometric function: simple up-down 50%; the "down after two correct, up after one wrong"
  rule (1-up/2-down) 70.7%; a sequence rule at 79.4% (the 1-up/3-down point); 84.1% via a
  sequence rule or Campbell's BUDTIF block rule (change level after groups of four, down only if
  all four correct). No 85%/89% rule beyond these in his table.
  - Step size: start large and shrink. Practical approximation: halve the step after runs 1, 3, 7,
    15 ...; each new run starts at the mean of the last peaks and valleys. If the curve is roughly
    known, a single halving after run 3 is nearly as good.
  - Asymmetric cost of mis-sized steps: initial step twice optimum loses ~25% efficiency; half the
    optimum loses close to 100%. When unsure, pick the larger step.
  - Estimation: run to at least 6–8 reversals; use mid-run estimates (average of peaks and
    valleys), an even number of runs. Below ~30 trials, mid-run estimates beat maximum likelihood.
  - A good up-down procedure gets within ~30% of the precision achievable if every trial were
    placed at the target level.
  - Only essential assumption: the probability of a correct response rises monotonically with
    level, over the range sampled. Violations cost efficiency, not validity. Transformed rules
    track drift more slowly than simple up-down because each step needs more trials.
  - Arithmetic (not from the paper, standard): an n-down/1-up rule converges where p^n = 0.5, so
    1-up/2-down 70.7%, 1-up/3-down 79.4%, 1-up/4-down 84.1%. Kaernbach's weighted up-down rule
    (1991, not opened) converges where p·step_down = (1−p)·step_up, so any target can be set by
    the ratio step_up/step_down = p/(1−p) (e.g., 75% → 3:1; 85% → ~5.7:1). [arithmetic, not read]
  - Zhang, Zhao, Dosher & Lu 2019, J Vision [full text, eScholarship PDF]: a 3-down/1-up staircase
    needs ~60–80 trials to converge, so staircase-based block estimates track a learning curve
    coarsely; 40-trial blocks gave too few reversals to use. In simulation, a Bayesian
    learning-curve method (qCD, below) recovered the amount of learning with far less bias than
    staircase blocks (e.g., bias in the dynamic-range parameter 0.016 vs 0.21–0.49 for 80/160-trial
    staircase blocks). Relevance: staircase level is a lagging, noisy readout of ability.

### 1.2 Bayesian adaptive methods

- Watson 2017, QUEST+ (J Vision 17(3):10) [full text, journal page]. Generalises QUEST to any
  number of stimulus dimensions, model parameters and response outcomes. Each trial picks the
  stimulus that minimises the expected entropy of the posterior over parameters (one-step
  look-ahead); estimate = posterior mode on the grid, ideally followed by a maximum-likelihood fit.
  - Simulated trial counts in the worked examples: threshold only 32 trials; threshold + slope +
    lapse 64; a contrast-sensitivity function (2 stimulus dims, 3 params) 32; a 3-D
    spatiotemporal CSF (4 params) 64 trials, visiting only 20 of 729 possible stimuli.
  - Cost: likelihood table = product of all grid sizes, so it grows fast; < 1 s/trial in his
    examples on a laptop (Mathematica). Grids, bounds and priors need "some knowledge and art".
  - Key limitation for training: assumes a stationary observer and independent trials. A learner
    who is improving violates this; a long-memory posterior lags behind real ability.
- Kontsevich & Tyler 1999, psi method (Vision Res 39:2729) [not opened; known as the
  entropy-minimising method for threshold + slope; QUEST+ is its generalisation]. Prins 2013
  psi-marginal [not opened].
- Zhang, Zhao, Dosher & Lu 2019, quick Change Detection (qCD) [full text]. Models the learning
  curve itself (exponential: threshold = k·e^(−n/c) + a; initial, time constant in trials,
  asymptote) and picks each stimulus to maximise information about those curve parameters.
  - 5 human observers, 1,920 trials of a 4AFC motion task interleaved with a staircase: qCD
    thresholds correlated r ≈ 0.88 with staircase thresholds; trial-by-trial 68% credible
    interval half-width 0.030, 0.022, 0.011 log10 units after 160, 640, 1,760 trials.
  - Limits: assumes a monotonic exponential curve (cannot represent dips/leaps); can only track
    change no faster than the posterior converges; prior-dependent. Authors mention power-law,
    two-phase and nonparametric alternatives.

### 1.3 Multi-dimensional adaptive practice

- QUEST+ (above) handles several stimulus dimensions in one posterior, but as measurement, not as
  a training scheduler.
- Clement, Roy, Oudeyer & Lopes 2015, J Educational Data Mining 7(2):20–48 (arXiv 1310.3174)
  [full text, ar5iv, read in two parts]. Multi-armed bandit tutors. ZPDES: each activity's reward
  = learning progress = success rate over the most recent d/2 attempts minus success rate over
  the d/2 before; mastered and impossible activities both earn ~0, so the scheduler drifts toward
  activities where the learner is currently improving. Activities are sampled in proportion to
  weights with a uniform exploration share γ. A "zone of proximal development" holds the active
  set; the next harder level unlocks when the learner's success rate exceeds a threshold ω and
  progress on the current level has dropped relative to the next. Minimal domain knowledge
  needed (an ordering graph).
  - Field study: ~400 children aged 7–8 in 11 schools; 40 min of exercises; groups = expert
    sequence, RiARiT, ZPDES, no-software control. Expert sequence pushed students furthest along
    its own fixed track (75% reached the top level of one exercise type vs 0% for ZPDES), but
    ZPDES students reached the harder exercise types more often (e.g., 95% succeeded at ≥1
    exercise of a type vs 75% with the expert sequence). Authors: efficiency comparable to an
    expert-designed sequence, larger benefit for heterogeneous learners. Parameter values were
    not in the parts I read.
- Related: Oudeyer, Gottlieb & Lopes 2016 (Prog Brain Res) on learning progress as an intrinsic
  motivation signal [not opened].

### 1.4 Elo / IRT learner models in learning apps

- Pelánek 2016, "Applications of the Elo rating system in adaptive educational systems",
  Computers & Education 98:169–179 [full text, author PDF].
  - Model: P(correct) = 1/(1+e^−(θ−d)) (Rasch form). Updates θ += K·(correct − P) and
    d += K·(P − correct). Multiple choice with k options: P = 1/k + (1−1/k)·logistic.
  - Constant K is either too slow or unstable; use an uncertainty function U(n) = a/(1+b·n),
    recommended start a = 1, b = 0.05 (Outline Maps), fitted later by grid search; separate
    functions for learners and items (items get far more answers).
  - About 10 answers per learner give r ≈ 0.8 with true skill in simulation; ~100 learners needed
    for good item difficulties. Under adaptive item selection, proportion-correct item estimates
    are poor, Elo nearly matches joint maximum likelihood at a fraction of the cost.
  - Extensions: response times (log-time), a combined speed-accuracy score, multiple correlated
    skills (small gains), learning/forgetting terms (e.g., short-term boost w/t). Limits:
    heuristic, no statistical guarantees; best for simple domains without prerequisite structure.
- Math Garden / Prowise Learn (Klinkenberg, Straatemeier & van der Maas 2011, Computers &
  Education 57:1813–1824) [secondary reports: Hilz et al. 2023 and Johansson et al. 2024 below].
  Elo-type ratings combined with a speed-accuracy scoring rule; positive feedback and a similar or
  slightly harder item after a correct answer, corrective feedback and a similar or slightly
  easier item after an error. Default target 75% correct; players can choose easy 90%,
  medium 75%, hard 60% (target probabilities stated in Johansson et al. 2024).
- Jansen et al. 2013, Learning and Individual Differences, doi:10.1016/j.lindif.2012.12.014
  [abstract only, UvA repository]. 207 children, grades 3–6, 6 weeks in a computer-adaptive maths
  program; control vs three pre-set success-rate conditions (rates not on the abstract page; the
  current Math Garden levels are 60/75/90%, but whether this study used the same values is
  unverified). Higher success rates → more problems attempted; maths
  performance improved only in the experimental conditions, with larger gains at higher success
  rates (secondary: mediated by number of problems attempted); anxiety improved equally in all
  conditions; perceived competence improved modestly.
- Papoušek, Stanislav & Pelánek 2016, "Impact of question difficulty on engagement and learning"
  (ITS 2016, LNCS; doi:10.1007/978-3-319-39583-8_28) [full text, author PDF]. Geography practice
  site; ~37,000 learners, ~3.3 M answers, randomised target error rates 5%, 20%, 35%, 50%.
  - Survival to 10 answers: 89.2 / 87.0 / 84.0 / 81.2% (easiest best). By 100 answers survival was
    ~26% in all conditions. Return after ≥10 h: 15.2 / 16.0 / 16.6 / 16.8% (harder best).
  - Learning (power-law curves on random reference questions every 10th item): harder practice
    looked better; the biggest gap was between 5% error and the rest.
  - Authors' suggestion: start easy to hook, then move harder. They later used 35% error (≈65%
    correct) as the default.
- Papoušek & Pelánek 2017, "Should we give learners control over item difficulty?" (UMAP '17
  Adjunct) [full text, author PDF]. ~85,000 learners, 8.2 M answers; after every 10 questions a
  "harder/easier" dialog; conditions: no dialog, placebo dialog, real adjustment (±10/20% of
  target). The dialog itself reduced engagement (placebo worst); real adjustment only partly
  offset it. No overall learning difference; learners who chose easier got more engagement but
  slower learning; those who chose harder learned faster. Highly unsuccessful learners often asked
  for "harder" (possible disengagement). Conclusion: prefer automatic tuning to asking.
- Papoušek & Pelánek 2015, "Impact of adaptive educational system behaviour on student
  motivation" (AIED 2015) [full text, author PDF]. Same geography site, ~6 M answers. Adaptive
  question construction vs random: median 33 vs ~20 answers per learner. Target success 50–95%
  showed no clear trend in answer counts, but self-reports rated difficulty "appropriate" most
  often near ~65% real success (in-school users preferred ~75%). Dynamic adjustment of the target
  from the last 10 answers: median 28 vs 21 answers (p = .02), "appropriate" 68% vs 63%, mean
  success ~75% either way. No learning measure.
- Johansson, Savi, van der Maas & Hofman 2024, "Three strikes and who is out? Individual
  differences in error-induced quitting" (preprint) [full text, author site]. Log analyses of
  Math Garden: ~31% of addition sessions ended early; each additional consecutive error raised
  the odds of quitting (OR ≈ 2.25 per error, β = 0.81); post-error quitting fell with experience;
  individual tendency stable across games (r = .64–.80). Players on the easy setting quit more
  after errors. (Preprint has some internal numeric inconsistencies, noted by the reader.)
- Hilz et al. 2023, J Intelligence 11:108, doi:10.3390/jintelligence11060108 [full text, first
  half]. Cluster-randomised, 376 fifth-graders, Math Garden for ~20 weeks of access (mean
  4.6 weeks actually practised): self-concept up (dz = 0.26), no group effect on addition or
  subtraction performance, no anxiety effect. Shows how little use a long-access app can get.

## 2. Target accuracy for learning

### 2.1 The "85% rule"

- Wilson, Shenhav, Straccia & Cohen 2019, Nature Communications 10:4646,
  doi:10.1038/s41467-019-12552-4 [full text, eScholarship PDF; PMC copy blocked by a check page].
  - Result: for binary classification learned by stochastic gradient descent, with Gaussian noise
    on the decision variable, the training error rate that maximises learning speed is
    ER* = ½(1 − erf(1/√2)) ≈ 15.87%, i.e. ~85% correct. Other noise shapes move the optimum:
    Laplacian ≈ 18.4% error (~82% correct), Cauchy 25% error (75% correct).
  - Speed claim: holding error at the optimum, precision grows like √t; at a fixed difficulty it
    grows only like √(log t) (their "exponential" advantage). Under Cauchy noise the gain is
    much smaller (cube root of t).
  - Simulations: perceptron; two-layer net on MNIST (test accuracy best at or near 85% training
    accuracy; best vs worst training rate ≈ 10 points of test accuracy); Law & Gold
    reinforcement model of perceptual learning (7,200 simulated MT neurons) — post-training
    differences between ER = 0.06, 0.17, 0.38 were small but in the predicted direction.
  - Stated limits: binary choices only (multi-alternative left open); gradient learners only (a
    Bayesian ideal learner with perfect memory has no optimal difficulty); assumes parameters only
    rescale precision; batch learning not analysed. No human training experiment in the paper;
    they note staircases already aim at ~80–85% and suggest testing whether engagement peaks there.
  - Reading for an app: an argument for holding accuracy roughly in the 75–85% band during
    learning trials, with the exact point depending on the noise and task form. It is a
    model-based optimum for speed of learning, not evidence about transfer or motivation.
- Empirical counterweights from learning platforms (see 1.4): Papoušek et al. 2016 found harder
  targets (50–65% correct) gave more learning and more returns, easy targets (95%) better
  short-term survival; Math Garden uses 75% as default with 60/90% options; Jansen et al. 2013
  found higher success rates gave more practice and larger gains in children (6 weeks).

### 2.2 Desirable difficulties and the challenge point framework

- Guadagnoli & Lee 2004, J Motor Behavior 36 (challenge point framework) [not opened;
  summarised via Thomas et al. 2025]. Distinguishes nominal difficulty (task property) from
  functional difficulty (difficulty relative to this learner now). Optimal challenge point:
  more information/difficulty helps learning only up to the learner's capacity; the optimum
  moves up with skill; practice performance and learning trade off.
- Thomas, Paul, Rasenyalo, Jones & Hendricks 2025, "Challenge accepted: a systematic scoping
  review of the applications of the challenge point framework", J Motor Behavior 57(4):444–462
  [full text, repository PDF]. 100 included papers (~half conceptual/reviews). Difficulty was
  adapted via task difficulty, practice schedule, feedback/guidance, self-control, individual
  performance curves, and auto-adaptive devices; monitoring via a 0–10 Rating of Perceived
  Challenge, NASA-TLX. No study in the review identified a specific optimal success rate.
  Mixed or null results exist (difficulty changed performance but not learning in one study;
  learning deficits at high nominal difficulty in Parkinson's disease). Gaps: short retention
  tests (1–3 days), small samples (14–21), little on fatigue or the motivational cost of errors.
- Bjork & Bjork 2011 (desirable difficulties chapter) [not opened]. Framework: conditions that
  slow acquisition (spacing, interleaving, variation, testing) can improve retention/transfer,
  but only if the learner can respond to them successfully ("desirable" vs undesirable).

### 2.3 Perceptual learning: training near threshold vs easier levels

- Ahissar & Hochstein 1997, Nature 387:401–406, doi:10.1038/387401a0 [secondary report:
  Ahissar & Hochstein 2004 review, full text]. Visual texture/odd-element detection with masks;
  easy conditions (long SOA, large orientation difference) produced learning that generalised
  across orientation and position; hard conditions produced specific learning. With
  interleaved SOAs, improvement appeared first on easy SOAs and only later on hard ones.
- Ahissar & Hochstein 2004, Trends Cogn Sci 8, reverse hierarchy theory (RHT) [full
  text, course-hosted PDF]. Learning is top-down guided: starts at high-level representations
  (broad, generalising), moves to low-level (fine, specific) only when needed. Eureka effect: one
  long exposure to an easy "pop-out" version enabled learning of a very hard masked task that was
  almost never learned without it (hard practice still needed afterwards). Implications they
  draw: start easy and increase gradually; greater (randomised) stimulus variability makes
  low-level specificity less likely but leaves thresholds higher.
- Hung & Seitz 2014, J Neurosci 34:8423–8431 [full text, eScholarship]. Same tasks trained with
  many short staircases (many supra-threshold trials) vs one long staircase (almost all trials
  near threshold). Orientation discrimination, 5 sessions: single long staircase gave more
  learning at the trained location (53.2% vs 31.6% improvement) but significantly less transfer
  to an untrained location (p = .03, one-tailed). In double training, the near-threshold
  procedure abolished the transfer that the short-staircase procedure produced (untrained
  location 1.0% vs 24.5%). Their proposal: the ratio of precise (hard) to imprecise (easy)
  trials, not the raw count of hard trials, governs specificity vs transfer (untested).
- Talluri, Hung, Seitz & Seriès 2015, J Vision 15(10):17, doi:10.1167/15.10.17 [full text,
  eScholarship]. A reweighting network model reproduces Hung & Seitz: threshold (low-confidence)
  trials drive learning in location-specific weights, easy (high-confidence) trials in
  location-invariant weights. Simulated as 8 short staircases (≤ 50 trials each/day) vs 1 long
  staircase (≤ 400 trials/day). Human "transfer" subgroup had trained on larger (easier) offsets on
  average (5.2 vs 4.7 arcmin).
- Liu, Lu & Dosher 2012, Vision Res (volume unchecked) [full text, author PDF]. Orientation identification
  in noise, accuracy held by staircases at 85% ("high") or 65% ("low"); 36 observers, 6 groups,
  6 days. Without feedback, low-accuracy-only training produced no reliable learning (10.1%
  threshold reduction, n.s.), but mixing 50/50 with high-accuracy trials produced learning at the
  low level too (32.2%). With feedback all mixtures learned (~29–37%). Model (augmented Hebbian
  reweighting) explains 90.7% of variance and predicts that >25% high-accuracy trials are needed
  for learning without feedback (flagged as untested).
- Liu, Lu & Dosher 2010, J Vision 10(10):29 [full text, author PDF]. Same task, 2 × 2 (85% vs
  65% training accuracy × feedback or not), 24 observers, 6 days × 320 trials. Threshold
  reductions: 65% + feedback 33.2%; 65% without feedback 0.7% (no learning); 85% + feedback
  27.5%; 85% without feedback 23.2%. Conclusion: at high training accuracy feedback is optional; at
  low accuracy it is essential.
- Amitay, Halliday, Taylor, Sohoglu & Moore 2010, PLoS ONE 5(3):e9816,
  doi:10.1371/journal.pone.0009816 [full text, UCL repository]. Frequency discrimination trained
  on an impossible task (all three tones identical; 600 trials, one session) with random
  feedback: 90% "correct" feedback, 10%, or none (n = 32/31/31). Only the 10% group learned
  significantly. "Unlearners" (thresholds got worse) were 1 of 43 in the 10%/33% groups but 9/32
  with 90% positive feedback and 8/31 with none. Authors' reading: feedback works as a monitor
  of performance against perceived difficulty, not as trial-by-trial error correction; feedback
  that mismatches the felt difficulty can hurt. Note: training was presented as a "computer
  game"; motivation was inferred, not measured.
- Gabay, Karni & Banai 2017, PLoS ONE 12(5):e0176488 [full text, author PDF]. Time-compressed
  speech (Hebrew), 65 adults, 5 groups (~13 each), 300 trials with feedback: constant easy (60% of
  natural duration), constant hard (30%), adaptive 2-down/1-up staircase (65% → down to 20%),
  stepwise incremental (60→50→40→30→20% by block). Constant hard gave the smallest gains on
  trained items; constant easy matched both adaptive protocols. Adaptive protocols generalised
  better to new tokens; no difference for a new talker. Authors lean toward "errorless" training
  over "hard items are required".
- Wisniewski, Radell, Church & Mercado 2017, PLoS ONE 12(7):e0180959 [full text, repository
  PDF]. FM-sweep rate categorisation; within-subject easy-to-hard (fading) vs constant hard: the
  progressively trained range was discriminated better at test (d = 0.49, n = 20), and in Exp 2
  also on untrained, shorter stimuli. Cites Church et al. 2013: progressive training beat
  anti-progressive (worst), random-order and constant-hard regimens. Cites Pashler & Mozer 2013
  (fading helped only when the relevant dimension was obscured; vanished when told the dimension)
  — here the benefit survived explicit instruction.
- Wright et al. 2010, J Neurosci 30:12868–12877, doi:10.1523/JNEUROSCI.0487-10.2010 [abstract
  only, university page + secondary report: news-medical.net]. Frequency discrimination, one week:
  20 min/day practice alone → no learning; 20 min practice + 20 min passive exposure to the
  trained tone during an unrelated puzzle → learning like 40 min/day of practice; 40 min/day
  exposure alone → none. Benefit shrank when exposure was 15 min away from practice and vanished
  at 4 h. Relevance: part of the active-trial budget can be replaced by low-effort exposure close
  in time.

### 2.4 Mastery thresholds

- Kelly, Wang, Thompson & Heffernan 2015, EDM 2015 poster [full text, 2 pp]. ASSISTments maths:
  3 consecutive correct (3-CCR) predicted next-problem correctness about as well as Bayesian
  knowledge tracing at 0.95 (~80%); for a transfer question, 5-CCR classified students better
  (73%) than 3-CCR (57%) or knowledge tracing (54%). >90% of students who reached 3-CCR went on to
  reach 5-CCR, mostly without an error.
- Pelánek (c. 2018), "Conceptual issues in mastery criteria: differentiating uncertainty and
  degrees of knowledge" [full text, author PDF]. Mastery rules mix "how much is known" with "how
  sure we are". N-consecutive-correct works with low-noise data but forgets history and fails with
  noisy data; an exponential moving average θ ← α·θ + (1−α)·correct with threshold T can mimic
  principled models (decision agreement often > 0.9; fitted α 0.85–0.95, T 0.65–0.97 depending on
  targets); BKT's 0.95 threshold produced premature mastery when its binary-knowledge assumption
  was violated. No universal defaults; recommends tracking average performance and number of
  attempts separately, and handling learners who cannot reach mastery (wheel-spinning).

## 3. Interleaving, contextual interference, spacing, retrieval, variability

### 3.1 Interleaving in category learning

- Brunmair & Richter 2019, "Similarity matters: a meta-analysis of interleaved learning and its
  moderators", Psychological Bulletin 145:1029–1052, doi:10.1037/bul0000209 [full text, author
  PDF, first ~85%]. 59 papers, 238 effect sizes, N = 8,466.
  - Overall interleaved > blocked g = 0.42 [0.34, 0.50]; trim-and-fill adjusted g = 0.29; high
    heterogeneity (I² = 77%).
  - By material: paintings g = 0.67; naturalistic photos 0.35; maths tasks 0.34; expository texts
    and tastes n.s.; words g = −0.39 (blocking better; few studies).
  - Moderators: higher between-category similarity → bigger interleaving benefit; higher
    within-category similarity → smaller benefit. Interleaving in immediate succession g = 0.73
    vs temporally spaced items g = 0.22 (n.s.): the benefit depends on comparing neighbours.
    Retention interval and retention-vs-transfer tests did not moderate.
  - Interpretation offered: discriminative-contrast / attentional-bias accounts.
- Carvalho & Goldstone 2014, Memory & Cognition 42:481–495, doi:10.3758/s13421-013-0371-0 [full
  text, Springer PDF]. Artificial "blob" categories. Generalisation to new items: interleaving won
  for high-similarity categories, blocking won for low-similarity categories (interaction
  p = .017; contrast d = 0.76). With the previous item kept on screen (simultaneous), interleaving
  won overall and the blocking advantage disappeared. During study, blocking always gave higher
  accuracy (performance ≠ learning). Account: interleaving directs attention to between-category
  differences, blocking to within-category commonalities.
- Perrachione, Lee, Ha & Wong 2011, JASA 130:461–472 [full text, author PDF]. Learning pseudowords
  distinguished by pitch contour, 8 days × 72 trials, 4 training talkers, tested on 4 new talkers.
  - Talkers mixed trial-by-trial (high variability) helped high-aptitude learners (d = 0.73) but
    hurt low-aptitude learners (d = 1.30) relative to one talker. Learning was faster with low
    variability for everyone; generalisation index was higher after high variability.
  - Exp 2: blocking the same four talkers (one talker at a time) restored low-aptitude learning
    (d = 1.65 vs mixed) and kept the generalisation advantage; no effect for high-aptitude
    learners. Aptitude was a pre-test of pitch-contour perception (> 70% = high).
- Dong, Clayards, Brown & Wonnacott 2019, PeerJ 7:e7191 [full text, UCL repository, first ~60%].
  Conceptual replication with real Mandarin words, 60 adults, one talker vs four mixed vs four
  blocked, 6 training sessions. One talker trained best; no generalisation advantage for
  multiple talkers (Bayes factors mostly favoured the null); aptitude predicted performance but did
  not interact with variability (evidence inconclusive) — the Perrachione interaction did not
  replicate.
- Brekelmans, Lavan, Saito, Clayards & Wonnacott 2022, J Memory and Language 126:104352
  [secondary report: Brekelmans, Evans & Wonnacott 2024 preprint, full text]. Large replication
  of the classic multiple-talker phonetic training study: substantial learning and generalisation
  to new talkers after both high- and low-variability training, no evidence of a multi-talker
  benefit for generalisation. The 2024 child study (50 seven-year-olds, 39 eleven-year-olds):
  only the older children generalised, and not more after multi-talker input.

### 3.2 Contextual interference (motor learning)

- Czyż, Wójcik & Solarská 2024, Frontiers in Psychology 15:1377122 [full text, journal page].
  Transfer (≥ 24 h) after random vs blocked practice: 34 studies, 86 effect sizes, 1,421
  participants; SMD 0.55 [0.25, 0.86], 0.40 without outliers; I² = 86%. Laboratory tasks 0.75;
  applied/sport tasks ~0.34–0.37 n.s. (0.11 without outliers). Under-18s 0.12 n.s.; adults 0.54.
  No included study was rated strong quality.
- Ammar et al. 2023, "The myth of contextual interference learning benefit in sports practice",
  Educational Research Review (2023; volume unchecked) [secondary report: Czyż et al. 2024; repository copy
  blocked by a bot check]. Reported a small non-significant random-practice benefit (SMD 0.243;
  16 studies, 38 effect sizes) in sport settings.
- Reading: the classic blocked-vs-random benefit is solid in simple laboratory tasks and weak in
  complex real-world skills and children; it is not a safe universal default.

### 3.3 Variability of practice

- Raviv, Lupyan & Green 2022, Trends Cogn Sci, doi:10.1016/j.tics.2022.03.007 (unchecked) [full
  text, NSF repository, first ~55%]. Separates numerosity (how many examples), heterogeneity (how
  different), situational/context variability, and scheduling variability. Consistent pattern
  across motor, perceptual, category, language and machine learning: variability slows or
  impairs early learning and tends to improve generalisation. Cautions: novices and learners
  with little prior knowledge may do better with low variability first; variability along
  task-relevant (discriminative) dimensions can impair novices, while variability along
  irrelevant dimensions can help even novices. Recommends starting low and increasing, and
  measuring both training and generalisation (only ~70% of studies they cite test transfer).
- Schema theory (Schmidt 1975) [not opened]: varied practice builds a generalised rule (schema)
  that supports novel variants of a movement; Raviv et al. treat it as one instance of the
  general variability → generalisation pattern. Age and expertise moderators not checked here.
- Speech: in Raviv et al., one talker per dialect helped recognise familiar talkers; three
  talkers per dialect helped recognise new talkers (Clopper & Pisoni, secondary).

### 3.4 Spacing, adaptive spacing and retrieval

- Cepeda, Vul, Rohrer, Wixted & Pashler 2008, Psychological Science 19:1095–1102 [full text,
  eScholarship]. 1,354 online adults, trivia facts, gaps 0–105 days, tests at 7–350 days. Optimal
  gap grows with the retention interval, but as a share of it falls: ~20–30% of the interval for
  tests a few weeks away, ~5–7% for one year. Optimal gap vs no gap: +64% recall (d = 1.1).
  Too short a gap costs more than too long a gap.
- Mettler & Kellman 2014, Vision Research 99:111–123 [full text, lab PDF]. Adaptive
  response-time-based sequencing (ARTS) for perceptual category learning (butterfly genera, 12
  categories). Priority of each category rises with trials since last seen (enforced delay D = 2),
  with slower correct RTs, and jumps after an error (back in about two trials). Retirement when 5
  of the last 6 correct with RT < 3 s. Vs random order: 25–29% more efficient (Exp 1) and 38–39%
  (Exp 2, effect sizes > 1.0); trials to criterion 155 vs 204 and 125 vs 235. Starting with
  mini-blocks did not help. Transfer to novel exemplars about equal to familiar ones.
- Mettler, Massey & Kellman 2016, J Exp Psychol: General ("A comparison of adaptive and fixed
  schedules of practice") [not opened; recalled gist that adaptive beat fixed spacing — verify].
- Molloy, Moore, Sohoglu & Amitay 2012, PLoS ONE 7(5):e36929 [full text, UCL repository].
  Frequency discrimination (79.4% staircase). Same 1,600 trials as 800×2, 400×4 or 200×8 sessions,
  plus 100×8: all groups ended equal and retained gains at 4–6 weeks, but 100-trial sessions
  (~8 min) learned fastest per trial over the first 800 trials. Between-session gains were largest
  early in training and after poorer end-of-session performance (r = .49); performance declined
  late in long sessions (fatigue). A single 800-trial day kept improving after training ended
  (to day 33) and caught up with 4 × 800. Authors: use short sessions with spacing.
- Fenn, Nusbaum & Margoliash 2003, Nature 425:614–616, doi:10.1038/nature01951 [secondary report:
  ScienceDaily press release]. Synthetic-speech word identification with novel words at test:
  21% → 54% right after training; after a waking 12 h much of the gain was lost (+10 points over
  pre-test); after a 12 h interval with sleep, +19 points; morning trainees recovered after a
  night's sleep. Implication: overnight consolidation of perceptual learning of speech;
  daytime interference/decay.
- Retrieval practice: well established for verbal/declarative material (not re-read here; not a
  core mechanism for perceptual discrimination trials, which are already tests). Relevant
  analogue: feedback-bearing test trials and adaptive re-presentation of missed items (ARTS).

## 4. Plateaus: shape, detection, interventions

### 4.1 What individual learning curves look like

- Donner & Hardy 2015, Psychon Bull Rev 22, doi:10.3758/s13423-015-0811-x [secondary
  report: Psychonomic Society featured-content post; Springer and PMC pages would not load].
  ~25,000 users of an online brain-training site with > 500 trials on several tasks. Group-average
  curves were smooth power functions, but only 14–22% of individuals (across 4 tasks) were best
  fit by a smooth curve; the rest were better fit by piecewise power laws with 1–3 breakpoints
  (step changes, read as possible insight/restructuring). Detecting steps needs many trials.
- Destefano & Gray 2016, CogSci proceedings 38, "Where should researchers look for strategy
  discoveries during the acquisition of complex task performance? The case of Space Fortress"
  [full text, eScholarship]. 9 players × 31 h. No individual curve looked like the smooth group
  average; individuals showed plateaus, dips and leaps. Method: Symbolic Aggregate Approximation
  (per-hour scores z-normalised and binned into 4 quantile bands; moves between bands flag
  change). Case: plateau hours 15–18, dip in hour 19 while a new strategy was tried, leap in hour
  20. Exploration often costs score first and is sometimes abandoned (one player dropped a
  strategy after a ~20% score drop). Gray & Lindstedt 2017, Cognitive Science,
  doi:10.1111/cogs.12412 (same framework, Tetris) [not opened].
- Heathcote, Brown & Mewhort 2000, Psychon Bull Rev 7 (unchecked) (exponential law of practice for
  individual curves; power law as an averaging artefact) [not opened; page blocked].
- Zhang et al. 2019 qCD (section 1.2) fits an exponential curve trial by trial and gives credible
  intervals on the asymptote and time constant: one principled way to ask "has this person reached
  their asymptote under the current regime?"

### 4.2 Detecting a stall from logs

- Wheel-spinning (unproductive persistence). Beck & Gong 2013 (AIED; doi:10.1007/978-3-642-39112-5_44)
  [secondary report: Kai et al.]: defined as ≥ 10 practice opportunities without mastery (3
  correct in a row); ~38% of students in their data. Kai, Heffernan, Almeda, Heffernan & Baker
  (c. 2018, J Educational Data Mining) [full text, author PDF] add a retention-test condition:
  9.1% wheel-spinning in 75,481 student-problem-set pairs. Early detector (first 10 problems):
  decision tree AUC 0.684 (3-feature version 0.628; best single feature 0.554). Predictors: never
  asking for a hint, heavy use of answer-revealing hints, and consistently short gaps between
  sessions (massed practice). Authors' suggestions (correlational): encourage spacing, limit
  answer-giving hints, prompt help-avoiders.
- Rollinson & Brunskill 2015, "From predictive models to instructional policies", EDM 2015
  [full text]. "Predictive similarity" stopping rule: stop practising a skill when the model's
  predicted probability of the next correct answer is unlikely (> 95%) to change by more than 0.01
  whatever the response. This stops both at mastery and when practice has stopped changing
  anything (likely unlearnable with current activities), without needing a mastery estimate.
  Data: 3,292 students, 505 skills (KDD Cup 2010). Agreed with a 0.95 mastery rule (r = 0.95) on
  skills with sensible parameters.
- ZPDES (section 1.3) uses the same idea online: learning progress (recent minus older success
  rate over a window) near zero means "mastered or stuck" and moves practice elsewhere.
- Sapountzi, Bhulai, Cornelisz & van Klaveren 2021, arXiv:2103.03766 [full text]. Bayesian
  mastery assessment using both accuracy (Beta prior) and response time (Gamma prior), score
  Z = P·(1 − T/d)₊; the learner profile is recovered in ~5–7 responses; a score falling over the
  first three items is treated as a sign of wheel-spinning/disengagement. No accuracy figures.
- Solenthaler, Klingler, Käser & Gross 2018, arXiv:1806.03257 [full text]. Learning-disability
  games with > 20,000 children: generic stopping policies flag wheel-spinning, cited as up to ~10%
  of students on a skill; "over-practice does not necessarily help".
- Staircase-specific evidence: reversal-based thresholds need ~60–80 trials per estimate (Zhang
  et al. 2019); Molloy et al. 2012 classed a listener as a non-learner when the threshold changed
  by less than one staircase step (factor √2) — i.e., a change smaller than one step should not be
  read as either gain or plateau.
- Statistical options seen in this literature: piecewise regression with breakpoints chosen by
  model comparison (Donner & Hardy), quantile banding of per-session scores (SAX, Destefano &
  Gray), Bayesian parametric learning-curve posteriors (qCD), windowed learning-progress
  differences (ZPDES), model-prediction stability (Rollinson & Brunskill). None was validated for
  auditory training specifically.

### 4.3 What breaks or prevents plateaus (evidence found)

- Rest and sleep. Mednick et al. 2002, Nature Neuroscience 5(7), doi:10.1038/nn864 [full
  text, lab PDF]: texture discrimination tested 4 × per day (1,250 trials/session) got 52% worse
  across the day in controls; a 30-min nap stopped the decline, a 60-min nap (more slow-wave and
  REM sleep) reversed it (−20.9 ms vs +14.1 ms in controls). Awake rest did not help, a $25 bonus
  did not help, and an easier task in earlier sessions did not prevent the late decline. Moving
  the stimulus to an untrained location restored performance → the deterioration is local,
  stimulus-specific saturation, not general fatigue. Fenn et al. 2003 (3.4): sleep restored
  speech-learning gains lost during the day.
- Shorter sessions and spacing. Molloy et al. 2012 (3.4): long sessions show within-session
  decline; most between-session ("latent") gains come early; 100-trial sessions learned fastest
  per trial early in training.
- Changing what is trained. Hung & Seitz 2014 (2.3): many short staircases with supra-threshold
  trials vs one long near-threshold staircase changed whether learning transferred. Harris,
  Gliksberg & Sagi 2012, Current Biology (PubMed 22921366) [not opened; abstract page blocked]:
  reported that interleaving "dummy" trials of a different orientation, which prevent sensory
  adaptation, turned location-specific texture learning into generalising learning (gist from
  the literature, numbers not checked). Mednick et al.: a new location escaped the decline.
- Adding exposure instead of more effortful trials. Wright et al. 2010 (2.3).
- Mixing in easy trials. Liu, Lu & Dosher 2012 (2.3): high-accuracy trials enabled learning on
  hard trials without feedback; Ahissar & Hochstein: easy-first cascade, Eureka exposure.
- Feedback changes. Amitay et al. 2010 (2.3): feedback that mismatches felt difficulty produced
  "unlearners"; Liu et al. 2010: feedback matters most when accuracy is low.
- Strategy discovery. Destefano & Gray 2016: plateaus end with new methods, often after a dip.
  No controlled study found here of explicit strategy instruction breaking a perceptual plateau
  (gap; see R-notes on strategies if any).

## 5. Game and motivation elements in cognitive/perceptual training

### 5.1 Gamified vs plain versions: learning and data quality

- Katz, Jaeggi, Buschkuehl, Stegman & Shah 2014, Frontiers in Human Neuroscience 8:242,
  doi:10.3389/fnhum.2014.00242 [full text, journal page]. Adaptive spatial n-back ("WMTrainer"),
  107 children (mean 10.7 y) at summer camps, 10 rounds/day for 3 days, 7 versions removing one
  feature each (points, theme changes, lives/levels display, prizes, certificates) plus all/none.
  - Training gain (slope of n-level/day): all features 0.10; no points 0.35 (p = .010,
    η²p = .15); no lives/levels display 0.29 (p = .042); no theme 0.12, no prizes 0.15 (n.s.); no
    features at all 0.28 (n.s. vs all). Pooled no-points (n = 31) vs points (n = 75): p = .006.
  - No differences in enjoyment, excitement, effort or transfer (untrained 2-back).
  - Authors: on-screen score and lives bar may pull attention from the task and hurt early
    learning; findings preliminary (camp-level assignment, small groups, 3 days).
- Lumsden, Edwards, Lawrence, Coyle & Munafò 2016, JMIR Serious Games 4(2):e11,
  doi:10.2196/games.5888 (unchecked) [full text, journal page]. Systematic review, 33 papers / 31 gamified
  tasks (17 assessment, 13 training). Every study that measured intrinsic motivation found it
  higher for the game-like version; some found longer training or more trials. No evidence that
  gamification improves data quality; training benefits "positive but tentative". Harms found:
  a gamified go/no-go game failed to detect an ADHD deficit; sound effects slowed responses
  (attentional capture; Miranda & Palmer 2014) while points did not; WMTrainer (Katz) gained
  least in the fully gamified version. Only 5/33 papers reported a power analysis. Recommends a
  same-platform non-gamified control.
- Lumsden et al. 2016, PeerJ 4:e2184, doi:10.7717/peerj.2184 [full text]. Go/no-go task, 287
  adults (84 lab, 203 online): plain vs points (multiplier that resets on error) vs theme (cowboy
  shoot-out). Points: same data as plain (Bayes factors 0.16–0.25 favouring no difference) and
  higher enjoyment (d = 0.43 vs plain). Theme: slower responses and 28% more no-go errors (theme
  stimuli were harder to categorise). Conclusion: points are a safe mechanic; themed stimuli can
  change the task itself.
- Hawkins, Rae, Nesbitt & Brown 2013, "Gamelike features might not improve data", Behav Res
  Methods 45:301–318, doi:10.3758/s13428-012-0264-3 [secondary report: Lumsden et al. 2016
  PeerJ and JMIR review]. N ≈ 200 combined; game-like versions raised interest but did not change
  the data.
- Prins, Dovis, Ponsioen, ten Brink & van der Oord 2011, Cyberpsychology, Behavior, and Social
  Networking 14:115–122, doi:10.1089/cyber.2009.0206 [abstract only, UvA repository]. 51 children
  with ADHD, 3 sessions: game-format working-memory training → more time training, more
  sequences reproduced, fewer errors, higher post-training WM score than the plain version.
- Mekler, Brühlmann, Tuch & Opwis 2017, Computers in Human Behavior 71:525–534,
  doi:10.1016/j.chb.2015.08.048 (unchecked) [full text, course-hosted PDF]. Image tagging, 273 adults online:
  plain vs points vs levels vs leaderboard (fictitious competitors). Points, levels and leaderboard
  increased the number of tags (points vs plain d = 0.44; leaderboard and levels beyond points
  d ≈ 0.35–0.39) but not tag quality, intrinsic motivation (IMI), or competence/autonomy need
  satisfaction. Authors: the elements acted as extrinsic incentives for quantity only.
- Sailer & Homner 2020, Educational Psychology Review, doi:10.1007/s10648-019-09498-w
  [full text, repository PDF, first ~80%]. Meta-analysis of gamified learning (38 papers, 40
  experiments): cognitive g = 0.49 [0.30, 0.69] (stable in high-rigour studies, g = 0.42);
  motivational g = 0.36 and behavioural g = 0.25 (both n.s. in high-rigour subsets). Game
  fiction helped behavioural outcomes only (0.41 vs 0.10). Competition alone n.s. (g = 0.12);
  competition combined with collaboration g = 0.70 (behavioural), and for motivation 0.61 vs
  −0.09 in rigorous studies. Most heterogeneity unexplained.
- Hanus & Fox 2015, Computers & Education, doi:10.1016/j.compedu.2014.08.019
  [secondary report: UCLA school mental-health centre brief]. A longitudinal course with mandatory
  badges and a leaderboard vs the same course without: lower satisfaction, intrinsic motivation and
  final-exam grades in the gamified section (exam effect attributed partly to lower intrinsic
  motivation). Candidate causes named: social comparison, loss of autonomy (forced badges).

### 5.2 Rewards, feedback, and intrinsic motivation

- Deci, Koestner & Ryan 1999, Psychological Bulletin 125(6), PubMed 10589297
  [secondary report: Deci, Koestner & Ryan 2001, Review of Educational Research, full text,
  self-determination theory site]. 128 experiments. Free-choice measures: verbal rewards
  (positive feedback) d = +0.33 (college +0.43, children +0.11 n.s.); tangible rewards −0.34;
  unexpected tangible rewards 0.01 (no harm); task-noncontingent −0.14 (n.s.);
  engagement-contingent −0.40; completion-contingent −0.44; performance-contingent −0.28; and
  −0.88 for performance-contingent rewards not everyone can earn (k = 6). Informational feedback
  +0.66 vs controlling feedback −0.44 (k = 5).
- Ryan, Rigby & Przybylski 2006, Motivation and Emotion 30, doi:10.1007/s11031-006-9051-8
  [full text, university-hosted PDF]. 4 studies (lab N = 89, 50, 58; online MMO players N = 730).
  In-game competence and autonomy predicted enjoyment (e.g., within-person β = .76 each) and
  preference for future play; relatedness added a smaller independent share in the MMO sample
  (enjoyment: autonomy β = .49, competence .24, relatedness .12). Intuitive controls acted through
  competence ("gatekeeper"). Difficulty was not manipulated.
- Feedback in perceptual learning: see 2.3 (Liu et al. 2010/2012 — feedback matters most at low
  accuracy, high-accuracy trials can stand in for it; Amitay et al. 2010 — feedback that
  contradicts the felt difficulty can produce un-learning). Shibata et al. 2009, Vision Res
  [abstract only, PubMed text without numbers]: fake feedback that signalled more improvement than
  real boosted visual perceptual learning more than true feedback (model: optimistic bias in the
  learning-rate controller). Treat as a small single study; no auditory replication found.
- Henshaw, McCormack & Ferguson 2015, Frontiers in Psychology 6:1067,
  doi:10.3389/fpsyg.2015.01067 [full text, journal page]. 44 adults 50–74 with mild hearing loss,
  home phoneme-discrimination training (15 min/day, 6 days/week, 4 weeks; weekly phone call).
  80% completed the 6 h, 75% exceeded it, no drop-outs. Uptake was driven by extrinsic reasons
  (noticing difficulties, family, GP invitation); engagement by both intrinsic (enjoyment,
  competence, beating previous scores) and extrinsic reasons. Worst aspects: technical problems
  39%, practical issues 18%, boring/repetitive 16%, feedback that did not match how they felt they
  did 11%. Requests: more game play, variety, graphics and sounds; feedback consistent with
  perceived performance; choice of tasks matching their own difficulties; involve others.

### 5.3 Game-based auditory training studies (progression and dose)

- Whitton, Hancock, Shannon & Polley 2017, Current Biology (PMID 29056453) [secondary report:
  Harvard Medical School news; PMC blocked]. 24 hearing-aid users (mean 70 y), ~3.5 h/week for 8
  weeks of an audiomotor game (moving a fingertip through a virtual soundscape to detect
  mismatches between predicted and actual sound) vs an auditory working-memory placebo game with
  matched expectations. Game group: ~25% more words identified in high noise; placebo: none.
  Gains tracked in-game accuracy and did not persist without continued play.
- Lelo de Larrea-Mancera et al. 2022, J Cognitive Enhancement (PMC8453468) [full text, PMC PDF
  mirror]. "Listen" endless-runner game: an avatar steers by sound; correct responses absorb
  energy, errors cost energy; difficulty adapts through streaks of correct/incorrect trials and new
  tasks unlock with progress (spectro-temporal modulation, spatial cues, 1-/2-back, in quiet and
  noise). 54 recruited, only 30 completed (≈ 44% attrition; remote, own phones). 30 sessions ×
  ~25 min. Speech-in-competition composite improved in the game group (d = 1.19 within) vs
  control (d = 0.01); between-group only one-tailed significant (d = 0.68); not retained at one
  month. Proof of concept.

### 5.4 Adherence in long training programmes

- FINGER trial computer cognitive training (Turunen et al. 2019, PLoS ONE 14:e0219541) [abstract
  only, DOAJ]: 631 adults 60–77, up to 144 sessions offered: 63% did ≥ 1 session, 20% ≥ half,
  12% all. Starting was predicted by computer experience, living with a partner, better memory and
  positive expectations; amount by computer experience only.
- LACE auditory training: Chisolm et al. 2013, Am J Audiology, doi:10.1044/1059-0889(2013/12-0081)
  [abstract only, ASHA]:
  84% of 50 veterans in a supervised RCT completed all 20 sessions; only completers improved on
  untrained measures (4 of 7, d 0.2–0.3). Routine clinical use: > 30% completing ≥ 10 of 20
  sessions (as cited by Henshaw et al. 2015) — real-world adherence far below trial adherence.
- Henshaw et al. 2015 (above): 80% completion with weekly contact, 4 weeks.
- Lelo de Larrea-Mancera et al. 2022: ~44% attrition with remote self-directed play.
- Hilz et al. 2023 (1.4): ~20 weeks of access, mean 4.6 weeks actually practised.
- Kumar, Benjamin, Heathcote & Steyvers 2022, npj Science of Learning 7 [full text,
  eScholarship]. ~39,000 Lumosity users on two games: performance on the first game of a session
  fell ~20% after a 100-day break and ~50% after 400 days, but recovered fast — one game after an
  800-day gap restored the previous session's level in one task. 88% of plays followed gaps under
  7 days. Relevance: skill largely survives absence; a short re-warm-up recovers it.

### 5.5 Elements, one line each (what the evidence above says)

- Points: safe for data and raise enjoyment (Lumsden 2016 PeerJ); raise quantity, not quality or
  intrinsic motivation (Mekler 2017); an always-visible score during an adaptive WM task cut
  training gains (Katz 2014).
- Levels / lives display: raised quantity (Mekler); visible lives/levels cut gains (Katz).
- Theme / narrative: theme changed stimuli and hurt validity (Lumsden PeerJ); theme changes had no
  effect (Katz); game fiction helped behavioural outcomes only (Sailer & Homner); story,
  teammates, avatars raised relatedness only (Sailer 2017).
- Sound effects during trials: slowed responses via attentional capture (Miranda & Palmer 2014,
  via Lumsden JMIR) — matters for an audio trainer.
- Badges / collections: more activity on a trading site (Hamari 2017, blog only); people steer
  effort toward approaching badge thresholds (Anderson et al., via Khodadadi et al. 2017 [full
  text, arXiv]); mandatory badges plus leaderboard harmed motivation and grades (Hanus & Fox).
- Leaderboards / competition: quantity up (Mekler); competition alone n.s., competition +
  collaboration better (Sailer & Homner); social comparison is a named harm (Hanus & Fox).
- Tangible or performance-contingent rewards: undermine free-choice motivation (d −0.28 to
  −0.44; −0.88 when not everyone can earn them); unexpected rewards and informational positive
  feedback do not (Deci et al.).
- Feedback: informational feedback helps motivation (+0.66); in perceptual learning, feedback is
  needed when accuracy is low (Liu 2010), and feedback that mismatches felt performance is a
  named complaint and a possible harm (Henshaw 2015; Amitay 2010).
- Learner control over difficulty: a difficulty dialog reduced engagement; learners who chose
  easier learned slower (Papoušek & Pelánek 2017). Automatic adjustment on the last 10 answers
  raised median answers 21 → 28 (Papoušek & Pelánek 2015).
- Skip option: delaying access to "skip" increased effortful practice without losing engagement
  (Savi et al. 2018, Computers & Education 119:84–94 [abstract only, VU repository]).

## 6. Reasons to return that never punish absence

### 6.1 Streaks

- Silverman & Barasch 2023, "On or off track: how (broken) streaks affect consumer decisions",
  J Consumer Research 49(6):1095–1117, doi:10.1093/jcr/ucac029 [abstract only, Delaware
  repository; secondary reports: Psychology Today post by A. Markman, 2023; University of
  Colorado news, 2023]. Seven studies. Intact logged streaks increase later engagement more than
  broken ones, independent of actual past behaviour — the log itself becomes a goal. The gap is
  larger when people blame themselves for the break and smaller when the streak can be repaired;
  people pay costs (e.g., watching ads) to repair. Example study: after a "glitch" broke a short
  exercise streak, ~58% vs ~66% chose to continue the same exercise type. In app data, users who
  broke a language streak tended to switch to a new language rather than rebuild. Caveat from the
  secondary report: very short streaks, lab settings.
- No study measuring streak-related anxiety directly was found in this pass (search budget ran
  out; see item 22 of the "Could not open" list).
- Lally, van Jaarsveld, Potts & Wardle 2010, European J Social Psychology 40,
  doi:10.1002/ejsp.674 [full text, CORE PDF]. 82 analysed adults, a daily behaviour for 84 days:
  median 66 days to 95% of the automaticity plateau (range 18–254; curve fit adequate for 48%).
  140 missed days (55 people): a single miss lowered automaticity by 0.29 points, and gains
  resumed normally — "a missed opportunity did not materially affect" habit formation.

### 6.2 Rewarding return instead of punishing absence

- Milkman et al. 2021, "Megastudies improve the impact of applied behavioural science", Nature
  600, doi:10.1038/s41586-021-04128-4 (unchecked) [full text, mirror PDF; secondary: Penn Today].
  61,293 gym members, 53 interventions + placebo, 4 weeks. Best arm: a tiny bonus (125 points,
  ≈ US$0.09) for returning after a missed planned workout: +0.40 visits/week (+27% vs 1.48 in
  placebo). 45% of arms worked during the programme (9–27%); only 8% still showed effects in the
  following weeks. Third-party forecasts did not predict which arms worked (r = 0.02).
- Kumar et al. 2022 (5.4): skills mostly survive breaks and recover within a game or two.
- Spacing and sleep make returning later useful rather than a debt: Cepeda et al. 2008 (optimal
  gaps), Molloy et al. 2012 (between-session gains early in training), Fenn et al. 2003 and
  Mednick et al. 2002 (sleep consolidates/restores).
- "Rested" bonus (e.g., the rested-experience mechanic in some online role-playing games, which
  accrues while the player is away and boosts the next play) — design example only; no research
  on learning found [general knowledge, not verified this session]. The closest evidence is the
  Milkman return bonus.
- Sharif & Shu 2017, J Marketing Research (details unchecked) ("emergency reserves": goals with a few
  costly skips) [not opened; recalled gist that slack with a cost increased persistence vs strict
  goals — verify before use].
- Kivetz, Urminsky & Zheng 2006, J Marketing Research (details unchecked) (goal-gradient effect; effort
  accelerates near a reward; illusory head starts speed completion) [not opened; verify].

### 6.3 Reminders and spaced-review prompts

- Yancey & Settles 2020, KDD (Duolingo practice reminders) [full text, company research PDF].
  A bandit choosing among reminder templates, with a recency penalty because recently seen
  templates lose impact (assumed half-life 15 days): online test +0.5% daily active users, +0.4%
  lessons, +2.2% / +2.0% new-user day-1 / day-7 retention. Small effects at large scale; no data on
  lapsed users. Duolingo blog [full text] adds: ~200 M reminders analysed; repeats are spaced
  using the same forgetting curve used for words.
- Push-notification industry summaries (eugeneyan.com essay [secondary report]): Pinterest cut
  volume 6–24% while click-through rose 11–31%; Twitter capped pushes per user cohort (+0.4–0.6%
  daily actives) — fewer, better-chosen prompts outperform volume.
- Item-level review schedules in learning games: Orthograph repeats missed words after 24 h and
  recaps after one month (Solenthaler et al. 2018 [full text, arXiv]); ARTS re-presents missed
  categories after ~2 trials and spaces correct ones by RT (Mettler & Kellman 2014).

### 6.4 Weekly goals, collections, maps, variable content

- Weekly windows: the Psychology Today report mentions a fitness app's weekly streak as a backup
  for broken daily streaks (no data).
- Collections and progress displays: see 5.5 (badges steer effort; feedback-type elements
  raise competence; quantity not quality).
- Variable content: novelty decay is measurable (Duolingo reminder templates); variability
  helps generalisation but slows early learning (Raviv et al. 2022).

## 7. Community features without servers

Search budget for this agent ran out before this item was searched; nothing here was opened in
this session. The notes below are general knowledge to be verified in a follow-up pass.

- Seeded daily puzzles [general knowledge, not verified]: one puzzle per calendar day, identical for
  everyone, derived from the date (word list indexed by date, or a date-seeded generator), so no
  server is needed. The best-known case (a five-letter word game, 2021–22) spread through a
  spoiler-free share text: puzzle number, score, and a grid of coloured squares showing the
  pattern of attempts but not the answer. Audio versions existed (daily song-intro guessing
  games that reveal more seconds per miss and share a squares grid). Games with daily seeded
  runs (roguelikes) add one attempt per day and a leaderboard.
- Commonly cited reasons they work [commentary, not research]: scarcity (one per day, short),
  a shared simultaneous experience to talk about, a spoiler-free artefact that shows effort not
  the answer, comparison among friends rather than global ranks, low stakes.
- Evidence that bears on it from this file: relatedness adds a small independent share to
  enjoyment (Ryan et al. 2006, β = .12); competition plus collaboration beats competition alone
  (Sailer & Homner 2020); social comparison via leaderboards can harm (Hanus & Fox 2015);
  rewards only some can earn undermine motivation (Deci et al., d = −0.88). Inference (not a
  finding): a share card that shows personal progress or a shared-challenge result works for
  every level of player, whereas a pure rank works only for the top.
- Engineering note [general knowledge]: a date-derived seed fed to a small deterministic PRNG
  (e.g., a 32-bit mixing function) gives identical content on every device if all randomness in
  item generation comes from that PRNG and the same build is used; a build or content version
  number belongs in the share text so results compare like with like.

## 8. Existing gamified training apps: progression and motivation

Verified in this session:
- "Listen" (Seitz lab; research app) [full text]: endless-runner; energy gained
  on correct, lost on error; difficulty steps on streaks of correct/incorrect trials; tasks unlock
  with progress; spectro-temporal, spatial and memory tasks in quiet and noise; 30 × 25 min.
- Audiomotor game (Polley lab; not public) [secondary]: continuous audiomotor task, ~3.5 h/week ×
  8 weeks; gains tracked in-game accuracy; needed continued play.
- LACE (commercial hearing-rehabilitation program) [abstract only, via Chisolm et al. 2013]: 5
  tasks (speech in babble, time-compressed speech, competing speaker, auditory memory, missing
  word), 20 sessions; adherence 84% in a supervised trial, much lower in routine use (Henshaw).
- Math Garden / Prowise Learn [full text preprint + secondary]: Elo with speed-accuracy scoring;
  coins at stake per item (earned when right, lost when wrong); coins buy decorative trophies;
  player-chosen difficulty 60/75/90%; a game ends after three fast errors in a row; delayed skip.
- Orthograph / Calcularis (learning-disability games) [full text, arXiv]: Bayesian student models
  over skill networks choose next activity (stay, go back to a precursor, go forward); points spent
  in a shop; spaced repeats (24 h, 1 month); generic stopping policy that also flags wheel-spinning
  (up to ~10% of students).
- outlinemaps.org (geography practice) [full text]: Elo-type model, target ~65% correct, dynamic
  adjustment from the last 10 answers, progress feedback every 10 questions.
- Duolingo (language) [full text, company papers/blog]: streaks with streak-related reminder
  templates; bandit-chosen reminders with novelty penalty.

Not verified in this session (general knowledge; verify before citing): music/audio ear-training
apps commonly use levels with star ratings, chapters that unlock, daily workouts, XP and weekly
leagues/leaderboards, and fixed-step or block-based difficulty rather than continuous
staircases; brain-training suites use per-exercise staircases with level/star displays and a
composite score; hearing-rehabilitation apps for implant users typically use adaptive
signal-to-noise steps and progress charts. App names are deliberately left out until verified.


## Could not open (important sources not read in full)

Ranked roughly by how much a progression or game-layer decision could lean on them. "Need" says
what to extract.

1. Kaernbach 1991, "Simple adaptive testing with the weighted up-down method", Perception &
   Psychophysics 49 (details unchecked) [not opened]. Need: convergence proof and efficiency of arbitrary
   targets (e.g., 75–85%) via step ratios. Meanwhile: step_up/step_down = p/(1−p) (arithmetic).
2. García-Pérez 1998, "Forced-choice staircases with fixed step sizes: asymptotic and
   small-sample properties", Vision Research 38(12):1861–1881 [metadata only; PubMed rate-limited].
   Need: which down/up step ratios make fixed-step staircases converge on their nominal targets,
   and recommended step size relative to the psychometric spread.
3. Kontsevich & Tyler 1999, psi method, Vision Research 39 (details unchecked) [not opened]. Need: trial
   counts for threshold and slope, grid/prior advice, behaviour with a non-stationary learner.
4. Donner & Hardy 2015, Psychon Bull Rev 22, doi:10.3758/s13423-015-0811-x [Springer
   and PMC pages failed; blog summary only]. Need: breakpoint-fitting method, model selection,
   minimum trials for detecting a step, their open code.
5. Harris, Gliksberg & Sagi 2012, Current Biology (PubMed 22921366) [abstract page
   blocked]. Need: proportion/type of interleaved "dummy" trials that prevented adaptation, and
   effects on transfer and within-session decline.
6. Nahum, Nelken & Ahissar 2008, "Low-level information and high-level perception: the case of
   speech in noise", PLoS Biology 6(5):e126, doi:10.1371/journal.pbio.0060126 (unchecked)
   [rate-limited].
   Need: reverse-hierarchy predictions for speech-in-noise training (which SNRs/contrasts to
   start with).
7. Whitton, Hancock, Shannon & Polley 2017, Current Biology (PMID 29056453; PMC5997394) [news
   summary only; PMC blocked]. Need: in-game adaptive rules, session structure, adherence.
8. Jansen et al. 2013, Learning and Individual Differences, doi:10.1016/j.lindif.2012.12.014
   [abstract only]. Need: exact success-rate conditions, effect sizes, mediation by practice.
9. Klinkenberg, Straatemeier & van der Maas 2011, Computers & Education 57(2):1813–1824
   [secondary only]. Need: speed-accuracy scoring rule, K values, item-selection rule around 75%.
10. Hanus & Fox 2015, Computers & Education, doi:10.1016/j.compedu.2014.08.019
    [secondary brief only]. Need: sample, effect sizes per element, time course.
11. Hawkins, Rae, Nesbitt & Brown 2013, Behav Res Methods 45:301–318,
    doi:10.3758/s13428-012-0264-3 [secondary only]. Need: which features, data-quality metrics.
12. Silverman & Barasch 2023, J Consumer Research 49(6):1095–1117, doi:10.1093/jcr/ucac029
    [abstract + secondary]. Need: per-study effect sizes, field-data analysis, repair moderator.
13. Ammar et al. 2023, Educational Research Review (myth of contextual interference)
    [repository behind a bot check; secondary numbers only]. Need: moderators (age, expertise).
14. Brekelmans et al. 2022, J Memory and Language 126:104352, doi:10.1016/j.jml.2022.104352
    [secondary only]. Need: sample, Bayes factors, blocked vs mixed talker design.
15. Gray & Lindstedt 2017, Cognitive Science, doi:10.1111/cogs.12412 [not opened].
    Need: plateau/dip/leap detection method in Tetris data.
16. Heathcote, Brown & Mewhort 2000, Psychon Bull Rev 7 (details unchecked) [blocked]. Need: individual
    exponential vs power fits — matters for plateau detection model choice.
17. Wright, Sabin, Zhang, Marrone & Fitzgerald 2010, J Neurosci 30:12868–12877,
    doi:10.1523/JNEUROSCI.0487-10.2010 [abstract + news only]. Need: trial counts, group sizes.
18. Sweetow & Sabes 2010, J Am Acad Audiol 21(9):586–593, doi:10.3766/jaaa.21.9.4 [publisher bot
    check]. Need: real-world LACE completion data and reasons for drop-out.
19. Shibata, Yamagishi, Ishii & Kawato 2009, Vision Research (PubMed 19531366) [abstract text
    without numbers]. Need: size of the fake-positive-feedback benefit.
20. Guadagnoli & Lee 2004, J Motor Behavior 36 [not opened]; Bjork & Bjork 2011
    (desirable difficulties) [not opened]; Schmidt 1975 schema theory [not opened].
21. Sharif & Shu 2017 (emergency reserves) and Kivetz, Urminsky & Zheng 2006 (goal gradient)
    [not opened; gists recalled, must be verified].
22. Not searched at all (search budget exhausted): analyses of daily seeded puzzle games and
    their share grids; any study of streak-related anxiety; current progression/motivation design
    of audio/music ear-training and hearing-rehabilitation apps. A follow-up search pass is needed
    for items 7 and 8.

## References

Reading depth in brackets. DOIs marked (unchecked) were written from bibliographic memory and
should be verified; other DOIs and URLs appeared on the pages read or in search results. Volume
and page numbers were not all checked; treat the DOI/URL/PubMed id as the reliable identifier.

- Ahissar, M., & Hochstein, S. (1997). Task difficulty and the specificity of perceptual
  learning. Nature, 387, 401–406. doi:10.1038/387401a0 [secondary report]
- Ahissar, M., & Hochstein, S. (2004). The reverse hierarchy theory of visual perceptual learning.
  Trends in Cognitive Sciences, 8(10), 457–464. doi:10.1016/j.tics.2004.08.011 (unchecked)
  [full text: https://www.cs.princeton.edu/courses/archive/spring08/cos598B/Readings/AhissarHochstein_TCS2004.pdf]
- Amitay, S., Halliday, L., Taylor, J., Sohoglu, E., & Moore, D. R. (2010). Motivation and
  intelligence drive auditory perceptual learning. PLoS ONE, 5(3), e9816.
  doi:10.1371/journal.pone.0009816 [full text]
- Brekelmans, G., Evans, B. G., & Wonnacott, E. (2024). Training child learners on non-native
  vowel contrasts with phonetic training: the role of task and variability. Preprint (in press,
  Language Learning). https://ora.ox.ac.uk/objects/uuid:c5f276e7-95ab-4f68-a7d7-45c53fa8cad8 [full text]
- Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning
  and its moderators. Psychological Bulletin, 145(11), 1029–1052. doi:10.1037/bul0000209
  (unchecked); PubMed 31556629 [full text, author PDF]
- Carvalho, P. F., & Goldstone, R. L. (2014). Putting category learning in order: Category
  structure and temporal arrangement affect the benefit of interleaved over blocked study.
  Memory & Cognition, 42, 481–495. doi:10.3758/s13421-013-0371-0 [full text]
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in
  learning: A temporal ridgeline of optimal retention. Psychological Science, 19(11), 1095–1102.
  PubMed 19076480 [full text, eScholarship]
- Chisolm, T. H., et al. (2013). Learning to listen again: The role of compliance in auditory
  training for adults with hearing loss. American Journal of Audiology.
  doi:10.1044/1059-0889(2013/12-0081) [abstract only]
- Clement, B., Roy, D., Oudeyer, P.-Y., & Lopes, M. (2015). Multi-armed bandits for intelligent
  tutoring systems. Journal of Educational Data Mining, 7(2). arXiv:1310.3174 [full text]
- Czyż, S. H., Wójcik, A. M., & Solarská, P. (2024). The effect of contextual interference on
  transfer in motor learning: a systematic review and meta-analysis. Frontiers in Psychology, 15,
  1377122. doi:10.3389/fpsyg.2024.1377122 [full text]
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments
  examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin,
  125(6), 627–668. PubMed 10589297 [secondary report: Deci, Koestner & Ryan 2001]
- Deci, E. L., Koestner, R., & Ryan, R. M. (2001). Extrinsic rewards and intrinsic motivation in
  education: Reconsidered once again. Review of Educational Research, 71(1), 1–27.
  https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf [full text]
- Destefano, M., & Gray, W. D. (2016). Where should researchers look for strategy discoveries
  during the acquisition of complex task performance? The case of Space Fortress. Proceedings of
  the Annual Meeting of the Cognitive Science Society, 38.
  https://escholarship.org/content/qt5vz6t146/qt5vz6t146.pdf [full text]
- Dong, H., Clayards, M., Brown, H., & Wonnacott, E. (2019). The effects of high versus low
  talker variability and individual aptitude on phonetic training of Mandarin lexical tones.
  PeerJ, 7, e7191 [full text, ~60%]
- Donner, Y., & Hardy, J. L. (2015). Piecewise power laws in individual learning curves.
  Psychonomic Bulletin & Review, 22, 1308–1319. doi:10.3758/s13423-015-0811-x [secondary report:
  https://featuredcontent.psychonomic.org/power-steps-to-perfection-learning-is-not-always-smooth]
- Fenn, K. M., Nusbaum, H. C., & Margoliash, D. (2003). Consolidation during sleep of perceptual
  learning of spoken language. Nature, 425, 614–616. doi:10.1038/nature01951 [secondary report:
  ScienceDaily]
- Gabay, Y., Karni, A., & Banai, K. (2017). The perceptual learning of time-compressed speech: A
  comparison of training protocols with different levels of difficulty. PLoS ONE, 12(5),
  e0176488 [full text, author PDF]
- Hamari, J. (2017). Do badges increase user activity? A field experiment on the effects of
  gamification. Computers in Human Behavior. doi:10.1016/j.chb.2015.03.036 [secondary report:
  author group blog]
- Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom.
  Computers & Education, 80, 152–161. doi:10.1016/j.compedu.2014.08.019 [secondary report]
- Hawkins, G. E., Rae, B., Nesbitt, K. V., & Brown, S. D. (2013). Gamelike features might not
  improve data. Behavior Research Methods, 45, 301–318. doi:10.3758/s13428-012-0264-3
  [secondary report]
- Henshaw, H., McCormack, A., & Ferguson, M. A. (2015). Intrinsic and extrinsic motivation is
  associated with computer-based auditory training uptake, engagement, and adherence for people
  with hearing loss. Frontiers in Psychology, 6, 1067. doi:10.3389/fpsyg.2015.01067 [full text]
- Hilz, A., Guill, K., Roloff, J., Sommerhoff, D., & Aldrup, K. (2023). How to continue? Journal
  of Intelligence, 11(6), 108. doi:10.3390/jintelligence11060108 [full text, first half]
- Hung, S.-C., & Seitz, A. R. (2014). Prolonged training at threshold promotes robust retinotopic
  specificity in perceptual learning. Journal of Neuroscience, 34(25), 8423–8431 [full text]
- Jansen, B. R. J., et al. (2013). The influence of experiencing success in math on math anxiety,
  perceived math competence, and math performance. Learning and Individual Differences.
  doi:10.1016/j.lindif.2012.12.014 [abstract only]
- Johansson, A. M., Savi, A. O., van der Maas, H. L. J., & Hofman, A. D. (2024). Three strikes
  and who is out? Individual differences in error-induced quitting. Preprint.
  https://ann1ejohansson.github.io/three-strikes/preprint/threestrikes2024.pdf [full text]
- Kai, S., Heffernan, C., Almeda, M. V., Heffernan, N., & Baker, R. S. (c. 2018). Decision tree
  modeling of wheel-spinning and productive persistence in Skill Builders. Journal of
  Educational Data Mining. https://learninganalytics.upenn.edu/ryanbaker/ShiminJEDM.pdf [full text]
- Katz, B., Jaeggi, S., Buschkuehl, M., Stegman, A., & Shah, P. (2014). Differential effect of
  motivational features on training improvements in school-based cognitive training. Frontiers
  in Human Neuroscience, 8, 242. doi:10.3389/fnhum.2014.00242 [full text]
- Kelly, K., Wang, Y., Thompson, T., & Heffernan, N. (2015). Defining mastery: Knowledge tracing
  versus N-consecutive correct responses. EDM 2015 (poster).
  https://www.educationaldatamining.org/EDM2015/proceedings/poster630-631.pdf [full text]
- Khodadadi, A., Hosseini, S. A., Tavakoli, E., & Rabiee, H. R. (2017). Continuous-time user
  modeling in the presence of badges: A probabilistic approach. arXiv:1702.01948 [full text]
- Kumar, A., Benjamin, A. S., Heathcote, A., & Steyvers, M. (2022). Comparing models of learning
  and relearning in large-scale cognitive training data sets. npj Science of Learning, 7.
  https://escholarship.org/content/qt6mb1w98z/qt6mb1w98z.pdf [full text]
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed:
  Modelling habit formation in the real world. European Journal of Social Psychology, 40,
  998–1009. doi:10.1002/ejsp.674 [full text, CORE]
- Lelo de Larrea-Mancera, E. S., et al. (2022). Training with an auditory perceptual learning game
  transfers to speech in competition. Journal of Cognitive Enhancement. PMC8453468 [full text]
- Levitt, H. (1971). Transformed up-down methods in psychoacoustics. Journal of the Acoustical
  Society of America, 49, 467–477. doi:10.1121/1.1912375 (unchecked) [full text, course PDF]
- Liu, J., Lu, Z.-L., & Dosher, B. A. (2010). Augmented Hebbian reweighting: Interactions between
  feedback and training accuracy in perceptual learning. Journal of Vision, 10(10), 29 [full text]
- Liu, J., Lu, Z.-L., & Dosher, B. A. (2012). Mixed training at high and low accuracy levels leads
  to perceptual learning without feedback. Vision Research, 61, 15–24 (volume unchecked)
  [full text: https://sites.socsci.uci.edu/~maplab/webdocs/LiuLuDosherVR2012.pdf]
- Lumsden, J., Edwards, E. A., Lawrence, N. S., Coyle, D., & Munafò, M. R. (2016). Gamification
  of cognitive assessment and cognitive training: A systematic review of applications and
  efficacy. JMIR Serious Games, 4(2), e11. https://games.jmir.org/2016/2/e11 [full text]
- Lumsden, J., et al. (2016). The effects of gamelike features and test location on cognitive
  test performance and participant enjoyment. PeerJ, 4, e2184. https://peerj.com/articles/2184
  [full text]
- Mednick, S. C., Nakayama, K., Cantero, J. L., et al. (2002). The restorative effect of naps on
  perceptual deterioration. Nature Neuroscience, 5(7), 677–681. doi:10.1038/nn864 [full text]
- Mees, M., Jay, T., & Habgood, J. (2018). Designing an adaptive learner model for a mathematics
  game. Proceedings of the 12th European Conference on Games Based Learning.
  https://core.ac.uk/download/161527697.pdf [full text; used only for its Math Garden summary]
- Mekler, E. D., Brühlmann, F., Tuch, A. N., & Opwis, K. (2017). Towards understanding the effects
  of individual gamification elements on intrinsic motivation and performance. Computers in Human
  Behavior, 71, 525–534. doi:10.1016/j.chb.2015.08.048 (unchecked) [full text]
- Mettler, E., & Kellman, P. J. (2014). Adaptive response-time-based category sequencing in
  perceptual learning. Vision Research, 99, 111–123.
  https://kellmanlab.psych.ucla.edu/files/mettler_kellman_2014.pdf [full text]
- Milkman, K. L., et al. (2021). Megastudies improve the impact of applied behavioural science.
  Nature, 600, 478–483. doi:10.1038/s41586-021-04128-4 (unchecked) [full text, mirror PDF]
- Molloy, K., Moore, D. R., Sohoglu, E., & Amitay, S. (2012). Less is more: Latent learning is
  maximized by shorter training sessions in auditory perceptual learning. PLoS ONE, 7(5), e36929
  [full text]
- Papoušek, J., & Pelánek, R. (2015). Impact of adaptive educational system behaviour on student
  motivation. AIED 2015. https://www.fi.muni.cz/~xpelanek/publications/aied15.pdf [full text]
- Papoušek, J., Stanislav, V., & Pelánek, R. (2016). Impact of question difficulty on engagement
  and learning. ITS 2016. doi:10.1007/978-3-319-39583-8_28 [full text, author PDF]
- Papoušek, J., & Pelánek, R. (2017). Should we give learners control over item difficulty?
  UMAP '17 Adjunct. https://www.fi.muni.cz/~xpelanek/publications/difficulty-adjustment.pdf
  [full text]
- Pelánek, R. (2016). Applications of the Elo rating system in adaptive educational systems.
  Computers & Education, 98, 169–179 (pages unchecked).
  https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf [full text]
- Pelánek, R. (c. 2018). Conceptual issues in mastery criteria: Differentiating uncertainty and
  degrees of knowledge. https://www.fi.muni.cz/~xpelanek/publications/mastery-modeling.pdf
  [full text]
- Perrachione, T. K., Lee, J., Ha, L. Y. Y., & Wong, P. C. M. (2011). Learning a novel
  phonological contrast depends on interactions between individual differences and training
  paradigm design. JASA, 130(1), 461–472 [full text, author PDF]
- Prins, P. J. M., Dovis, S., Ponsioen, A., ten Brink, E., & van der Oord, S. (2011). Does
  computerized working memory training with game elements enhance motivation and training
  efficacy in children with ADHD? Cyberpsychology, Behavior, and Social Networking, 14(3),
  115–122. doi:10.1089/cyber.2009.0206 [abstract only]
- Raviv, L., Lupyan, G., & Green, S. C. (2022). How variability shapes learning and
  generalization. Trends in Cognitive Sciences. doi:10.1016/j.tics.2022.03.007 (unchecked)
  [full text, NSF repository, ~55%]
- Rollinson, J., & Brunskill, E. (2015). From predictive models to instructional policies. EDM
  2015. https://www.educationaldatamining.org/EDM2015/proceedings/full179-186.pdf [full text]
- Ryan, R. M., Rigby, C. S., & Przybylski, A. (2006). The motivational pull of video games: A
  self-determination theory approach. Motivation and Emotion, 30, 347–363.
  doi:10.1007/s11031-006-9051-8 [full text]
- Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. Educational
  Psychology Review, 32, 77–112. doi:10.1007/s10648-019-09498-w [full text, ~80%]
- Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017). How gamification motivates: An
  experimental study of the effects of specific game design elements on psychological need
  satisfaction. Computers in Human Behavior, 69, 371–380 [full text, repository PDF]
- Sapountzi, A., Bhulai, S., Cornelisz, I., & van Klaveren, C. (2021). Personalized stopping
  rules in Bayesian adaptive mastery assessment. arXiv:2103.03766 [full text]
- Savi, A. O., Ruijs, N. M., Maris, G. K. J., & van der Maas, H. L. J. (2018). Delaying access to a
  problem-skipping option increases effortful practice. Computers & Education, 119, 84–94
  [abstract only]
- Silverman, J., & Barasch, A. (2023). On or off track: How (broken) streaks affect consumer
  decisions. Journal of Consumer Research, 49(6), 1095–1117. doi:10.1093/jcr/ucac029 [abstract
  only + secondary reports]
- Solenthaler, B., Klingler, S., Käser, T., & Gross, M. (2018). Ten years of research on
  intelligent educational games for learning spelling and mathematics. arXiv:1806.03257
  [full text]
- Talluri, B. C., Hung, S.-C., Seitz, A. R., & Seriès, P. (2015). Confidence-based integrated
  reweighting model of task-difficulty explains location-based specificity in perceptual
  learning. Journal of Vision, 15(10), 17. doi:10.1167/15.10.17 [full text]
- Thomas, A., Paul, L., Rasenyalo, S., Jones, B., & Hendricks, S. (2025). Challenge accepted: A
  systematic scoping review of the applications of the challenge point framework. Journal of
  Motor Behavior, 57(4), 444–462 [full text, ~90%]
- Turunen, M., et al. (2019). Computer-based cognitive training for older adults: Determinants of
  adherence. PLoS ONE, 14(7), e0219541 [abstract only]
- Watson, A. B. (2017). QUEST+: A general multidimensional Bayesian adaptive psychometric method.
  Journal of Vision, 17(3), 10. doi:10.1167/17.3.10 [full text]
- Whitton, J. P., Hancock, K. E., Shannon, J. M., & Polley, D. B. (2017). Audiomotor perceptual
  training enhances speech intelligibility in background noise. Current Biology. PubMed 29056453
  [secondary report: https://hms.harvard.edu/news/game-changer]
- Wilson, R. C., Shenhav, A., Straccia, M., & Cohen, J. D. (2019). The Eighty Five Percent Rule
  for optimal learning. Nature Communications, 10, 4646. doi:10.1038/s41467-019-12552-4
  [full text, eScholarship PDF]
- Wisniewski, M. G., Radell, M. L., Church, B. A., & Mercado, E., III. (2017). Benefits of fading
  in perceptual learning are driven by more than dimensional attention. PLoS ONE, 12(7),
  e0180959. doi:10.1371/journal.pone.0180959 [full text]
- Wright, B. A., Sabin, A. T., Zhang, Y., Marrone, N., & Fitzgerald, M. B. (2010). Enhancing
  perceptual learning by combining practice with periods of additional sensory stimulation.
  Journal of Neuroscience, 30(38), 12868–12877. doi:10.1523/JNEUROSCI.0487-10.2010 [abstract
  summary + news report]
- Yancey, K. P., & Settles, B. (2020). A sleeping, recovering bandit algorithm for optimizing
  recurring notifications. KDD 2020. https://research.duolingo.com/papers/yancey.kdd20.pdf
  [full text]
- Zhang, P., Zhao, Y., Dosher, B. A., & Lu, Z.-L. (2019). Assessing the detailed time course of
  perceptual sensitivity change in perceptual learning. Journal of Vision, 19(5), 9
  [full text, eScholarship]
- Secondary-only mentions: Anderson et al. 2013 (badge steering, via Khodadadi 2017); Beck & Gong
  2013 (via Kai et al.); Church et al. 2013, Liu et al. 2008, Pashler & Mozer 2013 (via
  Wisniewski 2017); Clopper & Pisoni (via Raviv 2022); Miranda & Palmer 2014 (via Lumsden 2016
  JMIR); Pinterest/Twitter notification results (via https://eugeneyan.com/writing/push/);
  Duolingo reminder blog (https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/, full text).
