#!/usr/bin/env python3
"""Render the player guide to docs/Earshot-Guide.pdf and check it.

    tools/with-browser.sh python3 tools/build-pdf.py [--png DIR] [--force] [--pages-url URL] [--repo-url URL]
    python3 tools/build-pdf.py --facts          (only check the guide's numbers against the code; no browser)

1. Opens docs/guide/guide.html in headless Chromium (Playwright) with print media, waits for its fonts and images,
   and checks the layout: missing images, internal links without a target, elements wider than the page.
2. Pass 1 prints the PDF; the page of every link target (the PDF's named destinations, one per #id the guide links
   to) fills the contents and the "page N" references; pass 2 prints again, and passes repeat (at most 4) until no
   number moves.
3. Checks the PDF: every external URL of the guide is a clickable link annotation, internal links are destinations,
   no link points at a file:// address, only Archivo and JetBrains Mono are embedded (a fallback font means a glyph
   the subsets lack), the page count is in PAGES_OK. Then writes the metadata with pikepdf (document info and XMP):
   title, author "the Chimera community", subject, keywords, creator, UTC dates; nothing else names anyone.
4. --png DIR rasterises every page (pdftoppm, 60 dpi) for looking at the layout.
5. FACTS: the numbers the guide states, each tied to the code line it comes from; --facts prints file:line for each
   and fails when a pattern no longer matches (the code changed: update the guide and the pattern together).
--pages-url / --repo-url fill the guide's "where to play" links (left as plain words when not given, so no
address is printed by accident). Runs Chromium: hold a browser slot (tools/with-browser.sh). MIT licence."""
import os
ORIG_TZ = os.environ.get('TZ', '')   # kept only to search the PDF for it (privacy_scan); never printed
os.environ['TZ'] = 'UTC'   # the container keeps a private time zone; dates in the PDF are UTC
import datetime
import json
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = ROOT / 'docs' / 'guide' / 'guide.html'
PDF = ROOT / 'docs' / 'Earshot-Guide.pdf'
PAGES_OK = (24, 48)
FONTS_OK = ('Archivo', 'JetBrainsMono')
META = {
    'title': 'Earshot — player guide',
    'author': 'the Chimera community',
    'subject': 'What Earshot trains, how to train with it, how it measures carry-over, and the research behind each choice.',
    'keywords': 'Earshot, listening, speech in noise, cocktail party, perceptual learning, auditory training, Chimera',
    'creator': 'tools/build-pdf.py (Chromium via Playwright)',
}

