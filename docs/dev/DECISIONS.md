# Decisions (append-only; one line each, with the reason; times UTC)

- 2026-11-26 Working name "Earshot" and local folder `earshot/` until the owner picks a name; the repository is mighty-iq/audio-encoding-trainer (the owner allowed a rename). Reason: a name is the owner's call; a working name keeps files consistent meanwhile.
- 2026-11-26 Privacy check copied from the owner's earlier tool (tools/privacy_check.py + pre-push hook). Reason: standing rules require a pre-push check; this one already checks commit data and every added blob.
- 2026-11-26 Build container reaches only GitHub (git, raw, LFS media, release assets), PyPI and npm; Hugging Face, OpenSLR, Zenodo and similar are blocked. Reason: tested with curl; it limits which speech corpora and models are usable.
- 2026-11-26 Candidate speech sources found reachable: AudioMNIST (60 talkers, spoken digits, MIT licence, many non-native accents), CREMA-D (91 actors, 12 sentences x 6 emotions, ODbL/DbCL), Kokoro-82M TTS (Apache-2.0, 54 voices), sherpa-onnx ASR models for build-time checks. Reason: licence files read; downloads tested. Final choice waits for research note R6.
