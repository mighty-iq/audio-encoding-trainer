# FRESH-B: fresh-player test of Echo, Seek, Voices, map, cast, weekly and missions

Written 2026-11-26 23:30 UTC. A fresh agent with no knowledge of the code tested the app. It drove Chromium through Playwright and chose each tap from a screenshot. It cannot hear, so the `?captions=1` line served as what it heard. It opened only the single-file app.

## Copies and runs

| Run | Copy | Device | Input | Fresh profile | Window (UTC) |
|---|---|---|---|---|---|
| r1 | snap2 | phone 390×844, touch | taps, touch drags | yes | 22:32–22:44 |
| r2 | snap2 | desktop 1366×768 | mouse, keys | yes | 22:45–22:51 |
| r3 | snap4 | phone 390×844, touch | taps, touch drags | yes | 22:51–23:06 |
| r4 | snap4 | desktop 1366×768 | mouse, keys | yes | 23:09–23:21 |

- **snap2** is the first copy. It turned out to lack four sound packs.
- **snap4** is the corrected copy, with all packs.
- Every finding below carries the tag **[snap2]**, **[snap4]** or **[both]**.
- A finding about missing or thin material is marked **snap2 only** unless it repeated on snap4.
- Screenshots are in `/tmp/fresh-b/` (outside the repo). They are named `rN-NNN-label.png`.

**How to read the times.** They are wall-clock times from the driver log. Each screen cost the agent a round trip of about 4 s to screenshot and decide. The table therefore also shows the time the app itself spent playing and waiting. A hearing person who reads at a normal pace should be at or below the wall time.

## 1. Time from opening an exercise to the first correct real answer (target under 2 min)

| Exercise | Copy, device | Opened | First correct real answer | Wall time | Screens; in-app time | Verdict |
|---|---|---|---|---|---|---|
| Echo | snap4 phone | 22:51:59.6 | 22:53:35.8 (trial 1, 3 of 3 details) | **1:36** | 13; 44 s | Pass. Includes the 6-step tutorial. First correct tutorial answer came at 0:41. |
| Echo | snap4 desktop | 23:10:01 | 23:11:53 (trial 1) | **1:52** | 8; 47 s | Pass. Includes the full tutorial. |
| Echo | snap2 phone and desktop | 22:34:09 and 22:46:05 | never | n/a | n/a | snap2 only: no Echo material (section 7). |
| Seek | snap4 phone | 23:02:40.6 | none fully correct. The word was named on real trial 1 at 23:04:33. | 1:53 to "Named it" | 13; 33 s | Could not be judged. A correct answer needs the voice found by ear; captions cannot stand in. The set scored 0 of 6, although 3 words were named. |
| Seek | snap4 desktop | 23:19:54 (first try 23:19:04 was blocked, see D3) | Practice scene 2 "Found and named" at 23:21:25 | 1:31 (practice) | 10; 27 s | Mouse drag and keyboard work. Real trials were not played on desktop. |
| Voices | snap2 phone | 22:35:08.6 | 22:37:02.3 (trial 1, Leila) | **1:54** | 17; 46 s | Pass, just. The time includes two missing clips (snap2 only). |
| Voices | snap2 desktop | 22:47:03.7 | 22:50:19 (trial 7) | 3:15 | 23; 85 s | Not a fair measure. Voice identity has no caption, so the five misses before it were coin flips. The tutorial itself took 1:19. |
| Far (extra) | snap4 phone | 22:55:00.6 | 22:56:41.2 (trial 1) | **1:41** | 10; 51 s | Pass. Includes the 7-step tutorial. Set result: 20 of 20. |

Reaching each exercise from first launch took 3 to 4 taps:
- Welcome, Start listening, Map, Café, then Play on a row for Echo and Voices.
- Lecture hall, then Play a set here, for Far.
- Seek has no path at all for a new player (C1).

## 2. Moments I was unsure what to do

- **C1 [both]: Where is Seek?**
  - Seek appears nowhere until the Park opens.
  - The Park opens only after a completed Far set at the Lecture hall reaches its mark.
  - Seek is also missing from the exercise list in Free mode, which shows Crowd, Far, Strange voices, Repair, Echo and Voices (`r1-115-free-panel.png`, `r3-042-s4-free.png`).
  - On snap2 the Far material was missing, so Park never opened and Seek could not be reached at all.
  - On snap4 I found it only after the Far set: "Find a voice in the open · Seek" at the Park (`r3-109-park.png`).
  - Suggestion: list Seek as a teaser on the Park card or home, and include it in Free mode.
