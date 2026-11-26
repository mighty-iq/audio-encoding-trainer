# RV-stimuli — items and audio validity (independent review)

Reviewer: stimuli and items reviewer (did not build Earshot). Review 2026-11-26 22:29–23:10 UTC (`date -u`).
Snapshots, all read-only: **S2** = 75c28ba (first frozen copy), **S3** = eab5150 (final stimulus set, 1,306 clips),
**S4** = 09a8ff3 (index.html lists all ten packs; `audio/` and `data/` byte-identical to S3, checked with `diff -r`).
Every number below names its snapshot. "S3/S4 data" means the shared audio and data of S3 and S4.
Method: reviewer scripts in a scratch folder outside the repository (not committed). They decode the base64 MP3
with ffmpeg at 16 kHz and transcribe with the build-time Parakeet TDT 0.6B v2 model (sherpa-onnx, nemo_transducer).
They run the snapshot's own generators, Lab probes and `tests/sim` shortcut responders on the real data in Node,
and decode a sample in headless Chromium. Listen-proxies only: the reviewer cannot hear.

## Summary

| # | Sev. | Finding | Snapshot |
|---|---|---|---|
| ST-01 | high (fixed in S4) | index.html loaded 6 of 10 packs, so 4 exercises had no audio in the app or the single file | S2, S3 |
| ST-02 | high | Repair: the authored foils make the answer the phonetic centre of its 4 options (72–79 % without listening) | S3/S4 |
| ST-03 | high | At low variety the familiar-answer cue reaches 0.42–0.65 (chance 0.25) in Far, Echo, Repair, Strange, Seek | S3/S4 |
| ST-04 | high | 35 of the 43 matrix-word clips added in eab5150 are cut short; Matrix, Rooms and New voice depend on 15 of them | S3/S4 |
| ST-05 | medium | Echo trains matrix probe words (eleven, fifteen, twenty, thirty, warm) | S2, S3/S4 |
| ST-06 | medium | Each probe runs on one talker; af_jessica and af_river (98 clips) cannot be used | S3/S4 |
| ST-07 | medium | Story probe: the longest option is right 54 % of the time; word-spotting answers 38/50 questions | S3/S4 |
| ST-08 | medium | The "accent" family is other-language voice embeddings on US-English phonemes; no natural L2 talker in training | S3/S4 |
| ST-09 | medium | Single file 13.24 MB, above the 12 MB goal | S4 |
| ST-10 | low | bm_fable F0 216.2 Hz in voices.js; measured 139.7 Hz (octave-type error) | S2, S3/S4 |
| ST-11 | low | Repair word-time windows leave an onset fragment on about 10 clips; 2 Repair clips have no word times | S3/S4 |
| ST-12 | low | Intro and call-sign oddities; Anouk (ff_siwis) has no intro and "meets" with someone else's call sign | S3/S4 |
| ST-13 | low | CREMA-D level metadata uncertain by up to 1.15 dB | S3/S4 |
| ST-14 | low | Ledger and text details (wrong pack name, guide fonts not listed, "a Italian", "one-minute story") | S3/S4 |
| ST-15 | low/info | Published voice ids carry dataset speaker ids that map to real volunteers | S3/S4 |

Passed (no finding): ASR on every other kind of speech, durations, browser decoding, synthetic-speech levels,
disjointness of clips, voices, texts, families and rooms, homophones, option categories, the heard-word and position
responders, Lessac, AudioSet and NC/ND/GPL exclusion, notices shipped with the app, and originality of the items.
Details follow under Measured numbers.

## Findings

### ST-01 (high; fixed in S4, guard missing) — packs missing from index.html and the single file
- File: `index.html` script block (S2, S3): only `pack-babble`, `-beds`, `-cast`, `-probe`, `-starter` and
  `-words2` are listed. `node tools/build-index.mjs --check` exits 1 on S3. `dist/earshot.html` (S3: 9.32 MB)
  therefore lacked `pack-echo`, `-far`, `-repair` and `-strange` (3.92 MB of JS), and `js/audio/assets.js` has no
  other way to load a pack.
