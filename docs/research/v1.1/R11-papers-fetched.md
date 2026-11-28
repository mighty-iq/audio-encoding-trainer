# R11 — Papers fetched through Google Scholar full-text links (1.1 research pass)

Started 2026-11-28 17:35 UTC. Written as the work proceeds (resumable: the last section shows where it stopped).
Method: cloud browser → Google Scholar result → the [PDF]/[HTML] link beside it (author pages, repositories,
open-access copies); fallback WebSearch + WebFetch. No sign-in, no bot-check bypass, nothing saved to disk.
Read levels: full text / abstract only / not reached (with the reason). Notes are in our own words.
What each paper was needed for: docs/research/ACCESS.md and docs/research/v1.1/R7 §14, R8 §10, R9 §8.

## 1. Kuai, Zhang, Klein, Levi & Yu 2005, Nature Neuroscience 8(11):1497–1499 — temporal patterning
- Source read: last author's faculty page PDF (psy.pku.edu.cn/static/main/uploads/faculty/yu_cong/, found through
  the Scholar "All versions" list). Read level: **full text** (brief communication; read through a text extraction,
  figure labels partly garbled, so observer counts are taken from the ANOVA degrees of freedom).
- Procedure: visual, two tasks. (a) Contrast discrimination, two Gabors per trial (92 ms each, 600 ms apart), 2AFC,
  3-down-1-up staircase, four reference contrasts (0.20, 0.30, 0.47, 0.63). (b) Motion-direction discrimination,
  two 500 ms intervals 200 ms apart, four reference directions (22.5°, 67.5°, 112.5°, 157.5°). Sessions ≈ 2 h,
  1,000–1,200 trials; contrast patterning ran five sessions.
- Results (post/pre threshold ratio; lower = learning):
  - Random roving of the four references: contrast 0.93 ± 0.09 (n.s.); direction 1.17 ± 0.23 (n.s.). No learning.
  - Fixed sequence, the reference changing on EVERY trial in a fixed cycle (1→2→3→4→1…): contrast 0.61 ± 0.06
    (≈ 39 % better, p < .001; 7 observers ascending order, 3 a non-monotonic fixed order — both learned, no separate
    statistics); direction, ascending cycle, 0.64 ± 0.11 (p = .014). Same size as blocked practice in their earlier
    study (0.64 ± 0.04).
  - Random roving with a pre-cue (a copy of the coming reference shown 1 s before): 0.88 ± 0.10 in both tasks,
    n.s. — knowing what comes next was not enough.
  - After fixed-sequence training, thresholds measured under random roving were also lower (contrast 0.61 ± 0.06,
    direction 0.55 ± 0.05, both significant; small n).
  - Not tested: run lengths > 1, rhythm/timing regularity, inter-trial intervals.
- Authors' reading: the fixed order lets each stimulus be tagged/chunked in memory; uncertainty reduction is not the
  mechanism.
- For Earshot (R7 §14.1, staged variety: blocked → announced alternation → random): **confirm the stage, correct
  the detail.** (i) A fixed, predictable cycle is what restored learning — the cycle length was 1 trial per
  condition, so runs of 3–5 are not required by this study (they are not contradicted either; untested). (ii) The
  ORDER must be fixed; merely ANNOUNCING the next condition (pre-cue) on a random order did not help — so the
  "announced alternation" stage must be a fixed repeating cycle, not random order with a label. (iii) Learning from
  the fixed cycle carried to random roving, supporting the final random stage. Caveat: visual fine discrimination
  with narrow-band stimuli, n = 3–10 per cell; not speech.

## 2. Zhang, Kuai, Xiao, Klein, Levi & Yu 2008, PLoS Biology 6(8):e197 — stimulus coding rules
- Source read: journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.0060197 (open access, CC BY), in the
  browser. Read level: **full text of abstract, introduction and all Results with figure legends**; Discussion and
  Methods not read (page length).
- Procedure: contrast discrimination as in paper 1 (four reference contrasts 0.20/0.30/0.47/0.63), usually 6
  observers per condition, five 2-h sessions on different days, five interleaved-staircase runs per session.
  Outcome = post/pre threshold ratio (PPR; < 1 = learning).
