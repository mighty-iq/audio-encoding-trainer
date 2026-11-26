# RV-play + RV-a11y — play-through and accessibility review

Independent reviewer (did not build Earshot). Written 2026-11-26 23:29 UTC (`date -u`).
Brief: docs/dev/briefs/phase3.md (RV-play, RV-a11y); PLAN §6–9; CONTRACTS §8.

**Snapshots.** snap2 = commit 75c28ba (first frozen copy; its index.html lacked the echo, far, repair and strange
packs). snap4 = commit 09a8ff3 (all packs, shell fix round 1). Every finding is from **snap4** unless marked
**snap2 only**. js/ and css/ are byte-identical in the two snapshots; only index.html (pack list) and dist/ differ.

**Builds.** Play-through: `dist/earshot.html` (test build, `?captions=1`). Accessibility matrix:
`dist/earshot-release.html` (playtest off); the test build once more at 360×640 for its Note button.

**Screenshots** are outside the repository, in the reviewer's scratch folder `/tmp/rv-play/shots/` (subfolders
`a11y/`, `verify/`, `runA/`, `snap2/`; the rest at the top level). Names are given per finding.

## In brief

The core loop holds up well: over 15 simulated days (17 sessions, 990 answered trials) nothing crashed, no page
error was logged, no invitation or game news ever appeared inside a set, the Chimera welcome was full once and light
on all 16 later opens, fresh-ears and overnight checks only ever reassured, the Weekly Night Out was identical for
two different profiles, and the plateau card states its reason and what changes. Contrast, focus, dialogs, keyboard
play, reduced motion and the no-scroll rule at 360×640 all pass. What needs work: trials on a **sideways phone**
scroll and hide the Next button (A1, high); **progress is front-loaded and partly overclaimed** (milestone bursts on
the first set, nothing new after day 2; P2), multi-answer sets read as half wrong at the intended edge (P5), Path
and Focus modes do not show what they are doing (P4, P6), a tutorial can loop forever on a sound that cannot be
prepared (P1), feedback is not announced to screen readers (A2), and several touch targets are under 44 px (A3).

| Severity | Findings |
|---|---|
| high | A1 · (S2-H1, snap2 only) |
| medium | P1, P2, P3, P4, P5, P6, P7, A2, A3 |
| low | P8–P19, A4–A7 |

## Method

