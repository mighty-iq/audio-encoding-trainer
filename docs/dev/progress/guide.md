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
time zone and the private strings of tools/privacy_check.py; values never printed). FACTS: 82 numbers tied to code.

### Page-by-page check
All 35 pages rendered at 60 dpi (cover, contents, chapters at 100 dpi) and looked at after the last change: no
overflow, every exercise on one page, tables full width, figures legible, references in two columns. Chapter ends
leave white space by design (each chapter and each exercise starts a page).

### Numbers in the guide and the code behind them (from `python3 tools/build-pdf.py --facts`, 2026-11-26 21:24 UTC)
| Statement | Where |
|---|---|
| edge trials aim at about 72 % right | `js/engine/dials.js:119` |
| anchors about 90 %, warm-ups about 85 %, floor 65 % | `js/engine/dials.js:119` |
| Crowd: your voice vs the others -15 to +12 dB, starts at +8 dB | `js/engine/dials.js:31` |
| Crowd: 1 to 3 other voices | `js/engine/dials.js:32` |
| Crowd: similarity other sex .. near-twin | `js/engine/dials.js:34` |
| Crowd: separation 90 deg .. same place, headphones only | `js/engine/dials.js:36-37` |
| Far: distance 1 to 30 m in 11 steps | `js/engine/dials.js:41` |
| Far: echo 0.3 to 3.0 s | `js/engine/dials.js:43` |
| Far: room noise -6 to +30 dB, starts at +24 dB | `js/engine/dials.js:45` |
| Strange: accent mild/quiet .. strong/-3 dB | `js/engine/dials.js:50-51` |
| Strange: fast 1.3x to 3x | `js/engine/dials.js:53` |
| Strange: whisper quiet, +15 .. 0 dB | `js/engine/dials.js:55` |
| Strange: phone 300-3400 Hz clear .. 700-2200 Hz +3 dB | `js/engine/dials.js:58-59` |
| Strange: muffled 3 kHz .. 550 Hz | `js/engine/dials.js:62` |
| Strange: vocoded 16 .. 4 bands | `js/engine/dials.js:64` |
| Repair: word lost 30 .. 100 % | `js/engine/dials.js:68` |
| Repair: sentence kept whole .. 50 % | `js/engine/dials.js:73` |
| Repair: gaps loud noise .. silence | `js/engine/dials.js:76` |
| Echo: speech vs noise -8 .. +20 dB, starts +15 | `js/engine/dials.js:79` |
| Echo: 2 .. 5 details; rate normal .. 1.6x; wait 1 .. 10 s | `js/engine/dials.js:80-84` |
| Seek: voice vs noise up close -12 .. +15 dB; 0 .. 4 decoys; pause 1 .. 4 s | `js/engine/dials.js:87-92` |
| Voices: 2 .. 6 voices; mixed .. similar pitch; -6 .. +30 dB; sentence .. one word | `js/engine/dials.js:96-100` |
| set lengths: Crowd 24, Far 20, Strange 20, Repair 22, Echo 10, Seek 6, Voices 22 | `js/engine/dials.js:108-114` |
| a session = minutes / 3 sets; default 15 min | `js/engine/planner.js:84` |
| default exercise weights | `js/engine/planner.js:13` |
| listen-only interludes of 25 s after Strange, Far or Repair sets, at most two a session | `js/engine/planner.js:116` |
| sleep note from the fourth session of a day | `js/engine/planner.js:90` |
| fresh ears after 2 or more days away | `js/engine/planner.js:73` |
| Focus mode: about 60 % of sets on the exercise behind the weakest check-in | `js/engine/planner.js:105` |
| session lengths 10, 15, 20, 30 min | `js/ui/screens/settings.js:13` |
| mode texts (Edge, Path, Variety, Focus 60 %, Free) | `js/ui/screens/settings.js:10` |
| weekly ring: 4 or 5 sessions a week is a good rhythm | `js/ui/widgets.js:7` |
| anchor every 4th-5th trial and after two misses in a row | `js/engine/controller.js:219` |
| focus dial chosen by learning progress, 20 % exploration | `js/engine/controller.js:146` |
| variety widens at 75 % over the last 20 edge trials, narrows below 55 % | `js/engine/learner.js:300-301` |
| Path: 5 in a row fully right or 80 % of the last 15; back one step after 15 trials under 50 % | `js/engine/path.js:107-110` |
| plateau: windows of 10 sessions, flat for 4 windows, band 0.15 dB, no best in 4 sessions | `js/engine/plateau.js:33` |
| plateau: at most one change every 3 sessions | `js/engine/plateau.js:112` |
| plateau breakers in order | `js/engine/plateau.js:17` |
| switch breaker rests the exercise for 3 sessions | `js/engine/plateau.js:162` |
| headphone check: 6 rounds, pass at 5 | `js/lab/hpcheck.js:12` |
| Matrix: 20 sentences, about 3 min, run SD 0.6 dB | `js/lab/probes.js:76-77` |
| Digits: 24 triplets, 2.5 min, run SD 0.9 dB, 2 dB steps | `js/lab/probes.js:121-122` |
| Two voices: 24 trials, 2.5 min, run SD 1.8 dB | `js/lab/probes.js:169-170` |
| Rooms: 12 sentences, 2 min | `js/lab/probes-more.js:23` |
| New voice: 16 sentences, 2.5 min | `js/lab/probes-more.js:67` |
| Story: one passage at +3 dB, 2 min | `js/lab/probes-more.js:108` |
| Diary: five items, 1 min | `js/lab/probes-more.js:166` |
| baseline blocks | `js/lab/schedule.js:18-19` |
| weekly: Matrix and Two voices, rotation Digits, Rooms, New voice, Story; Matrix twice for the first 8 | `js/lab/schedule.js:24-26` |
| verdicts: clear, likely (90 %), lower | `js/lab/stats.js:234-236` |
| no verdict before a measured run 5 days after the baseline | `js/lab/stats.js:150` |
| twelve venues on three lines | `js/game/data.js:1` |
| weekly night out: four stops, six trials each | `js/game/weekly.js:2-3` |
| a cast card turns known after 3 identifications | `js/game/cast.js:11` |
| milestones from at least 6 updates of a dial | `js/game/milestones.js:13` |
| own voices: up to 20 s, 16 kHz mono, IndexedDB on the device | `js/ex/voices-own.js:16` |
| app version | `js/core/ns.js:8` |
| Far rooms: small 5 m to a hall 38 m long; the talker fits the room | `js/engine/dials.js:40` |
| Far backgrounds per room size (hum, cafe, station, babble) | `js/engine/items/far.js:11` |
| Crowd cue types widen with variety: call sign, voice preview, location; onset jitter | `js/engine/items/crowd.js:4` |
| Echo: two or three questions after a pause | `js/engine/items/echo.js:2` |
| Seek: a field 20 m across (10 m per unit, -1..1) | `js/ex/seek-scene.js:19` |
| Seek head-turn feedback: voice 15-70 degrees to one side | `js/ex/seek-scene.js:210` |
| interlude: about 25 s, nothing to answer, words on screen | `js/ui/interlude.js:27` |
| tutorial: caption, worked example with labelled foils, practice; wrong practice answer gets a new try; ends with the Chimera link | `js/ui/tutorial.js:9` |
| overnight check: first session of a calendar day only | `js/engine/planner.js:44` |
| weekly check-in about 8-9 min after 6.5 days; retention check after 14 days away | `js/lab/schedule.js:4-8` |
| diary: five items, 1 (very hard) to 5 (very easy) | `js/lab/probes-more.js:164` |
| missions: eight, same for everyone per ISO week, swappable, 20-second check-in (tried, 0-10, helped) | `js/ex/missions.js:1-2` |
| milestone names: Equal footing at 0 dB, Through the crowd at -6 dB | `js/game/milestones.js:17-18` |
| three venues open from the start: cafe, lecture hall, phone line | `js/game/venues.js:135` |
| weekly night out: first complete run is the card; weekly trials never teach the learner | `js/game/weekly.js:8-9` |
| pool file: random id, relative days, no name/device/locale/time zone unless ticked, UTC export date | `js/lab/export.js:6` |
| backups: own-voice recordings never included; damaged files refused whole | `js/lab/export.js:2-13` |
| the first three items of a new condition are warm-ups that do not move its level | `js/engine/learner.js:240` |
| Voices: a wrong "who" answer plays the right voice, then the picked one | `docs/dev/DECISIONS.md:39` |
| own voices: name and consent tick; record where allowed, or import a file | `docs/dev/DECISIONS.md:40` |
| Lab: two Matrix runs per check-in lift a true 1.5 dB gain to clear by week 4 in 79 % vs 56 % | `docs/dev/DECISIONS.md:22` |
| plateau simulation: detection 47-86 %, false alarms 3.3-6.3 % (200 learners x 60 days) | `docs/dev/DECISIONS.md:36` |
| plateau simulation after fix round: false alarms 5.5-7.2 %, detection 51-83 % | `docs/dev/progress/engine.md:190` |
| Matrix words share no word or verb lemma with the British English matrix test | `LICENSES-ASSETS.md:56` |

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
