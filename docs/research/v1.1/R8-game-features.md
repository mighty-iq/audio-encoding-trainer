# R8 — Game features that keep people training without harming learning (Earshot 1.1)

Scope: levels, ranks and tracking; variety and novelty as motivation; adherence; serverless social
features; self-determination theory. Builds on docs/research/R5-progression-game-design.md (R5),
which already covers Katz 2014, Lumsden 2016, Mekler 2017, Sailer & Homner 2020, Deci et al. 1999,
Ryan et al. 2006, Silverman & Barasch 2023, Milkman et al. 2021, Pelánek 2016 and the Math Garden
papers. Those are cited here as "R5 §x" and not repeated.
Started 2026-11-28 16:38 UTC. Reading depth on every source: [full text], [abstract only],
[secondary report: where], or [general knowledge, not verified this session].
Budget: at most 12 web searches (shared); fetches only of URLs returned by those searches.

## Status (resumable)
- Complete 2026-11-28 16:55 UTC: 12 of 12 searches used; §1–§10 and references written.
- App and trainer names appear in these notes for traceability only; never in the app (owner's rule).

## Summary
1. Gamification helps learning on average (g ≈ 0.5–0.8 across three meta-analyses), but the
   motivation gains are fragile; points-only layers do about half as well as layers with
   challenge and progression (Li 2023).
2. Novelty of a game layer lasts about 2–6 weeks, then partly recovers by weeks 6–10 (Rodrigues
   2022): schedule refreshes for weeks 3–4 and 7–8, not week 1.
3. Global leaderboards discourage the bottom and make the top complacent; near-neighbour or
   self-referenced comparison keeps the bottom practising (Bai 2021; Bai & Hew 2025; Na & Han 2023).
4. Progress bars are the most wanted element (Marquardt 2025); performance graphs and badges raise
   felt competence (Sailer 2017); showing learners their skill estimates helps weaker learners
   (Long & Aleven 2013, 2017). A level made of confirmed ability marks keeps the pull without grind.
5. A moderately better partner raises persistence (Köhler effect, inverted U; Feltz 2012, 2014,
   2016) — the basis for ghost races against one's own or a friend's run.
6. Recalling past variety reverses satiation (Galak 2009) — a cheap variety recap.
7. Dropout is steepest early (43% pooled attrition, little extra with longer programmes;
   Meyerowitz-Katz 2020); check-ins and self-monitoring lower it (Chisolm 2013; Torous 2020).
8. No peer-reviewed study of streak anxiety was found; the no-streak rule rests on broken-chain
   effects (Silverman & Barasch 2023) and harmless missed days (Lally 2010).

## 1. Gamification meta-analyses and studies, 2015–2026: what helps, what harms, what wears off

### 1.1 Meta-analyses
- Sailer & Homner 2020 (R5 §5.1): cognitive g = 0.49, robust in rigorous studies; motivational
  (0.36) and behavioural (0.25) effects not robust in rigorous subsets; competition alone n.s.,
  competition + collaboration better; game fiction helped behavioural outcomes only.
- Bai, Hew & Huang 2020, "Does gamification improve student learning outcome? Evidence from a
  meta-analysis and synthesis of qualitative data in educational contexts", Educational Research
  Review 30 (the summary page lists 33; unchecked), doi:10.1016/j.edurev.2020.100322
  [secondary report: University of Zurich game-based-learning reference page summarising the
  abstract]. 24 studies / 30 interventions / 3,202 participants: g = 0.504 [0.284, 0.723], no
  publication bias detected. Moderators: element type and number of elements n.s.; duration
  significant, largest at 1–3 months; samples of 50–100 larger. Qualitative synthesis of 32
  studies: liked because it gives performance feedback, recognition and goal setting; disliked
  because it adds no real use for some learners and can cause anxiety or jealousy (leaderboards are the usual
  source in that literature; the summary does not break this down).
- Li, Ma & Shi 2023, "Examining the effectiveness of gamification as a tool promoting teaching
  and learning in educational settings: a meta-analysis", Frontiers in Psychology 14:1253549,
  doi:10.3389/fpsyg.2023.1253549 [full text, journal page, first ~57% read; open access].
  41 studies / 49 samples / > 5,071 participants: g = 0.822 [0.567, 1.078], very high
  heterogeneity (Q = 812, df = 48). Moderators: elementary 1.29 and secondary 0.87 vs higher
  education 0.01; designs with mechanics + dynamics + aesthetics 1.29 > mechanics + dynamics 1.00
  > mechanics only ("pointification") 0.53; the one dynamics + aesthetics design without clear
  goals and feedback was negative (−3.16, k = 1). Duration: < 1 week 1.87, 1 week–1 month 0.62,
  1–3 months 0.52, 3 months–semester 0.48, > 1 semester 3.30 (k = 5) — the drop from the first
  week to the month-scale studies is the pattern expected from novelty, though the authors do
  not test that. Reader's caveats: several table/text inconsistencies, one implausible cell
  (g = 35 from one sample); treat the moderator numbers as direction only. Individual elements
  were not analysed.
- Reading across the three: gamification helps learning on average (g ≈ 0.5), but the
  motivation/behaviour gains are fragile, the effect of a points-only layer is about half that of
  a layer with dynamics (challenge, progression, goals) and aesthetics (look, feel, story), and
  the biggest effects come from the first week or from long programmes where the layer is woven
  into the content.

### 1.2 Leaderboards and rank positions
- Bai, Hew, Sailer & Jia 2021, "From top to bottom: how positions on different types of
  leaderboard may affect fully online student learning performance, intrinsic motivation, and
  course engagement", Computers & Education (volume unchecked; journal inferred from the Elsevier
  identifier in the PDF) [full text, University of Augsburg repository PDF]. Two small
  quasi-experiments (n = 24 and n = 26 postgraduates, 10 weeks online). Absolute leaderboard (all
  positions public): at the end, the top third had higher intrinsic motivation than the bottom
  third (IMI 5.71 vs 4.70, p = .028), with no difference in grades. Relative leaderboard (each
  student saw only five neighbours above and below): no motivation gap between thirds, but a
  large grade gap (91 vs 69). Bottom-ranked students on the absolute board wanted anonymity (to avoid losing
  face); on the relative board they reported less peer pressure and more focus on their own past
  performance. Authors' advice: show only the top five on absolute boards, reset points every two
  weeks, switch to a relative board halfway. Very small samples, different courses.
- Na & Han 2023, "How leaderboard positions shape our motivation: the impact of competence
  satisfaction and competence frustration on motivation in a gamified crowdsourcing task",
  Internet Research 33(7):1–18, doi:10.1108/INTR-12-2021-0897 [full text, publisher page, first
  ~79%]. 111 undergraduates, one session, five rounds, private board of 10 fictitious players;
  ranked 1st–2nd vs 9th–10th (gap 8–12 points). Low rank: more tags over rounds (effort rose,
  dropping after round 4); high rank: complacency (less tagging time by round 5). High rank raised
  felt competence (p < .001) but not enjoyment or task value; no evidence of intrinsic motivation
  in either group. Advice: relative boards with adjacent players, frequent refresh, adapt boards
  to performance.
