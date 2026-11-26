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
- Bulk renders (Repair, Echo, Far, the non-accented SUS) use the 20 Piper voices (several times faster than
  Kokoro); Kokoro voices are the featured cast, the accented voices and the probe voices.
- Accented Kokoro voices are kept when at least 4 of 6 test utterances are recognised exactly and the mean word
  error is at most 12 % (15 of 17 kept); strength is graded into tiers 1-3 by recogniser accuracy at 0 dB SNR.
- Probe matrix: the first draft shared 7 adjectives, 3 verbs and 2 numbers with the published British English
  matrix test (Hall 2006, Table 2.1), so the words were replaced; validate.py now fails on any overlap.
- Stories run 35-40 s (Kokoro at speed 0.95 reads about 3.2 words/s), below the 45-60 s in the plan; longer
  passages would cost about 0.4 MB of the 8.5 MB budget.
- Item lists in data/vocab.js carry only items that have audio, so the app never picks an unplayable item.
- Numbers carry no neighbour list (one-nine have no true sound-alikes); names keep only near-rhymes (harper/parker).
- data/credits.js lists every shipped source with its licence and attribution; LICENSES-ASSETS.md has a generated
  "what ships" table.

## Numbers (last build)
<!-- stats:start -->
_Generated by tools/audio/report.py at 2026-11-26 21:03 UTC._

Total: 810 clips, 66 voices, 4.99 MB of MP3 (budget 8.5 MB); recogniser pass on the decoded MP3 of kept speech clips: 100.0%; clips sent back after MP3 coding in the last pack: 0.

| Pack | Clips | Seconds | MP3 MB | JS MB | Exercises |
|---|---|---|---|---|---|
| babble | 34 | 87 | 0.275 | 0.369 | crowd, echo, repair, far, seek |
| beds | 9 | 90 | 0.274 | 0.365 | crowd, echo, far, seek, repair, strange, voices |
| cast | 9 | 34 | 0.106 | 0.142 | voices, game |
| probe | 346 | 742 | 2.380 | 3.185 | lab |
| starter | 239 | 342 | 1.135 | 1.524 | crowd, far, seek, voices |
| words2 | 173 | 248 | 0.822 | 1.104 | crowd, far, seek, voices, strange |

| Kind | Set | Clips |
|---|---|---|
| bed | probe | 1 |
| bed | train | 9 |
| digit | probe | 80 |
| intro | train | 9 |
| phrase | train | 412 |
| sentence | probe | 94 |
| sentence | train | 34 |
| story | probe | 10 |
| word | probe | 161 |

| Source | Set | Voices | Clips |
|---|---|---|---|
| audiomnist | probe | 8 | 80 |
| cremad | probe | 8 | 94 |
| kokoro | probe | 4 | 171 |
| kokoro | train | 22 | 343 |
| ms-snsd | probe | 1 | 1 |
| ms-snsd | train | 2 | 8 |
| piper-libritts | train | 20 | 112 |
| synth | train | 1 | 1 |

Render jobs (render_phrases.py): items, kept, kept on the first render (main wording and voice at the base speed), kept with an alternative voice or wording, recogniser misses logged along the way.

| Job | Items | Kept | First try | Alternative | Misses |
|---|---|---|---|---|---|
| starter | 240 | 239 | 178 (74%) | 47 | 153 |
| babble1 | 16 | 16 | 16 (100%) | 0 | 0 |
| wave2 | 80 | 79 | 56 (70%) | 17 | 85 |
| piper_cs | 100 | 94 | 38 (38%) | 37 | 283 |
| babble2 | 20 | 18 | 17 (85%) | 0 | 8 |
| intros | 78 | 9 | 9 (12%) | 0 | 9 |
| sus | 150 | 0 | 0 (0%) | 0 | 0 |
| repair | 160 | 0 | 0 (0%) | 0 | 0 |
| echo | 60 | 0 | 0 (0%) | 0 | 0 |
| matrix | 80 | 71 | 64 (80%) | 0 | 56 |
| stories | 10 | 10 | 10 (100%) | 0 | 0 |
| far | 40 | 0 | 0 (0%) | 0 | 0 |

natural: 174 kept of 248 rows; not kept: {'not recognised': 2, 'actor not chosen': 72}.

words: 161 kept of 200 rows; not kept: {'not recognised': 39}.

Variants that failed and were replaced or dropped (sentences db): 215; the logs in ../stimwork/logs list each miss with what the recogniser heard.
<!-- stats:end -->