- **Play-through** (Python Playwright 1.63, Chromium): phone 390×844, dark, touch, time zone UTC. Playwright's clock
  was set forward before every session and the app reopened in a new tab (reloading the same tab hung this test
  browser twice, as the shell's round-1 notes also report). Simulated players only, no real data:
  - **run B** (main, snap4): 15 calendar days, 2026-11-02 → 2026-11-16 UTC, days 5, 6 and 12 skipped on purpose;
    Edge days 1–3 (two sessions on day 3), Path days 4 and 7, Variety ×2 on day 8, Focus on day 9 (nothing picked)
    and ×2 on day 10 after picking Rooms in the Lab, two more Edge sessions on day 10 (four that day), Free (Repair)
    day 11, Edge days 13–15; 15 minutes on day 1, 10 minutes after. Weekly Night Out played on day 2 (W45) and
    day 14 (W46). Each answer slot was right with probability = the engine's predicted p + a small drift (Crowd
    +0.05; Repair, Echo, Voices, Seek +0.04; Far, Strange 0; day 9 −0.15 as a bad day).
  - **run A** (snap4, days 1–3): an optimistic player (a "wrong" trial kept its other slots right); used only for
    day-1 screens and the W45 comparison.
  - Real audio for the first sets of day 1 (stillness checks); after that each sound was stopped after 60 ms by a
    wrapper around `ES.audio.play` so the run fits the session budget (Seek's live scene stayed real). "Active"
    times on result screens are therefore not representative.
- **Plateau**: the simulated long-term profile in tests/fixtures/game-longterm.js (no real player data), shifted so
  its last session ended a day earlier; Edge sessions at the engine's p − 0.05 per slot until plateau cards showed;
  then Path forced to the last step of the Crowd ladder.
- **Milestone calibration (Node)**: `simulate()` from tests/unit/game-calibrate.mjs, unchanged, with the simulated
  learners of tests/sim/learners.mjs (300 learners, Edge, 4 days); milestones reached after each learner's first
  session with an exercise compared with that learner's simulated true threshold (`trueTheta`).
- **Accessibility matrix**: 360×640, 390×844, 1366×768 and 640×360 (sideways phone), light and dark, long-term
  profile so every screen has content. In-page scans of every visible text node (HTML and SVG, composited
  backgrounds, inherited opacity, large-text rule), every interactive element (size, accessible name), horizontal
  overflow, trial fit (the `fits()` check of tests/e2e/ex_b_common.py plus internal scrolling); Tab order and
  visible focus on Home, Settings, Map and Lab; nested sheets; keyboard-only Crowd trial and Seek;
  prefers-reduced-motion; every screenshot looked at.
- **Tutorials** for all seven exercises at 360×640 with real audio; a forced render failure inside a tutorial and
  inside a set.

## Findings

### A1 · high · Sideways phone (640×360): every trial scrolls; Next and parts of the feedback are off screen
- Screen: Play, all six keyword exercises, answer and feedback states (Seek fits).
- Steps: open the release build at 640×360 landscape (touch), start any set, answer, look at the feedback.
- Evidence: the trial body scrolls internally by 60–270 px in every case; the field is 362–484 px tall in a 360 px
  window. Answer state: the last key row is cut for Far and Strange (answer panel to y 372), a third of Echo's keys
  are below the fold (to y 472). Feedback: Next sits at y 459–503 (Far), 417–461 (Strange); in Echo the verdict and
  the message are scrolled off the top (y −214…−82) and the first question is hidden.
- Screenshots: `a11y/trial_far_feedback_640x360_dark.png`, `a11y/trial_echo_feedback_640x360_dark.png`,
  `a11y/trial_crowd_answer_640x360_dark.png`.
- Fix (css/screens.css, the `orientation: landscape` blocks): cap the field to the window
  (`max-height: calc(100dvh - <bar> - 16px)`; it currently grows with the content rows), drop the 1fr spacer rows,
  and under `max-height: 480px` hide or shrink the field in the feedback state and tighten keys and feedback text.
  Re-run `fits()` at 640×360 and 740×360. Rotating to portrait is the player's only workaround today.

### S2-H1 · high · snap2 only · Strange voices tutorial could not start (missing packs)
- In snap2 the second set of the first session was Strange voices; every tutorial trial ended in "This sound could
  not be prepared", and "Skip this trial" drew another failing trial without end (800+ errors before the script
  stopped). Cause: the strange pack was not listed in snap2's index.html (fixed by 8d79e75). On snap4 every
  Strange tutorial step renders. The loop itself remains possible: see P1.

### P1 · medium · A tutorial loops forever when its sound cannot be prepared
- Screen: Tutorial (any exercise). Code: js/ui/tutorial.js:141–145 — a skipped or voided trial is replaced with a
  new one for the same step with no limit (sets have a cap of 3 replacements; tutorials have none).
- Steps (snap4): make `ES.audio.render` reject (any decode failure on a device does this), start a Crowd session on a
  fresh profile, Continue, tap "Skip this trial" repeatedly.
- Evidence: after 12 taps the tutorial was still at "Step 2 of 7" in the error state; the only way out is the small
  "Skip" in the tutorial bar, which the error screen does not mention. In a set the cap worked (the set ended after 4).
- Screenshot: `verify/tut_forced_error.png`.
- Fix: after 2 failures in a step, move to the next step (or finish the tutorial) with one line that says why;
  count tutorial replacements like set replacements.

### P2 · medium · Milestones and venues arrive in a burst on the first set, partly overclaimed, then dry up
- Screen: Results news, Progress, Map. Code: js/game/milestones.js:13, 135–143 (a milestone counts once the
  posterior mean passes the level after `MIN_N = 6` updates).