- Bai & Hew 2025, "How different gamified leaderboards affect individual students' learning
  engagement, strategies, performance, and perceptions in online classes", Educational Technology
  & Society 28(4):42–61, doi:10.30191/ETS.202510_28(4).RP03 [full text, University of Hong Kong
  repository PDF]. Same 10-week online course, consecutive semesters: absolute board (n = 24, all
  names and ranks) vs relative board (n = 23, two neighbours above and two below), points for
  completion and performance. Bottom third with the relative board did more non-graded practice
  (means 15 vs 8 tasks, p < .001) and more reflection; about half felt happy about their progress,
  whereas 3 of 8 bottom-third students on the absolute board felt upset or incompetent. Post-test
  advantages for the relative cohort in the top and middle thirds (d ≈ 2) are too large to trust
  given cohort differences (power 0.4). Authors: prefer relative boards; limit public ranks,
  especially for the bottom.
- Gao, Rogers & Li 2024, "Understanding students' perceived need satisfaction, enjoyment, and
  participation intention in a leaderboard-based math practice game", E-Learning and Digital
  Media (online first), doi:10.1177/20427530241251407 [full text, NSF public-access copy].
  47 undergraduates, one session with a live projected board under pseudonyms: actual competence
  (number correct) did not predict enjoyment or intention to play again; perceived autonomy did
  (β = .73 and .85), and perceived competence dropped out once autonomy was in the model.
  Relatedness was below the scale midpoint (individual boards do not create belonging). They cite
  older classroom reports that weaker students gave up once rankings stabilised over weeks.
- With R5 (Hanus & Fox 2015 harm; Mekler 2017 quantity not quality; Sailer & Homner 2020
  competition alone n.s.): a global rank helps no one's learning reliably, demotivates the
  bottom in public, and makes the top complacent. The pull of a rank can be kept by comparing
  a player with near neighbours or with their own past self.

### 1.3 Streaks, loss framing and absence
- Silverman & Barasch 2023, J Consumer Research 49(6):1095–1117, doi:10.1093/jcr/ucac029 (R5
  §6.1) [secondary report: INSEAD Knowledge article by the authors, 22 Jun 2022, read in full].
  Adds to R5: seven experiments, > 4,000 participants (one with field data from a university
  fitness programme); a streak = ≥ 3 consecutive repetitions; 66.2% vs 57.9% continued after an
  intact vs a broken log of identical behaviour; highlighting a broken streak lowered persistence
  below not highlighting it at all; almost half would do something unpleasant (watch an ad) to
  keep or repair a streak. Authors' own advice: never highlight or notify a broken streak; count
  weekly or several activities rather than daily; share the blame for a break; allow repair.
  Earshot's rule goes further (no chain at all), which this evidence supports: the harm comes from
  the broken-chain display itself, and the pull of an intact chain can be got from logs that
  cannot break (cumulative counts, collections, ability marks).
- Idrus & Zheng 2026, master's thesis (international marketing; a Swedish university repository)
  "What drives language learners' to keep using Duolingo?" [full text, first ~45%; the
  streak sections were beyond the part read]. Survey of 186 users, PLS-SEM: the streak predicted
  intention to continue, but unlike habit it was not driven by perceived learning value — the
  authors read streak keeping and learning as different kinds of repeated use. Student work;
  weak evidence; consistent with the concern that a streak keeps people opening an app without
  keeping them learning.
- No peer-reviewed study that measures streak-related anxiety directly was found in this pass
  either (one targeted search returned only commentary and press pieces; see §10). The design
  case rests on Silverman & Barasch (broken chains demotivate), Lally et al. 2010 (a missed day
  does not harm habit formation; R5 §6.1) and Deci et al. 1999 (rewards not everyone can keep
  earning undermine motivation, d = −0.88; R5 §5.2).

## 2. Levels, ranks and ratings that track real ability

### 2.1 Effort levels (XP) vs ability levels: what the evidence allows
- Effort-based points and levels raise the quantity of activity but not its quality or intrinsic
  motivation (Mekler et al. 2017, levels d ≈ 0.35–0.39 beyond points; R5 §5.1). A levels/lives
  display that is visible during an adaptive task cut training gains (Katz et al. 2014: slope
  0.29–0.35 without vs 0.10 with; R5 §5.1). Points-only layers have about half the effect of
  layers with challenge and progression (Li, Ma & Shi 2023, 0.53 vs 1.0–1.3; §1.1).
- Players prefer a progress bar over every other element (Marquardt et al. 2025; §6.1), and
  performance graphs plus badges raised felt competence (Sailer et al. 2017; §6.1).
- So the pull of a level is the visible approach to a next mark; the harm comes from what the
  level measures (time spent, which invites grinding and easy trials) and from showing it during
  trials. A level that is a function of measured ability keeps the pull and removes the grind,
  because the only way up is to hear better.

### 2.2 Showing learners their own skill estimate (open learner models)
- Long & Aleven 2017, "Enhancing learning outcomes through self-regulated learning support with
  an Open Learner Model", User Modeling and User-Adapted Interaction 27:55–88,
  doi:10.1007/s11257-016-9186-6 [abstract and parts of the text, publisher page; no statistics in
  the part read]. 302 students (grades 7–8), equation tutor, two classroom experiments, OLM
  (skill estimates shown, with self-assessment support) × shared control over problem selection.
  Experiment 1: the OLM improved learning; experiment 2: the OLM improved learning only when
  students also shared control over problem choice.
- Long & Aleven 2013, "Skill diaries: improve student learning in an intelligent tutoring system
  with periodic self-assessment", AIED 2013, pp. 249–258 [full text, author PDF]. 95 analysed
  high-school students, 3 class periods; both groups saw skill bars; prompting students to copy
  their skill bars and rate their confidence gave lower-performing students better post-test
  reproduction scores (p = .038, η² = .094) and fewer hint requests; no transfer effect; no
  effect for stronger students. Authors' reading: the prompts punctured weaker students' false sense of mastery.
- Reading for Earshot: per-skill ability meters (one per venue family / dimension) are an open
  learner model; showing them plus an occasional "how sure are you?" check is supported for
  learning, especially for weaker players, and pairs well with real choice of what to train.

### 2.3 Rating systems (general knowledge unless marked; see R5 §1.4 for the Elo evidence)
- Elo with an uncertainty-based K (Pelánek 2016, R5 §1.4) rates both learner and item; ~10
  answers give r ≈ 0.8 with true skill. [full text, R5]
