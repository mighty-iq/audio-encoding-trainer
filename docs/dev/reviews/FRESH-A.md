# FRESH-A: fresh-player test (phone 360×640, desktop 1366×768)

Written 2026-11-26 23:32 UTC. Tester: a fresh agent that saw only the app. It drove the app through Playwright
(Chromium, a new browser context for each run, `--autoplay-policy=no-user-gesture-required`) and chose every tap
from a screenshot. Captions were on (`?captions=1`), and the "Test aid · said: …" line stood in for hearing.

**Copies tested.** **snap2** is the first copy given; it lacked four sound packs (Far, Strange voices, Repair, Echo).
**snap4** is the corrected copy. Every finding below is tagged **[snap2]**, **[snap4]** or **[both]**. Findings
about missing or thin material in Far, Strange voices or Repair are marked **snap2 only** where snap4 did not
repeat them. Runs 3 and 4 (snap4) logged **zero console or page errors** in about 250 actions.

**Runs.** 1 = snap2 phone (launch 22:31:27 UTC), 2 = snap2 desktop (22:46:46), 3 = snap4 phone (23:06:48),
4 = snap4 desktop (23:20:13). Screenshots are named `<run>-<NNN>-<label>.png` with run letter p, d, q, r. Short
references such as q-023 mean `q-023-echo-t1-who.png`; the index at the end lists the full names. The
screenshots are kept outside the repository.

**How to read the times.** "Agent" is wall-clock time from the logs, from the tap that opened the exercise (or
from app launch for the first exercise of a session) to the first correct real answer. It includes the tester's
think time of about 5 to 15 s per screen, so it overstates a person's time. "Human est." adds up the sound and wait
times seen in the logs, the reading load (visible words, skimmed at about 200 to 250 words a minute) and about
1.5 s per tap.

## Summary

### Time to first correct real answer (target: under 2 min)

| Exercise | Copy · device | Agent | Human est. | Notes |
|---|---|---|---|---|
| Echo, first exercise of a session | snap4 · phone | **2:09 from launch** | **about 2:00-2:20** | Over target: 4 listening steps in the tutorial, each a 6-8 s message plus a 1-3 s wait; answer screens heavy with reading |
| Strange voices, first exercise | snap4 · desktop | 2:18 from launch | about 1:45-2:00 | Agent time includes about 15 s of keyboard experiments |
| Strange voices (Whispers) | snap4 · phone | 1:27 | about 1:25 | |
| Far | snap4 · phone / desktop | 1:42 / 1:32 | about 1:40 | Phone time includes a swallowed Continue tap (q-071) |
| Repair | snap4 · phone / desktop | 1:19 / 1:26 | about 1:15 | |
| Crowd | snap2 · phone / snap4 · desktop | 1:43 / 1:14 | about 1:20 | |
| Voices, first exercise | snap2 · phone | first answerable trial 1:52 from launch; first correct 3:22 | about 1:30 to the first answerable trial | Captions cannot say who is talking, so the tester's answers were coin flips: not a valid measure. The first real trial failed to load (snap2 only) |
| Far, Strange voices, Repair, Echo | snap2 · both | never | | **snap2 only**: every trial "could not be prepared" |

### Top confusions
1. **[both] The venue "‹ Back" swallows one tap per set played from that venue.** After 3 sets it took 4 taps
   (p-121 to p-128), after 2 sets 3 taps (q-117 to q-119; desktop r-052 to r-054), and after 1 set 2 taps
   (r-066/r-067). Nothing on screen changes, so it looks broken.
2. **[both] The tutorial "Continue" is grey and ignores taps for about 1.5 to 3 s after each card appears**, with no
   countdown (q-071: tapped at 1.5 s, nothing happened). It reads as a disabled or broken button.
3. **[snap4] Echo repeats its messages:** only 4 messages cycled over 10 trials (1=5=9, 2=6=10, 3=7, 4=8), and
   the tutorial's "your turn" step replays the example's own message (q-020 to q-058). By trial 5 the answers come
   from memory of earlier trials rather than from listening.