- Evidence (run B): the first Crowd set ever (24 trials, 17 right) awarded 6 milestones ("Picking a voice out" …
  "Through the crowd: each other voice 6 dB louder") and opened Restaurant and Bar. Days 1–2 brought 19 of the 34
  milestones of the whole run and all 6 venue openings; from day 3 to day 15 no venue opened (Club, Concert,
  Cathedral stayed closed) and days 11–15 brought one milestone. Node check with the project's own simulated
  learners (300): after the first session with Crowd the median player gets 5 milestones (p90 7, max 9); **58 %**
  get at least one at a level harder than their simulated true threshold (13 % by more than one display step).
  Far 26 % (9 %), Voices 22 % (9 %), Strange 16 % (5 %), Repair 16 % (4 %), Echo 1 %, Seek 0 %. Each such
  milestone says "about 7 times in 10" for a level the player does not yet reach.
- Screenshots: `p_results_d1_s0_set0.png` (run B, first Crowd set), `runA/p_d1_results.png`.
- Fix: award a milestone when the estimate's harder-side bound (e.g. m − 1 SD in the dial's direction) passes the
  level, or require two sessions with the exercise; show at most two milestones per results screen ("and 4 more"
  already exists for the invitation); keep later progress visible with the existing level-up lines (they are rare
  now because display steps are coarse).

### P3 · medium · Results show raw estimates and disagree with themselves
- Screen: Results (facts line, news, personal-best invitation). Code: js/ui/widgets.js:77 (`dialText` rounds an
  ordinal estimate and prints the raw number when it is past the top level) vs js/game/core.js:89–95 (`levelText`
  floors and clamps).
- Evidence: "Other voices: 2.57" / "2.69" / "2.9" (snap2 and run A), "Context: 2.53", "2.55", "2.68" (run B days
  13–15), also in the invitation "New personal best · Context: 2.53". The same screen shows "Distance: 4 m" (facts)
  and "Distance: 3 m (first estimate)" (news), "+1.1 dB" and "+1 dB" (run B day 1, Far); on the plateau run
  "Accent in babble: moderate accent, +6 dB" (facts) beside "+10 dB (first estimate)".
- Screenshots: `p_results_d13_s13_set0.png`, `p_results_d1_s0_set1.png`, `plateau_k1_1.png`.
- Fix: one shared formatter (floor + clamp, "(top)" past the last level) and one estimate source for facts, news and
  personal bests.

### P4 · medium · Path mode never shows the path, its progress or its end
- Screen: Play bar, Results, Home in Path mode. Code: no UI module reads `meta.decision.path` or the set entry's
  `path` (search of js/ui, js/game, js/ex).
- Evidence: Path sessions on days 4 and 7 looked exactly like Edge (bar: "Distance · 3 m"; results and news: no
  step, stage, venue or "moved on"). With the Crowd path set to its last step, 12 trials ran at +9 to +12 dB (eased
  by the adaptation floor), 12 of 12 right, and nothing said that the path had ended. Settings promises Path is
  "Right for beginners, for clear goals".
- Screenshots: `plateau_path_end_results.png`, `p_results_d4_s3_set2.png`.
- Fix: show "Path · Café: one other voice · step 2 of 4" in the bar and on Results; announce moving on and a step
  back ("no penalty"); at the last step say the path is complete and offer Edge. Never "mastered".

### P5 · medium · "N of M right" counts only fully right trials, so multi-answer sets read as half wrong at the edge
- Screen: Results headline and glyph row. Code: js/ui/screens/results.js:32 and :38.
- Evidence (run B, set trials): the engine aimed at about 0.74–0.77 right per word, but the share of trials shown
  as right was Echo 0.51, Far 0.57, Strange 0.57, Crowd 0.66, against 0.81 for the one-answer exercises (Repair,
  Voices). Echo sets read "3 of 10 right", "4 of 10 right" while the player was exactly where the engine wanted.