- Failing case (S3 data, 4,000 seeds per exercise): trials that needed a clip from an unloaded pack:
  - Far, Strange, Repair and Echo: 4000/4000 each.
  - Seek 3200/4000, Crowd 1620/4000, Voices 957/4000. Babble beds and Far room cues draw Piper sentences from
    those packs.
- S4: index.html lists all ten packs, and the same audit gives 0 such trials in every exercise.
- Fix: add `node tools/build-index.mjs --check` to the release checks. Add a unit test that every entry of
  `data/packs.js` appears in `index.html` and in the built single file.

### ST-02 (high) — Repair options give the answer away without listening
- Files: `data/vocab.js` (`repair[].foils`, written by `tools/audio/content_repair.py`) and
  `js/engine/items/repair.js` (`prefer: hit.item.foils`).
- In 3000/3000 trials the 3 foils are exactly the item's authored foils (S4 data), for example oven with ocean,
  bucket and honey. The foils were written as sound-alikes of the answer, so the answer sits at the centre of the
  option set.
- Snapshot responders, `node tests/sim/run.mjs --real --skip-sim --skip-checks --seeds 10000` (S3 data):

  | Responder | Accuracy (chance 0.25) |
  |---|---|
  | most typical (letter bigrams) | 0.515 |
  | most different | 0.111 |
  | longest | 0.316 |
  | shortest | 0.173 |
  | most frequent past answer | 0.365 |

  All 18 of 18 bins are flagged.
- Single simulated player (1,500 trials): a phonetic-hub responder scores 0.72–0.79. It picks the option whose
  CMUdict phonemes are closest to the other three, and needs no listening.
- The authored sound-alikes are labelled `random` (9,000 of 9,000), so feedback cannot say "sound-alike".
- Fix:
  - Build the slot with the pair structure that `C.slot` already uses: (T, authored nT) and (R, nR), with R drawn
    from the answers of the same pool. Alternatively, drop `prefer`.
  - Label authored sound-alikes `neighbour`.
  - Add the phonetic-hub responder to `tests/sim/shortcuts.mjs`.

### ST-03 (high) — familiar-answer cue at low variety, in every exercise
- Mechanism: answers come only from items that the player's current (narrow) voice pool has recorded. Foils are drawn
  from the answer distribution of the whole build (`answerDist` over all items in far.js, echo.js and strange.js, and
  the authored foils in repair.js). A word that has been right before is therefore more often right again.
- Single simulated player: fixed `playerSeed`, breadth 0.3, 1,500 trials, two players, S3 data. Breadth 0.3 is the
  early-weeks setting. "frequent" = most frequent past answer; "seen" = only options seen as answers before.

  | Exercise | frequent | seen | Chance |
  |---|---|---|---|
  | Far | 0.49–0.54 | 0.46–0.53 | 0.25 |
  | Echo | 0.50–0.65 | 0.44–0.53 | 0.25 |
  | Repair | 0.47–0.60 | 0.46–0.51 | 0.25 |
  | Strange | 0.44–0.46 | 0.27–0.30 | 0.25 |
  | Seek | 0.42–0.46 | 0.32–0.33 | 0.25 |
  | Crowd | 0.35–0.36 | 0.29 | 0.25 |
  | Voices | 0.31–0.34 | 0.30 | 0.28 |

- At breadth 1 the cue falls to 0.26–0.37.
- Mixed players, 10,000 seeds (S3 data): "frequent" 0.283 (Crowd) to 0.376 (Echo). Flagged bins: Crowd 6/20,
  Far 24/25, Strange 33/43, Repair 18/18, Echo 17/17, Seek 13/20, Voices 3/18.
- Fix: draw foils from the answer distribution of the items reachable with the current voice pool and level (the same
  filter as the answer). Alternatively, keep only pool words that have a clip in the current pool. Add a
  single-player, low-breadth case to `tests/sim/checks.mjs`, because the mixed-player run dilutes the cue.

### ST-04 (high) — the matrix words added in eab5150 are truncated
- Files: `audio/pack-probe.js` and `data/manifest.js`: the 43 `kind:'word'` clips that are new in S3, made by
  `tools/audio/cut_matrix.py`.
