# FINAL-CHECK — independent check of the Earshot 1.0.0 release candidate

Checked 2026-11-27, 01:45–02:10 UTC, on the frozen worktree at commit 89818c3 ("sw.js precache for the release
candidate"). The checker did not build Earshot and edited nothing in the worktree. Brief: docs/dev/briefs/final-check.md.

## Summary

| Severity | Count | Meaning |
|---|---|---|
| S1 | 2 | a text states something false (fix before release) |
| S2 | 6 | misleading or unverifiable |
| S3 | 6 | polish |

S1 list:
- **FC-01** Guide p.12: "A rest: the exercise sits out three sessions". The planner only cuts its draw weight to a fifth;
  a resting exercise still appears in 14–40 % of 15-minute sessions.
- **FC-02** Guide p.11, Settings and Home: "until it has a target, Focus trains like Edge". Without a target, Focus still
  sends ~60 % of edge trials to the dial furthest below its prior and skips the new-exercise intro.

Claims re-derived from code or data: 131 (table at the end). 119 match; 12 lead to findings. FC-12 and FC-14 come from
the announcement and VERIFY.md, which are outside the table. The guide's own sentence "Every number about the app
matches its code (version 1.0.0)" (p.2) holds once FC-01 and FC-02 are fixed.
Links, metadata, fonts, references, the announcement, README and ten-plus VERIFY rows pass (details below).

## Method

- PDF: all 35 pages rendered with pdftoppm and looked at; text from pdftotext; links, named destinations and metadata
  read with pypdf; fonts with pdffonts.
- Code: every claim traced to js/** or data/** by reading the module. Where behaviour depends on many draws, it was
  measured with the real engine and the real data (tests/sim/load.mjs with realData) in scratch scripts outside the
  repository: planner rest share, new-player plans, Variety repeats, Echo question counts, Focus focus-dial shares.
- `node tests/unit/run.mjs lab-sim` (read-only) to trace a VERIFY number.
- One Playwright probe through `tools/with-browser.sh` on file:// earshot.html (screenshots kept outside the repository):
  welcome (first and later launch), footer link, version and playtest flags, Settings mode texts and lengths, the
  Exercises list, and trial layout at 640×360 for Crowd, Far, Strange voices, Repair, Echo and Voices (answer state and
  miss feedback).
- External links could not be fetched: the container's proxy answered 403 for every host except github.com (200).
  Link targets were checked against their visible text instead.

## Findings

### S1

**FC-01 · S1 · Guide p.12, ch.3 §8 item 6 (docs/guide/guide.html:273)**
- Text: "A rest: the exercise sits out three sessions while the plan trains other situations, then comes back."
- Code: js/engine/plateau.js:163 sets `plat.rest = 3`. js/engine/planner.js:36 multiplies the exercise's draw weight by
  0.2 while `rest > 0`, and planner.js:140 counts it down once per planned session. Nothing removes the exercise from
  the plan. In Focus mode, planner.js:39-44 overwrites the focus exercise's weight with 0.6, and its ~60 % share of sets
  (planner.js:126-129) ignores the rest.
- Measured with the real planner (4,000 plans per exercise, all exercises already played): during its first rest
  session a resting exercise still appears in 37 % (Crowd), 40 % (Far), 36 % (Strange voices), 25 % (Repair), 23 % (Echo),
  14 % (Seek) and 15 % (Voices) of 15-minute sessions.
- Suggested wording: "A rest: for the next three sessions the plan picks this exercise far less often (a fifth of its
  usual weight) and trains other situations, then weighs it as before." Alternative: change the code (leave a resting
  exercise out of `cand` in planner.session while `rest > 0`) and keep the text.

**FC-02 · S1 · Focus mode without a target: guide p.11 Table 3 (guide.html:249), js/ui/screens/settings.js:72, js/ui/screens/home.js:36-37**
- Texts: guide "until it has a target, Focus trains like Edge and Home says so"; Settings "Until then Focus trains like
  Edge."; Home "This session trains like Edge."
- Code: with no Lab target the mode stays `focus`. js/engine/controller.js:265-268 with focusPick (controller.js:305-309)
  sends about 60 % of edge trials to the dial with the lowest z (furthest below its prior), and controller.js:130-131
  picks the weakest Strange family 60 % of the time. Edge uses the learning-progress bandit for every edge trial.
  js/engine/planner.js:114 also limits the new-exercise intro (three unplayed exercises per session) to Edge, Path and
  Variety, so Focus skips it.
- Measured (12 Crowd sets each, fresh learner): edge-trial focus shares were tmr 74 %, talkers 14 %, similar 13 % in
  Focus without a target, against 35 %, 43 % and 22 % in Edge. A new player's first 15-minute plan was
  far → crowd → strange → far → crowd in Edge and strange → far → echo → crowd → seek in Focus.
- Suggested fix: run Edge when Focus has no target (in js/ui/session.js, pass mode `edge` to the planner and flows while
  `labInfo().weakest` is null), which makes all three texts true. Or reword them: "Until then Focus plans sessions by
  the usual weights and spends about 60 % of each set's trials on the dial where you sit furthest below our starting
  guess."

### S2

**FC-03 · S2 · App text of the plateau "switch" breaker, js/engine/plateau.js:141**
- Text: "For the next few sessions the plan gives <exercise> a rest and trains other situations for a while, then comes
  back to it."
- Code: the same as FC-01; the exercise keeps coming in 14–40 % of sessions.
- Suggested: fix together with FC-01, for example "For the next three sessions the plan picks <exercise> less often and
  trains other situations, then weighs it as before."

**FC-04 · S2 · Overnight check and fresh ears, guide p.11 ch.3 §6 (guide.html:255-257)**
- Text: "The first set of the first session on a new day re-tests the hardest condition you reached on your last
  training day, with a voice that was not in that set … so this set lets you see what the night did." and "After two
  or more days away, a gentle fresh ears set comes first instead".
- Code:
  - planner.js:108 skips the overnight set in Path mode.
  - planner.js:103-106 returns before both the overnight set and the fresh-ears set in Free mode.
  - controller.js:201 re-tests only the first three trials of that set, and flow.js:88 avoids the last day's voices
    only for those three trials, where the pool allows (js/game/returns.js:8-10).
  - Because at most three trials carry the overnight flag, js/game/returns.js:63 always reports "3 trials: too few to
    judge on their own", so the app never shows "what the night did".
- Suggested: "In Edge, Variety and Focus, the first three trials of the first session on a new day re-test the hardest
  condition of your last training day, with other voices where possible; three trials are a hint, not a verdict.
  Path and Free skip this, and Free skips fresh ears too." Alternatively, lengthen the overnight block to the ten trials
  that returns.js needs before it shows a percentage.

**FC-05 · S2 · The 65 % floor, guide p.4 Table 1 ("No trial planned below 65 % predicted accuracy") and p.10 sidebar ("Floor: no trial is planned below 65 %")**
- Code: js/engine/controller.js:255-259 deliberately gives a floored dial the focus 12 % of the time, at its easiest
  level. controller.js:242 and 278 keep trials whose easiest levels are predicted below 0.65, with the flag `floor`.
  docs/dev/progress/engine.md:160 records 0.1–0.3 % of trials planned below 0.65.
- Suggested: "No trial is planned below 65 % unless even the easiest level is predicted below it; then it plays at the
  easiest level."

**FC-06 · S2 · Free mode, guide p.11 Table 3 (guide.html:250)**
- Text: "Pick any of the seven exercises, Seek included, and set its dials yourself; a coach line shows your current
  edge on each."
- Code: js/ui/screens/settings-free.js:34 drops family dials, and every Strange voices dial is a family dial
  (js/engine/dials.js:48-67). Free mode on Strange voices therefore shows no dial to set and no coach line, and the
  controller picks the kind of voice itself.
- Suggested: add "(Strange voices picks its kind of voice for you)", or add a family picker to the Free panel.

**FC-07 · S2 · "Run SD", guide p.22–23 (guide.html:598)**
- Text: "Run SD is the run-to-run noise the trend model assumes for one run … the Matrix value was checked in
  simulation."
- Code: the trend model (js/lab/records.js:55 → js/lab/stats.js:147-166) uses each run's own posterior SD plus `sigmaX`
  (Matrix 0.3 dB), scaled by a fitted noise factor. The table's value (`sigmaW`) is used only for the explanatory
  arithmetic on the report card (js/lab/screen-report.js:18-28). docs/dev/progress/lab.md:57 calls `sigmaW` the
  literature value. The simulation measured a Matrix run SD of 0.51 dB true and 0.53 dB reported (lab.md:46-47, 80),
  not 0.6.
- Suggested: "Run SD is the typical run-to-run noise of one run in published tests, used for the
  smallest-detectable-change figures on the card; the trend model itself uses each run's own uncertainty plus a small
  day-to-day term (in our simulations a Matrix run varied by about 0.5 dB)."

**FC-08 · S2 · Wording (outcome promise), js/ex/strange.js:58, shown on Home › Exercises**
- Text: "Bets on: variety that teaches you to adapt to any new voice."
- Problem: "any new voice" promises an outcome. The guide reports the benefit of variety as uneven and smaller than
  first claimed (p.4, p.16).
- Suggested: the guide's wording, "variety that trains adapting to new voices".

### S3

**FC-09 · S3 · guide p.9 (guide.html:223), "sets of about three minutes, each from a different exercise"**
- A new player's sessions draw only from the three newly introduced exercises plus those already played
  (planner.js:117-118, 130-132). Measured first 15-minute session: far → crowd → strange → crowd → strange. A 30-minute
  session (10 sets) must repeat exercises.
- Suggested: "each from a different exercise where possible".

**FC-10 · S3 · Variety mode, "A new talker, room or voice type on every trial" (guide.html:248; js/ui/screens/settings.js:9)**
- Measured over 570 consecutive trial pairs per exercise: the target voice repeats on 0 % of pairs in Crowd, Far,
  Strange voices and Repair, 2.1 % in Echo and 8.6 % in Voices, with the same type and room.
- Suggested: "on almost every trial".

**FC-11 · S3 · guide p.13 (guide.html:287), "All seven training exercises share one trial shape: … one sound played once"**
- Seek's live search plays a voice that keeps calling while you move (js/ex/seek-scene.js, js/audio/live.js), as p.19
  itself says.
- Suggested: add "(Seek's live search aside)".

**FC-12 · S3 · docs/dev/announcement.md line 17, "Every exercise holds you at your edge on several dials at once"**
- Missions has no dials.
- Suggested: "Every training exercise …". The post stays well under 2,000 characters.

**FC-13 · S3 · Two small app texts**
- js/ex/crowd.js:35 says the space dial "Unlocks once the headphone check passes", but the "I am wearing headphones"
  switch also unlocks it (settings.js:107-110). Suggested: "Unlocks with headphones (the check or the switch in
  Settings)."
- js/ui/screens/settings.js:94 calls a failed check "the left-right test", while the check and the guide describe
  quietest hums. Suggested: "Checked: the headphone check did not pass".

**FC-14 · S3 · docs/dev/VERIFY.md rows 30 and 34**
- Row 34 quotes "clear by check-in 4 for 73 %, likely or clear 88 %". These are the n = 60 unit-test log (rerun here:
  73 % and 88 %). The recorded n = 500 run in docs/dev/progress/lab.md:80-93 gives 79 % (76–80 %) and 91 %, and the
  guide's "about 8 in 10" rests on it.
- Row 30 quotes Edge accuracy "0.72 (p5 0.66, p95 0.79)", which I could not find in the notes.
  docs/dev/progress/engine.md:148-149 give edge trials 0.749 (planned 0.727) and all trials 0.779 (p5–p95 0.740–0.818).
- Suggested: cite the recorded runs.

## Guide: links, metadata, fonts, references, Chimera

- Metadata: Author "the Chimera community" in both the DocInfo and XMP dc:creator. CreationDate and ModDate are
  D:20261127011646+00'00', and the XMP dates are +00:00 (UTC). Rights: CC BY-SA 4.0, the Chimera community.
  pdfinfo shows local time only because it converts dates.
- Fonts: six subsets (JetBrains Mono, Archivo), all embedded and with Unicode maps.
- Links: 118 URI annotations, 83 unique URLs, no file:// link. All 95 internal destinations exist, and every
  #r-… citation resolves.
- Link text against target: for every DOI, PMC, PubMed and domain link the visible text matches the href. The two
  "CC BY-SA 4.0" links correctly point to creativecommons.org.
- Chimera: https://discord.gg/chmr is clickable on pp.1, 2, 7, 27 and 35. The cover and the back page invite readers
  to join.
- References: 78 entries; every entry is cited and every citation has an entry. Every source carries a reading-depth
  tag. Hung & Seitz 2014 has no link, which fits "a link where our notes record one". Second-hand sources (Brungart,
  Plomp, Kidd, Best, Ingvalson, Miranda & Palmer) are marked "reported by".
- Visual: all 35 pages looked at. No overflow, clipping or broken figures. Long DOIs wrap inside the identifier, and
  their links carry two annotation rectangles.
- Figure captions match the recorded figure metadata (docs/guide/figures/figures.json) and the simulation script
  (tools/shots.py:52-63): Crowd with two equal-level voices; Far at 11 m with 1.7 s of echo; Seek stopped 1.1 m from the
  voice; 10 of 12 venues open; 9 of 12 answers with 1 partly right; Matrix trend at 0.4 dB a week with 0.55 dB noise.

## README, announcement, app texts

- README: line 1 carries the link. The Pages URL, earshot.html offline, "only the 3D-direction levels need" headphones,
  the five-block baseline after the first session, the privacy lines and the licence files all match the code and the
  files.
- Announcement: 1,803 characters below the comment (limit 2,000). Every claim checks out except FC-12. It says only
  that Earshot was built by the Chimera community, plus the invitation link.
- App texts, checked in the browser and in code:
  - Welcome: full on first launch, one-tap on later launches. The link has target=_blank and rel=noopener.
  - Footer link on every page; version 1.0.0; TEST_BUILD false and playtest off in earshot.html.
  - Settings: the five mode texts and the 10/15/20/30 lengths (Focus's 60 % matches planner.js:126-129).
  - Exercises screen: all eight exercises, Play a set and How it works.
  - Help sheets: dial ranges are generated from js/engine/dials.js (js/ex/strategies.js:27-41), and the research
    lines agree with the guide.
  - Exceptions: FC-02, FC-03, FC-08, FC-10 and FC-13.

## VERIFY.md spot checks (docs/dev/VERIFY.md)

| Row | Requirement | Confirmed by | Result |
|---|---|---|---|
| 12 | Chimera pop-up: full, then light, link in a new tab | browser probe; js/app.js:54-57; js/core/chimera.js:21-58 | confirmed |
| 13 | Permanent link | footer in the browser (js/ui/widgets.js:71-74); About | confirmed |
| 14 | README first line | README.md:1 | confirmed |
| 15 | Link in the guide | annotations on pp.1, 2, 7, 27, 35 | confirmed |
| 16 | Link at the end of every tutorial | js/ui/tutorial.js:198-205 | confirmed |
| 17 | Link in every share text | js/game/weekly.js:150-158, js/game/share.js:78, js/ex/missions.js:81-85 | confirmed |
| 21 | Single file: 12.98 MB, playtest off, no worker | 12,981,409 bytes; no ES_CONFIG; TEST_BUILD false in the browser; js/core/pwa.js:3-5 never registers from inline scripts; no external resources | confirmed |
| 22 | PDF: 35 pages, 83 URLs / 118 annotations, fonts, UTC, 136 facts | pdfinfo, pypdf, pdffonts; 136 rows in docs/dev/progress/guide.md | confirmed |
| 23 | Announcement under 2,000 characters | 1,803 | confirmed |
| 25 | MIT code, CC BY-SA texts | LICENSE, LICENSE-TEXTS.md, About | confirmed |
| 30 | Edge accuracy 0.72 (p5 0.66, p95 0.79) | not found in the notes | not confirmed (FC-14) |
| 31 | Plateau false alarms 3.8–7.5 % | docs/dev/progress/engine.md:251 | confirmed |
| 34 | 1.5 dB clear by check-in 4 for 73 % | the n = 60 unit run; the recorded n = 500 run gives 79 % | partly (FC-14) |
| 36 | Playtest off by default at release | browser: playtest disabled; Settings toggle off | confirmed |
| 37 | Commits noreply + UTC, no session links | 163 commits, all noreply@anthropic.com, +0000, no session lines | confirmed |
| 49 | Planner weights follow the owner's priorities | js/engine/planner.js:13 | confirmed |
| 50 | Everything except 3D direction works on a speaker | dials.js:37 (`requires: 'headphones'`), items/seek.js:94 (head turn only with headphones) | confirmed |

## Wording

- Voice: confident and curious throughout. No section opens with what training cannot do. The disclaimers (p.24–25,
  About, the Lab report) are single and plain.
- No outcome promises in the guide, README or announcement. In the app, the one exception is FC-08.
- No in-app number is presented as IQ or a clinical score. The only mentions are "not clinical measures" disclaimers
  (js/ui/screens/about.js:14, js/lab/screen-report.js:65; guide ch.5 §5).
- No names of commercial trainers: a word-boundary search of the guide text, the README, the announcement and
  earshot.html found none. Saunders 2016's programme stays "[a commercial home] auditory training [programme]".
- No quotes of the owner's private brief: its distinctive phrases were searched and none was found.
- Nothing about the owner: tracked files and the guide text were searched for chat, session and artifact links,
  home-folder paths, the container's time-zone name, and place and device strings. The only hit is the generic regex
  in tools/privacy_check.py.

## Claims checked

The guide is cited by page. "ok" means the text matches the code or data. Measured values come from the scratch
simulations described under Method.

| # | Page | Claim | Code / data | Verdict |
|---|---|---|---|---|
| 1 | meta | Author the Chimera community; dates in UTC | PDF DocInfo and XMP | ok |
| 2 | meta | Fonts embedded | pdffonts | ok |
| 3 | all | 118 link annotations, no file://, 95 internal destinations resolve | pypdf | ok |
| 4 | 32–34 | References complete, depth tags, second-hand citations marked | guide.html anchors | ok |
| 5 | 4, 10 | No trial planned below 65 % | controller.js:242, 255-259, 278 | FC-05 |
| 6 | 5 | Seek and Voices are the new bets | ex cards (betNew); browser | ok |
| 7 | 7 | In-app browser notice (7 apps), dismissed per device | pwa.js:11-14, 30-36, 163-175 | ok |
| 8 | 7 | Updates offered with Reload between sets only | pwa.js:8-10, 81, 158 | ok |
| 9 | 7 | Welcome full first time, one-tap later, discord.gg/chmr | app.js:54-57; chimera.js:34-58; browser | ok |
| 10 | 7 | A wrong practice answer gets a fresh trial (up to 3 tries) | tutorial.js:174, 191-193 | ok |
| 11 | 7 | An unplayable practice sound gets two tries | tutorial.js:16, 179-184 | ok |
| 12 | 7 | Skip button; tutorial ends with the Discord link | tutorial.js:94, 198-205 | ok |
| 13 | 7 | Practice never counts toward levels | tutorial.js:40 (tutorial, warm-up); learner.js:252 | ok |
| 14 | 7 | Exercises lists eight; Play a set in your mode with the tutorial first; How it works | exercises.js:8, 34-61; browser | ok |
| 15 | 7 | Trials fit a sideways phone | browser 640×360: 6 exercises, answer and miss fit | ok |
| 16 | 7 | Screen reader: a heading and live announcements | trialview.js:87-90; play.js:45 | ok |
| 17 | 8 | Headphone check: 6 rounds, 3 hums, quietest; 5/6 passes; ≈2 % by guessing | hpcheck.js:2-6, 12, 42-46 (13/729 = 1.8 %) | ok |
| 18 | 8 | "I am wearing headphones" unlocks the direction dials | settings.js:107-110 | ok |
| 19 | 8 | Set level reference; every trial except Seek's live search at the same loudness | volume.js:7; ctx.js:36; items `out.db −20`; render.js:208 | ok |
| 20 | 8 | Sessions 10 to 30 minutes | settings.js:13; browser | ok |
| 21 | 9 | About 15 min, 3-min sets, 15 min = 5 sets | planner.js:94; dials.js:110-116 (168–180 s a set) | ok |
| 22 | 9 | Weights 20/12/8/22/18/12/8 | planner.js:13 | ok |
| 23 | 9 | Each set from a different exercise | planner.js:117-132; measured first plan | FC-09 |
| 24 | 9 | No return until the others had a turn; never twice in a row | planner.js:131-132 | ok |
| 25 | 9 | Up to three unplayed exercises a session; all seven by the third session (Edge, Path, Variety) | planner.js:111-120; measured worst case 3 over 4 lengths × 3 modes × 2 day patterns | ok |
| 26 | 9 | Set lengths 24/20/20/22/10/6/22 | dials.js:110-116 | ok |
| 27 | 9 | Sets passed over with the reason on screen | results.js:32-53; session.js:316-324 | ok |
| 28 | 9 | Only sessions with an answered trial are logged | session.js:235-241; planner.js:21-22 | ok |
| 29 | 9 | Interludes ≈25 s after some Strange/Far/Repair sets, at most 2 | planner.js:14, 137-139; interlude.js:1-5 | ok |
| 30 | 9 | Edge at ≈7 in 10; one focus dial at the edge, the others a margin below | dials.js:121 (0.72, fc 0.92); controller.js:245-271 | ok |
| 31 | 9 | One trial in five chosen at random | controller.js:146 | ok |
| 32 | 10 | Anchors ≈90 %, every 4th or 5th trial, after 2 misses | dials.js:121; flow.js:42, 114-116; controller.js:219 | ok |
| 33 | 10 | Warm-ups ≈85 % at the start of a set or a new condition; they do not move levels | controller.js:217-218; flow.js:97-98; learner.js:240, 252 | ok |
| 34 | 10 | Feedback replays per exercise (Crowd, Strange, Repair, Far) | crowd.js:171-172; strange.js:101; repair.js:89; far.js:79 | ok |
| 35 | 10 | Variety widens at ≥75 % of the last 20 edge trials, narrows below 55 % | learner.js:242-247, 293-302 | ok |
| 36 | 10 | Edge mode text | settings.js:7; controller | ok |
| 37 | 11 | Path: 5 in a row or 80 % of 15; back one after 15 trials under 50 %; bar; Results; complete → Edge | path.js:105-112; play.js:79; results.js:58-73 | ok |
| 38 | 11 | Variety: new talker, room or type on every trial; random focus dial | controller.js:179, 264; measured repeats | FC-10 |
| 39 | 11 | Focus: ≈60 % of sets, ≈60 % of trials; the pick or the weakest check-in | planner.js:39-45, 123-129; controller.js:265-268; records.js:68-79 | ok |
| 40 | 11 | Focus trains like Edge until it has a target | controller.js:265-268, 305-309; planner.js:114; measured | FC-02 |
| 41 | 11 | Free: set any exercise's dials; coach line per dial | settings-free.js:18-38, 65-66 | FC-06 |
| 42 | 11 | Overnight re-test of the hardest condition with another voice | planner.js:49-77, 103-108; controller.js:200-215; returns.js:63 | FC-04 |
| 43 | 11 | Fresh ears after ≥2 days; says whether the level held | planner.js:78-88; returns.js:52-58 | ok (not in Free: FC-04) |
| 44 | 11 | Sleep suggestion after three sessions in a day | planner.js:98-100 | ok |
| 45 | 11 | Ring counts the week's sessions; 4–5 a good rhythm | widgets.js:37-46 | ok |
| 46 | 11 | 10 weeks × 4–5 × 15 min ≈ 10–12 h | arithmetic (10–12.5 h) | ok |
| 47 | 12 | Plateau rule: no best in 4, 10-session trend, 80 % bound < +0.15, 4 in a row, earliest 13th | plateau.js:28-33, 106-118 | ok |
| 48 | 12 | Simulation: half to >4/5 caught; 3–8 % false alarms | engine.md:123-131, 194, 251 (47–86 %; 3.3–7.5 %) | ok |
| 49 | 12 | Waits ≥3 sessions between changes | plateau.js:113 | ok |
| 50 | 12 | Breaker order; sleep only from the 2nd session of a day | plateau.js:17, 121-127 | ok |
| 51 | 12 | A rest: the exercise sits out three sessions | plateau.js:163; planner.js:36, 140; measured 14–40 % | FC-01 |
| 52 | 12 | Plateau invitation never interrupts a set | chimera.js:84-117 | ok |
| 53 | 13 | One trial shape: one sound played once | seek-scene.js; live.js | FC-11 |
| 54 | 13 | Options shuffled every time | items/common.js:8, 21 | ok |
| 55 | 13 | Results between sets; a set shows progress dots | play.js:3 | ok |
| 56 | 13 | Help sheets show the same ranges | strategies.js:27-41 | ok |
| 57 | 13 | Table 4 weights | planner.js:13 | ok |
| 58 | 14 | Crowd TMR +12 → −15 dB, 0.5 dB steps, start +8 | dials.js:31 | ok |
| 59 | 14 | Crowd talkers 1–3, similarity 4 levels, separation 90°…same place (headphones) | dials.js:32-37 | ok |
| 60 | 14 | Cue (call sign, preview, place) and onset jitter grow with variety | items/crowd.js:121-123, 137 | ok |
| 61 | 15 | Far rooms 5/10/22/38 m with own backgrounds; the talker fits | items/data.js:203; items/far.js:10-11, 37-40 | ok |
| 62 | 15 | Distance 1…30 m (11 levels), RT60 0.3…3.0 s, noise +30 → −6 (start +24) | dials.js:41-45 | ok |
| 63 | 15 | Far feedback: distance and room; up close, then again | items/far.js:78-79 | ok |
| 64 | 15 | Rooms check-in in a hall never trained | probes-more.js:25 (seed 10007); items/data.js:201 (training seeds 1–9999) | ok |
| 65 | 16 | Accent ladder (easier quiet … hardest −3 dB) | dials.js:48-54 | ok |
| 66 | 16 | Fast, whisper, phone, muffled, vocoded ladders | dials.js:55-67 | ok |
| 67 | 16 | Accent tiers = recogniser difficulty; other-language models | dials.js:50-51; data/voices.js labels | ok |
| 68 | 16 | New voice uses tones, never trained (training vocoder uses noise) | items/strange.js:71; probes-more.js:69 | ok |
| 69 | 16 | Strange feedback: words, then the same voice again | items/strange.js:101 | ok |
| 70 | 17 | Repair dials (word lost, context, broken-up, fill) | dials.js:70-78 | ok |
| 71 | 17 | Repair replays: the whole sentence, then the broken one with words | items/repair.js:89 | ok |
| 72 | 18 | Echo: two or three questions | items/echo.js:88; measured 2 at 2–3 details, 3 at 4–5 | ok |
| 73 | 18 | Echo dials (SNR +20 → −8, start +15; 2–5; 1.0–1.6×; 1/3/6/10 s) | dials.js:81-86 | ok |
| 74 | 18 | Café or party noise | items/echo.js:163 | ok |
| 75 | 18 | A miss replays the message in noise with words | ex/echo.js:5-6, 89, 163 | ok |
| 76 | 19 | Seek room ≈20 m across | seek-scene.js:19, 57 | ok |
| 77 | 19 | Ring within 2.5 m down to 0.9 m | dials.js:92 × score.js:24 (1.15) × 10 m | ok |
| 78 | 19 | A scene counts when both parts are right | score.js:38 | ok |
| 79 | 19 | Head-turn feedback 15–70° | seek-scene.js:210-217 | ok |
| 80 | 19 | Practice scene only on the first Seek ever | ex/seek.js:53-57, 89-105 | ok |
| 81 | 19 | Seek dials (SNR +15 → −12, start +12; 0–4 decoys; 1–4 s) | dials.js:89-95 | ok |
| 82 | 20 | Voices dials (2–6; similarity; SNR +30 → −6, start +30; clip length) | dials.js:98-102 | ok |
| 83 | 20 | A wrong pick plays the right voice, then the picked one | ex/voices.js:28, 176-179 | ok |
| 84 | 20, 29 | Own voices: ≤20 s or import, name + consent, 16 kHz mono, original not kept, never exported | voices-own.js:5-7, 16, 97-136, 249-262; store.js:16, 265 | ok |
| 85 | 21 | Missions: one per ISO week, swappable, 20-s check-in (tried, 0–10, helped), into the diary; 8 titles | missions.js:1-7, 23-46, 51-85 | ok |
| 86 | 21 | Diary: four situations plus one overall | probes-more.js:157-163 | ok |
| 87 | 22 | Seven check-ins with reach tags | probes.js:76, 121, 169; probes-more.js:23, 67, 108, 166 | ok |
| 88 | 22 | Table 5 lengths and Run SDs; Story ≈40 s | same lines; story clips 33.4–39.6 s in data/manifest.js | ok |
| 89 | 22 | Probe material never used in training | materials.js:1-3; data: 0 shared clips either way | ok |
| 90 | 22 | Two voices uses recorded voices; Digits uses real talkers (probe only) | data/voices.js (CREMA-D, AudioMNIST probe set) | ok |
| 91 | 22–23 | Run SD is what the trend model assumes; checked in simulation | records.js:55; stats.js:147-166; screen-report.js:18-28 | FC-07 |
| 92 | 23 | Matrix words share no word or verb stem with the British English matrix | tools/audio/content_probe.py:24-30, 260-265 vs data/vocab.js | ok (against the repo's copy of the list) |
| 93 | 23 | Baseline: five blocks, one a day after the first session; practice + 2 or + 1 measured; diary without practice | schedule.js:17-23, 31, 49, 73-90 | ok |
| 94 | 23 | Weekly ≈8–9 min after ≥6.5 days; rotation; Diary | schedule.js:24-25, 100-113 (8.5–9 min) | ok |
| 95 | 23 | Second Matrix run while not clear, first 8 check-ins, ≈3 min | schedule.js:26, 104-106 | ok |
| 96 | 23 | Simulation: ≈8/10 clear by check-in 4 with two runs vs ≈6/10 with one | lab.md:80-94 (79–80 % vs 56–64 %) | ok |
| 97 | 23 | Retention check after ≥14 days away | schedule.js:114 | ok |
| 98 | 23 | Four verdicts and their rules | stats.js:232-238 | ok |
| 99 | 24 | No verdict before a measured run ≥5 days after the baseline | stats.js:150, 155-158 | ok |
| 100 | 24 | SDC = 1.96 × SE = 2.77 × SD / √k; Matrix 1.7 / 1.2 dB | stats.js:140, 210; arithmetic 1.66 / 1.18 | ok |
| 101 | 24 | Figure 11 simulation (0.4 dB a week, 0.55 dB a run) | tools/shots.py:52-63 | ok |
| 102 | 24 | Chart: hollow practice dot, baseline, trend band, better upward | charts.js:1-5, 52-83 | ok |
| 103 | 24 | Focus compares check-ins with our starting guesses, and says so | records.js:68-79; settings.js:71 | ok |
| 104 | 26 | 12 venues on 3 lines (6/5/1) with these names | game/data.js:19-101 | ok |
| 105 | 26 | Earshot ≈7/10; careful 90 % side; never beyond a level heard; "not yet"; "30 m+" | game/venues.js:51-100; game/core.js:20 | ok |
| 106 | 26 | Three venues open at the start; opening rule; never closes; Club mark +3 dB | game/data.js:26-101; game/venues.js:122-140 | ok |
| 107 | 27 | Every exercise at a start venue (Seek at the lecture hall) | game/data.js:26-34, 69-74, 96-100 | ok |
| 108 | 27 | Cast "known" after 3 picks; labels; synthetic labelled | game/cast.js:11, 25; screen-cast.js:40 | ok |
| 109 | 27 | Results count answers for multi-answer trials; partial marks | results.js; figures.json (9 of 12, 1 partly) | ok |
| 110 | 27 | Level-up lines only for levels tested; bests per dial | game/milestones.js:7; flow.js:162-169 | ok |
| 111 | 27 | Milestones Equal footing 0 dB, Through the crowd −6 dB; ≥6 trials; careful side; ≤2 per set; only the next | game/milestones.js:2-19; game/ui.js:136-137 | ok |
| 112 | 27 | One invitation card per results screen | chimera.js:71-112 | ok |
| 113 | 27 | Weekly: 4 stops, seeded, 6 trials on a fixed ramp; first run is the card; never teaches | game/weekly.js:1-27, 117-131, 150-158; learner.js:225-226 | ok |
| 114 | 27–28 | No streaks; the ring restarts each week | widgets.js:37-46 | ok |
| 115 | 29 | Blocked storage: says so, suggests a backup | app.js:15-24 | ok |
| 116 | 29 | Delete everything after a confirmation | settings-data.js:2-3; store.js:327 | ok |
| 117 | 29 | Backups merge, upgrade, refuse damaged files whole; nickname only, no device facts | lab/export.js:1-13, 147-171; store.js:16, 265 | ok |
| 118 | 29 | Two CSV exports | lab/export.js:73-88 | ok |
| 119 | 29 | Download through the viewer or the browser, with Copy | core/download.js:1-12; settings-data.js:16-31 | ok |
| 120 | 29 | Pool file: random id, relative days, UTC export date, opt-in nickname and device, trial answers | lab/export.js:91-144; records.js:99-106 | ok |
| 121 | 29 | The app sends nothing anywhere | no network calls besides sw.js; playtest.js:262 (test builds in the artifact host only) | ok |
| 122 | 30 | AudioMNIST: 8 talkers, Digits only | data/voices.js | ok |
| 123 | 31 | CREMA-D: 8 actors, each sentence ≥4, Two voices only | data/manifest.js (12 texts, 4–8 actors) | ok |
| 124 | 31 | LibriVox: one sentence from each of 10 readers | data/manifest.js | ok |
| 125 | 31 | DEMAND loops and the restaurant scene for Story only; Freesound; party bed | LICENSES-ASSETS.md:32; manifest beds; materials.js:7 | ok |
| 126 | 30 | Fonts fontsource 5.3.0; OFL texts in fonts/ and docs/guide/fonts/ | LICENSES-ASSETS.md:40-41; files present | ok |
| 127 | 2, 30 | Code MIT; texts CC BY-SA 4.0, © the Chimera community | LICENSE; LICENSE-TEXTS.md | ok |
| 128 | 35 | Version 1.0.0 | js/core/ns.js; browser | ok |
| 129 | app | Plateau "switch" text gives the exercise a rest | plateau.js:141 | FC-03 |
| 130 | app | Strange voices card bet "adapt to any new voice" | ex/strange.js:58 | FC-08 |
| 131 | app | Crowd space help; Settings headphone fail status | ex/crowd.js:35; settings.js:94 | FC-13 |

Not counted in the 131 rows: the README (all lines match), the announcement (FC-12) and VERIFY rows 30 and 34 (FC-14),
covered in their sections above.
