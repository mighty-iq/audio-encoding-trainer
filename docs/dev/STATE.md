# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-26 20:09 UTC

## Phase
2 → 3 overlap. Built and verified by their builders: shell, audio, engine (5 modes, solver/shortcut/sim checks,
plateau retuned), exA (Crowd, Far, Strange, Repair), lab (7 probes, stats: 1.5 dB gain clear by week 4 in 79 %),
game (map, cast, weekly, progress). Still building: stimuli (full voice set, probe materials), exB (Echo, Seek,
Voices, Missions). Reviews RV-code (2 high/11 medium) and RV-claims (2 high/13 medium) done on e079caf →
FIX ROUND 1 running (docs/dev/reviews/FIX-ROUND-1.md: rulings + per-owner assignments; all 7 builders active).

## Running subagents (IDs in the lead's container notes)
- shell → index.html, css/, fonts/, js/core/, js/ui/, js/app.js, tools/build-*.mjs, tests/unit/run.mjs, tests/e2e/
- audio → js/audio/**, tests/unit/audio*, tests/e2e/audio_*.py
- stimuli → tools/audio/**, data/**, audio/**, docs/dev/STIMULI.md, LICENSES-ASSETS.md (starter pack first)
- engine → js/engine/**, tests/unit/engine*, tests/sim/**
- exA → js/ex/{crowd,far,strange,repair,strategies}.js · lab → js/lab/** · game → js/game/**
Each keeps docs/dev/progress/<owner>.md; cross-owner needs in docs/dev/requests.md. The session server restarted at
~18:18 UTC; every builder was resumed from its transcript (background jobs it had running were lost).

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
1. Collect fix-round-1 replies; rebuild; run all unit + e2e suites; republish the test build.
2. When stimuli lands probe materials and content: RV-stimuli, RV-play, RV-a11y and fresh-player tests on a new
   snapshot (docs/dev/briefs/phase3.md), then fix round 2.
3. Guide PDF (builder brief in phase3.md), Discord post, release build (playtest off), verification table, release
   checklist page, build log and playbook merge; then wait for the owner's yes.

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
