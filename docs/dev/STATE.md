# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-26 22:29 UTC

## Phase
3 — review, fix, release (overlapping the last build work). Fix round 1 done by engine, lab, game, exA, exB; shell's
fix round 1 is uncommitted in the working tree (31 files) and the shell builder is resuming after a server restart
(~21:55 UTC). Stimuli: stage 1 (probe materials) committed; stages 2–3 (content, more voices) running.
Guide PDF (35 pages) and announcement done (33d8ea5). All exercises exist (exB done).

## Running subagents (IDs in the lead's container notes)
- Reviews on snapshot 75c28ba (/tmp/rv-snap2): FRESH-A, FRESH-B (fresh players, captions aid ?captions=1),
  RV-stimuli, RV-play-a11y → docs/dev/reviews/*.md. Stimuli stage 3 (LibriVox talkers, re-renders, ledger) running.

## Done
- Research R1–R6 complete (docs/research/), ACCESS.md lists sources not opened (core: Whitton 2017, Wright 2010/2015,
  Brungart 2001, Darwin 2003, Cameron & Dillon 2011, Smits 2013).
- docs/dev/PLAN.md draft (concept, failure modes, 8 exercises with bets, engine and 5 modes, Lab probes, game layer,
  stimuli, audio engine, architecture, visual concept, milestones M1–M10 + Phase 3).
- Decision board published privately (link in BRIEF.md and the project status note): exercise cards with switches,
  4 decisions (name, look, voices, game frame), 3 playable sketches (Crowd, Seek, Far), rank list, notes, papers,
  device probe (screen, touch, frames, codecs mp3/opus/aac, latency, storage, hearing + stereo check).
- Spikes: Kokoro int8 RTF ≈2.2 on 2 CPUs; isolated TTS words unreliable, phrases fine; Parakeet ASR verifies clips
  (~0.2–0.9 s per clip); MP3 16 kHz 24–32 kbps ≈ 3–4 KB/s; Web Audio offline mixing, HRTF, convolver work from file://.

## In progress (lead)
- Test build republished (19:30 UTC) with map, Lab, cast, weekly; playtest db sync on (no reports yet).
- Lead-owned done: LICENSE (MIT), LICENSE-TEXTS.md (CC BY-SA 4.0), README, fixlist, contracts updates, warm-up wiring.

## Next three steps
1. When the shell commits: build-index, full unit + e2e suites, rebuild and republish the test build.
2. New snapshot → RV-stimuli, RV-play, RV-a11y, fresh-player tests (docs/dev/briefs/phase3.md) → fix round 2.
3. Release: release build (playtest off), guide with URLs, VERIFY.md table, release checklist page, build log,
   playbook merge; wait for the owner's yes to merge build → main.

## Open questions
- Owner to rename the repo to Earshot (taps sent).
- speechocean762 licence confidence medium-high (no LICENSE file in the GitHub copy).

## Last verified
- Board: Playwright file:// at 390×844 and 1366×768: sketches play, probe runs, no page errors (fonts offline only).
- privacy_check clean on every push; last pushed commit on `build` see git log.

## Dead ends
- gh CLI token invalid; api.github.com refused → no repo rename by API (owner renames in Settings).
- Hugging Face/OpenSLR/Zenodo blocked. Piper models fine-tuned from Lessac rejected (research-only data).
- sherpa-onnx 2.0.3 has no espeak front end for Piper models → run ONNX via onnxruntime + build-time phonemiser.
- Web-search budget is shared by all agents and ran out in research; WebFetch of URLs not from a search needs the
  owner's approval prompts → plan future research with few agents and known URLs.