- Open-vocabulary recognition in quiet (S3): 35 of the 43 new clips are missed, against 0 of the 155 word clips that
  already existed in S2.
- Median duration: 0.33–0.40 s for the new clips against 0.44–0.50 s for the older ones.
- The misses look like lost codas or onsets: sorts→"sort", finds→"fines", cups→"caps"/"aps", shirts→"shut",
  holds→"howled", new→"nuke", picks→"pigs"/"pixna", sticks→"sticks up".
- The `diff` model (tools/audio/intel.py) agrees:
  - af_kore's 5 new words all have recogniser accuracy 0 in noise, so each gets diff = 1.8 (the voice mean ÷ 0.1).
  - 5 of bm_lewis's 10 new words sit at the +3 dB cap.
- Clips in use:
  - af_kore (Matrix, Rooms): cups, finds, picks, sorts and sticks.
  - bm_lewis (New voice, tone-vocoded): all 10 new words.
- These clips are what made both voices complete (in S2 no probe voice had all 50 words). They pass the
  pipeline's closed-set check: 50/50 for each voice after normalising digits.
- Fix:
  - Re-cut with wider margins, using boundaries from phoneme times ± 40 ms at the quietest point outside the word, or
    take new carrier sentences.
  - Accept a word only when open-vocabulary recognition passes too, as for every other speech clip.
  - Recompute `diff` afterwards.

### ST-05 (medium) — Echo trains matrix probe words
- Files: `data/vocab.js`. 15 of the 56 `echo` messages say a matrix word, and so do these `echoValues`:
  - number: eleven, fifteen, twenty, twenty-one, twenty-four;
  - time: ten fifteen, six fifteen, seven thirty, two thirty, eleven thirty, twenty past five;
  - item: a warm jumper.
- Code: `js/engine/items/echo.js`. `catPools` removes a probe word only when it is a whole value, and
  `dist.support` (the message answers) is not filtered at all.
- Failing case (S4, 4,000 Echo trials): a matrix word appears inside an option in 2,955 trials (74 %) and inside an
  answer 1,033 times: thirty 364, eleven 275, fifteen 243, warm 89, twenty 62.
- The snapshot's own solver also raises "probe word as option" 1,778 times in 10,000 Echo trials (S3 data).
- This contradicts the header of `js/engine/items/data.js` and PLAN §4 ("held-out … words for probes").
- Side note: `tests/sim/solver.mjs` `isNum` does not accept "twenty-four" or "twenty-one". That causes 251 false
  "labelled number but is not one" alarms in the same run.
- Fix, cheapest first:
  1. Remove those values and re-word and re-render the 15 messages.
  2. Or move the matrix number column to numbers Echo never says, which means new probe cuts.

### ST-06 (medium) — one talker per probe; two probe voices unusable
- `js/lab/materials.js` counts a matrix voice only when all 50 words exist. af_jessica lacks "shirts" and af_river
  lacks "sticks", so both voices drop out.
- Lab audit (S4, 40 forms per probe):
  - Matrix: 800 trials, all af_kore.
  - Rooms: 480 trials, all af_kore.
  - New voice: 640 trials, all bm_lewis.
  - Stories alternate between af_kore and bm_lewis.
- 98 clips (0.181 MB MP3, about 0.24 MB in base64) ship and are never used.
- Requested check: nothing asks for a missing combination. There were 0 missing or non-probe clip references over
  all forms. Every probe vocoder used a tone carrier, every probe room seed was ≥ 10000, and nothing came from an
  unloaded pack.
- Fix: render the two missing words (with the ST-04 checks), or drop the two voices' clips to save budget. Note that
  probe gains may be partly specific to af_kore.

### ST-07 (medium) — Story probe has answer-only cues
- File: `data/vocab.js` `stories[].questions`, 10 stories × 5 questions (S3/S4).
- The answer is the longest option in 54 % of the questions (chance 25 %).
- In 38 of 50 questions, the answer is the only option whose content words all occur in the passage, so spotting a
  heard word answers it.
