# STATE (rewritten at every milestone; under 100 lines; times UTC)

Updated: 2026-11-26 16:30 UTC

## Phase
1 — Research and plan: DONE. Now at the PLAN GATE: the plan message and decision board are with the owner.
Do not start Phase 2 until the owner says go (or answers on the board). Name, look, voices and game frame are open.

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

## Next three steps (after the owner's go)
1. Read the board answers (db_get slug 23b08504-… path answers/owner) or the pasted block; append them word for word
   to BRIEF.md; apply name/look/voices/frame; mark PLAN.md approved; log decisions.
2. M1 contracts: write docs/dev/CONTRACTS.md (namespace, module ownership, interfaces, file map) and start parallel
   builders (core shell, audio engine, stimulus pipeline, engine/generators).
3. M2 stimulus pipeline in the background early (TTS + ASR checks take hours): tools/audio/.

## Open questions
- Owner: name, look, voices policy, game frame, exercise keep/drop, priorities ranking.
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