- Screenshot: `p_results_d8_s6_set2.png` (Echo, 5 of 10).
- Fix: count answers for multi-slot sets ("22 of 30 details right"), or add a half mark for "partly right" in the
  glyph row and count it in the headline.

### P6 · medium · Focus mode without a target silently plays like Edge
- Screen: Settings (mode list), Home, the session plan.
- Evidence: day 9, Focus chosen with nothing picked and no measured check-ins: the plan was Crowd (overnight), Echo,
  Strange, with no Focus set and no note. Only the Lab says "Focus mode aims at: Chosen once a check-in has measured
  runs." After picking Rooms in the Lab, Far took 2 of 3 sets in both Focus sessions on day 10 (works).
- Screenshots: `p_lab_d9_before_focus.png`, `p_lab_focus_sheet.png`.
- Fix: under Focus in Settings show "aims at: … · Choose" (the Lab's chooser) and, when no target exists, a plan
  note on Home ("Focus has no target yet: pick one or run a check-in; this session trains like Edge").

### P7 · medium · "End set" before the first answer ends the whole session
- Screen: Play → Pause → End set. Code: js/ui/session.js:299 (no answered trial: later sets are cut and the session
  finishes).
- Evidence: in the plateau run, ending a Seek set before answering went straight to "Session done" with only the
  earlier set listed; the planned Crowd, Strange and Repair sets vanished without a word (sessions k0 and k3).
- Fix: skip to the next set, or label the button "End session" in that case and say what happens.

### A2 · medium · Screen readers hear neither the verdict nor the feedback, and hear "Listen…" over the sound
- Screen: Play and tutorial trials. Code: js/ui/trialview.js:87–92 (only the status line is `aria-live`),
  :145 (status "Listen…" is set as playback starts), :211–215 (feedback goes into a non-live block while the live
  status is emptied).
- Evidence: keyboard-only trial: after picking, focus stays on the key, the feedback block has no live region
  (`aria-live` null up the tree), and right answers move on by themselves after 1.2 s.
- Fix: render the verdict line ("Right", "Not quite: you picked …") into the live region (or move focus to it on a
  miss); set "Listen…" at least a second before the sound or keep it out of the live region, so speech output does
  not mask the stimulus.

### A3 · medium · Touch targets under 44 px
- Venue "Play" buttons 52×40 (js/game/style.js:66 `.g-also .btn-small{min-height:40px}`); "Show as a table" and
  news links such as "See Restaurant" 90×19 (style.js:18 `.g-link{min-height:0}`); Home "Open the mission" 116×16
  (js/ex/missions.js:232); map venue nodes 105–115 × 34–37 (the list rows below are full-size alternatives); the
  Discord link in the full welcome 189×36; "All the cast" 63×14; the weekly nickname field 40 px (style.js:120).
  The footer's Discord link (94×14) sits inside a sentence (exempt under WCAG, still below the contract's 44 px).
- Screenshots: `a11y/venue_360x640_light.png`, `a11y/home_360x640_light.png`, `a11y/map_390x844_dark.png`,
  `a11y/welcome_full_360x640_light.png`.
- Fix: `min-height: var(--tap)` (or padding) on these; give `.gm-node` a 44 px hit area.

### Low
- **P8** Plateau card reads "Next: Next sets bring in more voices…" (js/ui/screens/results.js:26 prefixes "Next:" to
  js/engine/plateau.js:135), and the plateau invitation right below repeats the same breaker text (session.js:287 →
  chimera.js:91). `plateau_k1_1.png`.
- **P9** Invitation volume: 29 of 61 result screens in run B carried a Chimera card, 8 carried two (milestone + personal
  best). Merge into one card per screen; the owner's rule is met by one. `p_results_d2_s0_set1.png`.