- Only 10 of 50 questions offer a lure from the passage, such as "green apples" in story-1.
- Options are shuffled at run time (probes-more.js:127), so position is not a cue.
- Fix: balance option lengths, and give most questions a lure that the passage mentions.

### ST-08 (medium) — what the accent family really is
- `tools/audio/jobs.py:124` renders the accented SUS with `lang:'en-us'`. The Kokoro hf_, jf_, zm_, ef_, ff_, if_
  and pf_ voices therefore read US-English phonemes, and the "accent" comes from the voice embedding only.
- The tiers in `data/voices.js` come from recogniser accuracy at 0 dB (`intel.py tiers`), which is a proxy for
  intelligibility, not for accent strength.
- French has one voice (ff_siwis), while PLAN §6 asks for at least two per accent.
- No natural L2 talker is in training: AudioMNIST is probe-only and speechocean762 is not shipped.
- Fix:
  - Word the labels as "a voice from a <language> model reading English" in the app and the guide.
  - Add natural L2 training talkers, for example AudioMNIST talkers outside the 8 probe talkers (digits only).
  - Where Kokoro accepts phonemes, try the L1 front end for a share of the items.

### ST-09 (medium) — budget
- S4: `dist/earshot-release.html` is 13,241,007 bytes, against the 12 MB goal (CONTRACTS §10, PLAN §10). It stays
  under the 16 MiB artifact limit.
- Sizes:
  - audio MP3 8.482 MB (inside the 8.5 MB audio budget), as base64 packs 11.363 MB;
  - `js/` 1.107 MB, `data/manifest.js` 0.452 MB, `data/vocab.js` 0.140 MB, fonts 0.086 MB raw.
- Largest packs (MP3): probe 2.435 MB, of which stories 1.105 MB and CREMA-D 0.744 MB; starter 1.135 MB;
  repair 0.970 MB; words2 0.952 MB; echo 0.948 MB.
- Levers:
  - drop the unusable af_jessica and af_river words (−0.24 MB);
  - re-encode the stories at 16 kbps (about −0.49 MB as base64);
  - remove `wt` where no generator reads it (manifest JSON 0.50→0.42 MB).
- Or the owner moves the goal.

### ST-10 (low) — bm_fable F0
- `data/voices.js`: kokoro.bm_fable has f0 = 216.2 Hz (male voice).
- Measured median 139.7 Hz (YIN on 5 clips, −7.6 semitones).
- The other 56 synthetic training voices agree within 2.3 semitones, and 54 of them within 1.5.
- Effect: Crowd's "same sex, ≥ 2 semitones" and "similar pitch" masker levels mislabel trials with this voice.
- Fix: re-measure with an octave-error guard.

### ST-11 (low) — Repair word times
- Test (S3 data): silence each clip's `wt[key]`, as at gap 100 % with silence fill, and transcribe.
- Result: the keyword disappears in 143 of 154 clips (low-predictability 79/80, high-predictability 64/74).
- When the silence starts 80 ms earlier, 10 of the remaining 11 lose the keyword too. So a short onset fragment
  survives on about 10 clips: repair-031-hi, 061-hi, 088-hi, 063-hi, 062-lo, 056-hi, 081-hi, 019-hi, 033-hi and
  059-hi.
- In the 11th clip (repair-062-hi, "wind") the keyword stays even then, so the recogniser restores it from context.
- `piper-libritts.p2577.sentence.repair-060-hi` and `p3094.sentence.repair-055-hi` have no `wt`. They are usable
  only as babble or as Far room cues.
- Fix: start the mask 40–80 ms before `wt[key][0]`, or refine the boundaries.

### ST-12 (low) — intros, call signs and Anouk
- Intro transcripts:
  - Lotte → "Lot", and p2577 "coffee beans" → "coffee bees";
  - Leila → "Layla", Ines → "Iniz", Rhea → "Re", Emil → "Emmel";
  - pf_dora "bar" → "bars".
- Call-sign phrases: "five" is heard as "V" in `kokoro.af_nicole.phrase.ruby-door-five` and
  `kokoro.af_nova.phrase.harper-goat-five`.