- **C2 [snap4]: Seek's "✕ Named it" result.**
  - Naming the right word but stopping a few metres off shows a cross next to "Named it" (`r3-123-seek-p3-ans.png`, `r3-126-seek-r1-ans.png`).
  - The set summary then says "0 of 6 right" (`r3-133-seek-summary.png`).
  - Neither the tutorial nor the feedback says how close counts as found.
  - The practice scene repeats until you find the voice. That is fine, but nothing says so.
  - Suggestion: state the radius ("within 2 m counts as found") and use a half mark instead of the cross.
- **C3 [snap4]: The Far summary claims more than I played.**
  - In my first Far set every talker stood 1 to 4 m away (the trial radar never went past 4 m).
  - The summary still awarded three milestones: "Across the table" (3 m), "Across the room" (6 m) and "Across the hall: you catch the words from 11 m away, about 7 times in 10". It also showed "Distance: 11 m (first estimate)".
  - Seen on the phone (`r3-103-far-summary-full.png`) and on desktop (`r4-083-f21-done.png`).
  - The venue page straight after says "4 m · You catch the words from up to 4 m away in this room" (`r3-105-after-far.png`). The two numbers contradict each other.
  - The Park then shows "4 m" before I ever played there, and says "in this room" for an outdoor park.
- **C4 [snap4 desktop]: The Far test-aid line once showed a different phrase from the one scored.**
  - About 8.5 s after the previous answer, the answer buttons were active ("Your answers:"). The test-aid line read "said: Do not forget the hand and the pie tomorrow" (`r4-024-f2.png`).
  - The feedback said the phrase was "…the hand and the snail tomorrow", and "pie" was one of the options (`r4-025-f3.png`).
  - Far plays two phrases and scores the second. So either the answers unlock before the second phrase ends, or the caption showed the first phrase.
  - If the answers unlock early, a quick hearing player could answer from the decoy phrase. Worth checking.
  - The other 19 trials were scored right once I waited about 10 s.
- **C5 [both]: Grey Continue buttons look disabled.**
  - Tutorial text steps show a grey Continue for a moment (`r3-023-echo-t5.png`, `r2-021-voices-open.png`).
  - A click on it worked on snap2 desktop (`r2-022-voices-t1-click-grey.png`).
  - On snap4 desktop, Enter presses during the grey phase were silently ignored (D5).
  - I could not tell whether to wait or tap.
- **C6 [both]: Truncated status line on the phone.**
  - The trial header cuts off the dial value: "Speech vs…", "Café · Messag…", "Distance …" (`r3-025-echo-set1.png`, `r1-124-free-echo-session.png`).
  - The tutorial title is cut to "How to play: Stran…" (`r3-137-wk4-play.png`).
  - On the phone you never see the current difficulty number during a trial.
- **C7 [snap2]: Voices step 2 asks who it was after naming her.**
  - "Meet Leila … Listen, then tap the name" offers four names: Tess, Mei, Leila, Selma (`r1-031-voices-t2.png`).
  - It is trivial but harmless. Showing only her name would be clearer.
- **C8 [snap4]: Seek tutorial text and the practice.**
  - The tutorial has four text steps and no sound demo (`r3-110`…`r3-113`).
  - The first practice scene is the only demonstration of "louder as you get closer".
  - On desktop the text still says "Put your finger on your dot". It does add "On a keyboard: arrow keys walk, Enter answers".
- **C9 [snap4 desktop]: Arrow-key walking is very slow.**
  - Five presses moved the dot about 7 px (`r4-102-keys.png`). A press does start listening ("Listening… let go where it is loudest").
  - With auto-repeat from a held key this may be fine. Single presses feel stuck.

## 3. Dead ends, swallowed input, unreadable or overlapping text, scrolling

- **D1 [both]: Back needs two taps after "Finish session".**
  - Finish session lands on the venue. Back then goes to the same venue again; a second Back reaches the Map.
  - Phone, snap2: `r1-065-back-a.png`. Phone, snap4: `r3-107-m1b.png`. Desktop, snap4: two clicks needed.
  - The weekly page behaves the same: Back went from weekly to weekly to home (`r1-091-wk-back.png`) [snap2].
- **D2 [snap2 only]: Echo tutorial example loop.**
  - In step 2, "Skip this trial" loaded another missing clip every time (`r1-019`…`r1-023`).
  - Only the top-right Skip got out.
  - Real sets ended after four skips with "This set ends here: its trials could not be prepared." (`r1-128-fecho-skip4.png`).
- **D3 [snap4 desktop]: "See Park" leads to a Play button that refuses.**
  - From the Far summary, "See Park" opens the Park while the session is still running.
  - Clicking Seek's Play first looked like nothing happened. The second click showed a toast at the bottom: "Finish or end the session that is running first." (`r4-087-seek-open3.png`).
  - Recovery: Back returns to the summary (`r4-088-park-back.png`), then Finish session.
  - Suggestion: "See Park" should finish the session, or Play should offer to.
