# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-26 16:58 UTC

## Phase
2 — Build. Owner said go at 16:44 UTC and accepted every recommendation (Earshot, Audiogram, mixed voices, Night out,
all 8 exercises). Wave 1 builders running against docs/dev/CONTRACTS.md.

## Running subagents (IDs in the lead's container notes)
- shell → index.html, css/, fonts/, js/core/, js/ui/, js/app.js, tools/build-*.mjs, tests/unit/run.mjs, tests/e2e/
- audio → js/audio/**, tests/unit/audio*, tests/e2e/audio_*.py
- stimuli → tools/audio/**, data/**, audio/**, docs/dev/STIMULI.md, LICENSES-ASSETS.md (starter pack first)
- engine → js/engine/**, tests/unit/engine*, tests/sim/**
Each keeps docs/dev/progress/<owner>.md; cross-owner needs in docs/dev/requests.md.

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

## Next three steps
1. Watch requests.md and progress notes; answer requests; integrate as modules land.
2. Write wave-2 briefs: exercise views A (crowd, far, strange, repair), B (echo, seek, voices, missions), lab, game.
3. First playable build (Crowd + Far + tutorial + playtest mode) as a private artifact → send to the owner.

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