# (what the guide says, file, regex that must match the code). --facts prints the file:line of each.
FACTS = [
    ('edge trials aim at about 72 % right', 'js/engine/dials.js', r"target: 0\.72"),
    ('anchors about 90 %, warm-ups about 85 %, floor 65 %', 'js/engine/dials.js', r"anchor: 0\.9, warm: 0\.85, floor: 0\.65"),
    ('Crowd: the voice you follow vs the others -15 to +12 dB, starts at +8 dB', 'js/engine/dials.js', r"cont\('tmr', 'The voice you follow vs the others', 'dB', -15, 12, 0\.5, -1, \{ start: 8"),
    ('Crowd: 1 to 3 other voices', 'js/engine/dials.js', r"\[1, 2, 3\], \['1 other voice', '2 other voices', '3 other voices'\]"),
    ('Crowd: similarity other sex .. near-twin', 'js/engine/dials.js', r"\['other sex', 'same sex', 'same sex, similar pitch', 'near-twin voice'\]"),
    ('Crowd: separation 90 deg .. same place, headphones only', 'js/engine/dials.js', r"\[90, 45, 30, 20, 15, 10, 5, 0\].*\n.*requires: 'headphones'"),
    ('Far: distance 1 to 30 m in 11 steps', 'js/engine/dials.js', r"\[1, 1\.5, 2, 3, 4, 6, 8, 11, 16, 22, 30\]"),
    ('Far: echo 0.3 to 3.0 s', 'js/engine/dials.js', r"\[0\.3, 0\.45, 0\.6, 0\.8, 1\.0, 1\.3, 1\.7, 2\.2, 3\.0\]"),
    ('Far: room noise -6 to +30 dB, starts at +24 dB', 'js/engine/dials.js', r"cont\('noise', 'Room noise \(speech vs noise\)', 'dB', -6, 30, 1, -1, \{ start: 24"),
    ('Strange: other-language model voices, an easier voice in quiet .. the hardest at -3 dB', 'js/engine/dials.js', r"'an easier accented voice, quiet', 'an easier accented voice, \+10 dB', 'a harder accented voice, \+10 dB', 'a harder accented voice, \+6 dB',\s*\n\s*'the hardest accented voices, \+6 dB', 'the hardest accented voices, \+3 dB', 'the hardest accented voices, 0 dB', 'the hardest accented voices, −3 dB'\]"),
    ('Strange: accent tiers = how hard a speech recogniser found the voice; other-language models reading English', 'js/engine/dials.js', r"tiers rank how hard a voice is to understand \(recogniser accuracy at 0 dB\), not how strong its accent is;\s*\n\s*// the voices are other-language models reading English"),
    ('Strange: prompt names a voice from another-language model reading English; synthetic voices labelled', 'js/ex/strange.js', r"var label = m\.synthetic === true \? 'synthetic voice'"),
    ('Strange: fast 1.3x to 3x', 'js/engine/dials.js', r"\[1\.3, 1\.5, 1\.7, 1\.9, 2\.1, 2\.3, 2\.6, 3\.0\]"),
    ('Strange: whisper in quiet, in noise +15 .. 0 dB', 'js/engine/dials.js', r"\[null, 15, 10, 6, 3, 0\],\s*\n\s*\['in quiet', 'in noise, \+15 dB', 'in noise, \+10 dB', 'in noise, \+6 dB', 'in noise, \+3 dB', 'in noise, 0 dB'\]"),
    ('Strange: phone 300-3400 Hz clear .. 700-2200 Hz +3 dB', 'js/engine/dials.js', r"\{ lo: 300, hi: 3400, snr: null \}.*\n.*\{ lo: 700, hi: 2200, snr: 3 \}"),
    ('Strange: muffled 3 kHz .. 550 Hz', 'js/engine/dials.js', r"\[3000, 2200, 1600, 1200, 900, 700, 550\]"),
    ('Strange: vocoded 16 .. 4 bands', 'js/engine/dials.js', r"\[16, 12, 10, 8, 6, 5, 4\]"),
    ('Repair: word lost 30 .. 100 %', 'js/engine/dials.js', r"ord\('gap', 'Word lost', '%', \[0\.3, 0\.45, 0\.6, 0\.75, 0\.9, 1\.0\]"),
    ('Repair: sentence kept whole .. 50 %', 'js/engine/dials.js', r"\['whole sentence', '75 % kept', '65 % kept', '55 % kept', '50 % kept'\]"),
    ('Repair: gaps loud noise .. silence', 'js/engine/dials.js', r"\['loud noise', 'noise', 'soft noise', 'silence'\]"),
    ('Echo: speech vs noise -8 .. +20 dB, starts +15', 'js/engine/dials.js', r"cont\('snr', 'Speech vs noise', 'dB', -8, 20, 0\.5, -1, \{ start: 15"),
    ('Echo: 2 .. 5 details; rate normal .. 1.6x; wait 1 .. 10 s', 'js/engine/dials.js', r"\['2 details', '3 details', '4 details', '5 details'\][\s\S]*\['normal', '1\.15×', '1\.3×', '1\.45×', '1\.6×'\][\s\S]*\['1 s', '3 s', '6 s', '10 s'\]"),
    ('Seek: voice vs noise up close -12 .. +15 dB; 0 .. 4 decoys; pause 1 .. 4 s', 'js/engine/dials.js', r"cont\('snr', 'Voice vs noise \(up close\)', 'dB', -12, 15[\s\S]*\['none', '1 decoy', '2 decoys', '3 decoys', '4 decoys'\][\s\S]*\['1 s', '1\.5 s', '2\.2 s', '3 s', '4 s'\]"),
    ('Voices: 2 .. 6 voices; mixed .. similar pitch; -6 .. +30 dB; sentence .. one word', 'js/engine/dials.js', r"\['2 voices', '3 voices', '4 voices', '5 voices', '6 voices'\][\s\S]*\['mixed', 'same sex', 'same sex, similar pitch'\][\s\S]*cont\('snr', 'Speech vs noise', 'dB', -6, 30[\s\S]*\['a sentence', 'a few words', 'one word'\]"),
    ('set lengths: Crowd 24, Far 20, Strange 20, Repair 22, Echo 10, Seek 6, Voices 22', 'js/engine/dials.js', r"crowd: \{[^}]*setTrials: 24[\s\S]*far: \{[^}]*setTrials: 20[\s\S]*strange: \{[^}]*setTrials: 20[\s\S]*repair: \{[^}]*setTrials: 22[\s\S]*echo: \{[^}]*setTrials: 10[\s\S]*seek: \{[^}]*setTrials: 6[\s\S]*voices: \{[^}]*setTrials: 22"),
    ('a session = minutes / 3 sets; default 15 min', 'js/engine/planner.js', r"opts\.minutes \|\| opts\.sessionMin \|\| 15, nSets = Math\.max\(1, Math\.round\(minutes / 3\)\)"),
    ('default exercise weights', 'js/engine/planner.js', r"var W = \{ crowd: 0\.20, repair: 0\.12, seek: 0\.08, far: 0\.22, strange: 0\.18, echo: 0\.12, voices: 0\.08 \}"),
    ('listen-only interludes of 25 s after Strange, Far or Repair sets, at most two a session', 'js/engine/planner.js', r"INTERLUDE\[s\.exId\] && i < sets\.length - 1 && nInter < 2\) \{ s\.interlude = \{ kind: 'exposure', ex: s\.exId, seconds: 25 \}"),
    ('sleep note from the fourth session of a day', 'js/engine/planner.js', r"if \(today >= 3\) notes\.push"),
    ('fresh ears after 2 or more days away', 'js/engine/planner.js', r"if \(away < 2\) return null"),
    ('Focus mode: about 60 % of sets on the exercise behind the weakest check-in', 'js/engine/planner.js', r"Math\.round\(0\.6 \* nSets\)"),
    ('session lengths 10, 15, 20, 30 min', 'js/ui/screens/settings.js', r"var LENGTHS = \[10, 15, 20, 30\]"),
    ('mode texts (Edge, Path, Variety, Focus 60 %, Free)', 'js/ui/screens/settings.js', r"\['focus', 'Focus', 'Spends 60 % of the time on your hardest situation\.'"),
    ('weekly ring: 4 or 5 sessions a week is a good rhythm', 'js/ui/widgets.js', r"RING_SEGMENTS = 5, GOOD_RHYTHM = \[4, 5\]"),
    ('anchor every 4th-5th trial and after two misses in a row', 'js/engine/controller.js', r"\(set\.sinceAnchor \|\| 0\) >= \(set\.anchorGap \|\| 4\) \|\| \(set\.misses \|\| 0\) >= 2"),
    ('focus dial chosen by learning progress, 20 % exploration', 'js/engine/controller.js', r"if \(cands\.length === 1 \|\| rng\.next\(\) < 0\.2\) return"),
    ('variety widens at 75 % over the last 20 edge trials, narrows below 55 %', 'js/engine/learner.js', r"if \(a >= 0\.75\)[^\n]*\n[^\n]*else if \(a < 0\.55\)"),
    ('Path: 5 in a row fully right or 80 % of the last 15; back one step after 15 trials under 50 %', 'js/engine/path.js', r"ps\.run >= 5 \|\| \(ps\.hist\.length >= 15 && mean >= 0\.8\)[\s\S]*ps\.n >= 15 && mean < 0\.5"),
    ('plateau: windows of 10 sessions, flat for 4 windows, band 0.15 dB, no best in 4 sessions', 'js/engine/plateau.js', r"window: 10, band: 0\.15[^\n]*persist: 4, pbSessions: 4"),
    ('plateau: at most one change every 3 sessions', 'js/engine/plateau.js', r"all\.length - pl\.at < 3\) return null"),
    ('plateau breakers in order', 'js/engine/plateau.js', r"var ORDER = \['variety', 'focus', 'anchors', 'strategy', 'sleep', 'switch'\]"),
    ('switch breaker rests the exercise for 3 sessions', 'js/engine/plateau.js', r"if \(b\.kind === 'switch'\) pl\.rest = 3"),
    ('headphone check: 6 rounds, pass at 5', 'js/lab/hpcheck.js', r"N: 6, PASS: 5"),
    ('Matrix: 20 sentences, about 3 min, run SD 0.6 dB', 'js/lab/probes.js', r"id: 'matrix', name: 'Matrix', distance: 'near–mid', reach: 'close to training', minutes: 3, core: true, proc: 'matrix-1', n: 20,\s*\n\s*unit: 'dB', better: -1, sigmaW: 0\.6"),
    ('Digits: 24 triplets, 2.5 min, run SD 0.9 dB, 2 dB steps', 'js/lab/probes.js', r"id: 'digits', name: 'Digits', distance: 'mid', reach: 'a step from training', minutes: 2\.5, core: true, proc: 'digits-1', n: 24,\s*\n\s*unit: 'dB', better: -1, sigmaW: 0\.9"),
    ('Two voices: 24 trials, 2.5 min, run SD 1.8 dB', 'js/lab/probes.js', r"id: 'twovoices', name: 'Two voices', distance: 'mid', reach: 'a step from training', minutes: 2\.5, core: true, proc: 'twovoices-1', n: 24,\s*\n\s*unit: 'dB', better: -1, sigmaW: 1\.8"),
    ('Rooms: 12 sentences, 2 min', 'js/lab/probes-more.js', r"id: 'rooms', name: 'Rooms', distance: 'mid', reach: 'a step from training', minutes: 2, core: false, proc: 'rooms-1', n: 12"),
    ('New voice: 16 sentences, 2.5 min', 'js/lab/probes-more.js', r"id: 'newvoice', name: 'New voice', distance: 'mid', reach: 'a step from training', minutes: 2\.5, core: false, proc: 'newvoice-1', n: 16"),
    ('Story: one passage at +3 dB, 2 min, far from training', 'js/lab/probes-more.js', r"id: 'story', name: 'Story', distance: 'far', reach: 'far from training', minutes: 2, core: false, proc: 'story-1', n: 1, snr: 3"),
    ('Story: a short story (about 40 seconds) in a busy restaurant, then five questions', 'js/lab/probes-more.js', r"short: 'A short story \(about 40 seconds\) in a busy restaurant, then five questions\.'"),
    ('Diary: five items, 1 min', 'js/lab/probes-more.js', r"id: 'diary', name: 'Diary', distance: 'far', reach: 'everyday life', minutes: 1"),
    ('baseline blocks', 'js/lab/schedule.js', r"\[\['matrix', 1\], \['digits', 1\]\],\s*\n\s*\[\['matrix', 2\], \['digits', 2\], \['twovoices', 1\]\]"),
    ('weekly: Matrix and Two voices, rotation Digits, Rooms, New voice, Story; Matrix twice for the first 8', 'js/lab/schedule.js', r"var ROTATION = \['digits', 'rooms', 'newvoice', 'story'\];\s*\n\s*var EVERY_WEEK = \['matrix', 'twovoices'\];\s*\n\s*var DOUBLE_WEEKS = 8;"),
    ('verdicts: clear, likely (90 %), lower', 'js/lab/stats.js', r"if \(t\.gain >= t\.sdc && t\.lo90 > 0\) return 'clear';\s*\n\s*if \(t\.gain <= -t\.sdc && t\.hi90 < 0\) return 'lower';\s*\n\s*if \(t\.pUp >= 0\.9\) return 'likely';"),
    ('no verdict before a measured run 5 days after the baseline', 'js/lab/stats.js', r"minDays = o\.minDays != null \? o\.minDays : 5"),
    ('twelve venues on three lines', 'js/game/data.js', r"Night out: twelve venues"),
    ('weekly night out: four stops, six trials each', 'js/game/weekly.js', r"four stops\s*\n?\s*\(Crowd, Far, Strange voices, Repair\) in a seeded order, each at a seeded venue, six trials per stop"),
    ('a cast card turns known after 3 identifications', 'js/game/cast.js', r"KNOWN_AT = 3"),
    ('milestones from at least 6 updates of a dial', 'js/game/milestones.js', r"var MIN_N = 6;"),
    ('own voices: up to 20 s, 16 kHz mono, IndexedDB on the device', 'js/ex/voices-own.js', r"var DB = 'earshot-own', SR = 16000, MAX_S = 20"),
    ('app version', 'js/core/ns.js', r"ES\.VERSION = '0\.1\.0'"),
    ('Far rooms: small 5 m to a hall 38 m long; the talker fits the room', 'js/engine/dials.js', r"small 5 m, medium 10 m, large 22 m, hall 38 m long"),
    ('Far backgrounds per room size (hum, cafe, station, babble)', 'js/engine/items/far.js', r"var BEDS = \{ small: \['hum'\], medium: \['cafe', 'hum'\], large: \['babble', 'station', 'cafe'\], hall: \['hall', 'babble', 'station'\] \}"),
    ('Crowd cue types widen with variety: call sign, voice preview, location; onset jitter', 'js/engine/items/crowd.js', r"cue types \(call sign, voice preview, location\) and onset jitter"),
    ('Echo: two or three questions after a pause', 'js/engine/items/echo.js', r"a pause, then 2–3 questions"),
    ('Seek: a field 20 m across (10 m per unit, -1..1)', 'js/ex/seek-scene.js', r"var M_PER_UNIT = 10"),
    ('Seek head-turn feedback: voice 15-70 degrees to one side', 'js/ex/seek-scene.js', r"if \(b >= 15 && b <= 70\) st\.earMs \+= dt"),
    ('interlude: about 25 s, nothing to answer, words on screen', 'js/ui/interlude.js', r"'About ' \+ secs \+ ' seconds\. Nothing to answer\.'"),
    ('tutorial: caption, worked example with labelled foils, practice; wrong practice answer gets a new try; ends with the Chimera link', 'js/ui/tutorial.js', r"A wrong practice answer offers \"Try again\" with a new trial of the same step"),
    ('overnight check: first session of a calendar day only', 'js/engine/planner.js', r"only the first session of a calendar day opens with it"),
    ('weekly check-in about 8-9 min after 6.5 days; retention check after 14 days away', 'js/lab/schedule.js', r"Weekly check-in \(≈ 8–9 min\) once ≥ 6\.5 days have passed[\s\S]*After 14 days or more away, the next check-in is a retention check"),
    ('diary: five items, 1 (very hard) to 5 (very easy)', 'js/lab/probes-more.js', r"var SCALE = \['very hard', 'hard', 'mixed', 'easy', 'very easy'\]"),
    ('missions: eight, same for everyone per ISO week, swappable, 20-second check-in (tried, 0-10, helped)', 'js/ex/missions.js', r"one real-world listening task a week and a 20-second check-in\s*\n\s*\(did you try it, how much of the talk you followed 0–10, did the trick help\)"),
    ('milestone names: Equal footing at 0 dB, Through the crowd at -6 dB', 'js/game/milestones.js', r"0: 'Equal footing'[\s\S]*'-6': 'Through the crowd'"),
    ('three venues open from the start: cafe, lecture hall, phone line', 'js/game/venues.js', r"Three venues are open from the start"),
    ('weekly night out: first complete run is the card; weekly trials never teach the learner', 'js/game/weekly.js', r"The first complete run of a week is that week's card; later runs are practice[\s\S]*Weekly trials never teach the learner"),
    ('pool file: random id, relative days, no name/device/locale/time zone unless ticked, UTC export date', 'js/lab/export.js', r"pooled\(opts\): the community format: a random pooling id, no name unless opts\.nickname"),
    ('backups: own-voice recordings never included; damaged files refused whole', 'js/lab/export.js', r"own-voice\s+recordings live in IndexedDB and are never included[\s\S]*a file with any damaged value is refused whole"),
    ('the first three items of a new condition are warm-ups that do not move its level', 'js/engine/learner.js', r"var newCond = c\.n < 3 && !\(trial\.meta && trial\.meta\.task === 'meet'\); // first items of a condition"),
    ('Voices: a wrong "who" answer plays the right voice, then the picked one', 'docs/dev/DECISIONS.md', r"a 'who' miss auto-plays the right voice then the picked one"),
    ('own voices: name and consent tick; record where allowed, or import a file', 'docs/dev/DECISIONS.md', r"Voices from your life: name \+ consent tick required; record \(≤ 20 s\) only where the permissions policy allows the microphone"),
    ('Lab: two Matrix runs per check-in lift a true 1.5 dB gain to clear by week 4 in 79 % vs 56 %', 'docs/dev/DECISIONS.md', r"56 % of simulated players by week 4 versus 79 % with two runs"),
    ('plateau simulation: detection 47-86 %, false alarms 3.3-6.3 % (200 learners x 60 days)', 'docs/dev/DECISIONS.md', r"Simulated false alarms 3\.3–6\.3 %.*flat stretches detected 47 % \(Focus\) to 86 % \(Variety\); earliest call at the 13th session"),
    ('plateau simulation after fix round: false alarms 5.5-7.2 %, detection 51-83 %', 'docs/dev/progress/engine.md', r"plateau false alarms 5\.5–7\.2 % and detection 51–83 %"),
    ('plateau simulation after fix round 2: false alarms 3.8-7.5 %, detection 54-81 %', 'docs/dev/progress/engine.md', r"plateau false alarms 3\.8–7\.5 %, detection 54–81 %"),
    # fix round 2
    ('first sessions: up to three unplayed exercises open a session in Edge, Path and Variety (all seven by the third)', 'js/engine/planner.js', r"a new player meets every exercise within the first three sessions \(FRESH-B C1\): up to three not yet played[\s\S]*if \(mode === 'edge' \|\| mode === 'path' \|\| mode === 'variety'\)[\s\S]*\.slice\(0, 3\);"),
    ('a session counts once it has an answered trial', 'js/engine/planner.js', r"Sessions that count: at least one answered trial"),
    ('foils from answers the player\'s own voice pool can reach', 'docs/dev/progress/engine.md', r"ST-03 fixed: foils from the reachable answers \(X\.reach/slotDist\) in Crowd, Far, Strange, Repair, Seek, Voices,\s*\n\s*Echo"),
    ('tutorial: a Skip button in the header', 'js/ui/tutorial.js', r"'data-skip-tutorial': ''[^\n]*'Skip'\);"),
    ('Far: then tap what you heard in the second phrase', 'js/ex/far.js', r"then tap what you heard in the second"),
    ('Seek: stop with the voice inside the ring around your dot; a scene counts when both are right', 'js/ex/seek.js', r"Stop with the voice inside the ring around your dot, then tap the word it was calling\. A scene counts when both are right\."),
    ('Seek: found within 1.15 x target size (10 m per unit): 0.22 -> 2.5 m, 0.08 -> 0.9 m', 'js/engine/dials.js', r"ord\('size', 'Target size', '', \[0\.22, 0\.17, 0\.13, 0\.1, 0\.08\]"),
    ('Seek: the scorer counts a stop within 1.15 x the target radius', 'js/engine/score.js', r"ok = Math\.sqrt\(dx \* dx \+ dy \* dy\) <= sl\.answer\.r \* 1\.15;"),
    ('Voices meet: intro plus one more clip, then tap the name (one key)', 'js/ex/voices.js', r"Two at most, so an introduction lasts about 4–8 s\.[\s\S]*' Listen for about ' \+ Math\.max\(2, Math\.round\(t\.audio\.dur \|\| 0\)\) \+ ' s, then tap the name\.'"),
    ('Lab: likely range = where the true change lies, 90 % sure', 'js/lab/screen-report.js', r"The likely range is where the true change lies, 90\\u00a0% sure\."),
    ('Lab: verdict names (A clear gain, Likely a gain, Not yet clear, Below your baseline)', 'js/lab/screen-report.js', r"var HEAD = \{ clear: 'A clear gain', likely: 'Likely a gain', unclear: 'Not yet clear', lower: 'Below your baseline',"),
    ('Lab: a run shows give or take', 'js/lab/runner.js', r"' give or take '"),
    ('Lab: Focus uses our starting guesses, not norms', 'js/lab/screen-lab.js', r"The starting guesses are ours, not norms\."),
    ('game: careful side Z = 1.28 (one-sided 90 % bound)', 'js/game/core.js', r"var Z = 1\.28;\s*// careful side: the one-sided 90 % bound of an estimate"),
    ('game: claims never beyond the hardest level tested', 'js/game/core.js', r"var careful = e\.m - d\.dir \* Z \* e\.s, capped = d\.dir \* \(careful - t\) > 0;"),
    ('map: earshot careful and never beyond the hardest level heard; "not yet" below reach; "m+" at the top', 'js/game/venues.js', r"function outOfReach\(\) \{ return 'not yet'; \}\s*\n\s*function topOfScale\(ex, d, hard\) \{\s*\n\s*var t = K\(\)\.levelText\(ex, d, hard\);\s*\n\s*if \(d\.unit === 'm'\) return t \+ '\+';"),
    ('map: earshot read at 72 % right', 'js/game/venues.js', r"the engine's model predicts 72 % right"),
    ('venue marks: bar +3 dB opens house party, house party +3 dB opens club', 'js/game/data.js', r"id: 'party', name: 'House party'[\s\S]*?opens: \{ from: 'bar', at: 3 \} \},\s*\n\s*\{ id: 'club', name: 'Club'[\s\S]*?opens: \{ from: 'party', at: 3 \} \}"),
    ('Seek at the lecture hall (open from the start)', 'js/game/data.js', r"\{ ex: 'seek', pin: \{ decoys: 0, size: 0, gap: 0 \}, dial: 'snr', label: 'Find the talker in the hall' \}\],\s*\n\s*opens: null \},"),
    ('map: where to find each exercise', 'js/game/screen-map.js', r"el\('h2', null, 'Where to find each exercise'\)"),
    ('results: at most two milestones, the rest in Progress', 'js/game/ui.js', r"ms\.slice\(0, 2\)\.forEach[\s\S]*' more milestone'"),
    ('level-up lines only for levels the player was tested at', 'js/game/milestones.js', r"if \(t === null \|\| d\.dir \* \(shown - t\) > 1e-9\) return;"),
    ('PWA: install, offline, whole-version updates between sets; in-app browsers notice; never in the single file', 'js/core/pwa.js', r"single-file build inlines every script, so it never registers there[\s\S]*Updates are taken as whole versions[\s\S]*It never appears during a set"),
    ('PWA: in-app browsers Facebook, Instagram, TikTok, Snapchat, LINE, X, Discord; dismissal kept per device', 'js/core/pwa.js', r"\['Facebook',[\s\S]*\['Instagram',[\s\S]*\['TikTok',[\s\S]*\['Snapchat',[\s\S]*\['LINE',[\s\S]*\['X',[\s\S]*\['Discord',"),
    ('PWA: looks for a new version at most every 30 min', 'js/core/pwa.js', r"var CHECK_MS = 30 \* 60 \* 1000;"),
    # shell round 2
    ('Home lists Exercises first: all eight, play a set or see how it works', 'js/ui/screens/home.js', r"\['exercises', 'Exercises', 'All eight by name: play a set of one, or see how it works'\]"),
    ('Exercises: Play a set in your mode, its tutorial first the first time; How it works', 'js/ui/screens/exercises.js', r"Play a set of one here; the first time, its two-minute tutorial comes first\. Your mode stays as it is\."),
    ('Exercises: eight rows, Missions opens its own screen', 'js/ui/screens/exercises.js', r"var ORDER = \['crowd', 'far', 'strange', 'repair', 'echo', 'seek', 'voices', 'missions'\];"),
    ('Free: every runnable exercise (Seek included)', 'js/ui/screens/settings-free.js', r"return \(E\(\)\.exercises \|\| \[\]\)\.filter\(function \(id\) \{ return I\.runnable\(id\)"),
    ('Path: stage and step in the bar', 'js/ui/screens/play.js', r"title\.textContent = place\.stage;[\s\S]*'Path step ' \+ place\.pos \+ ' of ' \+ place\.of"),
    ('Path: a step back has no penalty; last step: the path is complete, Switch to Edge', 'js/ui/screens/results.js', r"The path went back a step to firm it up\. No penalty[\s\S]*the path is complete\.[\s\S]*'Switch to Edge'"),
    ('Results: multi-answer sets count answers; trials fully and partly right on the line below', 'js/ui/screens/results.js', r"' answers right'\][\s\S]*' trials fully right' \+ \(T\.partial \? ', ' \+ T\.partial \+ ' partly right' : ''\)"),
    ('Results: a partly right trial gets a half-shaded mark', 'css/screens.css', r"\.glyph-row li\.is-partial \{ background: linear-gradient\(135deg, var\(--ok-wash\) 50%, var\(--surface-2\) 50%\); \}"),
    ('a set passed over with its reason (sounds, interruptions, ended before the first answer); the session goes on', 'js/ui/screens/results.js', r"ended: 'You ended it before the first answer, so nothing was counted\.',\s*\n\s*sounds: 'Its sounds could not be prepared on this device, so it was passed over\.[\s\S]*voided: 'Its trials were interrupted too often, so it was passed over\."),
    ('only sessions with an answered trial are logged', 'js/ui/session.js', r"One definition of a session \(round 2\): it holds at least one answered trial\. Only such sessions are logged;"),
    ('tutorial: a step whose sound cannot be prepared gets two tries', 'js/ui/tutorial.js', r"unplayable: a new trial, at most twice per step"),
    ('one invitation card per screen', 'js/core/chimera.js', r"a screen never\s*\n\s*shows more than one card\."),
    ('Focus: Settings shows its target with Choose; without one it trains like Edge; Home says so', 'js/ui/screens/settings.js', r"'No target yet: choose one, or run a Lab check-in\. Until then Focus trains like Edge\.'[\s\S]*'Focus aims at'[\s\S]*ES\.ui\.button\('Choose'"),
    ('Home: Focus has no target yet', 'js/ui/screens/home.js', r"'Focus has no target yet: '"),
    ('downloads: one helper for backups, Lab exports and the weekly card; viewer prompt or a normal download; Copy', 'js/core/download.js', r"the one way Earshot saves a file: backups, Lab exports \(JSON, CSV, pool file\) and the weekly\s*\n\s*card \(PNG\)[\s\S]*if nothing appeared, use Copy instead"),
    ('screen reader: a heading per trial; announces when to answer, the verdict and the feedback', 'js/ui/trialview.js', r"live region carries what a screen reader needs: when to answer, the verdict and the feedback, problems\."),
    ('screen reader: an sr-only h1 per trial', 'js/ui/screens/play.js', r"h1 = U\.el\('h1', \{ class: 'sr-only' \}\)"),
    ('sideways phones: trials and feedback fit without scrolling (640x360, 740x360)', 'docs/dev/progress/shell.md', r"shell_layout now holds 640×360 and 740×360 to the no-scroll rule"),
    ('sideways phones: Echo, Voices and Seek at 640x360 (Seek keeps its reveal beside the feedback)', 'docs/dev/progress/exB.md', r"A1 · checked at 640×360 with the shell's working-tree landscape rules: Echo and Voices fit in every state; Seek\s*\n\s*gets a wider room \(two equal columns\) and keeps its reveal beside the feedback\."),
    ('Matrix words share no word or verb lemma with the British English matrix test', 'LICENSES-ASSETS.md', r"they share no word and no verb lemma with it"),
]