- Glicko / Glicko-2 add a rating deviation that grows with time away and shrinks with play
  (Glickman 1999, Applied Statistics 48) [general knowledge, not verified this session]. Online
  chess puzzle trainers rate players and puzzles this way and mark new or long-idle ratings as
  provisional [general knowledge, not verified]. For Earshot this is a clean model of "we are
  less sure after a break" that changes the display of uncertainty, not the ability number, so a
  break never costs a level.
- Competitive games: rank decay for inactivity, seasonal soft resets, placement matches and
  visible point losses after defeats [general knowledge, not verified]. Decay and resets punish
  absence and add loss aversion — both conflict with the owner's rule. What survives: seasons as
  a chapter (a season card of what you did), never as a reset of ability.
- Goal-gradient (effort speeds up near a reward; Kivetz, Urminsky & Zheng 2006) and endowed
  progress (a head start on a progress bar speeds completion; Nunes & Drèze 2006) [general
  knowledge, not verified this session; R5 §6.2 lists Kivetz as unverified]. People steer effort
  toward approaching badge thresholds (Anderson et al., via R5 §5.5 [full text, arXiv]). Design
  consequence: a "next mark" bar pulls effort, which is good only if the mark is ability-based.

## 3. Adherence in auditory and cognitive training

### 3.1 Home auditory training (adds to R5 §5.2–5.4)
- Chisolm, Saunders, Frederick, McArdle, Smith & Wilson 2013, "Learning to listen again: the role
  of compliance in auditory training for adults with hearing loss", Am J Audiology 22(2):339–342,
  doi:10.1044/1059-0889(2013/12-0081) [abstract only, Duke scholars page]. Adds to R5: some tasks
  reached their maximum after ≥ 10 sessions, others needed up to 20; only completers of all 20
  improved on untrained measures; the authors credit the 84% completion to systematic verbal and
  written instructions plus telephone follow-up — i.e. contact, not the software.
- Henshaw, McCormack & Ferguson 2015 (R5 §5.2) [full text]: no drop-outs in 4 weeks with a
  weekly phone call; engagement came from enjoyment, competence and beating previous scores;
  complaints: technical problems (39%), boring/repetitive (16%), feedback that did not match how
  they felt they did (11%); asked for more game, more variety, choice of tasks matching their
  own difficulties, and involving others.
- Sweetow & Sabes 2010, J Am Acad Audiol 21(9):586–593, doi:10.3766/jaaa.21.9.4 — publisher bot
  check again (§10); the routine-use figure (> 30% completing ≥ 10 of 20 sessions) is known only
  through Henshaw et al. 2015.
- Reading: in every home auditory-training study found so far, adherence is high only where a
  person checks in (phone call, clinician). A serverless app cannot call, so the substitute has
  to be built in: a weekly plan the player sets, a visible return-to-plan card that never scolds,
  and the community (Discord) as the "someone who asks how it went".

### 3.2 Dropout curves in app-based programmes
- Meyerowitz-Katz, Ravi, Arnolda, Feng, Maberly & Astell-Burt 2020, "Rates of attrition and
  dropout in app-based interventions for chronic disease: systematic review and meta-analysis",
  J Medical Internet Research 22(9):e20283, doi:10.2196/20283 [full text, journal page]. 17
  studies (9 RCTs, 8 observational): pooled attrition 43% [29, 57]; RCTs 40%, real-world 49%
  (n.s.); length (≤ 2 vs > 2 months) made little difference — i.e. most loss happens early;
  younger participants dropped out less; tailored messages and access to a professional were
  linked to more engagement. In the largest cohort (~190,000 users) about 2% kept up continuous
  use; up to 80% of users in cited work logged in fewer than twice.
- Torous, Lipschitz, Ng & Firth 2020 (authors not on the page read; unchecked), "Dropout rates in
  clinical trials of smartphone apps for depressive symptoms: a systematic review and
  meta-analysis", J Affective Disorders 263:413–419, doi:10.1016/j.jad.2019.11.167 [abstract
  only, PubMed]. 18 RCTs, 3,336 participants: pooled dropout 26.2%, 47.8% after adjusting for
  publication bias; higher in larger studies; lower where the app offered human feedback or
  in-app mood monitoring (self-tracking). Placebo apps retained as well as real ones.
- Turunen et al. 2019 (R5 §5.4): 63% did ≥ 1 of 144 sessions, 20% ≥ half, 12% all.
- Lelo de Larrea-Mancera et al. 2022 (R5 §5.3): 44% attrition in a remote auditory game.
- Baumel et al. 2019 (JMIR; mental-health app usage panel; median 15-day retention ≈ 4% and
  30-day ≈ 3%) [general knowledge, not verified this session — the review citing it was behind
  a browser check].
- Shape for design: the steepest loss is in the first sessions and the first fortnight; a
  long programme barely adds loss after that. So the first three sessions (felt progress,
  no failure spiral) and the week-2 to week-6 novelty dip (§5.1) are where design effort pays.

## 4. Serverless social features

### 4.1 Partners that are a bit better than you (the Köhler effect) — basis for "ghost" play
- Feltz, Irwin & Kerr 2012, "Two-player partnered exergame for obesity prevention: using
  discrepancy in players' abilities as a strategy to motivate physical activity", J Diabetes
  Science and Technology 6(4):820–827, doi:10.1177/193229681200600413 [abstract only, PubMed].
  135 undergraduates; a same-sex virtual partner always slightly, moderately or much better,
  conjunctive task (the team's score is the weaker member's): persistence rose in every partner
  condition vs alone (+33.6 s vs −49.0 s, p < .001); moderate gap best (+51.4 s vs +22.5 low,
  +26.9 high; inverted U, quadratic p = .025). Higher heart rate, same felt exertion.
- Feltz, Forlenza, Winn & Kerr 2014, "Cyber buddy is better than no buddy: a test of the Köhler
  motivation effect in exergames", Games for Health Journal 3(2):98–105,
  doi:10.1089/g4h.2013.0088 [full text or detailed record, University of Kent repository; read
  as reported by the fetch tool]. 120 undergraduates, plank holds, partner ~40% better: alone
  −47.0 s from block 1 to block 2 (fatigue/boredom); human-like partner +33.1 s; software partners
  −9.8 s and −18.4 s (better than alone, < half the human-like gain). No effect on enjoyment or
  intention; partnered players reported lower self-efficacy (the always-better partner).
  Advice: moderate gap (~40%), conjunctive rules, a short introduction that makes the partner
  feel human.