- ff_siwis (Anouk) has no intro:
  - The cast screen shows no play control for her.
  - Voices "meet" falls back to SUS or call-sign phrases. In 200 forced meets, 71 played a call-sign phrase that
    names someone else (for example "Felix, bee, four."), while the screen says "That was Anouk".
- Fix:
  - Re-render the intro.
  - Leave call-sign phrases out of the meet fallback.
  - Listen-check the two phrases.

### ST-13 (low) — CREMA-D level metadata
- An independent P.56 re-measurement of the decoded audio differs from `adb` as follows:
  - CREMA-D: mean 0.20 dB, max 1.15 dB, 13 of 94 clips > 0.5 dB;
  - synthetic speech: mean 0.015 dB.
- The Two-voices target-to-masker ratio inherits this per-sentence uncertainty.
- Fix: cross-check with a reference implementation, or calibrate per sentence as the matrix words are.

### ST-14 (low) — ledger and text details
- `LICENSES-ASSETS.md`, CREMA-D row: "clips in `audio/pack-lab.js`". The file is `audio/pack-probe.js`.
- The guide's fonts (`docs/guide/fonts/`, fontsource latin-ext subsets with OFL texts) are not listed. The Fonts
  table names only the `fonts/` latin subset.
- `data/voices.js`: "English with a Italian accent" in audiomnist.s37, kokoro.if_sara and kokoro.im_nicola.
- `js/lab/probes-more.js:110` says "A one-minute story", but the story clips last 33.4–39.6 s.
- LibriVox babble: 4 of the 6 clips are LibriVox title or section announcements. One names a Wodehouse collection;
  LibriVox itself states "public domain in the USA". Acceptable as babble, but body sentences would sound more like
  conversation.

### ST-15 (low/info) — speaker ids in published voice ids
- Voice ids such as `piper-libritts.p1100` (LibriTTS/LibriSpeech speaker 1100) and `librivox.r02767` (LibriVox
  reader 2767) map, through public speaker lists, to the names of the volunteers.
- The cast gives these voices fictional names and blurbs.
- There is no licence problem (CC BY 4.0 and public domain).
- Option: use neutral public ids and keep the mapping in `tools/audio/`.

## Measured numbers

### 1. Manifest, packs and ASR
- Consistency (S3/S4 data):
  - 1,306/1,306 pack clips are in `data/manifest.js`, with 0 orphans and 0 pack mismatches.
  - Every clip has `asr.ok`.
  - `voices.js` clip counts match the manifest, and clip and voice sets agree.
- Reviewer ASR scoring: "lenient" means homophones (CMUdict), digits as words, Roman numerals and British spellings
  are accepted.
- S2: random sample of 683 clips, 680 of them speech:
  - lenient agreement 669 (98.4 %), 675 (99.3 %) when out-of-vocabulary name spellings are accepted;
  - key-word agreement 632/634.
- S3/S4: all 1,306 clips (683 measured on byte-identical S2 bytes, 623 measured on S3); 1,296 speech clips:

  | Measure | Result |
  |---|---|
  | lenient agreement incl. names | 1,251 (96.5 %) |
  | strict agreement | 1,142 (88.1 %) |
  | word error | 47 of 7,282 words (0.65 %) |
  | key words | 1,175/1,210 (97.1 %) |

- S3/S4 per kind:

  | Kind | Agreement |
  |---|---|
  | call-sign phrases | 439/441 |
  | SUS | 148/148 |
  | Far | 37/37 |
  | Repair | 156/156 |
  | Echo | 56/56 |
  | babble (6 LibriVox) | 39/39 |
  | CREMA-D | 94/94 |
  | digits | 80/80 |
  | stories | 8/10 (the 2 differences are number formatting) |
  | intros | 31/37 (ST-12) |
  | matrix words | 163/198 (ST-04) |

- Closed-set check of the matrix words for the voices in use: af_kore 50/50 and bm_lewis 50/50.
- Durations: decoded length matches `dur` within 0.5 ms for all 1,306 clips.
- Headless Chromium `decodeAudioData` against ffmpeg (S4, 60 random clips): 0-sample difference in length and in
  onset. Word times therefore hold in Chromium. Safari and Firefox were not tested.

