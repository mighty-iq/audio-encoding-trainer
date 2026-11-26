# R6 — Speech corpora, TTS voices, noises and impulse responses: licences and reachability

Status: complete for this pass (web-search budget ran out after ~17 searches; see Open questions).
Date of checks: 2026-11-26 (UTC).
Scope: English speech (digits, words, sentences; many talkers and accents), TTS voices, noise/ambience, room impulse responses, pronunciation dictionaries, word-frequency lists, open speech-in-noise materials.
Constraint: the build container reaches only GitHub (git, raw.githubusercontent.com, media.githubusercontent.com for Git LFS, release assets), PyPI and npm. Licences allowed: PD/CC0, CC BY, CC BY-SA, MIT/BSD/Apache-style, ODbL+DbCL, permissive custom. Not allowed: GPL-family for assets, NC, ND, research-only, unclear.

Reading-depth tags used below: [licence file read] = the actual LICENSE/licence section text was fetched and read; [README read] = README/model card read; [tree listing] = file list from a tree-only git clone; [secondary report] = information from a search snippet, a third-party page or prior knowledge not confirmed against the source.

## Summary table

"Tested" = a real file (or ranged part of it) was downloaded from inside the build container on 2026-11-26; "listed" = file tree read via git but no file fetched. Sizes marked ~ are estimates.

| # | Resource | Host | Licence | Talkers / voices | Type | Size | Reachable |
|---|---|---|---|---|---|---|---|
| 1 | CREMA-D | git LFS (media.githubusercontent.com per file) | ODbL 1.0 + DbCL 1.0 | 91 actors, 48 M / 43 F, ages 20–74, mixed ethnicity, US English | 12 short sentences × 6 emotions × intensities | 7,442 WAV 16 kHz, 606 MB | tested |
| 2 | speechocean762 | git (raw) | CC BY 4.0 (OpenSLR listing; README: free for commercial and non-commercial use; no LICENSE file in repo) | 250, 125 F / 125 M, ages 6–43 (about half children), Mandarin L1 | read sentences, words, digit strings + phone/word/sentence scores | 5,245 WAV 16 kHz, ~0.4 GB | tested |
| 3 | AudioMNIST | git (raw) | MIT (repo "contains code and data") | 60, 48 M / 12 F, ages 22–61, mostly German L1, about 14 other L1 labels, 3 native | isolated digits 0–9 × 50 | 30,000 WAV 48 kHz, ~2 GB | tested |
| 4 | FSDD | git (raw) | CC BY-SA 4.0 | 6 M (2 US, 2 German, Belgian-French, Greek) | isolated digits × 50 | 3,000 WAV 8 kHz, ~30 MB | tested |
| 5 | MS-SNSD clean speech | git (raw) | CC BY 4.0 (VCTK-derived Edinburgh 56-speaker set); PTDB-TUG ODbL | 56 VCTK speakers (UK regional + others) | read newspaper sentences, NO transcripts | 23,075 + 1,100 WAV 16 kHz | tested |
| 6 | DNS-Challenge LibriVox read_speech | git LFS, branches interspeech2020/master (16 kHz) and interspeech2021/adddata (48 kHz) | public domain (LibriVox) | 1,948 readers, no metadata | 31-s audiobook clips, NO transcripts | 65,348 clips (~65 GB at 16 kHz) | tested |
| 7 | PriMock57 | git LFS | CC BY 4.0 | 7 clinicians + 57 patient actors (UK) | conversational consultations, TextGrid utterance transcripts | 114 WAV 16 kHz (video-call origin), 2.0 GB, 8 h 38 min | tested |
| 8 | NPTEL2020 pure-set | release asset | CC BY 3.0 via YouTube Creative Commons (asserted by crawler) | many Indian-English lecturers | 3–10 s lecture chunks + subtitles | 189 MB sample | tested (HEAD) |
| 9 | librispeech-subset | git | CC BY 4.0 | 8 | read sentences + transcripts | 445 FLAC 16 kHz | listed |
| 10 | Piper en_US-libritts-high (sherpa-onnx mirror) | release asset | data CC BY 4.0; trained from scratch | 904 synthetic voices (LibriTTS readers, North American) | TTS | 131 MB | tested |
| 11 | Mimic 3 en_US/vctk_low | git LFS | CC BY 4.0 (voice LICENSE) | 109 VCTK voices (UK regional, Scottish, Irish, US, Canadian, Indian, NZ, S. African, Australian — accents per VCTK docs, secondary) | TTS, gruut (MIT) G2P | 76.5 MB | tested |
| 12 | Mimic 3 en_US/cmu-arctic_low | git LFS | CMU ARCTIC licence (permissive) | 18 (incl. Scottish, Canadian, Indian) | TTS, gruut | 76 MB | listed |
| 13 | Kokoro-82M v1.0 (kokoro-onnx releases; PyPI kokoro, misaki) | release asset + PyPI | weights Apache 2.0; code Apache/MIT | 28 English voices (20 US, 8 UK) | TTS, misaki G2P (espeak fallback optional) | int8 92 MB / fp16 177 MB / fp32 325 MB + voices 28 MB | tested |
| 14 | Coqui en/vctk/vits | release asset (coqui-ai/TTS v0.6.1_models) | Apache 2.0 (Coqui catalogue); VCTK CC BY 4.0 | 109 | TTS, espeak G2P | 148 MB | tested |
| 15 | Clean single Piper voices: en_US-ljspeech-high, en_GB-cori-high, en_US-kristin, -norman, -john (medium) | release asset | public domain data; from scratch or clean base | 5 (4 US, 1 UK F) | TTS | 67–116 MB each | tested |
| 16 | Mimic 3 hifi-tts_low, m-ailabs_low, ljspeech_low | git LFS | CC BY 4.0 / BSD-style / PD | 3 + 3 + 1 | TTS, gruut | 63–76 MB each | listed |
| 17 | Flite (cmu_us_kal, kal16, awb, rms, slt) | git | BSD-like | 5 robotic voices | TTS + permissive LTS | small | listed |
| 18 | MS-SNSD noise | git (raw) | Freesound CC0 + DEMAND CC BY-SA 3.0 | — | babble, café, cafeteria, restaurant, square, traffic, station, bus, metro, office, kitchen... | 179 WAV 16 kHz, ~0.25 GB | tested |
| 19 | DNS Freesound-CC0 noise subset | git LFS | CC0 | — | door, fan, typing, chair, breath, munching | ~10,600 clips | listed |
| 20 | ESC-10 (subset of ESC-50) | git (raw) | CC BY 3.0 (rest of ESC-50 is NC) | — | rain, sea waves, fire, dog, baby, clock, helicopter, chainsaw, rooster, sneeze | 400 × 5 s WAV 44.1 kHz | tested |
| 21 | OpenSLR 26 simulated RIRs (in DNS-Challenge interspeech2021/adddata) | git LFS | Apache 2.0 | — | 3 room-size sets with geometry/absorption metadata | 56,168 WAV 16 kHz | tested |
| 22 | OpenSLR 28 RIRs (same branch): simulated + 106 Aachen AIR real | git LFS | Apache 2.0 (AIR itself MIT) | — | simulated + real binaural/room IRs | 56,169 + 106 WAV | listed |
| 23 | HybridReverb2 IR database | git (raw) | CC BY-SA 4.0 (relicensed with Ruhr-Uni Bochum permission) | — | 472 measured IRs: halls, church, studio, living room, bathroom | FLAC 48 kHz 24-bit | tested |
| 24 | pyroomacoustics, rir-generator | PyPI | MIT | — | RIR simulation | — | tested (index) |
| 25 | CMUdict (raw), Britfone, ipa-dict en_US, WikiPron US/UK | raw | BSD-style / MIT / MIT / CC BY-SA | — | pronunciation | 0.4–3.6 MB each | tested |
| 26 | wordfreq, FrequencyWords, SCOWL/ESDB | PyPI / raw / git | Apache + CC BY-SA 4.0 data / MIT + CC BY-SA 4.0 / permissive custom | — | word frequency / commonness | <1 MB to tens of MB | tested |