def facts(report=True):
    bad = 0
    out = []
    for what, path, rx in FACTS:
        f = ROOT / path
        txt = f.read_text(encoding='utf8') if f.exists() else ''
        m = re.search(rx, txt)
        if m:
            line = txt.count('\n', 0, m.start()) + 1
            end = txt.count('\n', 0, m.end()) + 1
            out.append((what, f'{path}:{line}' + (f'-{end}' if end != line else ''), 'ok'))
        else:
            bad += 1
            out.append((what, path, 'CHANGED'))
    if report:
        for what, where, st in out:
            print(f'{st:8} {where:34} {what}')
    return bad, out


# ---------------------------------------------------------------- browser side
CHECKS = """() => {
  const out = { missing: [], badLinks: [], wide: [], urls: [], ids: [] };
  for (const i of document.images) if (!i.complete || !i.naturalWidth) out.missing.push(i.getAttribute('src'));
  const ids = new Set(Array.from(document.querySelectorAll('[id]')).map(e => e.id));
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.getAttribute('href');
    if (h.startsWith('#')) { if (!ids.has(h.slice(1))) out.badLinks.push(h); else out.ids.push(h.slice(1)); }
    else if (/^https:\\/\\//.test(h)) out.urls.push(h);
    else out.badLinks.push(h);
  }
  const W = document.body.getBoundingClientRect().right + 0.75;
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect();
    if (r.width && r.right > W && !e.closest('.cover')) {
      const t = (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
      out.wide.push(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' "' + t + '" +' + Math.round((r.right - W) * 25.4 / 96 * 10) / 10 + 'mm');
    }
  }
  out.urls = Array.from(new Set(out.urls)); out.ids = Array.from(new Set(out.ids)); out.badLinks = Array.from(new Set(out.badLinks));
  out.wide = out.wide.slice(0, 12);
  return out;
}"""