- "Enhancing aerobic exercise with a novel virtual exercise buddy based on the Köhler effect",
  Games for Health Journal 2016 (online 3 Jun 2016), doi:10.1089/g4h.2016.0018 (authors not on
  the page read; Feltz group, unchecked) [abstract only, publisher page]. 82 adults (42 students,
  40 community adults), 12 lab sessions of exergame cycling: alone vs a software partner always
  better vs a better partner who visibly tires over time. Men with the tiring partner kept
  cycling longer than men alone (+12 min 32 s, SE 4 min 54 s); women showed no change and no
  condition differences. The only multi-session test found: the partner effect did not wear off
  for one group over 12 sessions, and a beatable partner did best.
- No study of racing one's own past "ghost" was found in this pass. Inference for Earshot: a
  ghost made from the player's own best recent run, set a little ahead (the moderate-gap rule),
  should give the Köhler pull without the self-efficacy cost of an always-better stranger,
  because the gap is closable by definition and the "partner" is the player. A ghost made from
  another Discord member's shared run (a code in the share text) adds the human element that
  carried most of the effect. Untested; tag as a bet.

### 4.2 Seeded daily puzzles and share grids (commentary only; no research found)
- Kyburz (game developer, Australian National University School of Computing), quoted in ANU
  Reporter, early 2022, "Why is the world so rapt by Wordle?" [secondary report, read in full]:
  scarcity (one puzzle a day), everyone gets the same puzzle so solo play feels shared, the
  spoiler-free emoji grid (added Dec 2021) that shows the path not the answer, a blend of luck
  and skill, comparing with friends ("in 3" as a badge of honour), free and asks
  nothing of the player. 2.7 million players by 10 Jan 2022 (creator's figure).
- Baldwin (social psychologist), quoted in University of Florida News, 14 Jan 2022, "Why we
  Wordle" [secondary report, read in full]: one a day keeps it from becoming over-familiar;
  shared-reality theory (validation from others' matching experience); a flow-level difficulty
  that asks for only a little attention; the solve as a burst of fluency; sharing signals group
  membership.
- R5 §7 general-knowledge notes stand: the same build and a date seed are needed for identical
  content; put the build/content version in the share text.
- Reading: none of this is evidence about learning. The plausible active parts for Earshot are
  (a) one shared, identical, short set per period, (b) a share artefact that shows how it went
  without spoiling it, (c) comparison with friends in a channel rather than a global rank. Earshot
  1.0 already has a weekly seeded set; a shorter daily one is possible but must not become a
  chain (no "day N in a row" anywhere; missing a day costs nothing because each day's set stays
  playable for the week or the share card shows only that set).

## 5. Variety, novelty decay and content cadence

### 5.1 How fast a game layer's novelty wears off
- Rodrigues, Pereira, Toda et al. 2022, "Gamification suffers from the novelty effect but benefits
  from the familiarization effect: findings from a longitudinal study", Int J Educational
  Technology in Higher Education 19:13, doi:10.1186/s41239-021-00314-6 [full text, journal page,
  open access]. Quasi-experiment, 756 undergraduates in 14 programming courses (control 2016,
  n = 138; gamified 2017–18, n = 659), 14 weeks, seven two-week time points. Gamified layer:
  fantasy narrative and avatar, badges unlocking weapons, card draws for correct solutions, a
  top-three leaderboard with a special reward, and a class-wide collaborative goal (enough of the
  class reaching the end of a map defeats a monster). Outcomes are behaviour only (attempts, IDE
  minutes, logins), not motivation.
  - Overall: attempts +17.5% (g = 0.14), IDE minutes +48.6% (g = 0.34), logins +220% (g = 0.95).
  - Shape: the effect held or grew for ~4 weeks, then declined (novelty lasted two to six weeks),
    fell to negligible for attempts (weeks ~4–10), then partly recovered between weeks 6 and 10
    ("familiarization") without reaching the first-weeks level.
  - Authors' heuristics: ~4 weeks of use before the novelty decline; studies under 12 weeks are
    too short to judge a game layer; tailoring or changing the layer when the decline starts is
    proposed (untested).
  - Limits: assignment by year (instructor changes), exploratory visual analysis of the U shape.
- Li, Ma & Shi 2023 (§1.1): first-week studies g = 1.87 vs month-scale studies ≈ 0.5–0.6.
- Implication for Earshot: a player who started at the 1.0 release reaches the expected dip
  around weeks 4–6; new content and a changed goal structure should be scheduled for then,
  not front-loaded in week 1.

### 5.2 Satiation is partly in the head: variety that is noticed counts
- Galak, Redden & Kruger 2009, "Variety amnesia: recalling past variety can accelerate recovery
  from satiation", J Consumer Research 36(4):575–584, doi:10.1086/600066 [abstract only, RePEc
  page; plus secondary report: ScienceDaily press release from the University of Minnesota, May
  2009]. Pilot + two experiments over three stimulus classes: people recovered from satiation by
  recalling the variety of other items they had had since; they did not recall it on their own
  ("variety amnesia"). Press-release example: after hearing a favourite chorus 20 times,
  participants who three weeks later listed other musicians they had heard recovered nearly
  all of their liking; those who listed TV shows stayed satiated. No numbers in either source.
- Redden 2008, "Reducing satiation: the role of categorization level", J Consumer Research 34
  (details unchecked) [title confirmed by a search result; abstract page behind a bot check;
  gist from general knowledge, not verified this session: thinking of repeated experiences in
  finer sub-categories slowed satiation].
- Inference for Earshot: repeated training on the same listening problem is unavoidable; the
  satiation it causes can be cut by (a) naming the sub-kinds the player is moving through
  (venue × talker × distance × noise type, not "speech in noise again"), and (b) a recap that
  reminds the player how varied the last stretch was (new voices met, rooms visited, noise types
  survived) before a familiar block starts. Cheap, no harm to learning, no reward schedule.

### 5.3 How much new content, how often (no direct study found)
- No study measuring how much new content per week keeps learners returning was found in this
  pass. What the evidence above allows:
  - Novelty of a fixed game layer lasts about 2–6 weeks (Rodrigues 2022), so a 12-week programme
    needs at least two refreshes of what is new, around weeks 3–4 and 7–8.
  - Reminder templates lose effect when repeated (Yancey & Settles 2020, R5 §6.3; modelled
    half-life 15 days) — a hint that a single "new thing" format also wears out over ~2 weeks.
  - Unexpected rewards do not undermine motivation (Deci et al. 1999, d = 0.01; R5 §5.2), so
    surprise unlocks are safe as long as they are not a variable-ratio prize the player chases.
  - Variability slows early learning and aids generalisation (Raviv 2022, R5 §3.3), so new
    content should widen variety after a base is built, not in the first sessions.
  - Henshaw 2015 (R5 §5.2): "boring/repetitive" was the third complaint (16%) in a 4-week home
    programme, and players asked for more variety.
- Proposed cadence for Earshot (design, not evidence): something new every week that is earned
  by ability or simply released by the calendar (a voice, a venue variant, a weekly set), one
  larger change around weeks 3–4 (a new challenge type or a new goal structure, e.g. mastery
  marks begin), and another around weeks 7–8 (e.g. the first season recap).

## 6. Self-determination theory applied

### 6.1 Which elements feed which need
- Sailer, Hense, Mayr & Mandl 2017, "How gamification motivates: an experimental study of the
  effects of specific game design elements on psychological need satisfaction", Computers in
  Human Behavior 69:371–380, doi:10.1016/j.chb.2016.12.033 [full text, University of Augsburg
  repository PDF, CC BY]. Online order-picking game, N = 331 after a check that players had noticed
  the elements (88 of 419 had not). Points in all conditions; condition 1 added badges, a
  leaderboard and performance graphs; condition 2 added avatars, a short story and
  computer-controlled teammates.
  - Competence: condition 1 > points only (4.19 vs 3.76; ηp² = .020).
  - Task meaningfulness: condition 1 > points only (4.06 vs 3.65); the story bundle did not raise it.
  - Social relatedness: condition 2 > both (ηp² = .032), from a very low base (1.5–1.8 of 7).
  - Decision freedom: no element moved it (choices without consequences do not feel free).
  - Lessons the authors draw: specific elements have specific effects; one in five players did
    not notice the elements, so each needs a short introduction; autonomy needs choices with
    real consequences.
- Ryan, Rigby & Przybylski 2006 (R5 §5.2): competence and autonomy each predicted enjoyment
  and wanting to play again; relatedness added a smaller share.
- Marquardt, Schulz, Koziolek & Happe 2025, "Gamification with purpose: what learners prefer to
  motivate their learning", arXiv:2512.08551 [full text, preprint]. 125 people (median age 23),
  best–worst scaling over phone mock-ups of 10 elements: progress bar first (standardised score
  0.42; in 70% of chosen bundles), then achievements 0.24, feedback 0.21, concept map 0.16, points
  0.10, badges 0.01, leaderboards −0.14, story −0.15, virtual currency −0.37, avatar −0.49.
  Open answers: visible progress, feedback that helps learning, goals, structure; leaderboards were
  the "showcase" element, and one respondent noted they motivate or demotivate depending on how
  competitive a person is and asked for them to be switchable. Stated preferences only, small
  convenience sample.
- Gao, Rogers & Li 2024 (§1.2): with a live leaderboard, felt autonomy, not actual or felt
  competence, predicted enjoyment and wanting to play again.
- Mapping for Earshot (inference):
  - Competence: real-unit growth (dB, metres), performance graphs, informational feedback that
    matches felt performance (Henshaw 2015), mastery marks per skill, a bit-better ghost.
  - Autonomy: meaningful choices with consequences — which venue to work on this week, which
    progression mode, which plan; never a "harder/easier?" pop-up (R5 §1.4, Papoušek & Pelánek
    2017: the dialog itself cut engagement).
  - Relatedness: the cast (voices met), the shared weekly set, Discord; computer teammates and
    story raised relatedness only weakly in Sailer 2017, so the real lever is the community.

## 7. What current hearing- and brain-training apps do (for the plan only; no names in the app)

### 7.1 Hearing-training apps
- Hamilton-Basich 2026, "Auditory training: there's an app for that", The Hearing Review,
  18 Mar 2026 [secondary report: trade-magazine commentary with two clinicians' quotes; no data].
  - An AI-adaptive successor of a long-running home training programme (LACE AI Pro): plans that adjust
    difficulty in real time, a clinician portal, training on cloned voices of family members.
  - A cochlear-implant maker's rehabilitation app (MED-EL ReDi): AI-tailored exercises from activation day,
    clinician-assigned activities, remote monitoring.
  - Another implant maker's app (AB ListenFit): goal setting, progress over time, instant feedback on a series of
    everyday-listening tests.
  - Expert advice quoted: short consistent practice, 10–20 min a day; adherence called the single
    biggest obstacle (exercises feel generic, no clinician feedback, accessibility for older
    adults) — no numbers.
- A hearing-game app's store listing (Hearoes; read in full, Nov 2026) [secondary report: developer's own
  listing and user reviews]: five modules (environmental sounds to sentences in noise), 30–90
  activities (the listing disagrees with itself), four-stage difficulty with noise levels raised
  in stages 3–4, a composite "performance index", a daily-training section, subscription. User
  reviews: faster answers earn more points; progress charts unclear; a scoring change made
  progress harder to follow. No evidence cited.
- Huang, Stawarz, Zhao, Yang, Xie, Song & Liu 2025, "Applying cross-modal plasticity principles in
  auditory training applications", Int J Human-Computer Studies 203:103570,
  doi:10.1016/j.ijhcs.2025.103570 [full text, Cardiff University repository PDF, first ~57%].
  - Survey (79 valid; 63% with some hearing loss): of 12 who had used a training app, 6 named
    monotony as the main dissatisfaction, 7 put scientifically effective methods first, and only
    3 were willing to keep using apps. Wanted: quick positive feedback, negative feedback held
    until after the session, and a record of training they can look back on (older users most).
  - Their prototype's game layer: story with a rescuer role, cartoon guide, badges, points,
    medals, equipment, titles; 15-item sets, 30 s per answer, three wrong answers = failure; a
    seedling-to-tree map; timed real-world challenges, friend duels, groups and daily-to-yearly
    leaderboards (social parts untested). Testers: training results should be shown more
    prominently than the game elements; the story may put off people who dislike narrative.
- Review of auditory training mobile apps for adults with hearing loss, Perspectives of the ASHA
  Special Interest Groups 3(7):12–23, 2018, doi:10.1044/persp3.SIG7.12 [abstract only]: 239 apps
  found, 5 reviewed in depth; per-app tables not seen.
- R5 §8: a long-running commercial home programme (5 tasks, 20 sessions), a research endless
  runner (energy gained and lost, unlocks), a research audiomotor game.

### 7.2 Brain-training and skill apps [general knowledge, not verified this session]
- Per-game levels or stars on adaptive difficulty; a composite performance index or a percentile
  against an age group; a short fixed daily workout; daily streaks with freezes; weekly leagues
  with promotion and demotion (language apps); XP for activity; chess-puzzle trainers that rate
  both player and puzzle with Glicko-type ratings and mark provisional ratings.
- Where Earshot 1.0 already goes further: growth in real units; openings that are never undone;
  no streaks, lives or leaderboards; a seeded weekly set. Where the field offers things 1.0 lacks:
  an overall level, a per-skill display, comparison with others, a steady flow of new content.
  Earshot cannot show percentiles or age norms (not normed; owner's wording rule).

## 8. Ranked mechanics for Earshot 1.1

Ranked by evidence × fit to the owner's request (levels and tracking) × harm avoided × cost. "Need"
= the self-determination need served (§6). Every display below stays off the screen while a
timed stimulus plays (Katz 2014; Lumsden 2016; sound effects slowed responses, Miranda & Palmer
2014 via Lumsden — R5 §5.1).

1. **Earshot level: an overall level made only of confirmed ability marks.**
   - What: the level = the number of real-unit marks the player has confirmed across the venue
     families (dB in crowds, metres and echo, unusual talkers, memory load); a mark counts when
     the estimate passes it in sessions on two different days (the 1.0 overnight check can do
     the confirming); shown with a bar to the next level and what to hear to get there. Never
     lost: a break or a bad day changes only an uncertainty band (Glicko-style), never the level.
   - Need: competence; clear goal; visible growth; the owner's "levels".
   - Harm avoided: XP grinding and inflated levels (only better hearing moves it; Mekler 2017:
     effort levels buy quantity, not quality); lucky jumps (staircase estimates are noisy, R5 §1.1;
     two-day confirmation); loss aversion and absence penalties (no decay, no resets).
   - Evidence: progress bar is the most wanted element (Marquardt 2025, 0.42, first of 10);
     performance graphs and badges raised competence (Sailer 2017); mechanics + dynamics beat
     points-only (Li 2023, ~1.0 vs 0.53); open learner models improved learning (Long & Aleven 2017).
2. **Skill meters with tiers, a "next mark" bar per family, and personal-gain marks.**
   - What: one meter per family (the open learner model), tiers named in real units, plus marks
     relative to the player's own baseline (e.g. "3 dB better than your first week"), so players
     with hearing loss earn marks as often as anyone; after some sets, one tap "how sure were you?"
     compared with the measured result; each move of a meter says why (which condition, which set).
   - Need: competence, autonomy (choose which meter to push this week).
   - Harm avoided: rewards not everyone can earn (Deci 1999: d = −0.88); feedback that mismatches
     felt performance (Henshaw 2015: 11% complaint; Amitay 2010, R5); illusion of mastery.
   - Evidence: confidence prompts beside skill bars helped weaker students learn (Long & Aleven
     2013, η² = .094); OLM gains when combined with learner choice (Long & Aleven 2017).
3. **Seasons as chapters (about 6 weeks), never resets.**
   - What: each season opens with new content and a season goal the player picks (a family to push,
     a venue to open); ends with a season card (dB gained, metres, voices met, venues opened) to
     share with the Chimera link. Ability, level and openings carry over untouched; nothing from a
     season expires — its content stays playable afterwards.
   - Need: novelty, a reason to come back, a win worth sharing; autonomy (own goal).
   - Harm avoided: novelty decay (Rodrigues 2022: decline after ~4 weeks, partial recovery from
     week 6–10); rank decay and resets of competitive games; fear of missing out.
   - Evidence: Rodrigues 2022; Li 2023 (first-week effects largest); refresh advice from
     leaderboard studies (Bai 2021: reset the competitive layer every two weeks; Na & Han 2023).
4. **A weekly drip of something new, plus a variety recap.**
   - What: each calendar week opens one new thing for everyone who plays (a voice to meet, a venue
     variant, a new noise scene; ability-gated items open when reached); before a familiar block,
     a one-line recap of how varied the last stretch was ("5 rooms, 9 voices, 4 kinds of noise
     this week") and sub-kind names on sets.
   - Need: variety; curiosity; competence (sub-kinds show range).
   - Harm avoided: satiation and boredom (Henshaw 2015: 16% boring/repetitive; Huang 2025: 6 of 12
     app users named monotony); too much variety too early (Raviv 2022, R5 §3.3: widen after a base).
   - Evidence: recalling past variety reversed satiation (Galak, Redden & Kruger 2009); unexpected
     rewards do not undermine motivation (Deci 1999, d = 0.01).
5. **Ghost races: your own best run, or a friend's pasted share code, one step ahead.**
   - What: after (never during) a weekly or venue set, the trial-by-trial line of the player's best
     earlier run on the same seeded set, or of a friend's run decoded from the share text (the
     weekly card already carries ✓/✕ per trial); the ghost is set a modest step ahead.
   - Need: competence (a closable gap), relatedness (a friend's run).
   - Harm avoided: global leaderboards (bottom thirds discouraged: Bai 2021, Bai & Hew 2025; top
     complacent: Na & Han 2023); the self-efficacy cost of an always-better stranger (Feltz 2014).
   - Evidence: any partner beat training alone, a moderate gap did best (Feltz 2012, inverted U);
     a beatable partner kept effect over 12 sessions in men (2016 study); relative comparison
     raised practice in the bottom third (Bai & Hew 2025: 15 vs 8 tasks). Own-ghost: untested —
     tag as a new bet.
6. **A weekly plan the player sets, and a welcome-back gift.**
   - What: "this week: 3 sets, focus loud places" (player's choice, editable any time); counts only
     inside the week, any days; no counter of weeks in a row; on return after a planned set was
     missed, a small gift (an early look at the next new voice) and the 1.0 fresh-ears set.
   - Need: autonomy, structure; adherence.
   - Harm avoided: daily chains and their broken-chain display (Silverman & Barasch 2023:
     highlighting a broken record lowered persistence below showing nothing); guilt messages.
   - Evidence: a tiny bonus for returning after a missed plan was the best of 53 gym interventions
     (Milkman 2021, +27%); one missed day does not harm habit formation (Lally 2010); self-tracking
     and human feedback lowered app dropout (Torous 2020); home training adherence was high only
     with check-ins (Chisolm 2013; Henshaw 2015) — the plan plus Discord is the serverless stand-in.
7. **Crew card: a collaborative result from friends' share codes.**
   - What: paste up to a handful of friends' weekly share codes; the app builds one crew card (stops
     cleared together, voices followed, the crew's best stop) with the Chimera link. Additive, not
     ranked inside the crew.
   - Need: relatedness.
   - Harm avoided: individual ranking; isolation that individual boards bring (Gao 2024: relatedness
     below midpoint with an individual board).
   - Evidence: competition plus collaboration beat competition alone (Sailer & Homner 2020:
     behaviour g = 0.70; motivation 0.61 vs −0.09 in rigorous studies); teammates raised
     relatedness (Sailer 2017).
8. **Encore marks for mastered venues (prestige without reset).**
   - What: when a venue's top tier is confirmed, an encore variant opens (new talkers, a harsher
     room, a second noise type) with its own marks; the venue keeps its old marks.
   - Need: competence at the top; novelty.
   - Harm avoided: complacency at the top (Na & Han 2023); reset-style prestige that erases visible
     growth; grinding a mastered venue.
   - Evidence: indirect (Na & Han 2023; Rodrigues 2022); design.
9. **Surprise firsts: unannounced, informational notes for real firsts.**
   - What: notes that are not on any list ("first time you followed a voice through a crowd at
     −8 dB"), stated as information, never as a prize to chase, never random.
   - Need: competence.
   - Harm avoided: overjustification; variable-ratio reward chasing (loot-box style).
   - Evidence: unexpected rewards neutral (d = 0.01), informational positive feedback positive
     (+0.33; +0.66 vs controlling −0.44) (Deci et al. 1999, R5 §5.2).
10. **Community reference curves (later, from opt-in pooled exports).**
   - What: "players who started near your level were here by week 4", as a band, built into a
     release from pooled exports; never a rank; never made from simulated players shown as real.
   - Need: relatedness, competence (benchmark).
   - Harm avoided: absolute ranks; invented norms.
   - Evidence: relative comparisons beat absolute ones for low performers (Bai 2021; Bai & Hew 2025).
     Needs real pooled data first.

Supporting rules (not mechanics): short sets with a clear finish (R5: ~100-trial sessions learned
fastest per trial early; experts quoted in §7.1 suggest 10–20 min a day); first sessions easy
enough to survive, then at the edge (Papoušek 2016, R5 §1.4); break error runs (each extra error
in a row raised quitting odds about 2.25×, Johansson 2024, R5 §1.4); show training results more
prominently than game elements (Huang 2025 testers); introduce each element once, briefly (one
in five players did not notice the elements in Sailer 2017).

## 9. Anti-patterns to avoid
- Daily streaks, streak freezes, "about to break" warnings (owner's rule; Silverman & Barasch 2023).
- Any consecutive-period counter, including weekly chains (a looser chain is still a chain).
- XP or levels for time spent or trials done (Mekler 2017; invites easy-trial grinding).
- Level decay, ability resets at season start, demotion (punish absence; loss aversion).
- Global or public leaderboards (Bai 2021; Bai & Hew 2025; Hanus & Fox 2015, R5); fictitious
  competitors shown as real players.
- Lives, "three wrong = fail", points at stake that are lost on errors (Johansson 2024 error
  quitting; Huang 2025 prototype used three-strikes).
- Score, timers, animation or sound effects during a timed stimulus (Katz 2014; Lumsden 2016).
- Themes that change the stimuli or the task (Lumsden 2016 PeerJ).
- Random prize draws, loot boxes, virtual currency, card packs (Marquardt 2025: currency and
  avatars least wanted; gambling-like mechanics [general knowledge, not verified this session]).
- Time-limited content that disappears (fear of missing out punishes absence).
- "Harder or easier?" pop-ups (Papoušek & Pelánek 2017, R5 §1.4).
- Mandatory badges or badge checklists that gate content (Hanus & Fox 2015, R5).
- Rewards only the best can earn (Deci 1999: d = −0.88) — add personal-gain marks.
- Feedback inflated to look like progress (honesty rule; Shibata 2009 aside, R5 §5.2).
- Percentiles or age norms (not normed; owner's wording rule).

## 10. Could not open
Ranked by how much a 1.1 decision could lean on them; "need" = what to extract.
1. Silverman & Barasch 2023 full text (abstract + authors' summary only). Need: per-study effects,
   the repair moderator, the field data on users who broke streaks.
2. Bai, Hew & Huang 2020 full text (summary page only). Need: per-element moderators (points,
   badges, leaderboards) and the qualitative synthesis on anxiety and jealousy.
3. Long & Aleven 2017 statistics (no numbers in the part read). Need: OLM effect sizes.
4. Games for Health 2016 virtual-buddy study (abstract only) and an MSU dissertation on human vs
   virtual exergame partners (repository access restricted). Need: session-by-session persistence.
5. Sweetow & Sabes 2010, J Am Acad Audiol 21(9):586–593 (publisher bot check). Need: real-world
   completion and drop-out reasons.
6. Review on attrition in digital mental-health tools (PMC9380224; PMC browser check) and
   Baumel et al. 2019 (JMIR; not opened). Need: day-1/15/30 retention curves.
7. Galak et al. 2009 full text (paywalled) and Redden 2008 (bot check). Need: effect sizes and
   designs of the variety-recall and sub-categorisation effects.
8. Torous et al. 2020 full text (abstract only). Need: which engagement features lowered dropout.
9. ASHA Perspectives 2018 app review tables (paywall). Need: per-app progression features.
10. A 2026 article in SAGE Open (doi:10.1177/21582440261421375; site error) — returned by the
    gamification meta-analysis search; content unknown.
11. Not searched (budget of 12 searches spent): Koivisto & Hamari 2019, Int J Information
    Management 45:191–210 (review of gamification research; asked for by the caller — not
    reached); van Roy & Zaman 2018 (need-supporting gamification over time); Tyack & Mekler 2020
    (SDT in games research, CHI); studies of racing one's own past performance; peer-reviewed
    studies of streak anxiety (one search found only commentary); loot boxes and dark patterns in
    games (Zendle & Cairns 2018; Zagal, Björk & Lewis 2013); Glickman 1999; Kivetz et al. 2006;
    Nunes & Drèze 2006.

## 8. Ranked mechanics for Earshot 1.1

## 9. Anti-patterns to avoid

## 10. Could not open

## References
New in R8 (read level in brackets):
- Bai, S., Hew, K. F., & Huang, B. (2020). Does gamification improve student learning outcome?
  Evidence from a meta-analysis and synthesis of qualitative data in educational contexts.
  Educational Research Review (volume 30 or 33: sources differ, unchecked), 100322.
  https://doi.org/10.1016/j.edurev.2020.100322 [secondary report]
- Bai, S., Hew, K. F., Sailer, M., & Jia, C. (2021). From top to bottom: How positions on different
  types of leaderboard may affect fully online student learning performance, intrinsic
  motivation, and course engagement. Computers & Education (inferred; volume unchecked).
  https://opus.bibliothek.uni-augsburg.de/opus4/files/109038/109038.pdf [full text]
- Bai, S., & Hew, K. F. (2025). How different gamified leaderboards affect individual students'
  learning engagement, strategies, performance, and perceptions in online classes. Educational
  Technology & Society, 28(4), 42–61. https://doi.org/10.30191/ETS.202510_28(4).RP03 [full text]
- Baldwin, M., quoted in Clark, A. (2022, 14 Jan). Why we Wordle. University of Florida News.
  https://news.ufl.edu/2022/01/why-we-wordle/ [secondary report]
- Chisolm, T. H., Saunders, G. H., Frederick, M. T., McArdle, R. A., Smith, S. L., & Wilson, R. H.
  (2013). Learning to listen again: the role of compliance in auditory training for adults with
  hearing loss. American Journal of Audiology, 22(2), 339–342.
  https://doi.org/10.1044/1059-0889(2013/12-0081) [abstract only]
- Feltz, D. L., Irwin, B., & Kerr, N. (2012). Two-player partnered exergame for obesity
  prevention: using discrepancy in players' abilities as a strategy to motivate physical
  activity. Journal of Diabetes Science and Technology, 6(4), 820–827.
  https://doi.org/10.1177/193229681200600413 [abstract only]
- Feltz, D. L., Forlenza, S. T., Winn, B., & Kerr, N. L. (2014). Cyber buddy is better than no
  buddy: a test of the Köhler motivation effect in exergames. Games for Health Journal, 3(2),
  98–105. https://doi.org/10.1089/g4h.2013.0088 [full text or detailed record, Kent repository]
- (Authors unchecked; Feltz group) (2016). Enhancing aerobic exercise with a novel virtual
  exercise buddy based on the Köhler effect. Games for Health Journal.
  https://doi.org/10.1089/g4h.2016.0018 [abstract only]
- Galak, J., Redden, J. P., & Kruger, J. (2009). Variety amnesia: recalling past variety can
  accelerate recovery from satiation. Journal of Consumer Research, 36(4), 575–584.
  https://doi.org/10.1086/600066 [abstract only; plus ScienceDaily press release, May 2009]
- Gao, F., Rogers, K. C., & Li, L. (2024). Understanding students' perceived need satisfaction,
  enjoyment, and participation intention in a leaderboard-based math practice game. E-Learning
  and Digital Media. https://doi.org/10.1177/20427530241251407 [full text, NSF public access]
- Hamilton-Basich, M. (2026, 18 Mar). Auditory training: there's an app for that. The Hearing
  Review. https://hearingreview.com/hearing-products/hearing-aids/apps/auditory-training-theres-an-app-for-that
  [secondary report]
- Huang, Q., Stawarz, K., Zhao, L., Yang, S., Xie, W., Song, F., & Liu, H. (2025). Applying
  cross-modal plasticity principles in auditory training applications. International Journal of
  Human-Computer Studies, 203, 103570. https://doi.org/10.1016/j.ijhcs.2025.103570
  [full text, first ~57%]
- Idrus, S. H., & Zheng, H. (2026). What drives language learners' to keep using Duolingo?
  Master's thesis, Lund University. https://lup.lub.lu.se/student-papers/record/9238652
  [full text, first ~45%]
- Kyburz, P., quoted in ANU Reporter (2022). Why is the world so rapt by Wordle?
  https://reporter.anu.edu.au/all-stories/why-is-the-world-so-rapt-by-wordle [secondary report]
- Li, M., Ma, S., & Shi, Y. (2023). Examining the effectiveness of gamification as a tool promoting
  teaching and learning in educational settings: a meta-analysis. Frontiers in Psychology, 14,
  1253549. https://doi.org/10.3389/fpsyg.2023.1253549 [full text, first ~57%]
- Long, Y., & Aleven, V. (2013). Skill diaries: improve student learning in an intelligent
  tutoring system with periodic self-assessment. AIED 2013, LNCS, 249–258.
  https://www.cs.cmu.edu/~ylong/papers/SkillDiaries.pdf [full text]
- Long, Y., & Aleven, V. (2017). Enhancing learning outcomes through self-regulated learning
  support with an Open Learner Model. User Modeling and User-Adapted Interaction, 27, 55–88.
  https://doi.org/10.1007/s11257-016-9186-6 [abstract and parts; no statistics read]
- Marquardt, K., Schulz, M., Koziolek, A., & Happe, L. (2025). Gamification with purpose: what
  learners prefer to motivate their learning. arXiv:2512.08551. https://arxiv.org/pdf/2512.08551
  [full text]
- Meyerowitz-Katz, G., Ravi, S., Arnolda, L., Feng, X., Maberly, G., & Astell-Burt, T. (2020).
  Rates of attrition and dropout in app-based interventions for chronic disease: systematic
  review and meta-analysis. Journal of Medical Internet Research, 22(9), e20283.
  https://doi.org/10.2196/20283 [full text]
- Na, K., & Han, K. (2023). How leaderboard positions shape our motivation: the impact of
  competence satisfaction and competence frustration on motivation in a gamified crowdsourcing
  task. Internet Research, 33(7), 1–18. https://doi.org/10.1108/INTR-12-2021-0897
  [full text, first ~79%]
- Review of auditory training mobile apps for adults with hearing loss (2018; authors not on the
  page read). Perspectives of the ASHA Special Interest Groups, 3(7), 12–23.
  https://doi.org/10.1044/persp3.SIG7.12 [abstract only]
- Rodrigues, L., Pereira, F. D., Toda, A. M., et al. (2022). Gamification suffers from the novelty
  effect but benefits from the familiarization effect: findings from a longitudinal study.
  International Journal of Educational Technology in Higher Education, 19, 13.
  https://doi.org/10.1186/s41239-021-00314-6 [full text]
- Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017). How gamification motivates: an
  experimental study of the effects of specific game design elements on psychological need
  satisfaction. Computers in Human Behavior, 69, 371–380.
  https://doi.org/10.1016/j.chb.2016.12.033 [full text]
- Silverman, J., & Barasch, A. (2023). On or off track: how (broken) streaks affect consumer
  decisions. Journal of Consumer Research, 49(6), 1095–1117. https://doi.org/10.1093/jcr/ucac029
  [secondary report: INSEAD Knowledge, 22 Jun 2022, by the authors]
- Torous, J., Lipschitz, J., Ng, M., & Firth, J. (2020; authors unchecked). Dropout rates in
  clinical trials of smartphone apps for depressive symptoms: a systematic review and
  meta-analysis. Journal of Affective Disorders, 263, 413–419.
  https://doi.org/10.1016/j.jad.2019.11.167 [abstract only]
- Hearoes (Games 4 Hearoes), App Store listing and user reviews (read Nov 2026)
  [secondary report].

Cited from R5 with R5's read levels: Katz et al. 2014; Lumsden et al. 2016 (JMIR Serious Games;
PeerJ); Mekler et al. 2017; Sailer & Homner 2020; Hanus & Fox 2015; Deci, Koestner & Ryan 1999;
Ryan, Rigby & Przybylski 2006; Henshaw, McCormack & Ferguson 2015; Lally et al. 2010; Milkman et
al. 2021; Yancey & Settles 2020; Pelánek 2016; Papoušek, Stanislav & Pelánek 2016; Papoušek &
Pelánek 2015, 2017; Johansson et al. 2024; Kumar et al. 2022; Turunen et al. 2019; Lelo de
Larrea-Mancera et al. 2022; Raviv et al. 2022; Amitay et al. 2010; Shibata et al. 2009; Miranda &
Palmer 2014.

General knowledge, not verified this session: Glickman 1999 (Glicko); Kivetz, Urminsky & Zheng
2006 (goal gradient); Nunes & Drèze 2006 (endowed progress); Redden 2008 (title verified only);
Baumel et al. 2019; Koivisto & Hamari 2019 (not opened); Zendle & Cairns 2018; Zagal, Björk &
Lewis 2013.