- Results:
  - Rhythm. Fixed ascending cycle with a constant inter-trial interval: ITI 1 s PPR 0.69 ± 0.06; 2 s 0.71 ± 0.03;
    3 s 0.86 ± 0.02 (weaker, p = .009 vs shorter). Same order but ITI jittered (1–3 s or 2–4 s): 0.99 ± 0.05, no
    learning. Uneven but fixed ITIs (2, 2.5, 1.5, 1 s): 1.05, no learning; steadily lengthening ITIs: 0.82 (some).
    Gains were within-session (≈ 15 % per session), none between sessions.
  - Consolidation. One random-roving run added after each day's patterned practice: at 0 h delay PPR 0.94 (learning
    almost wiped out); 4 h 0.87 (reduced, p = .034); 8 h 0.81 and 12 h 0.78 (not reliably below normal). 24
    observers, 6 per delay.
  - After learning is complete. Four sessions of random roving one day after five patterned sessions: thresholds
    stayed at the trained level (ratio to post-training 1.02 on day 1, 1.05 on day 4); same after a 2–4 week gap
    (3 observers). Learned skill survives, and is usable under, random roving.
  - Run length under roving (random order, each contrast kept for k consecutive trials): k = 1 no learning (earlier
    data); k = 3 PPR 0.95 ± 0.07 (n.s.); k = 5 0.81 ± 0.06 (p = .029); k = 8 0.74 ± 0.03 (p = .001); k ≈ 30
    (blocked) learns.
  - Identity. Two roved contrasts that are close (0.30, 0.47): 0.94, no learning; two that are far apart (0.20,
    0.47): 0.76, learning. Four roved contrasts each preceded by a letter tag A–D (shown 200 ms, 200 ms before the
    trial): 0.77 ± 0.04, learning restored — whereas a physical copy of the stimulus as pre-cue (paper 1) did not.
    Illusory-line orientation: roving four arbitrary orientations 0.95 (none), fixed rotation 0.68, but roving four
    cardinal/oblique orientations (nameable) 0.66. Longer stimuli (400 ms) or a spatial 2AFC did not rescue roving.
- Authors' account: each stimulus must be conceptually tagged so that attention can switch to the right template;
  rhythm + order, a semantic label, distinctness, or ≥ 5 consecutive trials all supply the tag.
- For Earshot (R7 §14.1): **correct.**
  - "Runs of 3–5 trials in a fixed announced cycle" → use runs of **≥ 5** (3 failed, 5 learned, 8 learned more)
    when conditions come in runs; runs of 3 are below the threshold found here.
  - Alternation on every trial works only with a fixed order AND a steady pace; self-paced app trials jitter the
    interval, which in this study abolished the benefit. Earshot trials are self-paced, so do not rely on a
    1-trial fixed cycle — rely on run length ≥ 5 and on a **named label shown before each trial** (venue/condition
    name, a word or icon the player knows) — the semantic tag restored learning even in random order.
  - Conditions that are clearly distinct and nameable (e.g. Crowd vs Far vs Strange; male vs female masker) can be
    mixed at random without this cost; the roving cost applies to similar, confusable conditions (adjacent SNR or
    similarity steps of one dial). So the staged schedule matters within an exercise's fine steps, less across
    exercises.
  - Do not end a sitting that taught a new condition with a random-mix set of its confusable neighbours (0 h
    roving erased the day's gain; safe after ≥ 8 h). Put mixed/random sets first or on a later sitting until the
    condition is learned; after learning, random mixing does no harm.
  - Caveat as for paper 1: visual threshold tasks, 3–6 observers per cell.

## 3. Smits, Goverts & Festen 2013, JASA 133(3):1693–1706 — digits-in-noise test (doi:10.1121/1.4789933)
- Sources tried: Scholar lists 7 versions; the only full-text copy is on ResearchGate, which showed a security
  check (not passed, by rule). Read: the publisher's minimal article page (aipp.silverchair-cdn.com/article-minimal/
  913552, abstract + references) and the Amsterdam UMC repository record (no file). Read level: **abstract only**.
- What the abstract states: digit triplets from one male talker in steady speech-spectrum noise, 1-up-1-down;
  measurement error **0.7 dB**; **one training list** is needed for naive listeners, then no further learning over
  24 further SRT measurements; r = 0.96 with a sentence test after correction for measurement error (normal
  hearers with simulated loss); reference data from 1,386 listeners over 60.
- Still missing: triplets per list, step size, slope, the size of the first-list learning effect in dB.
- For Earshot (ACCESS core 8: "SD 0.7–1 dB; one practice run before baseline"): **confirm** — 0.7 dB is the
  authors' own figure for this test and one practice list is their recommendation. (Earshot's probe is its own
  material, so its own retest SD must come from simulation and pooled exports, not from this number.)

## 4. Clopper, Pisoni & Tierney 2006, J Am Acad Audiol 17(5):331–349 — open-set vs closed-set demands
- Source read: PubMed Central author manuscript PMC3324094 (pmc.ncbi.nlm.nih.gov/articles/PMC3324094/, linked from
  Scholar). Read level: **full text** (through a text extraction; per-block values are only in figures).