FILL = """(pages) => {
  let changed = 0;
  for (const el of document.querySelectorAll('[data-for]')) {
    const v = pages[el.getAttribute('data-for')];
    const t = v ? String(v) : '00';
    if (el.textContent !== t) { el.textContent = t; changed++; }
  }
  return changed;
}"""

URLS = """([pages, repo]) => {
  for (const el of document.querySelectorAll('[data-url]')) {
    const u = el.getAttribute('data-url') === 'pages' ? pages : repo;
    if (!u) continue;
    const a = document.createElement('a'); a.href = u; a.className = 'ext'; a.textContent = u.replace(/^https:\\/\\//, '');
    el.replaceWith(a);
  }
}"""


def dest_pages(path):
    """{id: page number} from the PDF's named destinations (Chromium writes one per #id the document links to)."""
    from pypdf import PdfReader
    r = PdfReader(str(path))
    out = {}
    for name, dest in r.named_destinations.items():
        try:
            out[name.lstrip('/')] = r.get_destination_page_number(dest) + 1
        except Exception:
            pass
    return out, len(r.pages)


def render(page, path):
    page.pdf(path=str(path), prefer_css_page_size=True, print_background=True, outline=True, tagged=True,
             display_header_footer=False)


def check_pdf(path, urls):
    from pypdf import PdfReader
    r = PdfReader(str(path))
    found, internal, files = {}, 0, []
    for i, pg in enumerate(r.pages):
        for a in pg.get('/Annots') or []:
            o = a.get_object()
            if o.get('/Subtype') != '/Link':
                continue
            act = o.get('/A')
            act = act.get_object() if act is not None else None
            uri = act.get('/URI') if act is not None else None
            if uri:
                found.setdefault(str(uri), []).append(i + 1)
                if str(uri).startswith('file:'):
                    files.append(str(uri))
            elif o.get('/Dest') is not None or (act is not None and act.get('/S') == '/GoTo'):
                internal += 1
    norm = lambda u: u.rstrip('/')  # noqa: E731
    have = {norm(u) for u in found}
    missing = sorted({u for u in urls if norm(u) not in have})
    return len(r.pages), found, internal, missing, files