### 2. Train/probe disjointness (S2 and S3/S4; same results)
- Setup: 7 generators × 4,000 seeds with random settings over every dial range, 13 player seeds, breadth
  0, 0.3, 0.6 and 1, and tutorial settings on every 10th seed. Also `exposure()` on every 20th seed and 50
  `flow.exposure` calls per exercise.
- Results:
  - 0 probe-set clips, 0 probe voices, and 0 probe texts (matrix words, CREMA-D sentences, stories) as clips.
  - 0 tone-vocoder effects; Strange used 1,164 noise-vocoder effects.
  - 0 of 13,888 training room seeds ≥ 10000.
- Training clip reach: generators emit 906 of 923 clips; the other 17 are cast intros, which the cast screen plays.
- Word-level overlap: only Echo carries matrix words (ST-05). SUS, Far and Repair keys contain none.
- Digits: the probe digits one to nine are also the call-sign numbers. This is by design: the probe holds out
  talkers and format, not the words.

### 3. Foils and answer-only cues (S3/S4 data)
- Option sets per exercise (4,000 trials each):
  - Crowd and Seek: all options from one category (noun, number or name), 0 errors.
  - Echo: all options in the category of the question, 0 of 9,000 slots wrong.
  - Strange: never offers the sentence's other key word.
- Foil labels are type-correct for masker, number and neighbour, with one exception: Repair's sound-alikes are
  labelled random (ST-02).
- No homophone, British non-rhotic or cot/caught pair among any options (2,500 trials per exercise; the checker was
  self-tested).
- Snapshot responders (10,000 seeds):
  - position and the heard-word responder stay at chance: Crowd 0.355 vs 0.363, Seek 0.345 vs 0.333,
    Voices 0.337 vs 0.316;
  - length cues appear only in Repair (ST-02), Strange "longest" 0.265, and per Echo category within ±0.06.
- Remaining cues: ST-02, ST-03 and ST-07.

### 4. Levels (S3/S4 data, all 1,306 clips)
- Independent P.56 re-measurement against `adb`: mean |difference| 0.031 dB, max 1.15 dB.
- 14 clips differ by more than 0.5 dB: 13 CREMA-D and 1 Kokoro.
- No peak above −1 dBFS. 16 clips sit below −25 dBFS because of peak limiting (mostly piper p1100); their `adb` is
  correct.

### 5. Licences (S3/S4)
- Piper: `en_US-libritts-high`. Its model card says "Trained from scratch on train-clean-360" (904 speakers), so
  there is no Lessac lineage.
- No AudioSet clip: beds come from DEMAND and Freesound (CC0) via MS-SNSD. No NC, ND or GPL asset ships; espeak-ng
  and phonemizer run at build time only.
- CREMA-D is probe-only, with the ODbL notice in `data/credits.js` and in `LICENSES-ASSETS.md`.
- LibriVox: 6 public-domain clips, used as babble.
- Every voice `src` has a credits entry.
- The MIT (AudioMNIST), BSD (CMUdict) and OFL texts are inside the single file, through `js/ui/licence-texts.js`.
- Gaps: ST-14.

### 6. Originality (S3/S4)
- No copied items were found:
  - SUS: 148 items of the form "The <noun> <verb>s the <noun>." from 40 nouns × 30 verbs;
  - Repair: 78 pairs in a context-predictability paradigm, with original wording;
  - Echo: 56 template messages; Far: 37 carrier phrases; 37 intros; 33 own babble sentences; 10 stories;
  - matrix words: no overlap with the British English matrix, as recalled. The American English list was not
    checked.
- The 125 one-syllable nouns are the common picturable words that children's picture-pointing tests also use, for
  example bee/key/knee and chair/bear/pear. From memory, no published ensemble is reproduced, but this was not
  checked against the tests themselves.

### 7. Budget
See ST-09: the single file is 13.24 MB in S4. The S3 file (9.32 MB) lacked 4 packs (ST-01).