- Procedure: 132 CVC words (66 "easy", 66 "hard" by lexical neighbourhood), five male talkers (one talker vs all
  five, between groups), signal degraded by flipping the sign of 10 % of samples (no added noise). Each listener
  did open-set (type the word), closed-set with options shown before the word, and closed-set with options shown
  1 s after it. 48–60 listeners per experiment.
- Results (overall % correct; open-set was 45–47 % throughout):
  | Exp | options | foils | closed-set % | easy>hard effect | one talker > five effect |
  |---|---|---|---|---|---|
  | 1 | 6 | one-phoneme substitutions chosen by the authors (less confusable) | 82 | open-set only | open-set only |
  | 2 | 12 | the 5 from Exp 1 + 6 taken from listeners' real open-set errors | 60 | all three formats | open and options-after (before: marginal) |
  | 3 | 12 | random words from the set | 92 | open-set only (marginal) | open-set only |
  | 4 | 6 | 5 of the open-set-error foils | 67 | open and options-before | open (options-after marginal) |
- Conclusion: a closed set behaves like open recognition only when the options are BOTH many and truly confusable
  (drawn from what listeners actually mishear); option count alone (Exp 3) or designer-picked minimal pairs at a
  small count (Exp 1) do not; 6 real-error foils get part of the way. Showing options after the word (so they cannot
  be used to listen selectively) did not by itself restore the effects.
- For Earshot (R9 §8.3: sound-alike options and the typed top step): **confirm, with a sharper rule.** Foils should
  come from real confusions (the app's own pooled error log, or phoneme-confusion data), not only one-phoneme
  neighbours; aim at 12 options for the hardest closed step where the screen allows, 6 real-error foils as the
  phone-sized compromise; random foils make the task trivially easy (92 % where open-set was 47 %) — a 45-point
  gift from elimination; the typed/open step stays the only format in which talker and lexical difficulty showed
  in every experiment. Options-after-audio (already planned for 1.0.1) is kept for the anti-strategy reason, but
  this study does not show it adds lexical difficulty on its own.

## 5. Agus, Thorpe & Pressnitzer 2010, Neuron 66(4):610–618 — rapid memories for noise
- Source read: cell.com/neuron/fulltext/S0896-6273(10)00285-0 (publisher's open-archive HTML, linked from Scholar;
  the PDF link failed). Read level: **full text** (through a text extraction).
- Procedure: 1 s Gaussian noises; "repeated noise" = a 0.5 s segment played twice without a gap; task = say whether
  a repetition was present, no feedback. One particular repeated noise ("reference") recurred, unannounced, on 50
  of the 200 trials of a block (100 plain noise, 50 fresh repeated noise, 50 reference), never twice in a row.
- Results: reference and fresh repeated noises start equal; the reference improves within about the first 10
  presentations (half-life ≈ 4 presentations; ≈ 2 in the blocks where learning took hold). d′ 1.0 (reference) vs
  0.4 (fresh) in naive listeners (n = 12); learning was all-or-none per noise: 31 % of blocks reached ≥ 90 %
  (7 of 12 listeners at least once), rising to 67 % of blocks in 5 practised listeners (d′ 2.3). Learned noises
  were recognised again after a mean of 16.5 days (performance restarted at 86 % vs 64 % for a new noise).
  Learning survived the similar noises in between; segments of 0.125–2 s were all learned (0.5 and 2 s best);
  tolerant to time reversal and to moderate pitch/time shifts → the learned features are short and local in time.
- For Earshot (R9 change 1: fresh noise and babble on every trial; no frozen masker tokens): **confirm, with
  numbers.** A recurring masker token can start to be recognised after roughly 4–10 exposures, without intent or
  feedback, and the memory lasts weeks. So: never reuse a noise or babble excerpt often enough to matter — draw a
  random offset into long babble recordings (or synthesise) every trial; if the babble pool is finite, keep any
  0.5–2 s excerpt's reuse far below ~4 presentations per player per fortnight; the same applies to probes (a fixed
  probe masker would be learnable across retests, inflating "gains"). The paper is about noise recognition, not
  release from masking, so the size of any benefit for speech scores still needs Felty, Buchwald & Pisoni 2009.

## 6. Herzog, Aberg, Frémaux, Gerstner & Sprekeler 2012, Vision Research 61:95–99 — roving and the unsupervised bias
- Source read: sciencedirect.com/science/article/pii/S0042698911003816 (publisher HTML, open archive, linked from
  Scholar). Read level: **full text** (through a text extraction). Volume and pages as in ACCESS.md, not re-checked.