def privacy_scan(path):
    """Search the PDF for what must never be published: file:// links, home or temp paths, the container's time zone,
    and the private strings of tools/privacy_check.py (.privacy.local or PRIVACY_STRINGS). Looks in the decompressed
    objects (qpdf --qdf) and in the visible text (pdftotext), whose glyphs are not plain bytes in the file."""
    import tempfile
    found = []
    slash = '/'   # the folder names are joined at run time so that this file holds no home-folder path itself
    pats = [('a file:// link', 'file:' + slash * 2), ('a home path', slash + 'home' + slash), ('a root path', slash + 'root' + slash),
            ('a temp path', slash + 'tmp' + slash)]
    try:
        sys.path.insert(0, str(ROOT / 'tools'))
        import privacy_check
        cfg = privacy_check.load_config()
        pats += [('a private string (value not shown)', v) for v in cfg.get('strings', []) if len(v) >= 3]
    except Exception as e:  # the check still runs on the fixed patterns
        print('privacy_check config not loaded:', e)
    tz = ORIG_TZ.lstrip(':').strip()
    if tz and tz.upper() not in ('UTC', 'GMT', 'ETC/UTC', 'ETC/GMT', 'UCT', 'UNIVERSAL', 'ZULU'):
        pats.append(('the container time zone (value not shown)', tz))
        city = tz.split('/')[-1].replace('_', ' ')
        if len(city) >= 4 and city != tz:
            pats.append(('the container time zone city (value not shown)', city))
    with tempfile.TemporaryDirectory() as d:
        qdf = pathlib.Path(d) / 'q.pdf'
        subprocess.run(['qpdf', '--qdf', '--object-streams=disable', str(path), str(qdf)], check=False)
        raw = qdf.read_bytes() if qdf.exists() else path.read_bytes()
        txt = subprocess.run(['pdftotext', '-enc', 'UTF-8', str(path), '-'], capture_output=True, text=True).stdout
    for what, pat in pats:
        if pat.encode('utf8') in raw or pat.lower() in txt.lower():
            found.append(what)
    return sorted(set(found))