- **D4 [snap2 desktop]: A number key during "Listen…" is ignored but looks selected.**
  - Pressing 1 while the clip played left a blue focus ring on "Anouk", with no answer recorded (`r2-028-vt3-ans.png`, `r2-029-vt3-later.png`).
  - I had to press again (`r2-030-vt3-ans2.png`).
- **D5 [snap4 desktop]: Enter in the tutorial.**
  - During the grey phase, Enter does nothing and gives no feedback (`r4-095-st2.png`, `r4-096-st3.png`).
  - On "You are ready", Enter did not start the set; a click was needed (`r4-099-seek-prac.png`).
- **D6 [snap4 desktop]: A highlight that looks like a pre-selection.**
  - The hover highlight stays on whichever answer sits under the last click, for example "six fifteen" as an Echo trial opens (`r4-012-echo-r1.png`).
- **D7 [snap4 desktop]: Seek drag that starts off the dot.**
  - It is not silently swallowed: the hint changes to "Grab your dot, marked 'you', then drag." (`r4-101-offdot.png`). Good.
  - A touch drag on the phone and a mouse drag on desktop both moved the dot and opened the word question on release (`r3-115-seek-p-rel1.png`, `r4-103-mdrag.png`).
- **D8 [both]: The playtest "Note" bubble covers text on the phone.**
  - It sits over the Discord footer link on venue pages ("discord." is cut, `r3-109-park.png`) and over parts of the summary cards. It is playtest-only.
- **D9 [snap4 desktop]: The Back link moves.**
  - It sits at x≈345 on the Map but x≈410 on venue pages (narrower column), so it jumps between pages.
- **Scrolling during a trial: none.**
  - Every phone trial screen fit in 844 px (page height 844 during play).
  - This held even for Echo with three question groups of four answers plus feedback (`r3-030-echo-r1-ans.png`).
  - Summaries, Map, Cast and Settings scroll, which is fine.
- **Labels overlapping answers: none seen.**
  - In Echo feedback the radar shrinks to make room, which works.
  - On the phone, Seek's grid shifts up when the answer buttons appear (`r3-115` vs `r3-114`).

## 4. Tutorials

- **Echo [snap4]: good, 6 steps.**
  - Steps: rule, a worked example, two guided trials (1 s wait, then a louder room with a 3 s wait), "what adapts", then ready.
  - The example marks every key: "the answer", "not in the message", "sounds alike" (`r3-008-echo-ex4.png`). It is the clearest teaching screen in the app.
  - Change 1: say in step 1 that the message plays once and cannot be replayed before answering.
  - Change 2: explain "Again, in the noise" and "The voice alone".
  - Change 3: during the silent wait, a static "hold it…" label would stop players thinking it froze.
- **Far [snap4]: good, 7 steps.**
  - "The first lets you hear the room. Then tap what you heard in the second."
  - Then an example and three practice distances: 1.5 m, 4 m, 6 m.
  - Change 1: "First word / Second word" labels sit next to "second phrase" wording, which is easy to mix up. "Word 1 / Word 2 of the second phrase" would help.
  - Change 2: see C4.
- **Voices [snap2]: clear, 6 steps.**
  - Steps: meet Leila, meet Anouk, "who is it?", what grows, then ready.
  - The useful cue arrives only after a miss: "close in pitch (about 210 Hz and about 195 Hz): listen for pace and voice quality" (`r2-038-vr1-ans.png`).
  - Change: give one listening cue before the first test (pitch, pace, voice quality).
- **Seek [snap4]: mechanics clear, success rule missing.**
  - It covers the mechanics: drag, let go where it is loudest, tap the word.
  - Change 1: state the success radius.
  - Change 2: say that practice repeats until found.
  - Change 3: device-neutral wording on desktop ("press and drag").
  - Change 4: possibly a 5 s audio demo of near versus far.
- **Strange voices** (seen in the weekly) [snap4]: 7 steps, which I skipped. The first trial worked with the vocoded voice (`r3-139-wk4-s1b.png`, `r3-140-wk4-s1-ans.png`).

## 5. First sight of the map, cast, weekly, missions, settings and "voices from your life"

- **Welcome [both]: clear.**
  - Phone uses a bottom sheet, desktop a modal (`r1-001-open.png`, `r2-001-open.png`). The Discord link is prominent, and Start listening is focused on desktop.
- **Map [both]: clear once read.**
  - "The night out · 3 of 12 venues open". A Y-shaped map with two branches (Far & echoey, Many voices), "you" at the base and Phone line below (`r1-006-map-full.png`, `r2-004-map.png`, `r3-108-m2.png`).
  - Locked venues say exactly what opens them: "Opens when your earshot at the café reaches 0 dB or better …" with a disabled "Opens later" (`r1-103-restaurant.png`).
  - The "≥ 3 m / ≤ 0 dB" notation on the nodes is technical but readable.
  - On the phone the map plus lists run to about 2 screens.
  - The snap4 intro ("Each number is the level where you get about 7 in 10 right …") is clearer than the snap2 one.
