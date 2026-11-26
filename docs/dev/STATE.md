# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-26 15:30 UTC

## Phase
1 — Research and plan. The plan gate comes next: plan message + decision board, then wait for the owner's go.

## Done
- Workspace: BRIEF.md and RULES.md (git-ignored), root CLAUDE.md imports, privacy check + hook, `main` pushed.
- Repository attached: mighty-iq/audio-encoding-trainer (was empty; no owner commits to check).
- Feasibility: Kokoro int8 TTS runs on CPU at about 2.2x real time; AudioMNIST, CREMA-D, Piper voices and a
  Parakeet ASR model download from GitHub (raw corpora outside the repo, in the container's corpora folder).

## In progress
- Research agents R1–R6 write docs/research/R1…R6-*.md (training efficacy; non-standard speech learning;
  cocktail-party and distance mechanisms; measurement; progression and game design; corpora and licences).
- Spikes: audio encode size/quality (MP3 at 16 kHz), Web Audio mixing/decoding in headless Chromium.

## Next three steps
1. Read R1–R6 summaries; write docs/research/ACCESS.md (sources not opened) and tell the owner about any core paper
   we cannot open.
2. Write docs/dev/PLAN.md (exercises, transfer bets, modes, probes, visual concept, milestones + acceptance checks).
3. Build the decision board page (cards, decisions, 2–3 playable sketches, rank list, device probe) and send the
   five-part plan message; stop at the plan gate.

## Open questions
- Name (owner decides; recommendation on the board). Whether synthetic voices are acceptable alongside recordings.

## Last verified
- privacy_check --self-test ok; --history clean (1 commit) before pushing `main` (c255538).

## Dead ends
- `gh` CLI token invalid and api.github.com refused by the proxy: no repo creation or rename via API.
- Hugging Face and other dataset hosts blocked: only GitHub/PyPI/npm sources are usable.