4. **[both] Exercises are hard to find by name:** Home has no exercise list. Strange voices and Repair appear only as
   grey subtitles ("Accents", "Lost words, strong context", "Whispers at the back") inside venue pages, reached
   through Home → scroll → Map → venue (p-061 to p-069).
5. **[both] "End set" in the pause sheet ends the whole session** ("Session done"), not just the set (p-060, q-066, r-024).
6. **[both] Session counters disagree:** after four short exploratory sets Home says "That is 4 sessions today.
   Sleep consolidates practice, so tomorrow is a good time…" while the week card says "This week · 0 sessions"
   (r-068; snap2 d-041 counted 3 empty sessions). A new player who is exploring gets told to stop for the day.
7. **[snap4 desktop] Keyboard focus and hover look like selections:** a blue focus ring stays on answer 1 while
   another answer is selected (r-006), and the answer under the resting mouse pointer gets a grey fill that looks
   pre-selected (r-016 "needle"; r-048 "sleeves", which happened to be the right answer; r-063 "cab"). Enter during
   the replay only moves focus (a second press is needed, r-011), and on "You are ready" Enter does nothing (r-015).

### Dead ends
- **snap2 only:** Far, Strange voices (Accents, Whispers), Repair and Echo were unplayable. Their tutorials loop on
  "Skip this trial", one failing example after another (6 in a row, p-099 to p-104). After 5 failures in a real set,
  the set and the whole session end ("Session done · Active time 0:00", d-009, d-023, d-039). So a fresh desktop
  player on snap2 got three empty sessions in a row. snap4 fixes the material; the failure handling remains (see below).
- [both] No way out of a tutorial except "Skip" → pause → End set (no Home or back control in the tutorial header).
- No dead ends on snap4 apart from the Back taps.

## Run logs

**Run 1 [snap2, phone].** Welcome → Start session → Voices tutorial (6 steps) → Voices set (16 answered; 3 of 19
trials "could not be prepared") → Next set = Echo (failed) → End set → Home → Map → Café: Crowd tutorial + 3
trials; Accents and Lost words failed → Lecture hall: Far failed; Whispers failed.

**Run 2 [snap2, desktop].** Welcome → Start session = Far (the first exercise differs by profile) → failed →
session ended. The same happened twice more (Strange voices, then Repair). Lab → Digits practice run, 4 trials,
by click and by keyboard; ended without saving.

**Run 3 [snap4, phone].** Start session = Echo tutorial + full set (9 of 10; one miss was deliberate) → Next set =
Crowd (tutorial skipped) → End set → Map → Lecture hall: Far tutorial + 2 trials; Whispers tutorial + 1 trial →
Café: Lost words tutorial + 1 trial.

**Run 4 [snap4, desktop].** Start session = Strange voices tutorial + 1 trial → Next set = Seek (skipped) → Map
(venue list beside the tree) → Café: Crowd tutorial + 1 trial; Lost words tutorial + 1 trial → Lecture hall: Far
tutorial + 1 trial → Lab → Matrix practice, 3 trials; ended without saving.

## Findings in detail

### Load failures and how the app handles them
- **snap2 only:** missing clips `*.phrase.sus-*`, `*.sentence.repair-*`, `*.sentence.far-*` and
  `*.sentence.echo-*`. The Voices set used the same `sus` clips and lost 3 trials (p-016, p-024, p-054). One
  "Meet Bruno" intro was also followed by a silent `[session skip]`.
- **[snap2] Handling, worth fixing before any clip ever fails in the field:**
  - A tutorial's "Skip this trial" has no limit, and only the small "Skip" link leaves the tutorial.
  - 5 failures end the set and the session, instead of moving on to the next set.
  - Empty sessions still count toward "N sessions today" (d-041).
  - The set summary said "Ended early… partial: it sets no personal best" after a set played to the last trial,
    whose final clip had failed to load (p-054).

