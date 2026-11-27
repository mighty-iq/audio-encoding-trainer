# Progress: guide (PDF) and announcement (resumable notes; newest at the bottom; times UTC)

Owner: guide builder. Owned paths: docs/guide/** (guide.html, guide.css, figures), tools/build-pdf.py,
tools/shots.py, docs/Earshot-Guide.pdf, docs/dev/announcement.md, this file.
Brief: docs/dev/briefs/phase3.md, section "Guide (PDF) and announcement".

## 2026-11-26 20:34 UTC — start
- Read: phase3 brief, PLAN, README, LICENSE-TEXTS, LICENSES-ASSETS, DECISIONS, R1–R6 summaries and the sections the
  guide cites, ACCESS.md, RV-claims (consistency list), and the code behind every number (dials, planner,
  controller, path, plateau, Lab probes/schedule/stats, game data/weekly/returns/milestones, ex views, settings).
- Pipeline choice: a flowing A4 document (CSS paged media) instead of hand-paginated sheets; page numbers in the
  page margin; tools/build-pdf.py renders twice: pass 1 finds the page of every TOC target from the PDF outline,
  pass 2 writes the numbers into the contents (a third pass only if a number moved).
- Figures: tools/shots.py builds the single file to tests/out/guide/ (never touches index.html or dist/) and shoots
  simulated profiles only (tests/fixtures/game-longterm.js for the game screens; a simulated Lab history).

## 2026-11-26 21:24 UTC — guide, figures and announcement done (status: complete; resumable)
Built: `docs/Earshot-Guide.pdf` (35 A4 pages, about 1.8 MB) from `docs/guide/guide.html` + `guide.css`; figures in
`docs/guide/figures/` (11 PNG, simulated players only; `figures.json` records what each shows); latin-ext subsets of the
same two fonts in `docs/guide/fonts/` (fontsource 5.3.0, OFL texts beside them; needed for Başkent, Kopčo, Papoušek);
`docs/dev/announcement.md` (1,610 characters with the three placeholders; real addresses may total up to 422).

### Rebuild
- Figures: `tools/with-browser.sh python3 tools/shots.py [--only home,map,lab-trend,crowd,far,strange,repair,echo,voices,seek]`
  (builds tests/out/guide/earshot.html with build-single --out; stops if index.html is stale; TZ=UTC, en-GB, 390×844 @2x,
  long-term simulated learner from tests/fixtures/game-longterm.js, seeded simulated Lab history; PNGs re-saved as
  256-colour without metadata). Trial content (names, words, room size, Strange family) changes between runs, so
  captions and alt texts are written to hold for any run; check `figures.json` after a re-shoot (Far is pinned to
  11 m, 1.7 s, +12 dB; Crowd to two same-sex voices at 0 dB).
- PDF: `python3 tools/build-pdf.py [--png DIR] [--pages-url URL --repo-url URL]` (takes a browser slot itself). At
  release pass the final Pages and repository addresses: without them the guide prints plain words, so the owner's
  handle never lands in it by accident. Exit 0 = clean.
- Numbers only: `python3 tools/build-pdf.py --facts` (no browser).

### What build-pdf.py checks (all pass on this build)
Missing images; internal links without a target; elements wider than the page; two-pass contents (named
destinations → page numbers; stable after pass 2); every https URL is a clickable URI annotation (81 URLs, 113
annotations, 195 internal links); no file:// links; only Archivo and JetBrains Mono embedded (no fallback, no Type 3);
no nearly empty page (an exercise spilling a few lines); page count in 24–48; metadata read back (title "Earshot —
player guide", author "the Chimera community", CreationDate/ModDate and XMP dates in UTC, no other name in XMP,
/Lang en); privacy scan of the decompressed objects and the visible text (file://, home/temp paths, the container
time zone and the private strings of tools/privacy_check.py; values never printed). FACTS: 82 numbers tied to code (111 after round 2).

### Page-by-page check
All 35 pages rendered at 60 dpi (cover, contents, chapters at 100 dpi) and looked at after the last change: no
overflow, every exercise on one page, tables full width, figures legible, references in two columns. Chapter ends
leave white space by design (each chapter and each exercise starts a page).

### Numbers in the guide and the code behind them
The round-1 table (82 facts) is superseded by the current table in the round-2 section below.

Numbers from research (dB, points, hours, percentages of studies) come from docs/research and are cited in the guide
with their reading depth: R1 §1, §2.1, §2.2, §3.3, §4, §5, §6 (trial results, failure modes, dose, apps); R2 Summary,
§1.0, §1.3, §1.6, §1.11, §2.1, §3.1–3.6 (adaptation speed, feedback, ramps, structure, sleep); R3 §1, §3, §4, §5, §6,
§7, §8, §9, §10, §12, §14 (masking, space, head turn, gaps, context, familiarity, music, audiomotor, rooms,
cognition, under-tested ideas); R4 §2a, §5a, §6a, §6c, §6e (practice effects, reliable change, headphone check,
remote testing, WHO–ITU); R5 §2.1, §2.3, §2.4, §4.1, §5.1, §5.2, §5.5, §6.1, §6.2 (targets, easy trials, mastery,
curves, game elements, rewards, streaks, returns). No commercial trainer or test is named; the one trial whose title
names a product is cited with the name replaced by a bracketed description.

### For other owners (not done here: not my files)
- LICENSES-ASSETS.md (stimuli): the Fonts table could add "docs/guide/fonts/: latin-ext subsets of the same fonts
  (fontsource 5.3.0, OFL 1.1), used only to render the PDF guide".
- Lead at release: rebuild the PDF with --pages-url/--repo-url once the repository name is final; fill the
  announcement's placeholders; re-run tools/shots.py if the app's look changes before release.

### Dead ends
- CSS `string-set` running heads: Chromium 158 ignores them (margin boxes with counter(page) do work).
- `.wide` on tables needs an explicit width (a negative margin alone does not widen a 100 %-wide table), and a later
  `margin` shorthand on `.figrow` cancelled it (fixed with `.figrow.wide`).
- A clearfix `::after` made an empty page after an exercise that filled its page exactly (`display: flow-root` instead).
- SVG text with a stroke halo made Chromium embed Type 3 fonts; labels are placed clear of the rings instead.

## 2026-11-27 00:43 UTC — round 2: the guide matches the code after fix round 2 (status: complete; resumable)
Sources: docs/dev/reviews/FIX-ROUND-2.md, the round-2 sections of progress/{engine,game,exA,exB,lab,pwa}.md, and the
code itself (every statement below checked in code). Rebuilt without the URL flags: 35 pages, 1,864 KiB, 2 passes,
81 URLs / 113 URI annotations / 195 internal links, only Archivo and JetBrains Mono, metadata in UTC, privacy scan
clean, no nearly empty page, FACTS 111/111. All 35 pages looked at after the last change.

### What changed in the guide
- Figures re-shot (tools/shots.py, simulated players): home (this week 4 sessions; Lab baseline block 1 of 5), crowd
  ("The voice you follow vs the others", 0 dB), far (11 m, 1.7 s, "tap two words from the second phrase"), strange
  (phone line, thin line; two word slots), repair, echo (two questions), seek (Found and Named marked apart, 1.1 m),
  voices (meeting: "Listen for about 7 s, then tap the name", one key), lab-trend ("close to training", "likely
  range"), map (10 of 12 open, "not yet", the mark +3 dB under Club). Alt texts and captions follow the new shots.
- Ch 0/4: dial name "the voice you follow vs the others". Ch 2: install from the Pages site (home screen, offline after
  the first visit), whole-version updates offered between sets, the in-app browser notice (Discord, Instagram,
  Facebook, TikTok, Snapchat, LINE, X; dismissed per device), the single file never installs anything; the web
  version checks its site for a new version (pwa.js CHECK_MS), so "no network requests" now reads "sends nothing
  about you". Tutorial: a wrong practice answer gets a new trial; Skip is always there.
- Ch 3: up to three unplayed exercises open a session in Edge, Path and Variety (all seven by the third session); a
  session counts once it has an answered trial; plateau numbers now cover every simulation run (detection about half
  to more than four in five; false alarms 3 to 8 %).
- Ch 4: foils drawn from answers the player's own voices could have said; Far "then tap what you heard in the
  second"; Strange: other-language model voices reading English, tiers = recogniser difficulty (table row, trains
  line, what you do, one research sentence; no "strong accent" or speaker wording), whisper "in quiet / in noise";
  Seek: the ring rule (within 2.5 m down to 0.9 m), a scene counts when both are right, marked apart; Voices: a
  meeting plays the introduction plus one more line, then one name key.
- Ch 5: reach tags (close to training, a step from training, far from training, everyday life) in the text and the
  Table 5 column; Story = a short story (about 40 seconds) in a busy restaurant; "give or take"; "likely range" in
  place of "90 % interval" in the verdict text, the card guide and the figure; verdict names as the app shows them;
  Focus uses "our starting guesses", not norms.
- Ch 6: earshot on the careful side (90 % sure) and never beyond the hardest level heard; legend "not yet" and "m+";
  the ring mark example (+3 dB under Club); the exercise list under the map and Seek at the lecture hall; milestones
  on the careful side at a tested level, at most two per results screen, level-up lines only at tested levels.
- Announcement: Strange voices reads "other-language model voices" (no accent wording), and the web version
  "installs to your home screen"; 1,660 characters with placeholders, so the three addresses may total up to 372.

### Not confirmable in code, or worth knowing
- The in-app list in code also has Discord (the lead's list did not); the guide names it.
- Echo: the dial still offers "2 details", but the question rule asks one detail fewer than the message holds, up to
  three (echo.js:88), and the build's messages carry 3–5 details, so the guide's "two or three questions" holds.
- Voices: a meeting holds at most two clips (the intro, then the engine's clip or a sentence, phrase or word), so the
  guide says "one more line" rather than "one more sentence".
- Still to come from the lead: shell (Path stage and step, answer counts, Exercises list from Home, failures move on)
  and stimuli (final counts, Story options); counts of voices are not stated in the guide until then.

## 2026-11-27 01:05 UTC — round 2b: shell round 2 (fe51b23, ff62544, 12f2120, aa6dfa2, b2f617f) (status: complete; resumable)
Every statement checked in code (progress/shell.md round-2 section as the map). Rebuilt without the URL flags:
35 pages, 2,079 KiB, all checks pass (links, fonts, metadata, privacy, sparse pages, FACTS 130/130); pages looked at.
- New figures (tools/shots.py `--only exercises,results`): Figure 2 Exercises (the list with Play a set and How it
  works) in ch 2; Figure 13 Results after a set in ch 6 (a short Crowd set answered by script R R P R W R: "9 of 12
  answers right", "4 of 6 trials fully right, 1 partly right", the half-shaded mark). Later figures renumbered 3–12.
  Home re-shot: unchanged in its first screen (the index with Exercises sits below it; the caption says so). Trial
  figures already showed the round-2 bar (whole dial value) and corner marks, so they were not re-shot.
- Ch 2: Home › Exercises (all eight, Play a set in the current mode with the tutorial first, How it works); a
  practice sound that cannot be prepared gets two tries, then the tutorial moves on; sideways phones fit without
  scrolling; screen readers get a heading per trial and announcements (when to answer, right or wrong, feedback).
- Ch 3: a set passed over with its reason (sounds, interruptions, ended before the first answer) while the session
  goes on; only sessions with an answered trial are logged and counted. Table 3: Path shows stage and step in the
  bar, each move on Results, no penalty for a step back, the path complete with Edge offered; Focus shows its target
  with Choose and trains like Edge without one (Home says so); Free includes Seek.
- Ch 6: the results headline counts answers in multi-answer sets, trials on the line below, a half-shaded mark for a
  partly right trial; never more than one invitation card on a results screen.
- Ch 7: backups, exports and the weekly card save through one path (a normal download, or a viewer's own download
  prompt; Copy if nothing arrives). "Deleting everything" folded into section 1 to keep the chapter on one page.
- Voice and clip counts stay out until the stimuli round's final numbers arrive.

## 2026-11-27 01:17 UTC — release candidate (HEAD 9f860da: stimuli round 2, cast labels, version 1.0.0) (status: complete)
Built WITH the release addresses: `python3 tools/build-pdf.py --pages-url https://mighty-iq.github.io/audio-encoding-trainer/
--repo-url https://github.com/mighty-iq/audio-encoding-trainer` → 35 pages, 2,082 KiB, 83 URLs / 118 URI annotations /
195 internal links, only Archivo and JetBrains Mono, metadata in UTC, privacy scan clean (the addresses hold none of
the private strings), FACTS 136/136. Pages looked at: cover, contents, ch 2, ch 6, credits, back page.
- Version 1.0.0 on the cover, in the contents note and on the back page (js/core/ns.js).
- Stimuli numbers come from docs/dev/STIMULI.md (generated): the guide states no total of clips, voices or MB;
  Table 6 now says CREMA-D's sentences are each read by at least 4 of the 8 actors (81 clips kept) and LibriVox gives
  one sentence each from 10 readers; AudioMNIST stays 8 talkers. The matrix word swap (hugs, wipes, dolls) changes no
  guide text (no words are listed; the "no shared word or verb stem" sentence still holds per LICENSES-ASSETS.md).
  Lab Table 5 (lengths, run SDs, reach) rechecked against js/lab through FACTS.
- Cast cards: each card names what the voice is (US English, a voice from a French model reading English).
- Announcement: the three addresses filled in; 1,803 characters (limit 2,000); the comment line says what to post.
- README (the lead's file) — proposed lines: (1) line 8 "- Online: https://mighty-iq.github.io/audio-encoding-trainer/
  (installs to your home screen and opens offline after the first visit)."; (2) line 21 "| Strange voices | Voices
  from other-language models reading English, fast, whispered, phone-quality and robot-like speech | Variety that
  trains adapting to new voices |"; (3) after the table "Home → Exercises lists all eight: play a set of one (its
  tutorial first) or see how it works."; (4) lines 29–30 "before training and then weekly" → "in a five-block
  baseline that starts after your first session, then weekly" (the baseline begins after the first session).

## 2026-11-27 02:39 UTC — final check FC-01…FC-12 (docs/dev/reviews/FINAL-CHECK.md) (status: complete)
Built with the release addresses again: 35 pages, 2,083 KiB, 83 URLs / 118 URI annotations / 195 internal links,
fonts, UTC metadata and privacy scan clean, FACTS 151/151; changed pages looked at (pp. 5, 8, 9, 11, 12, 13, 16, 22, 23).
- FC-01: the plateau rest now reads "a fifth of its usual weight for your next three sessions; you can still pick it
  from Exercises; your Focus target is never rested (another change is chosen)" (planner.js weights and countdown;
  the Focus-target rule is in the engine builder's working tree at the time of writing, plateau.js, commit pending).
- FC-02: "until it has a target, Focus trains like Edge" kept; planner.js and controller.js switch target-less Focus
  to Edge (engine working tree, commit pending); no other guide text describes target-less Focus.
- FC-04: the overnight check is the first three trials of the first session of a new day in Edge, Variety and Focus,
  other voices where possible, reported as a plain count that counts toward the trend; Path skips it, Free skips it
  and fresh ears. FC-05: "almost no trial below 65 %" (Table 1 and the trial-mix sidebar). FC-06: Free says Strange
  voices picks its kind of voice. FC-07: Run SD note rewritten (literature value for the card's figures; the trend
  uses each run's own uncertainty plus a day-to-day term; simulated Matrix run about 0.5 dB). FC-09 "where possible";
  FC-10 "on almost every trial"; FC-11 "(Seek's live search aside)". Strange voices' bet box matches the app's card
  ("Variety that trains adapting to new voices"); Figure 2 (Exercises) re-shot to show the new bet text.
- FC-12: announcement "Every training exercise holds you at your edge …"; 1,812 characters.

### Numbers in the guide and the code behind them (`python3 tools/build-pdf.py --facts`, 2026-11-27 02:39 UTC)
| Statement | Where |
|---|---|
| edge trials aim at about 72 % right | `js/engine/dials.js:121` |
| anchors about 90 %, warm-ups about 85 %, floor 65 % | `js/engine/dials.js:121` |
| Crowd: the voice you follow vs the others -15 to +12 dB, starts at +8 dB | `js/engine/dials.js:31` |
| Crowd: 1 to 3 other voices | `js/engine/dials.js:32` |
| Crowd: similarity other sex .. near-twin | `js/engine/dials.js:34` |
| Crowd: separation 90 deg .. same place, headphones only | `js/engine/dials.js:36-37` |
| Far: distance 1 to 30 m in 11 steps | `js/engine/dials.js:41` |
| Far: echo 0.3 to 3.0 s | `js/engine/dials.js:43` |
| Far: room noise -6 to +30 dB, starts at +24 dB | `js/engine/dials.js:45` |
| Strange: other-language model voices, an easier voice in quiet .. the hardest at -3 dB | `js/engine/dials.js:52-53` |
| Strange: accent tiers = how hard a speech recogniser found the voice; other-language models reading English | `js/engine/dials.js:50-51` |
| Strange: prompt names a voice from another-language model reading English; synthetic voices labelled | `js/ex/strange.js:138` |
| Strange: fast 1.3x to 3x | `js/engine/dials.js:55` |
| Strange: whisper in quiet, in noise +15 .. 0 dB | `js/engine/dials.js:57-58` |
| Strange: phone 300-3400 Hz clear .. 700-2200 Hz +3 dB | `js/engine/dials.js:60-61` |
| Strange: muffled 3 kHz .. 550 Hz | `js/engine/dials.js:64` |
| Strange: vocoded 16 .. 4 bands | `js/engine/dials.js:66` |
| Repair: word lost 30 .. 100 % | `js/engine/dials.js:70` |
| Repair: sentence kept whole .. 50 % | `js/engine/dials.js:75` |
| Repair: gaps loud noise .. silence | `js/engine/dials.js:78` |
| Echo: speech vs noise -8 .. +20 dB, starts +15 | `js/engine/dials.js:81` |
| Echo: 2 .. 5 details; rate normal .. 1.6x; wait 1 .. 10 s | `js/engine/dials.js:82-86` |
| Seek: voice vs noise up close -12 .. +15 dB; 0 .. 4 decoys; pause 1 .. 4 s | `js/engine/dials.js:89-94` |
| Voices: 2 .. 6 voices; mixed .. similar pitch; -6 .. +30 dB; sentence .. one word | `js/engine/dials.js:98-102` |
| set lengths: Crowd 24, Far 20, Strange 20, Repair 22, Echo 10, Seek 6, Voices 22 | `js/engine/dials.js:110-116` |
| a session = minutes / 3 sets; default 15 min | `js/engine/planner.js:97` |
| default exercise weights | `js/engine/planner.js:13` |
| listen-only interludes of 25 s after Strange, Far or Repair sets, at most two a session | `js/engine/planner.js:141` |
| sleep note from the fourth session of a day | `js/engine/planner.js:103` |
| fresh ears after 2 or more days away | `js/engine/planner.js:83` |
| Focus mode: about 60 % of sets on the exercise behind the weakest check-in | `js/engine/planner.js:129` |
| session lengths 10, 15, 20, 30 min | `js/ui/screens/settings.js:13` |
| mode texts (Edge, Path, Variety, Focus 60 %, Free) | `js/ui/screens/settings.js:10` |
| weekly ring: 4 or 5 sessions a week is a good rhythm | `js/ui/widgets.js:7` |
| anchor every 4th-5th trial and after two misses in a row | `js/engine/controller.js:223` |
| focus dial chosen by learning progress, 20 % exploration | `js/engine/controller.js:146` |
| variety widens at 75 % over the last 20 edge trials, narrows below 55 % | `js/engine/learner.js:300-301` |
| Path: 5 in a row fully right or 80 % of the last 15; back one step after 15 trials under 50 % | `js/engine/path.js:107-110` |
| plateau: windows of 10 sessions, flat for 4 windows, band 0.15 dB, no best in 4 sessions | `js/engine/plateau.js:34` |
| plateau: at most one change every 3 sessions | `js/engine/plateau.js:125` |
| plateau breakers in order | `js/engine/plateau.js:18` |
| switch breaker rests the exercise for 3 sessions | `js/engine/plateau.js:178` |
| headphone check: 6 rounds, pass at 5 | `js/lab/hpcheck.js:12` |
| Matrix: 20 sentences, about 3 min, run SD 0.6 dB | `js/lab/probes.js:76-77` |
| Digits: 24 triplets, 2.5 min, run SD 0.9 dB, 2 dB steps | `js/lab/probes.js:121-122` |
| Two voices: 24 trials, 2.5 min, run SD 1.8 dB | `js/lab/probes.js:169-170` |
| Rooms: 12 sentences, 2 min | `js/lab/probes-more.js:23` |
| New voice: 16 sentences, 2.5 min | `js/lab/probes-more.js:67` |
| Story: one passage at +3 dB, 2 min, far from training | `js/lab/probes-more.js:108` |
| Story: a short story (about 40 seconds) in a busy restaurant, then five questions | `js/lab/probes-more.js:110` |
| Diary: five items, 1 min | `js/lab/probes-more.js:166` |
| baseline blocks | `js/lab/schedule.js:18-19` |
| weekly: Matrix and Two voices, rotation Digits, Rooms, New voice, Story; Matrix twice for the first 8 | `js/lab/schedule.js:24-26` |
| verdicts: clear, likely (90 %), lower | `js/lab/stats.js:234-236` |
| no verdict before a measured run 5 days after the baseline | `js/lab/stats.js:150` |
| twelve venues on three lines | `js/game/data.js:1` |
| weekly night out: four stops, six trials each | `js/game/weekly.js:2-3` |
| a cast card turns known after 3 identifications | `js/game/cast.js:11` |
| milestones from at least 6 updates of a dial | `js/game/milestones.js:14` |
| own voices: up to 20 s, 16 kHz mono, IndexedDB on the device | `js/ex/voices-own.js:16` |
| app version 1.0.0 | `js/core/ns.js:8` |
| Far rooms: small 5 m to a hall 38 m long; the talker fits the room | `js/engine/dials.js:40` |
| Far backgrounds per room size (hum, cafe, station, babble) | `js/engine/items/far.js:11` |
| Crowd cue types widen with variety: call sign, voice preview, location; onset jitter | `js/engine/items/crowd.js:4` |
| Echo: two or three questions after a pause | `js/engine/items/echo.js:2` |
| Seek: a field 20 m across (10 m per unit, -1..1) | `js/ex/seek-scene.js:19` |
| Seek head-turn feedback: voice 15-70 degrees to one side | `js/ex/seek-scene.js:217` |
| interlude: about 25 s, nothing to answer, words on screen | `js/ui/interlude.js:27` |
| tutorial: caption, worked example with labelled foils, practice; wrong practice answer gets a new try; ends with the Chimera link | `js/ui/tutorial.js:11` |
| overnight check: first session of a calendar day only | `js/engine/planner.js:54` |
| weekly check-in about 8-9 min after 6.5 days; retention check after 14 days away | `js/lab/schedule.js:4-8` |
| diary: five items, 1 (very hard) to 5 (very easy) | `js/lab/probes-more.js:164` |
| missions: eight, same for everyone per ISO week, swappable, 20-second check-in (tried, 0-10, helped) | `js/ex/missions.js:1-2` |
| milestone names: Equal footing at 0 dB, Through the crowd at -6 dB | `js/game/milestones.js:18-19` |
| three venues open from the start: cafe, lecture hall, phone line | `js/game/venues.js:156` |
| weekly night out: first complete run is the card; weekly trials never teach the learner | `js/game/weekly.js:8-9` |
| pool file: random id, relative days, no name/device/locale/time zone unless ticked, UTC export date | `js/lab/export.js:6` |
| backups: own-voice recordings never included; damaged files refused whole | `js/lab/export.js:2-13` |
| the first three items of a new condition are warm-ups that do not move its level | `js/engine/learner.js:240` |
| Voices: a wrong "who" answer plays the right voice, then the picked one | `docs/dev/DECISIONS.md:39` |
| own voices: name and consent tick; record where allowed, or import a file | `docs/dev/DECISIONS.md:40` |
| Lab: two Matrix runs per check-in lift a true 1.5 dB gain to clear by week 4 in 79 % vs 56 % | `docs/dev/DECISIONS.md:22` |
| plateau simulation: detection 47-86 %, false alarms 3.3-6.3 % (200 learners x 60 days) | `docs/dev/DECISIONS.md:36` |
| plateau simulation after fix round: false alarms 5.5-7.2 %, detection 51-83 % | `docs/dev/progress/engine.md:194` |
| plateau simulation after fix round 2: false alarms 3.8-7.5 %, detection 54-81 % | `docs/dev/progress/engine.md:251` |
| first sessions: up to three unplayed exercises open a session in Edge, Path and Variety (all seven by the third) | `js/engine/planner.js:114-120` |
| a session counts once it has an answered trial | `js/engine/planner.js:19` |
| foils from answers the player's own voice pool can reach | `docs/dev/progress/engine.md:202-203` |
| tutorial: a Skip button in the header | `js/ui/tutorial.js:94` |
| Far: then tap what you heard in the second phrase | `js/ex/far.js:31` |
| Seek: stop with the voice inside the ring around your dot; a scene counts when both are right | `js/ex/seek.js:37` |
| Seek: found within 1.15 x target size (10 m per unit): 0.22 -> 2.5 m, 0.08 -> 0.9 m | `js/engine/dials.js:92` |
| Seek: the scorer counts a stop within 1.15 x the target radius | `js/engine/score.js:24` |
| Voices meet: intro plus one more clip, then tap the name (one key) | `js/ex/voices.js:87-107` |
| Lab: likely range = where the true change lies, 90 % sure | `js/lab/screen-report.js:37` |
| Lab: verdict names (A clear gain, Likely a gain, Not yet clear, Below your baseline) | `js/lab/screen-report.js:11` |
| Lab: a run shows give or take | `js/lab/runner.js:318` |
| Lab: Focus uses our starting guesses, not norms | `js/lab/screen-lab.js:88` |
| game: careful side Z = 1.28 (one-sided 90 % bound) | `js/game/core.js:20` |
| game: claims never beyond the hardest level tested | `js/game/core.js:117` |
| map: earshot careful and never beyond the hardest level heard; "not yet" below reach; "m+" at the top | `js/game/venues.js:95-98` |
| map: earshot read at 72 % right | `js/game/venues.js:2` |
| venue marks: bar +3 dB opens house party, house party +3 dB opens club | `js/game/data.js:49-62` |
| Seek at the lecture hall (open from the start) | `js/game/data.js:73-74` |
| map: where to find each exercise | `js/game/screen-map.js:94` |
| results: at most two milestones, the rest in Progress | `js/game/ui.js:136-137` |
| level-up lines only for levels the player was tested at | `js/game/milestones.js:224` |
| PWA: install, offline, whole-version updates between sets; in-app browsers notice; never in the single file | `js/core/pwa.js:5-9` |
| PWA: in-app browsers Facebook, Instagram, TikTok, Snapchat, LINE, X, Discord; dismissal kept per device | `js/core/pwa.js:30-36` |
| PWA: looks for a new version at most every 30 min | `js/core/pwa.js:22` |
| Home lists Exercises first: all eight, play a set or see how it works | `js/ui/screens/home.js:7` |
| Exercises: Play a set in your mode, its tutorial first the first time; How it works | `js/ui/screens/exercises.js:68` |
| Exercises: eight rows, Missions opens its own screen | `js/ui/screens/exercises.js:8` |
| Free: every runnable exercise (Seek included) | `js/ui/screens/settings-free.js:22` |
| Path: stage and step in the bar | `js/ui/screens/play.js:81-83` |
| Path: a step back has no penalty; last step: the path is complete, Switch to Edge | `js/ui/screens/results.js:66-73` |
| Results: multi-answer sets count answers; trials fully and partly right on the line below | `js/ui/screens/results.js:84-92` |
| Results: a partly right trial gets a half-shaded mark | `css/screens.css:125` |
| a set passed over with its reason (sounds, interruptions, ended before the first answer); the session goes on | `js/ui/screens/results.js:32-34` |
| only sessions with an answered trial are logged | `js/ui/session.js:235` |
| tutorial: a step whose sound cannot be prepared gets two tries | `js/ui/tutorial.js:179` |
| one invitation card per screen | `js/core/chimera.js:85-86` |
| Focus: Settings shows its target with Choose; without one it trains like Edge; Home says so | `js/ui/screens/settings.js:72-75` |
| Home: Focus has no target yet | `js/ui/screens/home.js:36` |
| downloads: one helper for backups, Lab exports and the weekly card; viewer prompt or a normal download; Copy | `js/core/download.js:1-105` |
| screen reader: a heading per trial; announces when to answer, the verdict and the feedback | `js/ui/trialview.js:88` |
| screen reader: an sr-only h1 per trial | `js/ui/screens/play.js:45` |
| sideways phones: trials and feedback fit without scrolling (640x360, 740x360) | `docs/dev/progress/shell.md:143` |
| FC-01: a rest cuts the draw weight to a fifth while rest > 0 | `js/engine/planner.js:36` |
| FC-01: the rest is counted down once per planned session | `js/engine/planner.js:143` |
| FC-01: the current Focus target is never rested (another breaker is chosen) | `js/engine/plateau.js:138-139` |
| FC-02: Focus without a target plans and trains exactly like Edge | `js/engine/planner.js:95` |
| FC-02: Focus without a target picks trials like Edge | `js/engine/controller.js:189` |
| FC-04: the overnight re-test covers the first three trials | `js/engine/controller.js:205` |
| FC-04: Free skips fresh ears and the overnight check; Path skips the overnight check | `js/engine/planner.js:106-111` |
| FC-04: the overnight result is a plain count that counts toward the trend | `js/game/returns.js:69` |
| FC-04: at the hardest level of your last training day | `js/game/returns.js:67` |
| FC-05: a floored dial gets the focus now and then, at its easiest level | `js/engine/controller.js:259-260` |
| FC-06: Free on Strange voices: no dial to set, it picks its kind of voice | `js/ui/screens/settings-free.js:89` |
| FC-07: Run SD is the literature value for the card; the trend adds a day-to-day term | `docs/dev/progress/lab.md:57-58` |
| FC-07: simulated Matrix run SD about 0.5 dB (0.51 true, 0.53 reported) | `docs/dev/progress/lab.md:47` |
| FC-10: Variety on almost every trial | `js/ui/screens/settings.js:9` |
| Strange voices bet on the Exercises card | `js/ex/strange.js:58` |
| AudioMNIST: 8 talkers, Digits check-in only | `docs/dev/STIMULI.md:144` |
| CREMA-D: 8 actors, Two voices only; 81 clips, every one of the 12 texts with at least 4 actors | `docs/dev/STIMULI.md:145` |
| CREMA-D: every text keeps at least 4 actors | `docs/dev/STIMULI.md:106-107` |
| LibriVox: one sentence each from 10 readers, as background talkers | `docs/dev/STIMULI.md:148` |
| cast cards show the voice label (US English, a voice from a French model reading English) and synthetic or recorded | `js/game/cast.js:25` |
| cast card facts: synthetic or recorded voice, the label, pitch | `js/game/screen-cast.js:40` |
| sideways phones: Echo, Voices and Seek at 640x360 (Seek keeps its reveal beside the feedback) | `docs/dev/progress/exB.md:110-111` |
| Matrix words share no word or verb lemma with the British English matrix test | `LICENSES-ASSETS.md:56` |