- **P10** Plain language. Weekly: "Same night for: v0.1.0 · w1 · 1." (js/game/screen-weekly.js:91), stops "to 6
  bands", "Repair · to 90 %". Overnight intros: "room noise (speech vs noise) at 1 dB", "muffled (through a wall) at
  1.2 kHz", "context at little context", "-2 dB" with a hyphen (js/engine/planner.js:66). Out of reach shown as
  "now > +12 dB" (Home, Map; js/game/venues.js:70–74). Lab: "NEAR–MID/MID/FAR", "(one SD)", "±1 SD", "90 % interval",
  "provisional references"; venue: "the anchors and easy trials"; Seek card: "self-set thresholds"; "Whisper:
  whisper, +3 dB". `p_weekly_card_long_d2.png`, `p_home_d10.png`, `runA/p_lab_d1.png`.
- **P11** "Your voice" names the talker you follow ("Your voice vs the others", "a near-twin of your voice", "hear your
  voice alone"); players can read it as their own voice. Use "the voice you follow" (js/engine/dials.js:31,
  js/ex/crowd.js:119, Crowd tutorial and help). `a11y/help_sheet_crowd_360x640_light.png`.
- **P12** Cast copy: "Lucia · Studys history and sit in the front row" (tools/audio/content_cast.py:62 `third_person`),
  and news lower-cases whole blurbs: "rings the bells on sundays" (js/game/record.js:74). `p_results_d1_s0_set1.png`.
- **P13** Number and unit split across lines ("Again from 1 / m"): use a no-break space in `U.fmtM`/`U.fmtDb`
  (js/core/util.js:59–69). `runA/p_d1_feedback.png`.
- **P14** Pausing during a trial's feedback says "Trial 2 of 2" while trial 1 is still on screen
  (js/ui/screens/play.js:122). `a11y/pause_sheet_640x360_dark.png`.
- **P15** Cast shows a wall of 38 locked "Someone from the café. You meet them in training." cards
  (js/game/screen-cast.js:36), against the game's own rule "never a wall of locked badges" (milestones.js:5).
  `a11y/cast_390x844_dark.png`.
- **P16** A set that ends because its sounds cannot be prepared lands on "Session done. Active time 0:00" with an empty
  list; the reason was a 3-second toast. Say it on the screen. `verify/set_forced_error_end.png`.
- **P17** Repair sentences appear in lower case ("she carried water from the well in a [bucket]") while the other
  exercises capitalise. `a11y/trial_repair_feedback_360x640_light.png`.
- **P18** Overnight check reports a percentage from 3 trials ("33 % of words right over 3 trials (the model expected
  about 72 %)"); with 3 trials the number is noise. Use more trials or words ("3 trials: too few to judge").
- **P19** Test build only: the floating Note button covers card text (Home overnight/mission cards, results news) and
  squeezes the tutorial bar at 360 px ("How to play: Ec…", step counter cut). `runA/p_home_d2.png`,
  `verify/tut_echo_answer.png`.
- **A4** Trial screens have no heading (the bar title is a span); add an sr-only h1 such as "Crowd, trial 3 of 24".
- **A5** The ✓/✕ mark overlaps the end of long option labels at 360 px ("a quarter past four"); reserve right padding
  on marked keys (css/components.css:102). `a11y/trial_echo_feedback_360x640_light.png`.
- **A6** Settings' session length and theme buttons are `role="radio"` but each is a Tab stop and arrow keys do nothing
  (js/ui/screens/settings.js:21–31); use a roving tabindex with arrows, or plain toggle buttons with `aria-pressed`.
- **A7** Echo at 360×640: the field collapses to 0 px in feedback and in its tutorial, leaving an empty band in the
  tutorial's answer state. No scrolling, so cosmetic. `verify/tut_echo_answer.png`.

## Brief checklist

