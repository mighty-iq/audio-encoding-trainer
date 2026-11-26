# Stimuli — how every clip is made (owner: stimuli; times UTC)

Rebuild everything: `python3 tools/audio/build_all.py` (resumable; finished clips are skipped). Only encode and
check: `python3 tools/audio/build_all.py pack`. Raw corpora live outside the repository in `../corpora/<name>/`,
scratch renders in `../stimwork/` (WAV, per-step JSONL databases and logs). Nothing GPL ships: the synthesisers,
espeak-ng and the recognisers run at build time only; the app gets MP3 clips and JSON data.

## Outputs (generated; never edit by hand)
- `audio/pack-<name>.js` — `ES.packs['<name>'] = {clipId: base64 MP3}` (16 kHz mono, CBR 24 kbps, LAME Info frame).
- `data/manifest.js` — `ES.data.manifest = {version, sr, kbps, built, clips}`; per clip `pack, voice, kind, text,
  words, dur, adb, set, asr:{ok}` plus `wt` (word [start, end] s, phrases and sentences), `tags`, `item` (vocab id),
  `rate` (synthesis speed), `bed` (bed category), `diff` (dB, matrix words).
- `data/voices.js` — per voice `src, sex, accent, set, licence, f0` (median Hz), `clips`, and where it applies
  `tier` (1-3, accented voices), `cast {name, venue, blurb}`, `ageBand`, `noise:true` (pseudo-voices of beds).
- `data/vocab.js` — names, numbers, nouns, rhymes, family, neighbours (nouns, numbers, names), sus, susPools,
  phrases (Far), repair (one item per sentence), echo (+ echoValues), intros {voiceId: text}, stories, matrix
  {name, verb, num, adj, obj, slots}, twovoices.
- `data/packs.js` — per pack `bytes` (MP3), `file`, `fileBytes`, `clips`, `dur`, `exercises`.
- `data/ltas.js` — long-term average spectrum of the training speech: `mag` (257 bins of a 512-point FFT at
  16 kHz, dB re the maximum) and `third` (1/3-octave bands 100 Hz-8 kHz), for speech-shaped noise.

## Pipeline (tools/audio/)
1. Content (original): `content_words.py` (16 call signs with distinct onsets, numbers one-nine, 125 one-syllable
   nouns in 46 rhyme families), `content_sus.py`, `content_phrases.py`, `content_repair.py`, `content_echo.py`,
   `content_cast.py`, `content_babble.py`, `content_probe.py` (matrix, stories, two-voices labels).
2. Voices (`plan.py`): Kokoro-82M English voices (12 starter + 10 second wave), Kokoro voices of other languages
   reading English kept only if the recogniser gets ≥ 5 of 6 test utterances exactly (`scan_accent.py`), 20 Piper
   libritts-high speakers chosen for clarity and an even spread of F0 per sex (`scan_piper.py`). Probe voices
   (af_kore, bm_lewis, af_river, af_jessica, AudioMNIST and CREMA-D probe talkers) never appear in training.
3. Synthesis (`tts.py`, `render_phrases.py`): whole utterances; Kokoro runs from a variant of its int8 graph that
   also outputs its per-token durations (`kokoro_timed.py`), which gives word times. Every clip is trimmed to
   30 ms of silence, measured (active speech level, ITU-T P.56 method B: two-stage 30 ms envelope, 200 ms hangover,
   15.9 dB margin) and checked by Parakeet TDT 0.6B v2: short items must match word for word (homophones and
   spelling variants allowed via CMUdict, espeak-ng pronunciations for unknown spellings, Roman numerals and
   digits normalised); stories may differ by ≤ 6 % of words and must contain every keyword. A miss is re-rendered
   at speed ×0.95 and ×1.05, then with alternative voices or wordings (call-sign phrases), then dropped and logged.
4. Natural speech (`natural.py`, `natural_librivox.py`): AudioMNIST probe talkers (first of up to six takes the
   recogniser hears correctly), CREMA-D neutral sentences (8 clearest of 14 sampled actors, 4 per sex), LibriVox
   sentences cut at Parakeet's sentence ends and kept only where Parakeet and Whisper base.en agree word for word.
5. Matrix probe words (`cut_matrix.py`): cut from the held-out voices' matrix sentences at the synthesiser's word
   boundaries (refined to the quietest 5 ms within 30 ms), best take per word by recogniser and edge level;
   isolated synthesis only as a fallback. `intel.py` adds `diff` and voice `tier` from recogniser accuracy in
   speech-shaped noise.
6. Beds (`noise.py`): 10-s seamless loops (tail cross-faded into the head), -24 dBFS RMS; `adb` of a bed = RMS.
7. Packing (`pack.py --asr`): MP3 encode (cached by WAV hash), decode, re-measure `dur`/`adb` on the decoded audio,
   re-check speech with the recogniser on the decoded MP3; `registry.py` writes voices, vocab and LTAS;
   `validate.py` checks the schema, packs ↔ manifest, train/probe separation, ASR pass rate ≥ 98 %, budget.

## Decisions and dead ends (stimuli)
- Single words from Kokoro or Piper are unreliable (about 50-85 % recognised; "six" → "sex"); cutting words out
  of phrases left a loud edge (cut through speech) in 36 % of clips because the model rarely pauses between words;
  forcing pauses by lengthening punctuation or pad tokens makes the model voice filler vowels; a longer-utterance
  style vector adds syllables. So Crowd, Far, Seek and Voices use whole call-sign phrases ("Nora, boat, seven.",
  `kind:'phrase'`, `tags:['callsign']`) with word times; the engine's adapter (js/engine/items/adapt.js) reads them.
- The int8 Kokoro graph hides its durations; exposing /encoder/Cast_output_0 as an output gives word times.
- ffmpeg writes the MP3 Info frame (encoder delay and padding) only to a seekable file; with it, decoded length
  equals the original exactly (checked by cross-correlation), so `wt` and `dur` hold in the browser.
- CBR 24 kbps beats ABR/VBR in size on short clips (per-clip frame overhead dominates).
- AudioMNIST training digits are not built (no generator reads them); CREMA-D is probe-only.