- **Cast [both]: understood at once, but mostly empty.**
  - "2 of 38 met · 0 known".
  - A met card shows name, role, "synthetic voice · English with a French accent · about 210 Hz", a pitch scale and "heard 3 · picked out 0 of 3" (`r1-095-cast-full.png`, `r2-061-d-cast.png`).
  - 36 identical "? ? ?" cards make a long empty page: 3,110 px on the phone, almost 4 screens. Collapsing unmet cards per venue would help.
  - Copy nits:
    - "cafe" in voice bios but "Café" for the venue.
    - Lower-case day names: "rings the bells on sundays", "plays records at the club on fridays" (`r3-103`, `r3-133`).
- **Weekly [both]: clear.**
  - "Four stops, six trials each, from easy to hard. Everyone on this version plays the same night" (`r1-083-weekly.png`, `r3-136-weekly4.png`).
  - "Same night for: v0.1.0 · w1 · 1" is jargon.
  - Stops include venues still locked on the map (Concert, Restaurant), which works as a teaser.
  - On snap4 the first stop showed the Strange voices tutorial, and the trial worked.
  - "End set" ends only that stop ("SET 1 OF 4", `r3-142-wk4-end.png`). It is unclear whether the night continues.
- **Missions [both]: clear and pleasant.**
  - "Close the distance" with a one-line why (about 6 dB per halving of distance).
  - Two buttons ("Yes, I tried it" / "Not this week"), a disabled Save until answered, and a "choose a different mission" option (`r1-098-missions.png`, `r1-101-mission-yes-full.png`, `r2-062-d-missions.png`).
- **Settings, mode switch [both]: works.**
  - Free opens a panel with exercise tabs and dials, each with "Coach suggests …" (`r2-055-free-panel.png`).
  - Switching back to Edge restored the default (`r2-056-edge-again.png`, `r1-130-edge-back.png`, `r3-043-edge.png`).
  - Each mode's "Right for …" line is helpful.
- **Voices from your life [snap2 desktop]: clear.**
  - Fields: "Whose voice is it?", a permission checkbox, and Record (up to 20 s) / Import a voice note.
  - Both buttons stay disabled until the name and permission are given, then enable (`r2-058-yourvoices.png`, `r2-059-yourvoices-filled.png`). "Saved on this device only."
  - I did not record.
- **Lab [snap2 phone]: three of the seven check-in cards read "later build".**
  - The three are Matrix, Rooms and New voice. Each says "The probe voices for the matrix arrive in a later build" (`r1-141-lab-full.png`).
  - The matrix sentence on Rooms and New voice looks like a copy slip.
  - The other cards (Digits, Two voices, Story, Diary) show "no runs yet".

## 6. Fun or not fun (impressions)

**Fun:**
- Echo's marked feedback and the "All 3 details held through a 1 s wait" line.
- Far's distance radar.
- "Park is open", and the milestone card with the Discord invite.
- Collecting cast cards.
- Voices feedback that teaches (Hz, pace).
- Seek's drag is tactile and the reveal (dashed path, "8.6 m from where you stopped") is satisfying.

**Not fun:**
- Seek's "0 of 6 right" after naming half the words.
- Three milestones handed out at once for distances never played (C3).
- On snap2: whole sets that end with "could not be prepared" yet count as sessions ("That is 6 sessions today … come back after sleep", `r1-128-fecho-skip4.png`) [snap2 only].

## 7. snap2-only problems: missing material (did not repeat on snap4)

- **Echo:**
  - The tutorial example was missing; "Skip this trial" looped.
  - Real trials had no questions, only "Skip this trial" (`r2-011-echo-real-skip1.png`).
  - The set ended after four skips.
- **Far:** "This sound could not be prepared" (`r1-010-far-skip.png`, `r1-133-far2.png`). As a result Park and Seek could not be unlocked.
- **Start session** opened Strange voices, and every trial failed.
- **The weekly** failed on all trials of stop 1 (`r1-084-weekly-play.png`).
- **Free-mode Echo** failed. "Active time 0:00", but the session still counted.
- **Voices in noise:** some trials failed (`r2-047-vr6-ready.png`), and the tutorial's "Try again" hit a missing clip.
- **Console [snap2]:** 65 "missing clip" errors, 51 on the phone and 14 on desktop (Echo, Repair, Strange-voice phrases). There were no page errors.

## 8. snap4 health

- On snap4 the console showed 0 errors and 0 page errors across both runs.
- I never saw "could not be prepared" in:
  - Echo: tutorial and 3 trials on the phone, tutorial and 1 trial on desktop.
  - Far: 20 + 20 trials.
  - Seek: 3 practice and 6 real trials.
  - The weekly: 1 trial.
