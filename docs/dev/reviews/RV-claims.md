# RV-claims — player-facing claims checked against code and research

Reviewer: independent (did not build Earshot). Snapshot: commit e079caf, frozen copy. Written 2026-11-26 19:51 UTC.
Scope: every text a player sees in js/** (Help sheets, tutorials, strategy cards, bets, plateau and breaker messages,
Lab probe texts and verdicts, game lines, weekly share text, About and Settings, Chimera texts), README.md and
LICENSES-ASSETS.md. Evidence: docs/research R1–R6 (with their reading-depth tags), docs/research/ACCESS.md,
docs/dev/PLAN.md, docs/dev/DECISIONS.md, and the code that produces each number. Method: reading only; the app was
not run. There are no guide drafts in the snapshot. Paths are repository-relative; "R3:249" means
docs/research/R3-cocktail-party-distance-mechanisms.md line 249 (R1, R2, R4, R5 likewise).

**Counts: high 2 · medium 13 · low 25 (40 findings).**

Format per finding: id · severity · where. Text (quoted from the app). What is wrong. Evidence. Suggested rewrite.

## Checked and consistent (no finding)

- Help-sheet dial ranges are built from js/engine/dials.js (js/ex/strategies.js:32-40), so every "easy → hard" range
  matches the code. Tutorial captions read their levels from the same ladders (js/ex/far.js:108-111, js/ex/repair.js:116-119).
- "About 7 in 10" (map, venues, milestones, progress) matches the engine target 0.72 (js/engine/dials.js:119) and θ
  defined at p = target (js/engine/learner.js:2-4).
- Far feedback "N dB weaker against the echo than at 1 m" (js/ex/far.js:60, :95) matches the renderer's
  DRR = 20 log10(dc/dist) (js/audio/render.js:6, :164-170). Far's echo examples (0.35 s office, 0.6 s cafeteria,
  2.5–3 s halls; js/ex/far.js:34) match R3:593-596 and R3:625-628.
- Seek: 6 dB per doubling and the 1 m reference (js/ex/seek.js:39, :120) match js/audio/live.js:5, :76; ring sizes
  (js/ex/seek.js:42) match the scorer's 1.15 tolerance (js/engine/score.js:24); "20 m across" and the 5 m bar
  (js/ex/seek-scene.js:52, :59-61) match M_PER_UNIT 10.
- Crowd's "each other voice" wording matches per-masker TMR (js/engine/items/crowd.js:2, :112).
- Strange: "the first few of a new kind are warm-ups and do not move your level" / "three tries" match
  js/engine/learner.js:215 and js/engine/flow.js:58 (first 3 items) and Cooke 2022 [full] (R2:42).
- Card and Help figures that match their notes at the right strength: 10–15° separation (R3:181-183); final
  consonants 56–62 % vs 88 % (R3:593-596); 6 dB per halving (R3:575-577); degraded–words–degraded replay (R2:55);
  80 / 58 / 46 % accent scores (R2:199-202); ~9 points from noise-filled gaps and ~3 months retention (R3:281-288,
  R3:403-407); context after the gap (R3:385-390); familiar target ~10 points, no familiar-masker benefit
  (R3:439-445); 1–3 dB head turn in a virtual restaurant (R3:255-258); masker-language specificity (R3:91-100);
  three-room training (R3:625-632).
- Lab: Matrix σ 0.6 dB and Digits σ 0.9 dB (js/lab/probes.js:70, :115) sit inside R4:261-268; the 2.77 × σ / √k
  text (js/lab/screen-report.js:15-18; js/lab/stats.js:140) matches R4:320-331; the verdict wording matches
  js/lab/stats.js:232-238; "first 8 check-ins" and "about 3 extra minutes" match js/lab/schedule.js:26 and the
  Matrix minutes; "five blocks" matches js/lab/schedule.js:17-23. Probe content is drawn only from set:'probe'
  voices and clips (js/lab/materials.js:1-3), so "voices you never train with" holds whenever a probe is available;
  unavailable probes say "later build" honestly.
- Weekly Night Out: "Four stops, six trials each" and the 24 default (js/game/screen-weekly.js:89, js/game/share.js:72,
  js/game/weekly.js:149) match js/game/weekly.js:14-24. Share text and card always carry https://discord.gg/chmr
  and no name except an optional nickname; no locale or time zone.
- Twelve venues, three open from the start (js/game/venues.js:135-136, js/game/milestones.js:170) match
  js/game/data.js:24-97; venue flavour lines match their pins.
- Chimera: full and light welcome, footer, tutorial end, About, README line 1, share texts and the pb / milestone /
  plateau / export invitations link https://discord.gg/chmr in a new tab (js/core/chimera.js:90-93) and say that
  Earshot was built by the Chimera community on Discord, plus an invitation. Invitations wait while a set runs
  (js/core/chimera.js:139-157). Two borderline invitation lines: C30.
- No commercial trainer or test names in js/**, index.html or README.md (searched QuickSIN, HINT, LACE, LiSN, OLSA,
  WIN, CPHI, Earobics, BrainHQ, Brain Fitness, Cogmed, Lumosity, Duolingo, CRM, BKB, SSQ, HHIE, APHAB, Amptify and
  others). No streak wording, no "mastered", no "will improve" promises.
- No clinical framing: About (js/ui/screens/about.js:13-14), Lab (js/lab/screen-lab.js:121), report
  (js/lab/screen-report.js:54) and headphone check (js/lab/hpcheck.js:74) say the numbers are not clinical or normed
  and point to an audiologist; provisional references are "not norms" (js/lab/screen-lab.js:88). Diary items are
  original wording (js/lab/probes-more.js:153-159).

## High

**C01 · high · LICENSES-ASSETS.md:3; js/ui/screens/about.js:17-18; README.md:1**
Text: "The app's code is MIT and its texts are CC BY-SA 4.0 (see the repository licence files)." / "Code: MIT
licence." / "Texts and the player guide: CC BY-SA 4.0."
Wrong: the snapshot tracks no licence files (no LICENSE, COPYING or CC text; only LICENSES-ASSETS.md and the two OFL
files), so nothing grants MIT or CC BY-SA 4.0, and the ledger points at files that do not exist. README states no
licence.
Evidence: `git ls-files` at e079caf; standing rule "Code under MIT; texts and the guide under CC BY-SA 4.0".
Rewrite: add LICENSE (MIT, holder "Chimera community"), a texts licence file (CC BY-SA 4.0 with the legal-code link)
and a README line: "Code MIT · texts and guide CC BY-SA 4.0 · asset licences in LICENSES-ASSETS.md".

**C02 · high · js/ui/screens/about.js:20; LICENSES-ASSETS.md:32-34; tools/build-single.mjs**
Text: "Voices, noises and rooms: each source and its licence is listed in LICENSES-ASSETS.md in the source code."
(relative link)
Wrong: the app ships DEMAND loops under CC BY-SA 3.0 (data/voices.js: ms-snsd.demand, ms-snsd.demandprobe), which
need attribution plus a copy or URI of the licence with every copy; the embedded fonts are OFL 1.1, whose text must
travel with them; data/vocab.js neighbour lists derive from CMUdict (BSD-style notice). The single offline HTML
embeds none of these (tools/build-single.mjs has no licence or notice handling) and the relative link resolves to
nothing from disk or in sandboxed previews. The ledger itself gives licence names without URIs.
Evidence: search of tools/ and js/** for licence/notice/LICENSES finds only the about.js link; fonts/OFL-*.txt exist
only as repository files.
Rewrite: an in-app Credits sheet generated from the ledger at build time (source, author, licence + URL, "adapted:
cut into 10 s loops"), the OFL text and CMU notice included, build-single inlining the same; add the licence URLs
(creativecommons.org/licenses/by-sa/3.0/, …/by/4.0/, the OFL) to LICENSES-ASSETS.md.

## Medium

**C03 · medium · js/engine/plateau.js:20**
Text: "With headphones, turn until the voice sits straight ahead."
Wrong: contradicts the research and Seek's own card and feedback: the strategy is a ~30° turn so the voice sits to
one side; facing squarely is what to avoid. Shown when the Seek breaker is 'strategy' and no card is picked.
Evidence: R3:249-254 (Grange & Culling 2016 [full]); js/ex/seek.js:126; js/ex/seek-scene.js:275.
Rewrite: "Move in small steps and compare: louder means closer. With headphones, turn so the voice sits about 30° to
one side." (Related fix-list item: the engine's advice next to a card.)

**C04 · medium · js/engine/plateau.js:126; js/engine/planner.js:83**
Text: "This is your " + ordinal(today + 1) + " session today." / "Third session today."
Wrong: both off by one. The plateau check runs after the current session is written to the log (js/ui/session.js:219
before js/ui/session.js:264; counted by js/engine/plateau.js:89-93), so the second session of a day reads "third".
The planner counts only earlier sessions (js/engine/planner.js:82), so its note appears at the fourth session and
calls it the third.
Rewrite: plateau `ordinal(today)`; planner "You have trained three times today. Skills settle during sleep…".

**C05 · medium · js/engine/plateau.js:124**
Text: "More easy trials go in between the hard ones for a while, and every miss replays the sound with its words, so
the hard trials have something to build on."
Wrong: the breaker only shortens the anchor gap (js/engine/plateau.js:149; js/engine/flow.js:49); feedback does not
change. Crowd and Voices misses replay without words (js/ex/crowd.js:146 `words: null`; js/ex/voices.js:153-162).
Rewrite: implement a words-on-screen replay while anchorBoost > 0, or: "More easy trials go in between the hard
ones for a while, so the hard trials have something to build on."

**C06 · medium · js/ui/screens/settings.js:11**
Text: "Free — Pick any exercise and dial yourself; a coach suggests settings."
Wrong: no screen lets the player pick an exercise or set a dial; the session never passes one
(js/ui/session.js:72-73) while the planner's Free branch needs it (js/engine/planner.js:86); the coach value is
computed (js/engine/controller.js:216-217) but never shown. Choosing Free gives Edge-like sessions without saying so.
Rewrite: hide Free until its picker exists, or describe today's behaviour.

**C07 · medium · js/lab/probes-more.js:72 (fx at :69, distance label at :67)**
Text: "It sounds strange at first; most people improve within a few sentences."
Wrong: the probe is 6-band tone-vocoded speech; in Cooke 2022 [full] that family started near 2 % and needed ~15
sentences for half its gain, the slowest of eight. "A few sentences" fits noise-vocoded or fast speech, not this
one. Also: learning transfers partly across vocoder carriers (R2:62), and the engine trains noise-vocoded speech, so
"mid–far" is generous; a probe that starts near floor may sit at its 'lo' edge.
Evidence: R2:42-44.
Rewrite: "It sounds very strange at first and clears over the 16 sentences; how fast it clears is part of what this
check measures." Check the starting accuracy in playtests.

**C08 · medium · js/ex/voices.js:41**
Text: "Voices bets that meeting many new voices also makes you quicker at learning the next one. Nobody has tested
that yet; your check-ins help find out."
Wrong: no Lab check-in measures how fast a new voice is learned (probe list js/lab/probes-more.js:192; the pool file
holds check-ins and training time, js/lab/export-ui.js:55), so check-ins cannot answer it. "Nobody has tested" is
stronger than the note, which says untested in what was found (R3:465-469, R3:742-745).
Rewrite: "…That bet is untested as far as we found." Then either log and export how many meetings a new cast voice
needs before it is picked out, and say "your Voices log will show it", or drop the last clause.

**C09 · medium · js/ex/echo.js:39, :27, :143, :146**
Text: "Context is a strong repair tool: listeners restored 70 to 90 % of missing sounds in short everyday sentences
… so the rest of a message helps you rebuild a detail the noise covered." / "A detail lost in the noise often comes
back from the rest of the message."
Wrong: the figures concern missing phonemes in predictable sentences (R3:374-377, [secondary] via a review) and a
word-onset continuum with sentence context (R3:385-390). Echo's details are names, numbers, times, days, places and
things (js/engine/items/echo.js:1-2), which the rest of a message rarely predicts; "often comes back" is unsupported
for this content.
Rewrite: "The rest of a message can repair a blurred word when only one word fits: in studies reported in a review,
listeners restored most missing sounds in everyday sentences. Names and numbers get no help from context, so tag
each one as it comes."

**C10 · medium · js/engine/plateau.js:119-120 (also js/game/returns.js:49-52)**
Text: "<Exercise> has held near the same level for N sessions (trend +0.12 dB per session) with no new best in 4."
Wrong: the trend is a focus-weighted dB-equivalent index where positive means better (js/engine/plateau.js:42, :51):
for Crowd "+0.12 dB" means the voice-vs-others edge fell by 0.12 dB, the opposite sign of the dial the player
knows. For Strange and Repair (no primary dial) it prints "points", a unit used nowhere else. The test is one-sided
(js/engine/plateau.js:4), so the same sentence appears for a falling trend, where "held near the same level" is wrong.
Rewrite: "Crowd has set no new best in 4 sessions, and its level moved less than 0.15 dB a session over the last 6."
For a falling trend: "…has slipped a little over the last N sessions."

**C11 · medium · LICENSES-ASSETS.md:13-14, :24-26, :52**
Text: rows for Piper en_US-libritts-high, AudioMNIST, CREMA-D ("clips in `audio/pack-lab.js` with ids `cremad.*`"),
LibriVox via DNS-Challenge, Kokoro "voices of other languages reading English"; "All word lists, sentences,
messages, stories and questions are original to this project".
Wrong: this build ships only Kokoro US/UK voices and MS-SNSD noise (data/voices.js; packs babble, beds, probe,
starter in data/packs.js). audio/pack-lab.js does not exist, so the ODbL "offered under the same terms" statement
points at nothing. Once CREMA-D and LibriVox ship, their sentences are not original, contradicting line 52.
Rewrite: generate the ledger from data/voices.js and data/packs.js at build time (shipped sources and real file
names only); line 52: "…original to this project, except the CREMA-D sentences (ODbL/DbCL) and the LibriVox
readings (public domain) listed above."

**C12 · medium · js/ex/strange.js:118, :37 (also js/game/data.js:28, js/game/weekly.js:21)**
Text: "Last one: a mild accent." / "Accented voices from mild to strong, first in quiet, then in babble that gets louder."
Wrong: this build has no accented voices (data/voices.js: only "US English (synthetic)" and "UK English (synthetic)",
which js/engine/items/adapt.js:17-22 counts as native), so the generator swaps the accent family for Fast talker
(js/engine/items/strange.js:35-38). The tutorial caption promises an accent and plays a 1.3× fast talker; the Help
line, the Café "Accents" row and the weekly accent stop describe sounds the build cannot make.
Rewrite: build the tutorial caption from the trial's real family (prepare() already does this for the prompt) and
hide accent rows until accented voices ship.

**C13 · medium · js/lab/screen-report.js:44**
Text: "The baseline is a practice run and one measured run." (every non-core probe)
Wrong: Story gets only a practice run in the baseline (js/lab/schedule.js:22 `['story', 1]`; js/lab/schedule.js:31
k ≤ 1 = practice), unlike DECISIONS.md:29 ("the others practice + 1"). Its Lab card then reads "Baseline: 1 of 2
runs" (js/lab/screen-lab.js:30-33) until the weekly rotation reaches Story, about four check-ins later
(js/lab/schedule.js:24, :107).
Rewrite: give Story a second baseline run (or make its first run measured) so the text and the decision hold; or say
"a practice run" for Story.

**C14 · medium · js/lab/schedule.js:117**
Text: "Same voices you never train with, new sentences every time."
Wrong: Two voices draws targets and maskers from one fixed item set (js/lab/probes.js:180-182), the 12 CREMA-D
sentences per LICENSES-ASSETS.md:25, so the same sentences return every week (item learning can pass for gain);
Story cycles its passages by form (js/lab/probes-more.js:120). Only the matrix-family probes and Digits make new
items every run.
Rewrite: "Same voices you never train with, in new combinations every time." (Item count for Two voices: RV-stimuli.)

**C15 · medium · js/lab/hpcheck.js:74, :111**
Text: "This tells headphones from a speaker, so the direction dials work as they should." / "Headphones detected (5/6)."
Wrong: stronger than the evidence for the anti-phase screen at 5/6: ~18 % of laptop speakers passed (Woods 2017
[full]) and 42 % of loudspeaker users passed (Milne 2021 [full], AUC 0.74).
Evidence: R4:138-139; R4:310-316.
Rewrite: "This check usually tells headphones from a speaker (some speakers pass, some headphones fail), so the
direction dials work as they should." / "Sounds like headphones (5/6)."

## Low

**C16 · low · js/ex/strategies.js:238 (also js/ex/crowd.js:25)**
Text: "Most crowd mistakes are borrowed words: a real word, heard clearly, from the wrong talker."
Wrong: generalises one condition (one same-sex masker at 0 dB TMR, call-sign task), known only via a review
(R3:48-52; ACCESS.md:14), to every Crowd condition, including babble at negative TMR; "heard clearly" overstates.
Rewrite: "Many crowd mistakes are borrowed words: a real word from the wrong talker. In a classic study, reported in a
review, most errors against one same-sex voice were that voice's words."

**C17 · low · js/ex/seek.js:45**
Text: "A closed-loop listening game of this kind came with gains in speech in noise in one placebo-controlled study of
older adults; it has not been replicated, and the gains faded without practice."
Wrong: the study is known from a news release only (R3:530-539) and its mechanics are unread (ACCESS.md:8-9: Seek is
"our own closed-loop search design"), so "of this kind" claims a likeness we cannot check; "has not been replicated"
is stronger than "no independent replication surfaced in our searches" (R3:542). Two caveats in a row stack.
Rewrite: "In one placebo-controlled study, older adults who steered a fingertip through a sound scene gained in
speech in noise; we found no replication, and the gains faded without practice. Seek is our own take on that idea,
plus turning one ear to the talker, worth 1 to 3 dB in a virtual restaurant in another study."

**C18 · low · js/ex/strategies.js:235**
Text: "In lab studies, knowing where to listen was worth 10 to 40 points, and attention kept building while the voice
stayed put."
Wrong: the 10–40 points is what knowing only the call sign cost under location uncertainty (Kidd 2005, [secondary],
R3:312-314), so it argues for location over call signs, yet the card is about the call sign. Without headphones all
Crowd voices come from one place (js/ex/crowd.js:95-96), so "where it sits" does not apply to most players.
Rewrite: "From the call sign on, stay with that voice: its pitch and pace. In lab studies attention kept building
while the voice stayed the same, and switching cost about 10 points (R3:320-324, R3:329-334)." Keep the 10–40 figure
for crowd.space (headphones).

**C19 · low · js/engine/planner.js:60; js/game/returns.js:59**
Text: "…now with a voice you did not hear yesterday." / "Yesterday's hardest (…), with voices new to you: …"
Wrong: the code avoids only the voices of that one set, for the first 3 trials, when the pool allows
(js/engine/flow.js:53; js/engine/items/data.js:167); "yesterday" can be two calendar days back (js/engine/planner.js:44
allows up to 48 h). "Voices new to you" is wrong whenever the voice was met before.
Rewrite: "…now with a voice that was not in that set." / "Your last day's hardest…".

**C20 · low · js/lab/screen-report.js:17 (values js/lab/probes-more.js:24, :68, :109, :163)**
Text: "Run-to-run noise of tests like this one is about X…"
Wrong: sourced for Matrix and Digits (R4:261-268) and close for Two voices (call-sign spatial task, R4:276), but no
note covers a distance ladder, a tone-vocoded matrix, a story quiz or the diary (R4:22: distance tests never
searched); for Rooms, New voice, Story and Diary the value is a working assumption.
Rewrite for those four: "Our working estimate of run-to-run noise is about X; your own runs refine it." (The trend
model already fits the noise: js/lab/stats.js:172-194.)

**C21 · low · js/ex/strategies.js:268**
Text: "Chopped-up speech keeps its rhythm and gives glimpses of every word. Practice with interrupted sentences carried
over to other kinds of gaps and lasted about three months in one study."
Wrong: the study had two gap types and transfer was to the other one (R3:281-288); with 333-ms cuts a short word can
vanish entirely.
Rewrite: "…gives glimpses of most words. In one study, practice with one kind of gap (silent or noise-filled) carried
over to the other and lasted about three months."

**C22 · low · js/ex/strategies.js:244; js/ex/far.js:25**
Text: "Listeners adjust to a room within about half a second to three seconds, and speech in it then gets easier to catch."
Wrong: the 2.7 dB room benefit was mainly binaural, almost none with one ear (R2:147-149); most players use a phone
speaker. A monaural effect exists (R3:613-618), so the claim holds only in part.
Rewrite: "…and speech in it then gets easier to catch, most of all with headphones."

**C23 · low · js/ex/voices.js:236, :30, :233**
Text: "In one study about ten minutes of practice telling three voices apart already made them easier to follow…, and
twenty minutes did no better than ten." / "…already made a new voice easier to follow." / "In lab studies the two
together separated voices more than the sum of each alone"
Wrong: in Holmes 2021 [full] one session gave three voices ~10, 20 and 60 min each; the ~10-min voice already helped
and 10 = 20 min (R3:453-460), not ten minutes for all three. "A new voice" reads as any unheard voice. The pitch-and-
size result is one study via a review (R3:114-118) and is about separating simultaneous talkers, not naming them.
Rewrite: "In one study a voice heard for only about ten minutes of a who-is-talking task was already easier to follow
against another talker, and twenty minutes did no better than ten." / "In one study, reported in a review, pitch and
size differences together separated two talkers more than either alone…"

**C24 · low · js/engine/plateau.js:122, :126, :127; js/ui/screens/home.js:70; js/engine/planner.js:83**
Text: "a fresh mix often breaks a stall" / "so the next gain is likely tomorrow" / "skills often move again after a
break" / "the next one pays off most after sleep" / "tomorrow is the best time for the next one"
Wrong: predictions stronger than R5 §4.3 (R5:479-505): sleep and naps restored a visual task within a day (Mednick
2002 [full]) and a new stimulus location escaped same-day decline; nothing shows variety or a break ending a
multi-session stall.
Rewrite: "…a fresh mix gives the skill something new to work on." / "Sleep consolidates practice, so tomorrow is a
good time for the next session." / "…trains other situations for a while, then comes back to it."

**C25 · low · js/game/returns.js:32, :52**
Text: "Skills mostly survive a break and return within a set or two." / "It usually comes back within a set or two."
Wrong: the source is two online cognitive games (Kumar 2022 [full], R5:626-630), not listening; stated as a rule.
Rewrite: "In large studies of online training games, skill mostly survived breaks and came back within a game or two;
your next sets will show it here."

**C26 · low · js/ui/interlude.js:31**
Text: "Listening like this between sets helps the practice settle."
Wrong: the source is abstract-only (Wright 2015, R1:164): practice alternated with listen-only exposure matched or
beat continuous practice; nothing on consolidation.
Rewrite: "In lab studies, practice mixed with short listen-only breaks like this one learned as much as practice alone."

**C27 · low · js/ui/screens/volume.js:33-35**
Text: "Adjust the device volume until it is clear but never loud." / "Every trial plays at this same loudness, however
hard it gets. If anything ever sounds too loud, turn it down; short sessions are plenty."
Wrong: the safe-listening screen has no audiologist pointer (only About has one, js/ui/screens/about.js:14); Seek's
live search changes level with distance by design (js/ex/seek-scene.js:4-10; js/audio/live.js:5).
Rewrite: add "If you notice ringing, muffled hearing or pain after listening, stop and see an audiologist." and
"Every trial except Seek's live search plays at this loudness."

**C28 · low · js/ui/screens/settings.js:114**
Text: "Shown only on result cards you choose to share."
Wrong: backups carry the nickname (js/ui/screens/settings-data.js:102) and the pool file can (js/lab/export-ui.js:56).
Rewrite: "Shown on result cards you share and kept in backups; pool files include it only if you tick it."

**C29 · low · js/ui/widgets.js:7, :32-35**
Text: "Three to five sessions make a good rhythm; any day works."
Wrong: the plan's dose is 4–5 days a week for 8–10 weeks, ~10 h (docs/dev/PLAN.md:77, :239); positive trials used
≈12–40 h (R1:180). Three 15-min sessions a week reach 12 h after about 16 weeks. The ring, the plan and the guide
need one number.
Rewrite: pick one (e.g. GOOD_RHYTHM [4, 5]) and use it in the ring, the guide and PLAN.md.

**C30 · low · js/core/chimera.js:16-17**
Text: "Stuck at a level? Talk it through with the Chimera community on Discord." / "Pooled exports help test the bets
this tool makes. Bring yours to the Chimera community on Discord."
Wrong: borderline: implies the community helps with plateaus and runs a pooling effort; what Chimera offers is the
owner's to state.
Rewrite (owner to confirm): "Compare notes with other players in the Chimera community on Discord." / "Share your
pool file with the Chimera community on Discord if you like."

**C31 · low · js/game/screen-map.js:100**
Text: "…a number in decibels or metres, never a guess."
Wrong: the Phone line venue, open from the start, shows a line-quality level (js/game/data.js:93-97; js/game/venues.js:3).
Rewrite: "…a level in decibels, metres or line quality, never a guess."

**C32 · low · js/ex/seek.js:24, :126**
Text: "Later: turn your head to hear better." / "…after instruction everyone turned and scores rose by about 3 dB…"
Wrong: the turn is a knob on screen (js/ex/seek-scene.js:6-8); the 3.3 dB were self-set thresholds, not scores (R3:253).
Rewrite: "Later: turn the listener on screen to hear better." / "…everyone turned and their self-set thresholds
improved by about 3 dB…"

**C33 · low · js/engine/plateau.js:17**
Text: "Then follow the rhythm, not each sound."
Wrong: in no note, and it contradicts the Strange tip "Listen for the sounds." (js/ex/strange.js:30), which matches
the design (odd phrases block context guessing: R2:33).
Rewrite: "…ears re-tune to a new voice within a handful of sentences. Then listen for the sounds this voice changes."

**C34 · low · js/lab/screen-report.js:16**
Text: " dB*" in "Run-to-run noise … about 2.5 dB*" (Rooms)
Wrong: the starred unit (6.02 per doubling of distance, js/lab/probes-more.js:4-5) is never explained to the player.
Rewrite: express it as distance: "about 2.5 dB of direct sound, roughly a 1.3× change in distance".

**C35 · low · data/vocab.js (matrix: name, verb, num, adj, obj)**
Text: the 50-word Matrix vocabulary.
Wrong: unverifiable from the notes: the matrix principle is generic, but each language version's vocabulary belongs
to its developers (R4:222), and the notes hold no published English matrix lists to compare against.
Rewrite: before release, compare the 50 words with the published English matrix vocabularies and change any slot that
matches one closely.

**C36 · low · js/ex/repair.js:37, :41**
Text: dial "How strongly the rest of the sentence points to the word." / why "Holding a sentence in mind and repairing
it from context is a general listening strategy…"
Wrong: this build has no Repair sentences (data/vocab.js `repair: []`); trials fall back to call-sign phrases with no
context (js/ex/repair.js:47-51, :65-69), so the Context dial and the context bet do nothing yet.
Rewrite: hide the Context row and the context sentence while sentences() is false.

**C37 · low · js/ex/voices.js:21**
Text: card "Option: record people you know (stays on your phone)."
Wrong: the own-voices module is not in this build (no js/ex/voices-own.js). The card text is not displayed today
(Settings and Cast gate their lines: js/ui/screens/settings.js:88, js/game/screen-cast.js:71), but it will be wrong if
a picker shows card texts.
Rewrite: gate the sentence the way Settings does.

**C38 · low · js/lab/screen-report.js:51-52; js/lab/schedule.js:118**
Text: "…two runs make each check-in steadier, so a real gain shows weeks sooner."
Wrong: the simulation behind it (js/lab/schedule.js:6-7) shows a true 1.5 dB gain reading "clear" by the 4th
check-in ~79 % instead of 56 % of the time; "weeks sooner" was not shown.
Rewrite: "…so a real gain reads clear sooner (in our simulations about 8 in 10 times by the fourth check-in, against
6 in 10 with one run)."

**C39 · low · js/ex/strange.js:44**
Text: "Practising many kinds of unusual voice should train the skill of adapting itself."
Wrong: reads as an expected outcome; the note calls it untested, and Cooke found little carry-over between
distortions within a session (R2:492).
Rewrite: "Our bet: practising many kinds of unusual voice trains the skill of adapting itself."

**C40 · low · js/ui/screens/settings.js:7; js/ui/screens/about.js:12**
Text: Edge "Keeps every dial at the edge of what you can hear." / About "Short closed-set trials hold several dials
at the edge of what you can hear at once … Feedback after every trial lets you hear the voice alone, then the mix again."
Wrong: each trial pushes one focus dial to the edge while the others sit a margin below (docs/dev/PLAN.md:131-134;
js/engine/dials.js:9), as the plateau text itself says ("while the rest sit at comfort", js/engine/plateau.js:123).
"Voice alone, then the mix" is Crowd's replay; Far plays up close then from the distance, Strange replays with the
words, Repair plays the whole sentence then the broken one (js/ex/far.js:81-84; js/ex/strange.js:85;
js/ex/repair.js:96-99).
Rewrite: Edge "Tracks your edge on every dial and pushes one at a time to it, the rest just below. No setup."
About "…push one dial at a time to the edge of what you can hear while tracking all of them … Feedback after every
trial lets you hear the clear version, then the hard one again."

## Notes for the lead

- Build-state findings (C11, C12, C36, C37) disappear if the full packs ship; they still need a release check,
  because the copy is written for content this snapshot does not contain.
- C03 and C33 concern the engine's fallback strategy texts in js/engine/plateau.js:14-22; the fix list already plans
  not to print the engine's advice next to a card, so these texts are reached only when no card is picked.
- C07 and C14 also touch measurement validity (floor start, repeated items); RV-stimuli may want them.