def sparse_pages(path, minimum=400):
    """Pages (not the cover or the back page) carrying under `minimum` characters of text: usually a few lines that
    spilled over from the page before, which a fixed-page section (an exercise) should not do."""
    from pypdf import PdfReader
    r = PdfReader(str(path))
    out = []
    for i, pg in enumerate(r.pages):
        if i == 0 or i == len(r.pages) - 1:
            continue
        txt = ' '.join((pg.extract_text() or '').split())
        if len(txt) < minimum:
            out.append((i + 1, len(txt), txt[:70]))
    return out


def fonts_of(path):
    res = subprocess.run(['pdffonts', str(path)], capture_output=True, text=True)
    names = []
    for line in res.stdout.splitlines()[2:]:
        if line.strip():
            names.append(line.split()[0])
    bad = [n for n in names if not any(ok in n for ok in FONTS_OK)]
    return names, bad


def check_meta(path):
    """Read the metadata back: the author, UTC dates in the document info and the XMP, and no other name."""
    import pikepdf
    bad = []
    with pikepdf.open(str(path)) as pdf:
        info = {str(k): str(v) for k, v in pdf.docinfo.items()}
        if info.get('/Author') != META['author']:
            bad.append('author is ' + repr(info.get('/Author')))
        if info.get('/Title') != META['title']:
            bad.append('title is ' + repr(info.get('/Title')))
        for k in ('/CreationDate', '/ModDate'):
            if not re.fullmatch(r"D:\d{14}\+00'00'", info.get(k, '')):
                bad.append(k + ' is not UTC: ' + info.get(k, ''))
        xmp = pdf.Root.Metadata.read_bytes().decode('utf8', 'replace') if '/Metadata' in pdf.Root else ''
        for d in re.findall(r'<xmp:\w+Date[^>]*>([^<]*)<', xmp):
            if not d.endswith('+00:00'):
                bad.append('XMP date not UTC: ' + d)
        if '<rdf:li>' + META['author'] + '</rdf:li>' not in xmp:
            bad.append('XMP creator is not the Chimera community')
        names = set(re.findall(r'<rdf:li>([^<]*)</rdf:li>', xmp)) - {META['author']}
        if names:
            bad.append('XMP lists other names: ' + ', '.join(sorted(names)))
    return bad