## 0. Container reachability baseline (tested 2026-11-26)

| Host / method | Result |
|---|---|
| git over HTTPS (ls-remote, `clone --depth 1 --filter=blob:none --no-checkout`, `git ls-tree`) | works for public repos |
| raw.githubusercontent.com | 200 (plain-git files) |
| media.githubusercontent.com/media/OWNER/REPO/REF/PATH | 200/206 for Git LFS files (tested on CREMA-D, PriMock57, DNS-Challenge, Mimic 3 voices); 404 for non-LFS files (use raw for those) |
| Git LFS batch API (what `git lfs pull` uses) | 403 from the proxy for repos not attached to the session -> fetch LFS files one by one from media.githubusercontent.com |
| github.com/.../releases/download/TAG/ASSET | works (redirects to release-assets.githubusercontent.com; HEAD gives size) |
| github.com HTML pages, archive zips, api.github.com/repos/... | 403 for repos not attached to the session (release asset lists therefore came from documentation pages read with WebFetch) |
| pypi.org (simple + JSON API) | 200 |
| registry.npmjs.org | 200 |
| huggingface.co, openslr.org, zenodo.org, storage.googleapis.com, archive.org, datashare.ed.ac.uk, freesound.org, cdn.jsdelivr.net, unpkg.com, coqui.gateway.scarf.sh | refused |

Download recipes that worked: (a) list files: `git clone --depth 1 --filter=blob:none --no-checkout <repo>` then `git ls-tree -r --name-only HEAD`; (b) LFS sizes without downloading: clone with `--filter=blob:limit=1k` and read pointer files (`size N`); (c) LFS content: `curl -L https://media.githubusercontent.com/media/<owner>/<repo>/<ref>/<path>`; (d) small files inside large release archives: HTTP Range requests (tar.bz2 via bzip2recover; zip via central directory) — used here to read MODEL_CARD and config.json files without downloading whole models.

## 1. Natural speech on GitHub — details (verified)

### 1.1 Free Spoken Digit Dataset (FSDD)
- URL: https://github.com/Jakobovski/free-spoken-digit-dataset (plain git; files via raw.githubusercontent.com/Jakobovski/free-spoken-digit-dataset/master/recordings/<digit>_<speaker>_<n>.wav)
- Licence: CC BY-SA 4.0 (README "License" section; no separate LICENSE file). [README read]
- Attribution: credit FSDD and contributors (Zenodo DOI badge in README); share-alike applies to adapted audio.
- Content: 3,000 WAV (50 takes of each digit 0–9 per speaker), 6 speakers, all male. Accents per metadata.py: 2 USA, 2 German, 1 Belgian-French, 1 Greek. [file read: metadata.py]
- Format: 8 kHz, 16-bit mono WAV, trimmed (tested one file). Size ~30 MB.
- Quality: volunteer recordings, narrowband (8 kHz) — telephone-like bandwidth. Labels = file names (no further transcripts needed).
- Reachability: TESTED (git ls-remote OK; raw WAV download 200; tree listing shows 3,000 .wav).

### 1.2 AudioMNIST
- URL: https://github.com/soerenab/AudioMNIST (plain git, no LFS; raw.githubusercontent.com/soerenab/AudioMNIST/master/data/<spk>/<digit>_<spk>_<n>.wav)
- Licence: MIT (root LICENSE, "Copyright (c) 2018 soerenab"); README says the repository "contains code and data", so the MIT grant covers the recordings. [licence file read] [README read]
- Attribution: keep MIT notice; cite Becker et al. 2023 (J. Franklin Inst., doi:10.1016/j.jfranklin.2023.11.038).
- Content: 30,000 WAV, digits 0–9 × 50 repetitions × 60 speakers (verified count). [tree listing]
- Metadata (data/audioMNIST_meta.txt, read and tabulated): 48 male / 12 female; ages 22–61 (one entry has an invalid age "1234"); only 3 marked native English. Accent field: German 41, Chinese 3, Spanish 2, Italian 2, plus one each of South Korean, Madras, Tamil, Levant, Arabic, Egyptian-American, Brazilian, South African, Danish, French, English, German/Spanish. Recording rooms recorded (vr-room, Kino, library, Ruheraum).
- Format: 48 kHz, 16-bit mono WAV (tested). Size: roughly 1.5–2 GB uncompressed (one file ≈ 70 KB × 30,000) [estimate].
- Quality: recorded in named rooms (see metadata); strongly L2-accented (mostly German L1) — useful as an accented-digit set, not as a native-English set.
- Reachability: TESTED (raw WAV 200; 30,000 .wav in tree).

### 1.3 CREMA-D (Crowd-sourced Emotional Multimodal Actors Dataset)
- URL: https://github.com/CheyneyComputerScience/CREMA-D (Git LFS). Per-file download works via https://media.githubusercontent.com/media/CheyneyComputerScience/CREMA-D/master/AudioWAV/<file>.wav (TESTED, 200, valid WAV). NOTE: the LFS batch API (what `git lfs pull` uses) is refused by the container proxy for repos not attached to the session, so fetch per file from media.githubusercontent.com using a tree-only clone for the file list. README also names a GitLab mirror (gitlab.com is not on the allowed list).
- Licence: Open Database License 1.0 for the database; Database Contents License 1.0 for contents ("made available under the Open Database License ... Database Contents License"). [licence file read]
- Attribution/conditions: ODbL requires attribution and share-alike for derived databases and a notice on produced works; cite Cao et al. 2014 (IEEE Trans. Affective Computing 5(4):377–390). README asks (not as a licence condition) that GitHub users fill a usage form.
- Content: 7,442 clips, 91 actors (48 M, 43 F), ages 20–74, race/ethnicity metadata (VideoDemographics.csv); 12 fixed sentences × 6 emotions (anger, disgust, fear, happy, neutral, sad) × up to 4 intensity levels. [README read] Transcripts implicit (sentence code in file name, e.g. DFA = "Don't forget a jacket").
- Format: AudioWAV = 16 kHz, 16-bit mono (tested); also MP3 and FLV video in repo. Whole repo ~7.55 GB (README); AudioWAV subset = 605.9 MB (summed from LFS pointer files).
- Quality: acted, studio-style recordings (not audited here); American English, mixed ethnicity. Good for many-talker short sentences and older adult voices (up to 74).
- Reachability: TESTED (tree-only clone OK; media.githubusercontent.com WAV 200).