| Check | Result |
|---|---|
| ≥ 14 simulated days, tutorials, Edge then Path, Variety, Focus, Free | done: run B, 17 sessions, 990 answers, 15 days |
| Progression feels right | partly: fast early climb (Crowd −6 dB after the first set), bursts then a flat second week (P2); multi-answer headlines (P5) |
| Plateau messages with reasons | pass on the long-term profile: Strange ("barely moved") and Far ("slipped a little"), each with what changes next; wording P8 |
| Venues open | pass: 6 opened (days 1–2); none after day 2 (P2) |
| Weekly identical twice | pass: W45 identical for two profiles (24 trials: seeds, words, answers, option order) |
| Fresh ears / overnight never punish absence | pass: "Fresh ears: 2 days away. A gentle start…", "Your level held after 2 days away", "Missed days cost nothing"; 8 overnight checks; P18 |
| Chimera pop-up full, then light | pass: full on day 1, light on all 16 later opens; focus on the primary button; Esc closes and marks it seen |
| Invitations only between sets | pass: none on any of the 1,007 answer screens (sets, tutorials, weekly); frequency P9 |
| No dead ends, "moved on" never "mastered" | no "mastered" anywhere; venues say "(top)" and "Even the hardest level here…"; dead ends P1, P4, P6, P7 |
| Nothing decorative moves during a sound | pass: 12 real-audio trials, no DOM change and no running animation while playing (only the test-aid caption after the sound) |
| Contrast, light and dark | pass: no text under 4.5:1 (3:1 large) on 11 screens, trials and sheets in 8 size/scheme pairs; only the disabled "Save check-in" (exempt) |
| Focus order and visible focus | pass: logical order on Home, Settings, Map, Lab; 3 px ring everywhere (map nodes draw their own) |
| Dialogs trap focus, Esc closes the top one | pass: Tab stayed in the top sheet, Esc closed only it, focus returned to the sheet below |
| Screen-reader labels | pass for names (no unnamed control); A2, A4 |
| Never colour alone | pass: ✓/✕ glyphs with words, target dot with halo, size and name, ✓/✕ weekly marks |
| Touch targets ≥ 44 px | fail in places: A3 |
| No scrolling in trials at 360×640 | pass for all exercises and Seek; fail at 640×360 (A1) |
| Reduced motion | pass: the only transitions (switches, 0.15 s) drop to 0 s; there are no animations |
| ≤ 3 flashes per second | pass: nothing animates or blinks |
| Plain-language copy | mostly clear; P10, P11, P12 |
| Two-minute start per exercise | pass: with real audio and instant taps the first right practice answer came at 7.7–19.5 s, whole tutorials 17.8–34.5 s (Seek: 9.2 s of captions, then a practice scene in the set) |

## What worked well

- No page errors across 17 sessions, the weekly runs, the plateau run and the matrix; no stuck screen.
- The trial screen is calm and readable on phones: field, prompt, answers and actions fit at 360×640 and 390×844
  for every exercise; feedback names the foil ("sounds like", "came from the other voice") and replays are one tap.
- Keyboard play is complete: 1–9 pick, arrows move, Enter goes on; Seek walks with arrow keys and answers with Enter.
- Sheets behave like proper modal dialogs (inert background, trapped Tab, Esc for the top one, focus return).
- Return without punishment is consistent everywhere: week ring "Missed days cost nothing", "Beyond the good rhythm
  this week. Rest days help learning settle.", sleep notes after three sessions with "Nothing is lost by stopping
  here", fresh ears that reported "Your level held".
- The Weekly Night Out is truly identical for everyone in a week, its card is spoiler-free, and a practice replay
  never changes the card.
- Tutorials state the next action at every step, hold captions ≥ 3 s, label every foil in the worked example and
  give "Try again" on a missed practice; the Seek tutorial teaches keyboard use too.
- Plateau cards say what stalled, over how many sessions, and what changes next; the overnight check names the
  condition and the model's expectation.

## Not covered

No real screen reader, phone, ears or volume; no human reading speed (tutorial times are lower bounds); Lab probes,
diary and own-voice recording only viewed, not played; iOS Safari, the sandboxed preview and 200 % text zoom not
tested; Variety mode was checked for running and planning only.
