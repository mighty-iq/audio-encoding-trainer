# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-28 18:12 UTC

## Phase
1.1 — phase 1 (research and plan). Earshot 1.0.0 is released on `main` (c5fbb63). The owner asked (2026-11-28) for
research into better progression, level tracking and other game features, and anti-strategy measures for more
real-world transfer. Plan gate: decision board + short plan message, then wait for the owner's go.

## Running subagents
- R12 reader: Wright et al. 2010 and 2015 in full (plan B1's daily amount and listen-only rule), Hickson 2007
  effect sizes, Oberfeld 2016, Reynard 2022 → docs/research/v1.1/R12-papers-fetched.md (uncommitted until checked).

## Done since the last milestone
- 1.1 research: R0, R7, R8, R9; R10 (seven core papers the owner supplied, read in full) and R11 (16 papers through
  Scholar) corrected the plan (A1 retargeted to the recorded loops + level roving; B1 numbers; B2 in days, runs ≥ 5
  with named conditions; B8–B10; C2 yardsticks; D8 Seek Trace; E4–E5); decision board 1.1 republished with a
  "what the papers changed" list and the two Wright papers still being fetched.
- Fix round 2: engine (pool-matched foils, Repair without a central answer, Echo balance and variety, first-week
  planner, session = ≥ 1 answered trial), stimuli (1,200 clips, 89 voices, 8.235 MB MP3; matrix 50/50 per talker),
  shell (download helper, sideways phones, failures move on, Back, Continue, answer keys, Exercises list, Path and
  Focus shown, one formatter, a11y), game (careful milestones and venues), exA, exB, lab; PWA + in-app notice.
- Version 1.0.0; welcome says what Earshot is; release single file `earshot.html` (12.98 MB, playtest off) committed
  at the root; sw.js precache for the candidate; README with the Pages address.
- Guide 35 pages with the release addresses (136 code facts checked by its builder); announcement 1,803 characters.
- Release checklist page (9 pass/fail checks, db + Copy) and the test build (candidate, playtest on) published
  privately; links in BRIEF.md and the project status note.

## Last verified (candidate 2, 91b22c3; candidate 1 89818c3 also from the unpacked archive)
- Unit 224/224 (candidate 1 from the unpacked archive 221/221 after the git-reader test fix).
- Browser `run_all.py --all`: 958/958 shell checks, 12/12 other owners' suites (incl. pwa 57/57), 0 failures.
- Sims: Edge/Path/Variety/Focus × 200 learners; solvers 0 failures on 10,000 trials per generator; shortcut
  responders within chance + 0.06 in every bin.
- Release single file: file:// at 390×844 and 1366×768, no page errors, no service worker, no playtest UI; welcome
  fits 360×640. privacy_check clean on every push.

## Next three steps
1. Wait for the owner's go on docs/dev/PLAN-v1.1.md (decision board 1.1: link in BRIEF.md and the status note).
2. On go: save the answers to BRIEF.md, settle the plan (drop what the owner switched off), write contracts for 1.1.
3. M0 (1.0.1 claim fixes, answers after the sound, replay with words), then M1–M7 with builders.

## Open questions
- Owner may rename the repo (Pages URL changes with it; the guide and announcement then need a rebuild).
- Single file 12.98 MB vs the 12 MB target (lazy packs in docs/dev/PLAN-v1.1.md).

## Dead ends
- gh CLI token invalid; api.github.com refused → no repo rename or Pages switch by API (owner taps).
- Hugging Face/OpenSLR/Zenodo blocked. Piper models fine-tuned from Lessac rejected (research-only data).
- sherpa-onnx 2.0.3 has no espeak front end for Piper models → run ONNX via onnxruntime + build-time phonemiser.
- Web-search budget is shared by all agents and ran out in research; WebFetch of URLs not from a search needs the
  owner's approval prompts → plan future research with few agents and known URLs.
- Single TTS words (50–85 % recognised) and word cutting from phrases → whole call-sign phrases with word times.