### Tutorials: does each one teach the task?
All six that ran on snap4 or snap2 were clear enough to play the first real trial correctly. Notes per tutorial:
- **Crowd [snap2 phone, snap4 desktop]:** the best of the set. The worked example labels every key ("the answer",
  "the blue voice said this", "sounds alike", "not said"; p-072, r-030). Steps 3 and 4 use the same target, "Felix,
  cart, six". On the phone the radar shrinks to about 100 px and the talker's name is unreadable (p-072); on
  desktop it is large and clear.
- **Far [snap4]:** clear, and the "Up close / Again from 1.5 m" contrast is a good idea. Steps 3 and 4 use the same
  sentence ("The gate is somewhere under the crane", q-075, q-078). The help sheet "Far: how it works" (p-138) is
  excellent. The example takes about 10 s to play (r-056/r-057).
- **Strange voices [snap4]:** clear. The "Again, with the words…" replay after each answer works well (q-101,
  r-007). The four tutorial phrases are the same on both devices.
- **Repair [snap4]:** clear. Step 5 says "The clue is weaker now", but its feedback says "75 % of the word lost,
  strong context" (q-129). The example sentence is shown in lowercase with no full stop (q-122). Caption mode
  shows the masked word, so a captioned agent's Repair time does not measure the inference.
- **Echo [snap4 phone]:** clear but the slowest (see times). Step 3 ("your turn") replays the step-2 example
  message, whose answers were just shown.
- **Voices [snap2]:** clear. The miss feedback is excellent: it names both voices' pitch ("about 195 Hz and about
  210 Hz: listen for pace and voice quality") and replays both (p-019). The intros are long: "Listen…" for 7 to 15
  s with the name buttons locked and no progress cue (p-005). Bruno was introduced three times in one set and
  never became an answer option (p-031, p-041, p-044; not re-tested on snap4). The summary said "You now know 1
  voice of the cast" right under two "New voice" lines (p-054; not re-tested).
- **Lab [Digits snap2, Matrix snap4, desktop]:** the intro cards are clear (how to answer; practice runs do not
  count; no feedback). The Digits keypad works by click and by keyboard and submits after 3 digits (d-044 to
  d-053). The Matrix grid (5 columns × 10 words) fits 1366×768 with Done visible (r-071 to r-073). Neither shows a
  caption, so the tester could only guess. **snap2 only:** a "Matrix · later build" card was visible to players
  (d-042); on snap4 Matrix is live (r-069).

**What I would change.**
1. Never reuse the example's sentence as the first "your turn" item, and give step 4 a new sentence (Crowd, Far, Echo).
2. Show the Continue lock as a short fill animation, or accept an early tap and act on it when the lock ends.
3. Keep the radar readable on phones in tutorial examples.
4. Cut Echo's tutorial to two listening steps (or shorter messages), so the first correct answer comes before 2 min.
5. Keep the "Right" line on screen for about 2 s before auto-advance in Echo and Far. It is up for about 1 s
   now (q-023, q-092), and the Next button is shown but not needed.

### Layout and input
- **[both] No trial screen needed scrolling at 360×640** (page height = viewport on every trial screen, runs 1 and 3).
  Summaries, Home, Map and venues scroll.
- **[both] Truncated top bars at 360 px:** "How to play: Vo…/Ec…", "Café · Acce…", "Lecture hall …", "Echo
  Speech vs noise …", "Distanc…". The playtest "Note" button covers "Step N of M" (p-003, q-003).
- **[both, test builds only] "Note" overlaps the end of "Next set" and "Finish session"** (p-096, q-062). Lab intro
  cards show two Note buttons (d-043, r-071).