- Content (a model paper with a simulation, no new human data): perceptual learning is treated as reward-based.
  Such rules need an exact estimate of the average reward; with a single running average and two mixed stimulus
  types that earn DIFFERENT average reward (i.e. differ in difficulty), the estimate is wrong for both, weights
  drift, and learning stalls. A "critic" that keeps a separate reward estimate per stimulus type removes the
  problem — possible when the types are distinct enough for the (coarse, non-visual) critic to tell apart.
  Examples cited: bisection stimuli of 20′ vs 30′ width roved → no learning, each alone learns; bisection stimuli
  of different orientation roved → learning; another study where roving slowed learning ~15-fold (overcome after
  ~18,000 trials). Feedback: learning is possible without it, faster with it, and block-level feedback is almost as
  good as trial-level. Trials per session matter (a cited case: 1,600 trials in 2–4 sessions learned, 160 trials ×
  10 sessions did not). Predictable alternation or pre-cueing may help the critic but did not always work.
- The equal-difficulty prediction: **not stated as a tested prediction in this paper.** It follows from the model
  (equal average reward → one running average is exact → no bias), and the text blames differing difficulty, but
  no experiment testing equal-difficulty roving is reported here.
- For Earshot (R7 §14.3, item 4's invariant "interleaved conditions planned at equal accuracy"): **keep, relabel.**
  It is a model-derived inference, not an experimental result — DECISIONS.md and the guide should say "a model
  predicts", not "studies show". The staircase-per-condition design that holds each mixed condition near the same
  target accuracy is exactly what the model asks for; in addition, mixing clearly distinct conditions is safe by
  the same model (and by paper 2), and a per-condition running score shown to the player acts as an explicit
  per-type "critic". Frémaux, Sprekeler & Gerstner 2010 (the underlying model) not opened.

## 7. Yund & Woods 2010, Ear and Hearing 31(6):769–778 (issue Dec 2010; pages unchecked) — content vs procedural learning
- Source read: the structured abstract shown in the Scholar record (publisher page journals.lww.com not opened; the
  only full-text copy listed is on ResearchGate, which runs a security check). Read level: **abstract only**
  (a detailed structured abstract with the key numbers).
- Design: Exp 1, 8 normal-hearing listeners, five 1-h sessions on separate days, HINT-type sentence lists; some
  sentence sets repeated (twice per session, every session), other sets unique and given only in sessions 1 and 5.
  Exp 2, 23 young listeners, three sessions in 10 days, never-repeated lists from two sentence tests. Exp 3, 11
  older normal-hearing listeners, the same lists repeated after an interval of several months.
- Results: repeated sentences improved the SRT by **2.7 dB** over five sessions; unique sentences by 0.3 dB (n.s.)
  → in noise nearly all of the repeated-test gain is content (item) learning; procedural learning was significant
  only within the first session and needs **at least two practice lists** to wash out. With unique lists, 0.2 dB
  and 0.1 dB per session (the latter n.s.). The same lists again after months: still 0.5 dB and 0.4 dB better.
- For Earshot (R9 §8.10; probe design): **confirm and tighten.** (i) Probe items must never repeat for a player —
  item learning is ~2.7 dB, larger than the training effects we hope to detect; even a months-long gap leaves
  ~0.5 dB. Generated/recombined probe items (matrix-style) and alternate forms are the right design. (ii) The
  practice-before-baseline rule should be **two practice runs for sentence-type probes** (one is the published
  rule for digit triplets, paper 3). (iii) A procedural drift of ~0.1–0.2 dB per session remains with unique
  material: the meter's "real gain" threshold should sit above that.

## 8. Zhang, Cheng & Zhang 2021, JSLHR 64(12):4802–4825 — talker variability meta-analysis
- Source read: last author's lab page PDF (zhanglab.wdfiles.com/local--files/publications/, linked from Scholar),
  read as page images in the browser. Read level: **abstract + the moderator results and start of the Discussion
  (pages 11–12 of 24)**; methods, study table and the rest of the Discussion not read.
- Numbers: 18 studies, 549 learners, multiple-talker vs single-talker training of non-native sounds. Immediate
  outcome g = 0.46 [0.08, 0.84], shrinking to −0.04 [−0.46, 0.37] after removing outliers and correcting for
  publication bias; perception alone (16 studies) g = 0.56 [0.13, 1.00]; production (7 studies) −0.04.
  Generalisation to new talkers g = 0.72 [0.15, 1.29]; retention g = 1.09 [0.39, 1.78] (few studies each; the
  authors call these tentative).
- Moderators (meta-regressions, one variable at a time):
  - Programme length → immediate perceptual gain: F(1,9) = 4.15, p = .07 (a trend; longer programmes, larger
    multi-talker advantage; the plotted lengths run 1–8 units, the regression line from ≈ 0.1 to ≈ 0.7 g).
  - Talker presentation format → generalisation: F(1,7) = 5.94, p = .045; **blocked by talker (one talker per
    session) gave the larger multi-talker advantage** (box plot: median g ≈ 0.55 blocked vs ≈ 0.25 intermixed
    within a session). For immediate gains the format was not significant (p = .13).
  - Not significant: number of talkers, number of sessions, session length, tokens per session, total tokens,
    time span, proficiency, target language, phone type, task, test talker.
- For Earshot (R7 §14.6, R9 §8.9; Strange and the voice dial): **correct.** The advantage of many talkers shows
  up in generalisation and retention rather than in immediate scores (so judge it with the probes, not session
  accuracy), and across studies it was larger when talkers were blocked (one voice per sitting/set) than when
  intermixed trial by trial. So: for a new accent or unusual-speech type, start with one voice per set (blocked
  by talker), rotate voices across sets and days, and mix voices within a set only later — the same
  blocked → mixed staging as the roving papers (1, 2). The number of talkers itself did not moderate the effect:
  a handful of well-chosen voices is not shown to be worse than many. Caveat: non-native phoneme learning by L2
  adults, 7–9 studies in the moderator tests, single-variable regressions.

## 9. Johnsrude, Mackey, Hakyemez, Alexander, Trang & Carlyon 2013, Psychological Science 24(10):1995–2004
- Sources tried: publisher PDF (journals.sagepub.com — security check, not passed); the two repository copies
  Scholar lists (diva-portal.org FULLTEXT01.pdf and a cyberleninka.org PDF) both timed out in the cloud browser;
  WebFetch was refused for new sites from this point on (an unanswered permission prompt). Read level:
  **abstract only** (Scholar record).
- Abstract: call-sign (coordinate-response) sentences, spouse's voice vs strangers. A long-familiar voice helps
  both as the target (tracked better against a stranger) and as the masker (easier to ignore, so the stranger is
  understood better). With a novel target, performance falls with age; with the spouse as target it does not.
  Holmes et al. 2018 quote this study's familiar-talker effect as f = 0.72.
- Still missing: % correct per TMR, benefit in points/dB. Worth one more try from another network (DiVA record
  diva2:662961 is an institutional open copy).
- For Earshot (ACCESS core 6): no change — see paper 10 for numbers.

## 10. Holmes, Domingo & Johnsrude 2018, Psychological Science 29(10):1575–1583 — familiar voices without recognition
- Source read: accepted manuscript in the UCL repository (discovery.ucl.ac.uk/id/eprint/10055998/), read as page
  images in the browser. Read level: **methods and results in full (manuscript pages 5–13 of 23)**; introduction
  and discussion not read.
- Procedure: 11 pairs of friends/couples (21 completed; aged 19–24) who had known each other 0.5–9 years (median
  2.0) and spoke > 5 h per week. Each recorded 480 five-word matrix sentences (name–verb–number–adjective–noun,
  ≈ 2.5 s). Intelligibility task: two simultaneous sentences from different talkers, report the four words of the
  sentence starting with the target name; closed set; TMR −6 and +3 dB; 768 trials, all conditions randomly
  interleaved. Target = the partner ("familiar target") or a stranger ("both unfamiliar"); maskers always
  strangers; each voice served as familiar for one listener and unfamiliar for two others (acoustics
  counterbalanced). Voices unshifted, f0 raised 40 %, formants (vocal-tract length cue) raised 27 %, or both.
  Separate task: "is this my partner?" (84 trials).
- Results: familiar-voice benefit = % sentences fully correct, familiar minus unfamiliar target. Reliable in all
  four manipulations (p ≤ .007): about 17 points unshifted, about 10–13 points when f0, formants or both were
  shifted (read from the figure; unshifted larger than the others, p ≤ .036). By TMR: mean 17.4 points (SD 19.6)
  at −6 dB and 10.1 (SD 13.7) at +3 dB (the manuscript's sentence states the direction the other way round; the
  numbers are as given). Recognition: well above chance unshifted and with f0 shifted, at chance when formants
  were shifted — yet the intelligibility benefit remained. No correlation between recognising the voice and
  benefiting from it (r ≤ .34).
- For Earshot (ACCESS core 6: "~10–60 min gives 10–15 %"; the Voices exercise / recurring cast): **confirm the
  size, sharpen the mechanism.** Naturally familiar voices give ≈ 10–17 points in a two-talker matrix task, most
  at the harder TMR; the benefit does not need the listener to know who is speaking and survives a 40 % pitch
  shift, so (i) a recurring cast can pay off even if players cannot name the voices — do not gate the benefit on
  a voice-naming quiz; (ii) score the cast's effect as familiar-minus-new voice accuracy at matched TMR, with
  both kinds as targets against the same maskers and randomly interleaved, as here; (iii) pitch variation of a
  cast voice is tolerated, formant changes less so. The minutes-of-training figure comes from Holmes, To &
  Johnsrude 2021 (R3), not from this paper: here familiarity was ≥ 6 months of real life.

## 16d. Bieber & Gordon-Salant 2021, Hearing Research (review; PMC7880302) — read out of order
- Source read: pmc.ncbi.nlm.nih.gov/articles/PMC7880302/ (author manuscript). Read level: **full text in two
  halves through a text extraction** (sections 1–5.3 and 6; section 5.3–5.4 detail partly lost at the cut).
- What it says (older adults, challenging speech): adaptation to time-compressed, accented and vocoded speech
  starts within about 8–20 sentences and continues for at least 140–300 trials; older and younger listeners adapt
  at similar rates when starting levels are matched; hearing loss adds no clear penalty. Massed and spaced
  schedules gave similar learning in the one direct comparison cited. Transfer to untrained material is limited
  after one session and appears more often after several sessions and after training on several kinds of
  difficult speech; it may need a delay to show. Retention is rarely tested; no benefit was left one week after
  a single accent session. Practice alternated with passive exposure beat either alone in young adults (untested
  in older adults). Combined auditory + cognitive (memory/attention load) programmes are named the most promising
  for carry-over to speech in noise; working-memory training alone has not transferred. Method notes: block
  averages hide the learning curve (use trial-level growth models); most programmes were evaluated only by their
  makers; an active control is the minimum.
- For Earshot: **confirm.** Supports (i) several kinds of difficult speech and multi-session dosing for transfer,
  (ii) the 20–30 s listen-only interludes, (iii) Echo/Repair as memory-load-on-listening rather than separate
  memory games, (iv) delayed probes (not same-day) for the transfer meter, (v) trial-level curves in the pooled
  export. Nothing to correct.

## 11. Silverman & Barasch 2023, J Consumer Research 49(6):1095–1117 — streaks (doi:10.1093/jcr/ucac029)
- Sources tried: Scholar lists an institutional copy (udspace.udel.edu bitstream) — it timed out in the cloud
  browser and WebFetch was refused (unanswered permission prompt); publisher page not tried (paywall). Read level:
  **abstract only** (the full abstract in the Scholar record; R8 had only the authors' press summary).
- Abstract: a "streak" = the same behaviour logged three or more times in a row. Seven studies: showing an intact
  streak in a behaviour log raises later engagement relative to showing a broken one; the effect depends on how
  the log REPRESENTS the past, not on the actual past behaviour; people treat keeping the logged streak as a goal
  in itself. The drop after a broken streak is larger when the break is the person's own doing than when it has an
  outside cause, and smaller when the log lets them "repair" the break.
- Still missing: per-study effect sizes; whether a broken-streak log is worse than NO streak display (the
  comparison in the abstract is intact vs broken only); the field data.
- For Earshot (no daily streaks, by the owner's rule): **confirm.** The paper's mechanism — the harm comes from
  the log showing a break — supports displays that cannot show a break at all: cumulative counts ("sessions this
  month", total minutes, venues cleared), which never reset, instead of consecutive-day chains. If any run-like
  display is ever wanted (e.g. "3 weeks with ≥ 2 sessions"), it should attribute gaps externally and be
  repairable by design; the default stays: none.

## 14. Gollwitzer & Sheeran 2006, Advances in Experimental Social Psychology 38:69–119 — if-then plans meta-analysis
- Source read: the first author's university repository PDF (kops.uni-konstanz.de bitstream, linked from Scholar),
  read as page images. Read level: **abstract + the main results (chapter pages 92–95: overall effect, moderator
  table, goal-domain table, start of the self-regulatory-problem analysis)**; theory sections, process studies and
  discussion not read. The venue is now verified (R9 had it from a catalogue record).
- Numbers: overall d = 0.65 [0.60, 0.70], k = 94 tests, N = 8,461; heterogeneous (Q(93) = 173.5).
  - Sample: university students d = .65 (k = 79); general public .58 (k = 8); physical illness .52 (k = 4);
    children/young adults .47 (k = 2); people with self-regulation problems (three single clinical samples) ≈ 1.10.
  - Design and measurement: experimental .65 vs correlational .70; objective outcome .67 vs self-report .63;
    published .65 vs unpublished .67 — none of these differ.
  - Goal domain: laboratory tasks .70 (k = 38); academic .72 (k = 9); health .59 (k = 23); personal goals .58
    (k = 11); consumer .41 (k = 2); prosocial 1.01, environmental 1.12, antiracist .87 (k = 3–5 each).
  - By problem: remembering to act .54 (k = 11), seizing an opportunity .61 (k = 20), overcoming initial
    reluctance .65 (k = 21); shielding: suppressing unwanted attention responses .90, unwanted behaviour .54.
  - No hearing, listening or rehabilitation-of-communication study appears in the tables read.
- For Earshot (R9 §8.8; the real-life bridge "if I am in <place>, then I will <tactic>"): **confirm, with the
  right number.** Quote d ≈ 0.6 for everyday health/personal goals in non-student samples (not the headline .65,
  which is 84 % student samples), and say that no study in it tested listening tactics — the bridge is a bet
  transferred from other behaviours. The format that the evidence is about is a specific cue → specific action
  sentence written by the person; keep one plan at a time, tied to a situation cue the player names.

## 12. Bai, Hew & Huang 2020, Educational Research Review, article 100322 — gamification meta-analysis
- Sources tried: Scholar lists 5 versions, none with a free full-text link; the publisher page
  (sciencedirect.com/science/article/pii/S1747938X19302908) returned a client error to WebFetch. Read level:
  **abstract only** (full abstract in the Scholar record; R8 had a summary page).
- Abstract: 30 independent interventions, 3,202 learners, from 24 studies: gamified vs non-gamified learning,
  Hedges' g = 0.504 [0.284, 0.723]; no publication bias detected. From 32 qualitative studies: learners like it
  because it raises enthusiasm, gives feedback on performance, meets a need for recognition and supports goal
  setting; they dislike it when it adds nothing useful and when it causes **anxiety or jealousy**.
- Still missing: the per-element moderators (points, badges, leaderboards), duration moderator, which elements
  the anxiety/jealousy reports attach to; the journal volume (30 or 33) stays unchecked.
- For Earshot: **confirm** (no change): feedback-on-performance, recognition and goal setting are the liked
  functions — levels tied to measured ability, personal bests and chosen goals serve all three without ranking
  players against each other.

## 13. Sweetow & Sabes 2010, J Am Acad Audiol 21(9):586–593 — participation and compliance
- Sources tried: Scholar lists 10 versions, no free full-text link (publisher copy on ingentaconnect/Thieme).
  Read level: **abstract only** (structured abstract in the Scholar record).
- Abstract (a discussion article, not a trial): fewer than 10 % of audiologists offer auditory training although it
  seems to reduce hearing-aid returns; patients who are recommended home training often do not finish; in one
  cohort of home-based trainees **compliance was below 30 %**; the article proposes ways to raise it.
- Still missing: the cohort size, the definition of compliance, drop-out reasons, the proposed remedies.
- For Earshot: **confirm** the planning figure that most people who start a home listening programme do not
  finish it (< 30 % here) — the reason the game layer, short sessions and never-punishing return paths get design
  weight equal to the exercises. Do not quote remedies from this paper (not read).

## 15. Hickson, Worrall & Scarinci 2007, Ear and Hearing 28(2):212–230 (issue April 2007; pages unchecked) — ACE trial
- Sources tried: Scholar shows the structured abstract and an archived copy of the authors' university PDF
  (scholar.archive.org … /ACE.pdf), not opened for lack of budget in this pass. Read level: **abstract only**.
- Abstract: Active Communication Education = a group programme, 2 h a week for 5 weeks (problem-solving for
  everyday listening situations). Double-blind randomised trial, 178 older adults with mild-to-moderate loss
  (about half had been fitted with hearing aids): 78 did a placebo social programme for 5 weeks and then ACE; 100
  did ACE only; 167 re-assessed at 6 months. All outcomes are **self-report** questionnaires (hearing handicap,
  communication function, self-assessed communication, well-being, health-related quality of life) plus
  goal-based and global outcome scales after the programme. After the social programme, only one communication
  scale and the mental-health score improved; after ACE, the handicap scale, both communication scales and
  well-being improved, and the gains held at 6 months; 75 % reported some improvement on their own primary goal;
  more positive attitudes before the programme predicted more change.
- Still missing: effect sizes and the direct ACE-vs-placebo contrast statistics (the open copy above has them).
- For Earshot (R9 §5.1 bridges): **confirm, with a limit.** The bridge content (goal chosen by the person,
  problem-solving for named situations, tactics) has randomised support on self-reported communication, held for
  6 months — but no speech-recognition measure was used, the format was a facilitated group, and the placebo also
  moved one communication scale. So the app's bridge cards are "ACE-style" bets; say "self-reported everyday
  communication improved", never "hearing in noise improved", and measure them with the player's own goal rating
  (the trial's most convincing outcome was the personal-goal scale).

## 16. Lower-priority list — attempts
- Bieber & Gordon-Salant 2021: read (section 16d above).
- Oberfeld & Klöckner-Nowotny 2016 (doi:10.7554/eLife.16747): doi.org fetch was rate-limited once and not
  retried; **not reached**. Open access at elifesciences.org — an easy win for the next pass.
- Reynard et al. 2022 (doi:10.3390/jcm11102880): WebFetch may not follow doi.org redirects; **not reached**.
  Open access at mdpi.com and in PubMed Central.
- Green et al. 2019 (doi:10.1177/2331216519843878), Long & Aleven 2017, Galak, Redden & Kruger 2009, Koivisto &
  Hamari 2019: **not attempted** (budget of this pass spent on items 1–15).

## What worked and what did not (for the next fetcher)
- Google Scholar opened without a bot check on every query (16 result pages); the [PDF]/[HTML] link beside a
  result or under "All N versions" pointed to a usable copy for 9 of 15 papers.
- Readable: author/faculty pages and lab sites, university repositories that serve the PDF directly (read as page
  images in the browser PDF viewer: fit page, then page by page), PubMed Central article pages through WebFetch
  (no bot check this time; long pages come in 100,000-character parts), PLOS, cell.com and sciencedirect
  open-archive HTML.
- Not readable: ResearchGate and Sage (security checks — not passed, by rule); three repository hosts timed out
  in the cloud browser (diva-portal.org, cyberleninka.org, udspace.udel.edu); WebFetch refused every new host
  after one permission prompt went unanswered (so PDFs on new hosts had to be read as images); doi.org links are
  not followed by WebFetch. WebSearch was not used (0 of the 15 shared calls).
- Page-image reading costs one screenshot per page: jump to the results pages instead of reading from page 1.

## Table of all attempts
| # | Paper | Source that was read | Read level | Verdict for Earshot |
|---|---|---|---|---|
| 1 | Kuai et al. 2005 | author faculty page PDF (text extraction) | full text | confirm stage, correct detail: fixed cycle, not a pre-cue |
| 2 | Zhang et al. 2008 | PLOS Biology HTML | abstract, intro, all results | correct: runs ≥ 5, steady pace or a named label, no random mix right after new learning |
| 3 | Smits et al. 2013 | publisher minimal page | abstract only (ResearchGate blocked) | confirm 0.7 dB, one practice list |
| 4 | Clopper et al. 2006 | PubMed Central manuscript | full text | confirm, sharper: many AND real-confusion foils |
| 5 | Agus et al. 2010 | cell.com HTML | full text | confirm with numbers: noise learned in ~4–10 exposures, lasts weeks |
| 6 | Herzog et al. 2012 | sciencedirect HTML | full text | keep, relabel: equal-difficulty rule is a model inference |
| 7 | Yund & Woods 2010 | Scholar record | abstract only (ResearchGate blocked) | confirm and tighten: 2.7 dB item learning; two practice lists |
| 8 | Zhang, Cheng & Zhang 2021 | author lab PDF (page images) | abstract + moderator results | correct: block talkers first; benefit is in generalisation/retention |
| 9 | Johnsrude et al. 2013 | Scholar record | abstract only (Sage check; repositories timed out) | no change |
| 10 | Holmes et al. 2018 | UCL repository manuscript (page images) | methods + results | confirm size (10–17 points), no recognition needed |
| 11 | Silverman & Barasch 2023 | Scholar record | abstract only (repository timed out) | confirm: no chains; cumulative counts |
| 12 | Bai, Hew & Huang 2020 | Scholar record | abstract only (no open copy) | confirm |
| 13 | Sweetow & Sabes 2010 | Scholar record | abstract only (no open copy) | confirm: < 30 % compliance |
| 14 | Gollwitzer & Sheeran 2006 | author repository PDF (page images) | abstract + main results tables | confirm; quote d ≈ 0.6 for health/personal goals |
| 15 | Hickson et al. 2007 | Scholar record | abstract only (open copy found, not opened) | confirm with limit: self-report outcomes only |
| 16 | Bieber & Gordon-Salant 2021 | PubMed Central | full text (two parts) | confirm |
| 16 | Oberfeld 2016; Reynard 2022 | — | not reached | — |
| 16 | Green 2019; Long & Aleven 2017; Galak 2009; Koivisto & Hamari 2019 | — | not attempted | — |

Finished 2026-11-28 18:03 UTC.
