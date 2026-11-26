# Release verification (filled at release; every line checked against the built files)

Release candidate: (commit) · built (UTC) · checked by (lead + independent checker)

## Fixed for every new tool (standing rules)
| Requirement | Where / how verified | Result |
|---|---|---|
| Chimera pop-up on open: full welcome first launch, light one-tap later, clickable https://discord.gg/chmr in a new tab | js/core/chimera.js; e2e shell_open (first + second launch) | |
| Permanent Chimera link in the interface | header/footer; screenshot | |
| Link in README first line | README.md line 1 | |
| Link in the guide | docs/Earshot-Guide.pdf cover + last page (link annotations) | |
| Link at the end of every tutorial | tutorial runner last step; e2e ex_a/ex_b tutorial | |
| Link in every share text (weekly card, missions share) | js/game share text; js/ex/missions.js | |
| Invitations at personal best, milestone, plateau, export; never inside a set | ES.core.chimera.invite callers; e2e session (none during sets) | |
| Seeded weekly challenge, identical for everyone; result card | game_weekly e2e (two runs identical) | |
| Deliverable 1: repository ready for GitHub Pages (main, root) | index.html at root; relative paths; Pages check after merge | |
| Deliverable 2: one self-contained HTML, offline, from disk, sandboxed preview, phones | dist/earshot.html; e2e file://, srcdoc, 360×640 | |
| Deliverable 3: PDF guide with references and clickable links | docs/Earshot-Guide.pdf page check + link annotations + metadata | |
| Deliverable 4: Discord announcement < 2,000 characters | docs/dev/announcement.md character count | |
| Deliverable 5: build log in the project; lessons merged into claude/playbook.md | project docs | |
| Code MIT; texts and guide CC BY-SA 4.0 | LICENSE, LICENSE-TEXTS.md, About → Credits, PDF | |
| No copied test items, no clinical clones, no GPL/AGPL/NC assets, no commercial trainer names | RV-claims, RV-stimuli, LICENSES-ASSETS.md | |
| Data on the device; versioned saves; export and import work | store tests; lab export/import round trip | |
| No streaks; nothing punishes a missed day | game unit test scanning strings; RV-play | |
| Timed stimuli clean (nothing decorative runs during a stimulus) | code review + e2e frame checks | |
| Default mode holds difficulty at the edge on every dimension | engine sims (Edge accuracy 0.70–0.80, focus dials) | |
| Plateau detection with a stated change and reason | engine sims + RV-play screenshots | |
| Transfer portfolio, each exercise tagged with its bet, ≥ 1 new bet | ES.ex[*].bet / betNew; README table | |
| Several progression modes on one record; app says when each is right | Settings copy; RV-claims | |
| Probes near/mid/far, baselines, alternate forms, poolable export; gains visible within weeks | lab sims (79 % clear by check-in 4) | |
| Two-minute start tested on a fresh agent | fresh-player test reports | |
| Playtest mode in test builds, off by default at release | release build flag; Settings toggle | |
| Privacy: commits noreply + UTC, no session links, pre-push check, nothing about the owner | privacy_check --history; zip check | |
| Visual concept of its own (Audiogram), phone and desktop screenshots looked at | screenshots | |

## Owner's instructions (BRIEF.md)
| Instruction | Where / how verified | Result |
|---|---|---|
| Ultimate audio-encoding trainer following standing rules and playbook | this table + reviews | |
| Repository in mighty-iq (created by the owner; rename allowed) | remote URL | |
| Exercises for audio encoding, loud places (parties), far away, non-standard speech | Crowd/Repair/Seek; Far; Strange/Voices; Echo | |
| Good progression mechanics | 5 modes, engine sims | |
| Interleaving and variability principle (dosed per research) | controller breadth + block-then-interleave; DECISIONS | |
| Board answers: name Earshot, look Audiogram, voices mixed, frame Night out, all 8 exercises | app name, CSS tokens, packs, map | |
| Priorities: loud places > far > accents > memory > fun > fast progress > proof > short sessions | planner weights | |
| Everything except 3D direction works on a phone speaker | headphone gating of spatial dials | |