### 1.4 speechocean762 (non-native English, Mandarin L1; adults and children)
- URL: https://github.com/jimbozhang/speechocean762 (plain git; WAVE/SPEAKERxxxx/*.WAV via raw.githubusercontent.com)
- Licence: GitHub copy has NO LICENSE file; README states it "is available for free download for both commercial and non-commercial purposes". The same corpus is listed as OpenSLR SLR101 under CC BY 4.0 [secondary report: the OpenSLR page was not opened]. [README read]
- Content: 5,000 English utterances (5,245 WAV files in tree), 250 speakers (125 F / 125 M), ages 6–43 (about half children aged 6–15; tabulated from spk2age). Prompts are short sentences and digit strings (e.g. "ZERO THREE FIVE ONE", "TOM GIVES UP BOXING"). Rich annotation: sentence/word/phone accuracy, fluency, prosody, stress scores; phone sequences; Kaldi-style text/utt2spk files.
- Format: 16 kHz, 16-bit mono WAV (tested). Size ~400 MB [estimate].
- Quality: read speech (recording set-up not checked here; described elsewhere as phone-recorded in quiet rooms [secondary report]); strongly accented; the only clean-licence children's English set found on GitHub.
- Reachability: TESTED (raw WAV 200).

### 1.5 PriMock57 (mock GP consultations, conversational)
- URL: https://github.com/babylonhealth/primock57 (WAV in Git LFS; transcripts as Praat TextGrid in plain git)
- Licence: CC BY 4.0 (full legal code in LICENSE.md). [licence file read] [README read]
- Content: 57 mock primary-care consultations; 7 clinicians + 57 staff acting as patients; separate doctor and patient channels (114 WAV, ~14.6 MB each); 8 h 38 min (17 h 16 min across channels); manual utterance-level transcripts (TextGrid). [audio/README.md read]
- Format: 16 kHz 16-bit WAV, sourced from Opus video-call streams (lossy origin, remote-call quality).
- Quality/use: genuine conversational speech (disfluencies, overlaps), UK clinical context; accents not tabulated in repo.
- Size: 114 WAV = 1,989.5 MB (summed from LFS pointer files).
- Reachability: TESTED (tree-only clone; ranged GET of audio/day1_consultation01_doctor.wav via media.githubusercontent.com = 206).

### 1.6 MS-SNSD (Microsoft Scalable Noisy Speech Dataset) — speech part
- URL: https://github.com/microsoft/MS-SNSD (plain git, no LFS)
- Licence: code MIT; README "Dataset licenses": data provided under original terms — PTDB-TUG (ODbL 1.0), Edinburgh 56-speaker dataset (Valentini et al., derived from VCTK; CC BY 4.0), Freesound clips "Only files with CC0 licenses were selected", DEMAND (CC BY-SA 3.0). [licence file read] [README read]
- Speech content: clean_train = 23,075 WAV named like VCTK (p234_001.wav ...), i.e. the 56 VCTK speakers of the Valentini set (28 F / 28 M, UK regional + some US/other accents per VCTK); clean_test = 1,100 files "clnsp*.wav". No transcripts in this repo (VCTK sentence IDs are in the file names; the VCTK text files themselves are not here).
- Format: 16 kHz mono WAV.
- Reachability: TESTED (raw WAV 206/200).