- **[snap4] Echo at 360 px:** in caption mode the third caption line prints over the first question label ("it
  before ten to three." over "At what time?", q-020), and in the feedback state it runs under the labels (q-027).
  Outside caption mode: the ✓ badge covers the last letter of "a quarter past fou[r]" (q-006, q-011).
- **[snap4 desktop] Good:** a two-column layout, a big radar, number-key hints 1-4 on every answer, and everything
  above the fold (r-017, r-038, r-049, r-064). Number keys answer correctly. Enter works except as noted in
  Top confusions 7.
- **[snap4 desktop] Copy:** the Seek practice says "put your finger on your dot" on desktop (r-022).

### Possible scoring or shuffle issue (low confidence) [snap2]
In two-choice "Who is talking" trials, the correct name was the **second** button in 10 of 13 trials (two-sided
p ≈ 0.09, one-sided p ≈ 0.046 if positions were 50/50). The sample is small, but the option shuffle deserves a look.

### Fun
- **Fun:** Crowd's rhythm (call sign → two quick taps → "Right" → "X alone / the crowd again"). Strange voices'
  replay with words. Far's "Up close / Again from 1 m". The map of venues to unlock. Cast members with one-line
  lives ("owns the pizza place near the harbour"). The milestone card in the Voices summary. On desktop, keyboard
  play with 1-4 feels quick and precise.
- **Not fun:** Echo's repeated messages, which turn it into a memory quiz. The long Voices set with two names and
  slow intros. "Ended early… does not count" after a short exploration. Being told "tomorrow is a good time" after
  a few minutes of exploring. The swallowed Back taps.

## Screenshot index (full names)
p-003-start-session · p-005-tut2-after-listen · p-016-voices-start-set · p-019-voices-t2-anouk ·
p-024-voices-t4-next · p-030-voices-t8-leila · p-031-voices-t8-next · p-041-voices-t13-next ·
p-044-voices-bruno2-next · p-054-voices-skip3 · p-056-set1-summary-scroll2 · p-057-next-set · p-060-echo-end-set ·
p-061-back-to-tonight · p-065-open-map · p-069-map-cafe · p-072-crowd-tut2-wait · p-089-crowd-t1-four ·
p-096-crowd-summary-scroll · p-099-strange-tut1-continue · p-104-strange-tut2-skip5 · p-112-repair-tut1-continue ·
p-121-venue-back · p-122-venue-back2 · p-123-venue-back3-text · p-128-venue-back4 · p-131-far-tut1-continue ·
p-138-far-help · p-142-whisper-play · d-003-start-session · d-009-far-skip4 · d-023-strange-skip4 ·
d-039-repair-skipb4 · d-041-repair-skipb6 · d-042-open-lab · d-043-lab-start · d-044-lab-digits-start ·
d-053-lab-pause · q-003-start-session · q-006-echo-tut2-wait2 · q-011-echo-tut3-quarterpast4 · q-020-echo-t1-wait ·
q-023-echo-t1-who · q-027-echo-t2-platform · q-037-echo-t5-wait · q-041-echo-t5-miss-6s ·
q-058-echo-t10-wait · q-062-echo-summary-bottom · q-066-crowd-end-set · q-071-far-play · q-072-far-tut1-continue ·
q-075-far-tut2-continue · q-078-far-tut3-continue · q-088-far-t1-crab · q-092-far-t2-after2s · q-101-strange-tut3-whistle ·
q-112-strange-t1-tunnel · q-117-venue-back · q-119-venue-back3 · q-122-repair-tut1-continue ·
q-129-repair-tut5-continue · q-132-repair-t1-violin · r-006-strange-tut3-key3 · r-007-strange-tut3-key2 ·
r-011-strange-tut4-enter2 · r-015-strange-tut7-enter · r-016-strange-start-set · r-017-strange-t1-engine ·
r-022-seek-tut-skip · r-024-seek-end-set · r-030-crowd-tut1-continue · r-038-crowd-t1-key2 ·
r-048-repair-start-set · r-049-repair-t1-key3 · r-052-venue-back1b · r-053-venue-back2 · r-054-venue-back3 ·
r-056-far-tut1-continue · r-057-far-tut2-wait · r-063-far-start-set · r-064-far-t1-key4b · r-066-lh-back1 ·
r-067-lh-back2 · r-068-map-back · r-069-open-lab · r-071-lab-matrix-start · r-073-mx1-done (all `.png`).