def write_meta(path, when):
    import pikepdf
    stamp = when.strftime("D:%Y%m%d%H%M%S+00'00'")
    iso = when.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    with pikepdf.open(str(path), allow_overwriting_input=True) as pdf:
        info = pdf.docinfo
        for k in list(info.keys()):
            del info[k]
        info['/Title'] = META['title']
        info['/Author'] = META['author']
        info['/Subject'] = META['subject']
        info['/Keywords'] = META['keywords']
        info['/Creator'] = META['creator']
        info['/Producer'] = 'Chromium (Skia/PDF) and pikepdf'
        info['/CreationDate'] = stamp
        info['/ModDate'] = stamp
        with pdf.open_metadata(set_pikepdf_as_editor=False, update_docinfo=False) as xmp:
            for key in list(xmp.keys()):
                del xmp[key]
            xmp['dc:title'] = META['title']
            xmp['dc:creator'] = [META['author']]
            xmp['dc:description'] = META['subject']
            xmp['dc:rights'] = 'Text and figures: CC BY-SA 4.0, the Chimera community (https://discord.gg/chmr)'
            xmp['pdf:Keywords'] = META['keywords']
            xmp['pdf:Producer'] = 'Chromium (Skia/PDF) and pikepdf'
            xmp['xmp:CreatorTool'] = META['creator']
            xmp['xmp:CreateDate'] = iso
            xmp['xmp:ModifyDate'] = iso
            xmp['xmp:MetadataDate'] = iso
        pdf.Root.Lang = pikepdf.String('en')
        pdf.save(str(path))