### 1.7 DNS-Challenge (Microsoft) — speech and noise in the old `interspeech2020/master` branch
- URL: https://github.com/microsoft/DNS-Challenge (current `master` points to Azure blob storage: dns4public.blob.core.windows.net — not on the allowed list). Branch `interspeech2020/master` still holds the 2020 data in Git LFS; per-file download via media.githubusercontent.com/media/microsoft/DNS-Challenge/interspeech2020/master/<path> TESTED (206).
- Licence: repo docs CC BY 4.0 (LICENSE), code MIT; README "Dataset licenses": clean speech from LibriVox (public domain), PTDB-TUG (ODbL), Edinburgh 56-speaker (CC BY 4.0), VocalSet (CC BY 4.0), CREMA-D (DbCL), VoxCeleb2, VCTK (ODC-By 1.0); noise from AudioSet, Freesound (CC0 only), DEMAND (CC BY-SA 3.0); RIRs from OpenSLR 26/28 (Apache 2.0). [licence file read] [README read]
- 2020 branch content (tree listing): datasets/clean = 65,348 LFS WAV clips of ~31 s (992,044 bytes each = 16 kHz 16-bit) named book_xxxxx_chp_xxxx_reader_xxxxx_n.wav from 1,948 LibriVox readers (public domain) — NO transcripts, no reader metadata; datasets/noise = 65,303 clips: 54,698 named by YouTube IDs (AudioSet — REJECT: AudioSet's CC BY 4.0 covers the labels, the audio stays with YouTube uploaders) and ~10,600 "*_Freesound_validated_*" clips (CC0 per README; door, fan, typing, squeaky chair, breath, copy machine, dragging, munching — few crowd/café sounds). The 2020 branch has no impulse_responses folder.
- Use: the LibriVox clean clips are a big public-domain many-talker pool, but need ASR + forced alignment to cut words/sentences; total ~65 GB, so sample selectively.

### 1.8 Rev speech-datasets (Earnings-21, Earnings-22, Rev16) — REJECTED for audio
- URL: https://github.com/revdotcom/speech-datasets (MP3 in plain git).
- Licence: earnings21/LICENSE.md and earnings22/LICENSE.md say "The transcripts and associated text files ... are licensed under" CC BY-SA 4.0. The audio (company earnings calls) is not covered by that grant. coraal-multi transcripts are CC BY-NC-SA 4.0. [licence file read]
- Verdict: audio rights unclear -> not allowed. (Earnings-22 would otherwise be valuable: 125 calls, 119 h, global accents.)

### 1.9 librispeech-subset (k2-fsa developer)
- URL: https://github.com/csukuangfj/librispeech-subset (plain git). Licence: LibriSpeech CC BY 4.0 (LICENSE.TXT included). [README read; licence file present in tree]
- Content: 445 FLAC from 8 LibriSpeech speakers (dev-clean 777, 1272, 652, 1673; test-clean 121, 1089, 1221; train-clean-100 6000) with .trans.txt transcripts and SPEAKERS.TXT. 16 kHz FLAC. Small; good as a test fixture, not as a talker pool.
- Reachability: tree listing TESTED.

### 1.10 TinyVCTK
- URL: https://github.com/tqch/TinyVCTK — CC BY 4.0 (LICENSE read); only 9 .npy arrays of mu-law 8-bit DR-VCTK audio. Not useful as a stimulus source. [licence file read] [README read]

### 1.11 Further speech checks
- NPTEL2020 Indian-English (AI4Bharat): https://github.com/AI4Bharat/NPTEL2020-Indian-English-Speech-Dataset — no LICENSE file; README "Content License: Creative Commons" pointing at YouTube's Creative Commons option (CC BY 3.0) for the NPTEL lecture videos it crawled. Sample "Pure-Set" as GitHub release asset releases/download/v0.1/nptel-pure-set.tar.gz (TESTED 200, 189 MB); full 15,700 h set via scripts/torrent (not reachable). LibriSpeech-style wav + txt (YouTube subtitles, partly ASR-derived) + json metadata. Many Indian-English lecturers (mostly male, lecture-hall mics). Licence plausibly CC BY 3.0 per video, but asserted by the crawler rather than the rights holder -> usable with per-video attribution after checking the JSON; medium confidence. [README read]
- DNS-Challenge `interspeech2021/adddata` branch (LFS, TESTED): clean_fullband adds the same LibriVox read_speech at 48 kHz (65,348 clips) and CREMA-D (emotional_speech/crema_d); other folders are non-English. No VCTK.
- Svarah (AI4Bharat, Indian-accented English): README gives no licence and no GitHub-hosted audio -> not usable here.
- Jenny (dioco-group/jenny-tts-dataset): custom licence — attribution "Jenny (Dioco)" required in interfaces that generate audio, commercial use permitted; audio hosted at languagereactor.com (blocked). Coqui's en/jenny model on GitHub releases carries the same custom licence (usable with that attribution; not checked further).
- DailyTalk (keonlee9420/DailyTalk): CC BY-SA 4.0 (README licence section; repo LICENSE is MIT for code) but audio only on Google Drive (blocked).
- festvox/datasets-CMU_Arctic: does not exist (git ls-remote fails). CMU ARCTIC audio itself was not found on an allowed host; its voices reach us only through the TTS models above.

### 1.12 Gaps: isolated command words, non-standard speech
- Isolated command words: no clean corpus on an allowed host (Speech Commands, MSWC and Common Voice single-word sets sit on Google storage, MLCommons or Hugging Face). Digits are covered (FSDD, AudioMNIST, speechocean762 digit strings). Other words have to be cut from sentence corpora with a forced aligner (2.8) or synthesised.
- Fast, whispered or disordered speech: no clean corpus was found on an allowed host. Corpora that exist elsewhere (e.g. TORGO, UA-Speech, wTIMIT, CHAINS) were not checked because the search budget ran out; from prior knowledge they are restricted or non-commercial. Practical route: transform clean sources — time compression (WSOLA/PSOLA), whisper simulation (noise-excited vocoding of the spectral envelope), band-limiting and codec artefacts, noise-vocoding, TTS speed controls (Kokoro `speed`, Piper/Mimic 3 `length_scale`), Flite's robotic voices — plus the natural variety already present: CREMA-D emotions, speechocean762 L2 speakers and children, AudioMNIST L2 accents.

## 2. TTS voices — details

### 2.1 Piper voices mirrored by sherpa-onnx as GitHub release assets
- Host: GitHub release assets, https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-<voice>.tar.bz2 (TESTED: 200, sizes 67–131 MB each). Archive = Piper ONNX model + onnx.json (speaker map) + tokens.txt + espeak-ng-data/ (+ MODEL_CARD in most).
- sherpa-onnx itself: Apache-2.0 (also on PyPI `sherpa-onnx` and npm). It phonemises Piper voices with espeak-ng (GPL-3.0) — see G2P section.
- Piper voice weights: the rhasspy/piper-voices repository is MIT-labelled [secondary report]; the deciding factor is the TRAINING DATA and the BASE CHECKPOINT named in each MODEL_CARD. Many Piper voices are "Finetuned from U.S. English lessac voice". The Lessac voice is trained on the Blizzard 2013 Lessac data, whose licence is research-only and excludes "any commercial purpose" (CSTR licence page, read via WebFetch). Under our rules a voice whose weights descend from Lessac is NOT clean, even when its own fine-tuning data is CC BY.
- MODEL_CARD results (read from inside the archives via ranged downloads <5 MB; [README read] level):

| Voice (sherpa asset) | Speakers | Data licence | Lineage | Verdict |
|---|---|---|---|---|
| en_US-libritts-high | 904 | LibriTTS, CC BY 4.0 | trained from scratch (train-clean-360) | CLEAN — best many-talker TTS |
| en_US-libritts_r-medium | 904 | LibriTTS-R, CC BY 4.0 | finetuned from lessac | not clean (Lessac lineage) |
| en_GB-vctk-medium | 109 | VCTK, CC BY 4.0 | finetuned from lessac | not clean (Lessac lineage) |
| en_US-arctic-medium | 18 (awb, rms, slt, ksp, clb, lnh, aew, bdl, jmk, rxr, fem, ljm, slp, aup, ahw, axb, eey, gka) | CMU ARCTIC licence | finetuned from lessac | not clean (Lessac lineage) |
| en_GB-aru-medium | 12 | ARU (Liverpool), CC BY 4.0 | finetuned from lessac | not clean |
| en_GB-semaine-medium | 4 | CC BY-NC-SA 4.0 | lessac | REJECT (NC) |
| en_US-l2arctic-medium | 24 | CC BY-NC 4.0 | lessac | REJECT (NC) |
| en_US-ljspeech-high | 1 F | LJ Speech, public domain | trained from scratch | CLEAN |
| en_GB-cori-high | 1 F (UK) | LibriVox, public domain | trained from scratch | CLEAN |
| en_US-kristin-medium | 1 F | LibriVox, public domain | trained from scratch | CLEAN |
| en_US-norman-medium | 1 M | LibriVox, public domain | trained from scratch | CLEAN |
| en_US-john-medium | 1 M | LibriVox, public domain | finetuned from kristin | CLEAN |
| en_US-bryce-medium | 1 M | "public domain" (author's own voice) | finetuned from an unreleased voice | probably clean; base unknown |
| en_US-kathleen-low | 1 F | CC0 | finetuned from Ryan (low) | not clean (Ryan data is CC BY-NC-SA) |
| en_US-danny-low | 1 M | mimic3 voices | finetuned from Ryan | not clean |
| en_US-joe-medium, en_US-reza_ibrahim-medium | 1 M each | CC0 | lessac | not clean |
| en_US-sam-medium | 1 (non-binary) | Apache-2.0 | lessac | not clean |
| en_US-kusal-medium | 1 M | mimic2 data | lessac | not clean |
| en_GB-alan-medium, en_GB-alba-medium (Scottish F, CC BY 4.0), en_GB-jenny_dioco-medium, en_GB-northern_english_male-medium (CC BY-SA 4.0) | 1 each | various | lessac | not clean |
| en_US-hfc_female/male-medium | 1 each | CC BY-NC-SA 4.0 | lessac | REJECT |
| en_US-ryan-high | 1 M | CC BY-NC-SA 4.0 | from scratch | REJECT |
| en_US-lessac-high/medium/low | 1 F | Blizzard 2013 research-only | from scratch | REJECT |
| en_US-glados-high | 1 | game character voice | — | REJECT (copyrighted character) |
| en_GB-dii-high, en_GB-miro-high, en_US-miro-high, en_GB-southern_english_female/male-medium, en_US-amy-* | — | MODEL_CARD not found in the sampled window | — | unverified |

- Practical yield: one clean 904-speaker model (libritts-high, North American LibriVox readers; 131 MB) plus five clean single voices (4 US: ljspeech, kristin, norman, john; 1 UK: cori) and one probable (bryce). No clean multi-accent British/Scottish/Indian Piper model was found.

### 2.2 Kokoro-82M
- Hosts: GitHub release assets of thewh1teagle/kokoro-onnx — model-files-v1.0/kokoro-v1.0.onnx (325 MB), kokoro-v1.0.fp16.onnx (177 MB), kokoro-v1.0.int8.onnx (92 MB), voices-v1.0.bin (28 MB) (all TESTED 200); sherpa-onnx mirrors kokoro-multi-lang-v1_0 (350 MB), kokoro-int8-multi-lang-v1_0 (132 MB), kokoro-en-v0_19 (320 MB, 11 voices) (TESTED 200). PyPI: `kokoro` (Apache-2.0, hexgrad), `kokoro-onnx` (MIT), `misaki` (G2P).
- Licences: weights Apache 2.0 (model card "License: apache-2.0"); hexgrad/kokoro and hexgrad/misaki code Apache-2.0 (LICENSE files read); kokoro-onnx MIT (LICENSE read). [licence file read] [README read]
- Training data (model card via WebFetch): "trained exclusively on permissive/non-copyrighted audio data" — public-domain audio, Apache/MIT-licensed audio, two named CC BY sets (Koniwa tnc CC BY 3.0, SIWIS CC BY 4.0), and synthetic audio generated by closed TTS models from large providers; "a few hundred hours" for v1.0. Caveat: the synthetic share may conflict with those providers' terms of service (not a copyright licence on our side, but a provenance caveat to state in the guide).
- Voices (VOICES.md via WebFetch): English = 28 voices — 20 American (11 F, 9 M) and 8 British (4 F, 4 M); quality grades range from A (af_heart) to F+ (am_adam); several voices trained on only minutes of data (grade D). Speech is studio-clean, 24 kHz.
- G2P: misaki English uses gold/silver lexicons (misaki/data/us_gold.json, us_silver.json, gb_gold.json, gb_silver.json) with OPTIONAL espeak-ng fallback for out-of-vocabulary words; `en.G2P(trf=False, british=..., fallback=None)` runs without espeak (README). With a fixed stimulus vocabulary every word can be checked against the lexicon at build time, so a GPL-free path exists. Lexicon provenance is not stated in the README (open question).
- Caveat: kokoro-js (npm) phonemises in the browser with the `phonemizer` package (espeak-ng compiled to WASM, GPL-3.0) — avoid for runtime; render audio at build time instead.

### 2.3 Mimic 3 voices (Mycroft) — Git LFS on GitHub
- URL: https://github.com/MycroftAI/mimic3-voices ; ONNX generators in Git LFS, e.g. https://media.githubusercontent.com/media/MycroftAI/mimic3-voices/master/voices/en_US/vctk_low/generator.onnx (TESTED: 200/206, 76.5 MB).
- Licence: repository LICENSE = CC BY-SA 4.0; EACH voice folder has its own LICENSE file, which governs (read for all English voices). [licence file read]
- English voices (all "low" quality VITS, 22,050 Hz, phonemizer = gruut per config.json):
  - en_US/vctk_low — 109 VCTK speakers; voice LICENSE = CC BY 4.0. CLEAN on data; base checkpoint not stated (Mimic 3 predates Piper's Lessac base) — best clean multi-accent synthetic option (VCTK talkers span UK regional, Scottish, Irish, US, Canadian, Indian, NZ, South African and Australian accents [secondary report: VCTK speaker-info not read here]).
  - en_US/cmu-arctic_low — 18 speakers; CMU ARCTIC licence ("Permission to use, copy, modify, and license ... for any purpose ... without fee", notice retained). CLEAN on data. Includes Scottish (awb), Canadian (jmk), Indian (ksp and others) speakers [speaker accents: secondary report].
  - en_US/hifi-tts_low — 3 speakers (9017, 6097, 92); NVIDIA Hi-Fi TTS, CC BY 4.0. CLEAN on data.
  - en_US/m-ailabs_low — 3 speakers; M-AILABS licence (BSD-style: "Redistribution and use in any form, including any commercial use ... permitted"). CLEAN on data.
  - en_US/ljspeech_low — 1 F; public domain. CLEAN.
  - en_UK/apope_low — voice LICENSE reads "Copyright 2022 Mycroft AI All Rights Reserved". REJECT (conflicts with the repo-level CC BY-SA; treat as unclear).
- Runtime: the Mimic 3 engine is AGPL-3.0 [secondary report] — do not ship it; run the ONNX generator with onnxruntime (MIT) at build time, phonemes from gruut (MIT, PyPI). This is the cleanest fully GPL-free synthetic path found.
- Caveat: "low" quality (small VITS); intelligibility good but less natural than Kokoro.

### 2.4 Coqui TTS model zoo (GitHub release assets of coqui-ai/TTS)
- Host: https://github.com/coqui-ai/TTS/releases/download/v0.6.1_models/<name>.zip (TESTED 200 for tts_models--en--vctk--vits.zip, 148 MB, and tts_models--en--ljspeech--vits.zip, 146 MB). The coqui.gateway.scarf.sh redirector named in .models.json is BLOCKED (403) — use the GitHub URL directly.
- Licences (from TTS/.models.json, read): en/vctk/vits "apache 2.0" (109 speakers; config.json read via HTTP range: phonemizer "espeak", language "en", 22,050 Hz); en/ljspeech/vits, tacotron2-DDC, fast_pitch, speedy-speech, overflow, neural_hmm "apache 2.0"; ljspeech glow-tts and tacotron2-DCA "MPL"; en/vctk/fast_pitch "CC BY-NC-ND 4.0" (REJECT); multilingual your_tts "CC BY-NC-ND 4.0" (REJECT); xtts_v1.1/v2 "CPML" (REJECT, non-commercial); en/jenny "custom"; en/blizzard2013 capacitron (Apache label but trained on Blizzard 2013 research-only data -> REJECT under our rules). Coqui TTS code is MPL-2.0 [secondary report].
- Verdict: en/vctk/vits is a second 109-speaker multi-accent option (Apache label, VCTK CC BY 4.0, trained by Coqui), but needs espeak-ng phonemes (build-time only).

### 2.5 sherpa-onnx `vits-vctk` and `vits-ljs`
- https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-vctk.tar.bz2 (TESTED 200, 152 MB; 109 speakers, 22,050 Hz; vits-vctk.onnx 116 MB + int8 37 MB). Converted from the original VITS authors' pretrained_vctk.pth (VITS code MIT); the weights carry no stated licence (sherpa page read) — unclear -> second choice only. Uses lexicon.txt (no espeak at run time).

### 2.6 Others checked
- KittenTTS (KittenML/KittenTTS): code Apache-2.0 (LICENSE read); models on Hugging Face (blocked) but sherpa-onnx mirrors kitten-nano-en-v0_8-int8 (31 MB, TESTED 200) and other v0.1/v0.2/v0.8 variants; 8 voices; training data NOT documented in the README -> provenance unclear, avoid.
- Flite (festvox/flite): COPYING says core is "BSD-like ... free to use in commercial products"; "GPL code is only included as part of the build process and does not taint any of the run-time code". Bundled voices in lang/: cmu_us_kal, cmu_us_kal16, cmu_us_awb (Scottish), cmu_us_rms, cmu_us_slt, cmu_time_awb; other .flitevox voices download from festvox.org (blocked). Robotic (diphone/clustergen) quality — useful as a deliberately degraded or "non-standard" voice, and its cmulex + letter-to-sound rules are a permissive G2P. [licence file read] [README read]
- Matcha-TTS: guessed release asset names returned 404; not pursued (sherpa mirrors matcha-icefall-en_US-ljspeech, 77 MB, single speaker).
- Larynx (rhasspy/larynx, MIT, superseded by Piper): guessed voice asset name 404; not pursued.

### 2.7 Grapheme-to-phoneme paths without GPL at run time
- Simplest: render every stimulus at BUILD time and ship only audio files; the app then contains no G2P at all. Running espeak-ng (GPL-3.0) inside the build container does not put GPL code into the shipped app.
- Fully GPL-free, including the build: (a) Mimic 3 voices + gruut (MIT; PyPI gruut, gruut-lang-en) + onnxruntime (MIT); (b) Kokoro + misaki (Apache-2.0) with `fallback=None`, checking that every stimulus word is in misaki's lexicon; (c) Piper/Coqui VITS voices fed with espeak-style IPA that we derive from CMUdict (BSD) or Britfone (MIT) — feasible but must be validated by listening, because those models were trained on espeak-ng output.
- Avoid at run time: the `phonemizer` package and kokoro-js's phonemizer (GPL-3.0, espeak-ng compiled to WASM), piper-tts >= 1.3 (GPL-3.0), PyPI `cmudict` (GPL-3.0 code).

### 2.8 Forced alignment (to cut words out of sentence recordings)
- Montreal Forced Aligner: PyPI `Montreal-Forced-Aligner` 3.4.5, MIT. Models as GitHub release assets of MontrealCorpusTools/mfa-models (TESTED 200): acoustic-english_us_arpa-v3.0.0/english_us_arpa.zip (92 MB; model card: CC BY 4.0, trained on LibriSpeech only — CLEAN), dictionary-english_us_arpa-v3.0.0/english_us_arpa.dict (7 MB). acoustic-english_mfa-v3.1.0 (92 MB) is also labelled CC BY 4.0 but was trained on corpora that include L2-ARCTIC and CORAAL (non-commercial data) — prefer us_arpa. Open question: MFA normally pulls Kaldi binaries from conda-forge, which is not on the allowed list; test whether the PyPI install alone works. [README read: model cards]
- torchaudio (BSD; PyPI) provides CTC forced alignment, but its pretrained pipelines download weights from hosts not on the allowed list (unverified).

## 3. Noise / ambience and room impulse responses

### 3.1 MS-SNSD noise (GitHub, plain git) — best clean ambience source found
- URL: https://github.com/microsoft/MS-SNSD (noise_train/, noise_test/), raw download TESTED (Cafe_1.wav 9.6 MB = 5 min at 16 kHz mono; Babble_1.wav 2.6 MB).
- Licence: per README, Freesound clips were selected "Only files with CC0 licenses"; DEMAND clips under CC BY-SA 3.0. Per-clip Freesound IDs are not given. [README read]
- Content: noise_train 128 WAV + noise_test 51 WAV, 16 kHz mono. Freesound-CC0 classes (train+test counts combined): Babble 20, AirConditioner 20, ShuttingDoor 18, Munching 17, AirportAnnouncement(s) 15, NeighborSpeaking 14, Typing 12, SqueakyChair 11, CopyMachine 11, VacuumCleaner 10, Neighbor 8, WasherDryer 7. DEMAND-derived scenes (one ~5-min channel each, CC BY-SA 3.0, credit Thiemann, Ito & Vincent 2013): Cafe, CafeTeria, Restaurant, Square, Station, Traffic, Bus, Metro, Car, Park, Field, Hallway, Kitchen, LivingRoom, Office, Washing.
- Covers: café, cafeteria, restaurant, crowd babble, street/traffic, station, public square. Missing: wind (synthesise), loud party/music (build babble from our own speech pools).

### 3.2 DNS-Challenge noise (LFS) — use only the Freesound-CC0 subset
- 2020 and 2021 branches: ~54,700 AudioSet clips (named by YouTube ID) — REJECT (audio rights stay with uploaders); ~10,600 "*_Freesound_validated_*" clips (CC0 per README): door (5,775), fan (1,599), typing (1,335), squeaky chair (970), breath/spit (520), munching (~250), copy machine, dragging. Mostly office/household; little crowd ambience.

### 3.3 ESC-50 — only the ESC-10 subset is allowed
- URL: https://github.com/karolpiczak/ESC-50 (audio in plain git). LICENSE: whole dataset "Creative Commons Attribution-NonCommercial" (REJECT); "The ESC-10 subset is licensed as a Creative Commons Attribution 3.0" — 400 × 5 s clips, 44.1 kHz, 10 classes (dog, rooster, rain, sea waves, crackling fire, crying baby, sneezing, clock tick, helicopter, chainsaw); esc10 flag in meta/esc50.csv; per-clip Freesound attributions in LICENSE (must be reproduced). [licence file read] Useful for rain/sea/fire distractors, not for speech babble.

### 3.4 Impulse responses
- OpenSLR 26 simulated RIRs, mirrored in Git LFS in microsoft/DNS-Challenge branch `interspeech2021/adddata`, path datasets/wideband/impulse_responses_wideband/SLR26/simulated_rirs_16k/{smallroom,mediumroom,largeroom}/RoomNNN/*.wav — 56,168 WAV (16 kHz, 16-bit mono; one 16 KB file TESTED 200 via media.githubusercontent.com). LICENSE file = Apache 2.0 (read). README: image method (Habets implementation); 200 rooms per set; widths/lengths 1–10 m, 10–30 m, 30–50 m; height 2–5 m; absorption 0.2–0.8; source–receiver ≤ 5 m; room_info gives geometry per RIR — ideal for a graded "distance/reverb" axis. CLEAN.
- OpenSLR 28 (same branch, SLR28/RIRS_NOISES): Apache 2.0 LICENSE; simulated_rirs (56,169 WAV) CLEAN; real_rirs_isotropic_noises (286 entries: 106 AIR, 142 RWCP, 36 REVERB-2014, plus list files) come from RWCP, REVERB 2014 and the Aachen AIR database. AIR's own page says it ships with an MIT licence (WebFetch) — clean; RWCP and REVERB-2014 originals are research databases whose own terms were not verified -> use only the AIR-named files, or none.
- HybridReverb2 impulse-response database: https://github.com/jpcima/hybridreverb2-impulse-response-database (plain git, FLAC; one file TESTED 200: 48 kHz 24-bit mono). LICENSE CC BY-SA 4.0; README: relicensing permission granted by Prof. Rainer Martin and Dr. Christian Borß (Ruhr-Universität Bochum). 472 measured IRs: huge/large/small concert hall, church, studio, living room, bathroom, several distances and loudspeaker positions. Attribution + share-alike. CLEAN. [licence file read] [README read]
- Voxengo free IRs (mirrored in https://github.com/oramics/sampled, IR/Voxengo, 38 WAV): custom licence allows royalty-free use "for any purpose, including commercial usage", but redistribution only of "complete and unaltered" copies with the notice and no charge -> do NOT bundle or convert; at most use at build time to render stimuli (grey area). [licence file read]
- EMT-140 plate IRs (same repo): "Creative Commons Attibution-Any" from a Facebook page — vague, and a plate not a room -> REJECT.
- PulseAudio-IRSs (eedeidk): CC0 label, but the files appear to be headphone-effect profiles of unknown origin -> REJECT (provenance).
- MIT IR Survey (Traer & McDermott 2016, 271 real-world IRs): source page states no licence (MLTK docs say CC BY 4.0, secondary); hosted on mcdermottlab.mit.edu and Hugging Face mirrors — not reachable -> excluded.
- Simulators (PyPI, reachable): pyroomacoustics 0.10.1 (MIT-style, EPFL-LCAV; image source + ray tracing, also directivity), rir-generator 0.3.0 (MIT; Habets image method). Generating our own RIRs avoids all provenance questions and lets the trainer set distance and T60 exactly.

## 4. Pronunciation dictionaries and word-frequency lists (for phonetically similar foils)

| Resource | URL (raw, TESTED 200) | Licence (read) | Notes |
|---|---|---|---|
| CMUdict | raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict (3.6 MB) | BSD-2-style CMU notice ("Redistribution and use ... permitted") | ~135k US English words, ARPAbet + stress. Use the raw file; the PyPI `cmudict` package is GPL-3.0-or-later (code) — avoid it. npm `cmu-pronouncing-dictionary` 3.0.0 is ISC (wrapper over CMUdict, 4.7 MB). nltk_data copy: raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/cmudict.zip (0.9 MB). |
| Britfone | raw.githubusercontent.com/JoseLlarena/Britfone/master/britfone.main.3.0.1.csv (433 KB) | MIT | ~16k British English (RP) words in IPA, vocabulary filtered by BNC/Google/NGSL frequency; transcriptions start from CMUdict plus UK sources. |
| ipa-dict en_US | raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt (3.2 MB) | repo MIT; en_US from cmudict-ipa (MIT) | IPA with stress. AVOID en_UK: README says it is derived from ipacards (GPL 3.0). |
| WikiPron | raw.githubusercontent.com/CUNY-CL/wikipron/master/data/scrape/tsv/eng_latn_us_broad.tsv and eng_latn_uk_broad.tsv (2.9 MB each) | code Apache-2.0; data under Wiktionary terms (CC BY-SA) | Broad IPA, US and UK; good second opinion for UK forms. |
| gruut + gruut-lang-en | PyPI | MIT | G2P with lexicon + model; the Mimic 3 voices' phonemizer. |
| g2p_en (Kyubyong/g2p) | PyPI `g2p-en` 2.1.0 | Apache-2.0 | CMUdict lookup + neural OOV model; needs nltk tagger (nltk_data on raw.githubusercontent.com). |
| misaki | PyPI 0.9.4 | Apache-2.0 | Kokoro's G2P; `fallback=None` avoids espeak. |
| Flite cmulex + LTS | github.com/festvox/flite | BSD-like | C letter-to-sound rules. |
| wordfreq | PyPI `wordfreq` 3.1.1; github.com/rspeer/wordfreq | code Apache-2.0; data CC BY-SA 4.0 (NOTICE.md read) | Zipf frequencies from subtitles (OpenSubtitles, SUBTLEX with Brysbaert's permission), Wikipedia, Google Books, etc. NOTICE requires crediting "Robyn Speer" by that name and crediting the SUBTLEX authors. Best frequency source. |
| FrequencyWords (OpenSubtitles 2016/2018) | raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt (623 KB) | code MIT; content CC BY-SA 4.0 | Raw subtitle counts, top 50k / full. |
| SCOWL / ESDB (en-wl/wordlist, branch v2) | github.com/en-wl/wordlist (Copyright file read) | permissive custom ("Permission to use, copy, modify, distribute, and sell ... without fee", notice kept) | Size-graded word lists (commonness levels); notes that COCA 3-gram data was used under an NDA. |
| google-10000-english | github.com/first20hours/google-10000-english | REJECT: LICENSE says data derive from the LDC-distributed Google Web Trillion Word Corpus and advises against commercial use without an LDC licence | — |

Not checked (no search budget left): Unisyn (believed to need a licence agreement), Moby Pronunciator (believed public domain), SUBTLEX-US direct download (crr.ugent.be, not on allowed hosts; wordfreq already includes it with permission).

Counts in the DNS mirror (tree listing): SLR26 = 56,168 WAV (nominally 60,000); SLR28 simulated = 56,169 WAV; SLR28 real = 106 AIR files (e.g. air_type1_air_binaural_aula_carolina_*; MIT per AIR), 142 RWCP, 36 REVERB-2014 (RWCP/REVERB terms unverified -> skip).

## 5. Speech-in-noise test materials

### 5.1 Open materials found
- GRID audio-visual corpus (Cooke, Barker, Cunningham & Shao 2006): CC BY 4.0 (Zenodo record 3625687, read via WebFetch); 34 talkers (18 M, 16 F), 1,000 sentences each of the CRM-like form "put red at G9 now", 25 kHz WAV, audio_25k.zip 2.6 GB + word alignments 20 MB. Host Zenodo/Sheffield = NOT reachable; no GitHub mirror found. The best open CRM-style material if the owner mirrors it (licence allows redistribution with attribution).
- UW/NU Corpus 2.0 (IEEE/Harvard sentences; 33 talkers, Pacific Northwest and Northern Cities dialects; 22,460 WAV at 44.1 kHz with auto-aligned TextGrids): page names no licence, only "Please cite as" -> unclear -> not allowed; host not reachable.
- Open Speech Repository (Harvard sentences, VoIP test clips): terms say "freely available for use in VoIP testing", credit "Open Speech Repository" -> purpose-limited wording, treat as unclear; host not reachable.
- University of Salford HARVARD speech corpus 2019 (one native British English female, all 720 sentences, 48 kHz): "Creative Commons Attribution-NonCommercial 4.0" -> REJECT.
- ML test sets with noisy/clean pairs (MS-SNSD clean_test + noise_test; DNS 2020 datasets/test_set) are engineering material, not calibrated listening tests; DNS test noise includes AudioSet clips (reject those).
- Conclusion: no ready-made, clean-licence, GitHub-reachable speech-in-noise TEST was found. Build our own: digit triplets (from AudioMNIST/FSDD/speechocean762 digit strings or clean TTS), CRM/matrix-style closed-set sentences with original word lists rendered by clean TTS (Piper libritts-high, Mimic 3 vctk_low, Kokoro), and CREMA-D's 12 sentences for many-talker natural items.

### 5.2 Established clinical materials to AVOID (copyrighted or licensed) — [from prior knowledge; not re-verified this session because the search budget ran out]
- QuickSIN and BKB-SIN (Etymotic Research), HINT (Hearing in Noise Test), AzBio sentences, BKB sentence lists, SPIN / R-SPIN, CID W-22, NU-6 and CNC commercial recordings (e.g. Auditec), Words-in-Noise (WIN, built on NU-6 recordings), language-specific Matrix sentence tests (e.g. OLSA and its international versions, commercially licensed), commercial Digits-in-Noise implementations, the Diagnostic Rhyme Test and Modified Rhyme Test as published standards, and the CRM corpus CD (licence unclear). The standing rules also forbid clones of clinical subtests: use the concepts (digit triplets, closed-set matrix sentences, rhyme foils) with original items.
- Harvard/IEEE sentence TEXT: widely reproduced and commonly treated as free to use, but its formal status (1969 IEEE Recommended Practice; earlier Harvard Psycho-Acoustic Laboratory lists) was not verified here — prefer original sentences, or flag as a low-risk assumption.

## 6. Rejected candidates and why

| Candidate | Reason |
|---|---|
| ESC-50 (all but ESC-10) | CC BY-NC 3.0 |
| EmoV-DB | non-commercial licence (LICENSE.md read) |
| Rev Earnings-21/22, Rev16 audio | licence covers only transcripts; audio rights unclear (CORAAL transcripts NC) |
| DNS-Challenge AudioSet noise clips (~54.7k per branch) | YouTube audio; AudioSet CC BY covers labels only |
| Piper voices fine-tuned from Lessac (vctk, libritts_r, arctic, aru, alba, alan, jenny, northern_english_male, joe, kusal, reza_ibrahim, sam, ...) | base model trained on research-only Blizzard 2013 Lessac data |
| Piper lessac, ryan, hfc_female/male, semaine, l2arctic, glados; kathleen/danny (Ryan base) | NC or research-only data, or a copyrighted character voice |
| Coqui your_tts, vctk/fast_pitch (CC BY-NC-ND), XTTS (CPML), blizzard2013 capacitron (research-only data) | NC/ND or research-only lineage |
| Mimic 3 en_UK/apope_low | voice LICENSE "All Rights Reserved" |
| KittenTTS | training data undocumented |
| sherpa vits-vctk / vits-ljs (original VITS checkpoints) | weights licence not stated (second choice only) |
| google-10000-english | LDC-derived; author advises against commercial use |
| ipa-dict en_UK | derived from GPL-3.0 ipacards |
| PyPI cmudict, phonemizer, piper-tts >=1.3 (piper1-gpl), big-phoney | GPL-3.0 code (avoid at run time; use raw CMUdict) |
| Voxengo IRs (bundled) | redistribution only complete/unaltered; avoid bundling |
| EMT-140 plate IRs, PulseAudio-IRSs | vague licence / doubtful provenance |
| MIT IR Survey | no licence on source page; host blocked |
| Salford HARVARD 2019 | CC BY-NC 4.0 |
| UW/NU 2.0, Open Speech Repository | no licence / purpose-limited terms; hosts blocked |
| DailyTalk, Jenny dataset, GRID, VCTK, LibriSpeech/LibriTTS, Speech Commands, Common Voice, DEMAND (full), MUSAN, VoxPopuli | licences fine (CC BY / CC BY-SA / CC0 / custom-attribution) but only on blocked hosts (Zenodo, OpenSLR, HF, Google storage, university servers); no GitHub mirror found |
| Known-NC or restricted corpora not examined in detail: L2-ARCTIC (CC BY-NC 4.0, per Piper card), RAVDESS, TESS, Speech Accent Archive, TED-LIUM, CORAAL, MyST, SEP-28k, UA-Speech, TIMIT/TIDIGITS (LDC) | [prior knowledge] NC, ND, LDC or application-only |

## 7. Open questions

1. Mirroring: the licences of GRID (CC BY 4.0), VCTK 0.92 (CC BY 4.0), Speech Commands v0.02 (CC BY 4.0), LibriSpeech/LibriTTS-R (CC BY 4.0), DEMAND (CC BY-SA 3.0) and Common Voice (CC0) allow redistribution. If the owner uploads the needed subsets as release assets of a GitHub repository, the container can fetch them. This would add the strongest natural material (GRID for CRM-style closed sets; VCTK for 110 accented talkers with transcripts).
2. Git LFS: per-file media.githubusercontent.com downloads work, but the LFS batch API (`git lfs pull`) is refused for repos not attached to the session. Per-file fetch also counts against the upstream owner's LFS bandwidth quota — download once, cache outside the repo, and fetch only the files needed.
3. Mimic 3 base checkpoints: the voice READMEs do not say whether vctk_low/cmu-arctic_low were fine-tuned from another voice. Mimic 3 predates Piper's Lessac base, so this is probably fine; it is unverified.
4. Kokoro: the training set includes synthetic audio from closed commercial TTS. The weights are Apache-2.0, but say this in the guide. misaki's lexicon provenance (us_gold/us_silver) is undocumented.
5. Piper G2P: Piper and Coqui VITS voices expect espeak-ng IPA. Running espeak-ng (GPL-3.0) at BUILD time does not put GPL code into the app (only rendered audio ships), but if the owner wants zero GPL even at build time, use Mimic 3 voices with gruut (MIT) or Kokoro with misaki and `fallback=None`, or map CMUdict/Britfone to the espeak phoneme set ourselves (needs validation by listening).
6. speechocean762: the GitHub copy has no LICENSE file; the CC BY 4.0 statement comes from its OpenSLR SLR101 listing [secondary report] and the README's "free ... for commercial and non-commercial purposes". Medium-high confidence; cite the paper (Zhang et al. 2021, arXiv 2104.01378).
7. NPTEL2020: per-video CC BY claims should be verified from the JSON metadata (YouTube video IDs) before use.
8. AudioMNIST: MIT text names "the Software"; README says the repo holds "code and data". Reasonable reading: data are covered. Low risk; attribute.
9. Piper voices whose MODEL_CARD was not found in the sampled byte window (en_GB-dii-high, en_GB-miro-high, en_US-miro-high, en_GB-southern_english_female/male, en_US-amy): unverified.
10. Search budget: the shared web-search quota for this turn was exhausted after roughly 17 searches by this agent; further discovery (e.g. other GitHub-hosted mirrors of GRID, Speech Commands, CMU ARCTIC, DEMAND, or CC0 party ambience) needs a follow-up session. These HF model-card URLs were constructed by me and refused by the fetch tool without being sent: huggingface.co/rhasspy/piper-voices raw MODEL_CARD paths for en_US/libritts_r/medium, en_GB/vctk/medium, en_US/arctic/medium (the same cards were then read from inside the sherpa-onnx archives instead).

## 8. References / URLs (all accessed 2026-11-26 UTC)

Speech: github.com/Jakobovski/free-spoken-digit-dataset · github.com/soerenab/AudioMNIST · github.com/CheyneyComputerScience/CREMA-D · github.com/jimbozhang/speechocean762 (arXiv 2104.01378) · github.com/babylonhealth/primock57 (arXiv 2204.00333) · github.com/microsoft/MS-SNSD · github.com/microsoft/DNS-Challenge (branches interspeech2020/master, interspeech2021/adddata) · github.com/revdotcom/speech-datasets · github.com/csukuangfj/librispeech-subset · github.com/tqch/TinyVCTK · github.com/AI4Bharat/NPTEL2020-Indian-English-Speech-Dataset · github.com/numediart/EmoV-DB · github.com/karolpiczak/ESC-50 · github.com/keonlee9420/DailyTalk · github.com/dioco-group/jenny-tts-dataset · zenodo.org/records/3625687 (GRID) · depts.washington.edu/phonlab/resources/uwnu/uwnu2/ · voiptroubleshooter.com/open_speech/contribute.html · salford.figshare.com/collections/HARVARD_speech_corpus_-_audio_recording_2019/4437578/1 · arizona-phonological-imaging-lab.github.io/misc/harvard_sent/README.html (no licence stated; ultrasound+audio, 10 talkers)

TTS: github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models · k2-fsa.github.io/sherpa/onnx/tts/all/English/index.html · k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/vits.html · www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html · huggingface.co/rhasspy/piper-voices (ljspeech/high and libritts/high MODEL_CARDs read via WebFetch) · huggingface.co/hexgrad/Kokoro-82M (+ VOICES.md) · github.com/hexgrad/kokoro · github.com/hexgrad/misaki · github.com/thewh1teagle/kokoro-onnx (releases model-files-v1.0, model-files-v1.1) · github.com/MycroftAI/mimic3-voices · github.com/coqui-ai/TTS (TTS/.models.json; releases v0.6.1_models) · github.com/KittenML/KittenTTS · github.com/festvox/flite · github.com/rhasspy/larynx · github.com/shivammehta25/Matcha-TTS

Noise/IR: github.com/microsoft/MS-SNSD · github.com/microsoft/DNS-Challenge (SLR26/SLR28 under datasets/wideband/impulse_responses_wideband) · github.com/jpcima/hybridreverb2-impulse-response-database · github.com/oramics/sampled · github.com/eedeidk/PulseAudio-IRSs · www.iks.rwth-aachen.de (AIR database page) · mcdermottlab.mit.edu/Reverb/IR_Survey.html · siliconlabs.github.io/mltk (MIT IR survey and ambient loaders) · zenodo.org/records/1227121 (DEMAND) · PyPI pyroomacoustics, rir-generator

Lexicon/frequency: github.com/cmusphinx/cmudict · github.com/JoseLlarena/Britfone · github.com/open-dict-data/ipa-dict · github.com/CUNY-CL/wikipron · github.com/rspeer/wordfreq (NOTICE.md) · github.com/hermitdave/FrequencyWords · github.com/en-wl/wordlist (branch v2, Copyright) · github.com/first20hours/google-10000-english · github.com/Kyubyong/g2p · github.com/rhasspy/gruut · github.com/nltk/nltk_data · npm cmu-pronouncing-dictionary · PyPI metadata for cmudict, phonemizer, piper-tts, g2p-en, gruut, misaki, sherpa-onnx, wordfreq
