# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-27 12:00 UTC

## Phase
Released. Earshot 1.0.0 is on `main` (fast-forward to 0a0e7b8, 2026-11-27 ~11:58 UTC) with the owner's go-ahead; the
owner skipped the release checklist and left any fixes for later. GitHub Pages switch-on could not be checked from the
container (API and github.io refused); the owner has the taps. Next work: owner feedback, then the 1.1 backlog.

## Running subagents
- None.

## Done since the last milestone
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
1. Owner: confirm Pages is on (Settings → Pages → Deploy from a branch → main, / (root)); post the announcement.
2. Read playtest reports (db collection playtest) and any checklist answers (release checklist db answers/owner).
3. Fix what the owner reports; then plan 1.1 from docs/dev/PLAN-v1.1.md.

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
