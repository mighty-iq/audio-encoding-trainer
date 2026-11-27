# Release verification (every line checked against the built files)

Release candidate: version 1.0.0 on `build` (commit recorded in STATE.md at release) · checked 2026-11-27 UTC by the
lead, with spot checks by an independent final checker (docs/dev/reviews/FINAL-CHECK.md).
Evidence legend (FINAL-CHECK spot-checked 17 rows; rows on Edge accuracy and Lab sensitivity corrected to the recorded runs): e2e = `tools/with-browser.sh python3 tests/e2e/run_all.py --all` on the candidate; unit =
`node tests/unit/run.mjs` (221/221); sims = `node tests/sim/run.mjs` (4 modes × 200 learners; solvers 0 failures on
10,000 trials per generator; shortcut responders within chance + 0.06 in every bin).

## Fixed for every new tool (standing rules)
| Requirement | Where / how verified | Result |
|---|---|---|
| Chimera pop-up on open: full welcome first launch, light one-tap later, clickable https://discord.gg/chmr in a new tab | js/core/chimera.js welcome(full); e2e shell_open (first and later launches); RV-play: full once, light on 16 later opens | pass |
| Permanent Chimera link in the interface | js/ui/widgets.js footer link; js/ui/screens/about.js | pass |
| Link in README first line | README.md line 1 | pass |
| Link in the guide | docs/Earshot-Guide.pdf (cover and back page; link annotations checked by tools/build-pdf.py) | pass |
| Link at the end of every tutorial | js/ui/tutorial.js last step (linkEl 'discord.gg/chmr') | pass |
| Link in every share text (weekly card, missions share) | js/game/share.js, js/game/weekly.js LINK, js/ex/missions.js | pass |
| Invitations at personal best, milestone, plateau, export; never inside a set | ES.core.chimera.invite callers (results, lab runner/report, exports); RV-play: none on 1,007 answer screens; one card per results screen | pass |
| Seeded weekly challenge, identical for everyone; result card | js/game/weekly.js (seed weekly:<week>:w1); RV-play: week 45 identical for two profiles, 24 trials | pass |
| Deliverable 1: repository ready for GitHub Pages (main, root) | index.html at root, relative paths, manifest + sw.js (PWA, tests/e2e/pwa.py 57/57) | pass (Pages switch-on after merge) |
| Deliverable 2: one self-contained HTML, offline, from disk, sandboxed preview, phones | earshot.html (12.98 MB, playtest off, no worker); e2e shell_srcdoc, file:// suites, layout 360×640 and 640×360 | pass |
| Deliverable 3: PDF guide with references and clickable links | docs/Earshot-Guide.pdf, 35 pages, 83 URLs / 118 link annotations, fonts embedded, metadata UTC, 136 code facts | pass |
| Deliverable 4: Discord announcement < 2,000 characters | docs/dev/announcement.md, 1,803 characters with addresses | pass |
| Deliverable 5: build log in the project; lessons merged into claude/playbook.md | project docs claude/build-log-earshot.md, claude/playbook.md | at release |
| Code MIT; texts and guide CC BY-SA 4.0 | LICENSE, LICENSE-TEXTS.md, About → Credits (js/ui/screens/credits.js), guide back page | pass |
| No copied test items, no clinical clones, no GPL/AGPL/NC assets, no commercial trainer names | RV-claims, RV-stimuli (originality; matrix words checked against Hall 2006, validate.py fails on overlap), LICENSES-ASSETS.md | pass |
| Data on the device; versioned saves; export and import work | store envelope + schema guard; e2e shell_storage, shell_download, lab export/import round trip | pass |
| No streaks; nothing punishes a missed day | no streak mechanic in js/ (voices-own.js "streak" is a 2-down staircase counter); RV-play: fresh-ears and overnight notes gentle | pass |
| Timed stimuli clean (nothing decorative runs during a stimulus) | RV-play: nothing on screen changed in 12 trials with real sound; reduced motion respected | pass |
| Default mode holds difficulty at the edge on every dimension | `node tests/sim/run.mjs` on the candidate, Edge × 200 learners: edge trials 0.75 right (p5–p95 0.71–0.78; planned 0.73), all trials 0.78 (anchors included), dials chosen per bottleneck | pass |
| Plateau detection with a stated change and reason | js/engine/plateau.js; sims false alarms 3.8–7.5 %; RV-play plateau cards with reason | pass |
| Transfer portfolio, each exercise tagged with its bet, ≥ 1 new bet | ES.ex[*].bet / betNew (Seek, Voices new); README table; guide chapter 1 | pass |
| Several progression modes on one record; app says when each is right | Edge, Path, Variety, Focus, Free; Settings copy; Path stage/step, Focus target shown (round 2) | pass |
| Probes near/mid/far, baselines, alternate forms, poolable export; gains visible within weeks | js/lab (7 checks), five-block baseline, export JSON/CSV/pooled; lab simulation n = 500 (docs/dev/progress/lab.md): a true 1.5 dB Matrix gain reads clear by the 4th weekly check-in for 79 % (76–80 % across gain shapes), likely or clear 91 %; a zero gain reads clear for 2 % | pass |
| Two-minute start tested on a fresh agent | FRESH-A/FRESH-B: Crowd ~1:15–1:45, Far ~1:35–1:45, Repair ~1:20, Strange 1:27 (phone), Echo 1:36–2:09 (as the first exercise incl. its tutorial) | pass (Echo at the limit) |
| Playtest mode in test builds, off by default at release | ES.TEST_BUILD only with --test; Settings toggle off by default; earshot.html has no testBuild flag | pass |
| Privacy: commits noreply + UTC, no session links, pre-push check, nothing about the owner | tools/privacy_check.py on every push; shingle check of committed docs vs the brief (no quotes); grep for device and place facts: none | pass |
| Visual concept of its own (Audiogram), phone and desktop screenshots looked at | lead and reviewers' screenshots at 360–1366 px, light and dark | pass |

## Owner's instructions (BRIEF.md)
| Instruction | Where / how verified | Result |
|---|---|---|
| Ultimate audio-encoding trainer following standing rules and playbook | this table + six reviews and two fix rounds | pass |
| Repository in mighty-iq (created by the owner; rename allowed) | origin mighty-iq/audio-encoding-trainer; rename left to the owner (taps given) | pass |
| Exercises for loud places (parties), far away, non-standard speech, audio encoding | Crowd, Repair, Seek; Far; Strange voices, Voices; Echo | pass |
| Good progression mechanics | 5 modes, per-dial learner, first-week planner, venues and milestones on careful estimates | pass |
| Interleaving and variability principle (dosed per research) | controller breadth (block then interleave), planner mixing; DECISIONS | pass |
| Board answers: name Earshot, look Audiogram, voices mixed, frame Night out, all 8 exercises | app name, css/tokens.css, real + synthetic packs, Night out map, 8 exercises | pass |
| Priorities: loud places > far > accents > memory > fun > fast progress > proof > short sessions | js/engine/planner.js weights (crowd .20, far .22, strange .18 …) | pass |
| Everything except 3D direction works on a phone speaker | spatial dials gated on headphones; the owner's device has no headphones | pass |
