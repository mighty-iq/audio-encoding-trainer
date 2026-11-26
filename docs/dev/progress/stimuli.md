# Progress: stimuli (resumable notes; newest at the bottom; times UTC)

## 2026-11-26 17:18 UTC — starter pack under way
- Pipeline in tools/audio/: common.py (paths, P.56 level, trim, MP3), lexicon.py (raw CMUdict), content_words.py
  (16 names, 9 numbers, 125 nouns in 46 rhyme families), tts.py (Kokoro + Piper via onnxruntime), asr.py
  (Parakeet; Whisper later), plan.py (voices, token spread), render_words.py (phrases -> cut words -> ASR check).
- Key fix: the int8 Kokoro graph hides its durations; tools/audio/kokoro_timed.py exposes /encoder/Cast_output_0 as
  a 'duration' output (writes ../corpora/kokoro/kokoro-v1.0.int8.timed.onnx). kokoro-onnx then inserts real pauses
  (0.3 s) after commas and reports phoneme timings, so carrier phrases cut cleanly at the pause centres.
- Dropped 'thumb' (Kokoro renders the /θ/ weakly; ASR hears "some"). UK 'one' (/wɒn/) is phonemised /wʌn/.
- Running: render_words.py starter (12 Kokoro voices x 45 tokens; scratch in ../stimwork/wav, db/words.jsonl,
  logs/words-starter.log). Resume = rerun the same command (verified clips are skipped).

## 2026-11-26 19:00 UTC — starter pack committed; full set rendering
- Course change: single TTS words are unreliable and cut words had clipped edges (36 %), so the Crowd/Far/Seek/Voices
  unit is the whole call-sign phrase ("Nora, boat, seven.", kind 'phrase', tags ['callsign'], wt word times); the
  engine's js/engine/items/adapt.js already reads it. Data shapes follow requests.md (engine 17:05, lab 17:44).
- Starter (validated, published, committed): pack 'starter' 216 call-sign phrases (12 Kokoro voices), 'babble' 16
  sentences, 'beds' 9 loops (babble, cafe, party, street x2, station x2, hall, hum), 'probe' 1 cafe bed; 1.47 MB.
  24 phrases failed the recogniser after MP3 coding and were sent back (they get new wordings in the next pass).
- Packs are built in ../stimwork/stage and copied into data/ and audio/ only after validate.py passes (--publish).
- Running: ../stimwork/chain1.sh (log ../stimwork/logs/chain1.log), one heavy step at a time: scan_piper, scan_accent,
  render_phrases wave2 piper_cs babble2 intros far, sus, repair, echo, matrix stories, cut_matrix, natural
  audiomnist/cremad/librivox. Resume: rerun the chain (every step skips finished clips). After it: render_phrases
  starter (retries the 24), pack.py --asr, registry.py, intel.py tiers + matrix, pack.py --asr, registry.py,
  validate.py --publish, docs, commit.