def main(args):
    if '--facts' in args:
        bad, _ = facts()
        return 1 if bad else 0
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, str(ROOT / 'tests' / 'e2e'))
    import harness as H
    png_dir = args[args.index('--png') + 1] if '--png' in args else None
    force = '--force' in args
    pages_url = args[args.index('--pages-url') + 1] if '--pages-url' in args else ''
    repo_url = args[args.index('--repo-url') + 1] if '--repo-url' in args else ''
    bad, _ = facts(report=False)
    if bad:
        facts()
        print(f'{bad} number(s) in the guide no longer match the code: fix the guide and FACTS together')
        if not force:
            return 1
    tmp = ROOT / 'tests' / 'out' / 'guide'
    tmp.mkdir(parents=True, exist_ok=True)
    with H.browser_lock(), sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(timezone_id='UTC', locale='en-GB')
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(HTML.as_uri())
        page.emulate_media(media='print')
        page.evaluate('document.fonts.ready.then(() => true)')
        page.wait_for_function("() => Array.from(document.images).every(i => i.complete)", timeout=30000)
        page.evaluate(URLS, [pages_url, repo_url])
        page.wait_for_timeout(200)
        chk = page.evaluate(CHECKS)
        if chk['missing']:
            print('MISSING IMAGES:', chk['missing'])
        if chk['badLinks']:
            print('LINKS WITHOUT A TARGET (or not https):', chk['badLinks'])
        for w in chk['wide']:
            print('WIDER THAN THE PAGE:', w)
        if (chk['missing'] or chk['badLinks'] or chk['wide']) and not force:
            b.close()
            print('not written: fix the problems above (or pass --force)')
            return 1
        pages, passes, n = {}, 0, 0
        for passes in range(1, 5):
            page.evaluate(FILL, pages)
            out = tmp / f'pass{passes}.pdf'
            render(page, out)
            new, n = dest_pages(out)
            moved = {k: (pages.get(k), v) for k, v in new.items() if pages.get(k) != v}
            pages = new
            if passes > 1 and not moved:
                break
        absent = [i for i in chk['ids'] if i not in pages]
        shutil.copyfile(out, PDF)
        b.close()
    when = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
    write_meta(PDF, when)
    n, found, internal, missing, files = check_pdf(PDF, chk['urls'])
    names, badfonts = fonts_of(PDF)
    print(f'{PDF.relative_to(ROOT)}: {n} pages, {PDF.stat().st_size / 1024:.0f} KiB, {passes} passes')
    print(f'links: {len(chk["urls"])} external URLs, {sum(len(v) for v in found.values())} URI annotations, {internal} internal links')
    print('fonts:', ', '.join(sorted(set(n.split('+')[-1] for n in names))))
    problems = 0
    if absent:
        print('TARGETS WITHOUT A DESTINATION:', absent)
        problems += 1
    if missing:
        print('NOT CLICKABLE:', missing)
        problems += 1
    if files:
        print('FILE LINKS:', files)
        problems += 1
    if badfonts:
        print('FALLBACK FONTS EMBEDDED (a glyph the subsets lack):', badfonts)
        problems += 1
    for what in privacy_scan(PDF):
        print('PRIVACY: the PDF contains', what)
        problems += 1
    meta_bad = check_meta(PDF)
    for m in meta_bad:
        print('METADATA:', m)
        problems += 1
    for pg, nch, head in sparse_pages(PDF):
        print(f'NEARLY EMPTY PAGE {pg} ({nch} characters): {head}')
        problems += 1
    if not PAGES_OK[0] <= n <= PAGES_OK[1]:
        print(f'PAGE COUNT {n} is outside {PAGES_OK}')
        problems += 1
    if errs:
        print('page errors:', errs[:5])
        problems += 1
    if png_dir:
        d = pathlib.Path(png_dir)
        d.mkdir(parents=True, exist_ok=True)
        for old in d.glob('page-*.png'):
            old.unlink()
        subprocess.run(['pdftoppm', '-r', '60', '-png', str(PDF), str(d / 'page')], check=True)
        print(f'pages rasterised to {d}')
    (tmp / 'pages.json').write_text(json.dumps(pages, indent=1, sort_keys=True))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
