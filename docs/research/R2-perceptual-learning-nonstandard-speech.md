# R2 — Perceptual learning of degraded and non-standard speech: what generalizes, and what training structure helps

Status: in progress. Started 2026-11-26 15:20 UTC.

Reading-depth tags used for every source:
- [full text] = the full article was retrieved (open-access page, PMC, repository or author copy) and its methods and results were read through targeted extraction.
- [abstract only] = only the abstract or publisher landing page was read.
- [secondary report] = the finding is known only from another source, which is named.

All wording below is paraphrase. Numbers are as reported by the source; where a number could not be verified in the source itself, it is flagged.

## Summary

(to be written last)

## 1. Per speech type

### 1.0 Cross-distortion benchmark: how fast adaptation happens without feedback

**Cooke, Scharenborg & Meyer (2022)** [full text, TU Delft repository]. 68 native Spanish listeners, one male talker (Sharvard corpus, 16 kHz). Each listener heard 8 blocks of 30 sentences, one distortion per block, after 15 clear sentences. No feedback at any point. Keyword scoring (5 per sentence).
- Distortions and parameters: FAST = 2.5x speed-up (phase vocoder, 32 ms window); REVERSED = locally time-reversed 62 ms segments; SINE-WAVE = sinusoids tracking F1 and F2; NOISE-VOCODED = 6 ERB-spaced bands, 100-7500 Hz, noise carrier; TONE-VOCODED = same bands, tone carrier; NARROWBAND = one third-octave band at 2 kHz; GLIMPSED = only time-frequency cells where speech beats speech-shaped noise by 3 dB local SNR (0 dB global SNR); SCULPTED = music carrier shaped by glimpses above 6 dB local SNR.
- Overall: keyword score roughly doubled from first to last sentence (33.7% to 67.5%). Half the total gain came within about 2.7 sentences; a fast phase (about 10 points per sentence) ended near sentence 3, then a slow phase (about 0.5 points per sentence).
- Per distortion (initial score, total gain in points, sentences to half the gain): fast 57/+30/4.2; noise-vocoded 41/+42/5.1; reversed 45/+19/3.0; glimpsed 53/+12/3.3; sculpted 36/+20/1.8; narrowband 25/+31/5.5; tone-vocoded 2/+59/14.8; sine-wave 6/+44/10.5.
- Tone-vocoded and sine-wave speech were still rising after 30 sentences. Glimpsed speech (the closest to "speech in noise") showed the smallest gain and no clear fast phase.
- A log curve, score = a*ln(n + b) + c, fit every condition at least as well as other growth functions.
- Prior blocks of other distortions helped only sine-wave speech; prior blocks hurt fast speech slightly. The authors read this as little evidence of a general "distorted speech" skill learned within a session.
- Trainer relevance: (1) every one of these manipulations can be generated in Web Audio; (2) expect most of the within-session gain in the first 3-6 sentences of a new distortion, so the first sentences of a new condition should not count toward a difficulty staircase; (3) masking-like degradation (glimpsing) adapts least.

### 1.1 Noise-vocoded and spectrally degraded speech (cochlear-implant simulations)

**Davis, Johnsrude, Hervais-Adelman, Taylor & McGettigan (2005)** [full text, author PDF].
- Vocoder: 6 log-spaced bands, 50-8000 Hz (edges 50, 229, 558, 1161, 2265, 4290, 8000 Hz), noise carriers, envelope smoothing about 64 ms window with periodicity above about 50 Hz removed. One female Southern British talker. Sentences of 6-13 words (mean 2.0 s). A 15-band example sentence was played first. Scoring: words in order, exact form.
- Exp 1 (no feedback, 30 sentences): word report rose from 31.6% (sentences 1-10) to 43.4% (11-20); the very first sentence was below 10%.
- Exp 2: after each report, the sentence was replayed either distorted-clear-distorted (DCD: clear version heard before the second distorted play, which "pops out") or distorted-distorted-clear (DDC). DCD produced more learning. Last block above 75% with DCD vs below 60% without feedback.
- Exp 3: written text in place of the clear version (distorted, text shown 1.5 s, distorted) was as good as clear speech (DWD = DCD); both beat distortion-only repetition. So the useful feedback is knowing the words, not hearing a clear acoustic version.
- Exp 4-5: training on nonword sentences (even with written or clear feedback) gave no benefit over naive listeners; syntactic prose made of real but unrelated words helped about as much as normal sentences; Jabberwocky (real function words, nonword content words) helped less. Real words, not sentence meaning, drive the learning.
- Passive DCD exposure without a report task worked about as well as active report (marginal advantage for passive).
- Learning transferred to words never heard vocoded, so it is sublexical. Time scale: about 20 minutes for most of the gain.

**Hervais-Adelman, Davis, Johnsrude, Taylor & Carlyon (2011)** [full text, Université de Genève open archive].
- Exp 1: low region 50-1406 Hz (6 bands) vs high region 1593-5000 Hz (5 bands by error), noise carriers, 40 sentences, DCD feedback, switch after 20 sentences. Learning transferred completely between frequency regions (switch group not worse than no-switch).
- Exp 2: 6 bands 937-5000 Hz with three carriers matched for naive intelligibility: noise bands, sine waves at band centres, and pulse trains (alternating-phase harmonic complex, F0 70 Hz, 140 pulses/s). Transfer across carriers was only partial: switch groups landed between naive and no-switch.
- Interpretation: learning sits beyond tonotopic stages but keeps sensitivity to fine structure (noise vs periodic). For a trainer: varying the carrier is a real change of condition; varying the band region is not.

**Hervais-Adelman, Davis, Johnsrude & Carlyon (2008)** [secondary report, via Huyck et al. 2017 and Hervais-Adelman et al. 2011]: training with vocoded single words generalized to new words from the same talker; learning is enhanced by phonological (sublexical) content even without lexical status, in contrast to the sentence result of Davis et al. 2005. Primary not opened.

**Huyck, Smith, Hawkins & Johnsrude (2017)** [full text, CORE]. Same 6-band vocoder as Davis 2005; two female talkers (Canadian English and Southern British English); 20 training sentences (DCD), 20 test sentences. Learning was significant within the first 10 sentences and transferred completely to the other talker (switch = constant at test). Naive listeners caught up by test sentences 11-20, so a 20-sentence head start lasts about 10 sentences for this kind of rapid learning.

**Stacey & Summerfield (2008)** [full text, CORE / Nottingham Trent repository].
- 8-channel noise vocoder (analysis bands centred 433-4712 Hz, envelope low-passed at 160 Hz), simulating a 6 mm basilar-membrane upward shift (output bands centred 1206-11007 Hz). 18 adults, 6 per group.
- Three training methods, nine 20-minute sessions (3 hours total) on separate days over 2-3 weeks: (a) word task, 2-alternative choice between near-minimal pairs, wrong trials repeated until correct; (b) sentence task, pick 3 key words from 6 written options, with acoustic replay and then the written sentence and one more replay after errors; (c) phoneme-continuum task (adaptive XAB, no labelling).
- Gains after 3 hours (points above best baseline; tests used 2-10 untrained talkers): word training +12.5 IEEE sentences, +13.0 BKB sentences, +12.3 consonants; sentence training +15.6 IEEE, +16.2 BKB, +9.8 consonants; phoneme-continuum training about +2 to +3 on sentences and not significant.
- Repeated testing alone would have doubled the apparent gains (e.g., 27-28 points vs 13-16 points controlled). A trainer's own probe tasks need a test-retest control.
- Conclusion: training that maps sound to words transfers; non-lexical discrimination training does not.

**Nogaki, Fu & Galvin (2007)** [secondary report, via Fu & Galvin 2008 review, PMC]. Normal-hearing listeners, severely shifted CI simulation, five 1-hour sessions of vowel-contrast training delivered at 1, 3 or 5 sessions per week. Rate did not significantly change the outcome; total amount of training looked more important. Untrained consonants and sentences also improved.

### 1.2 Time-compressed and naturally fast speech

**Dupoux & Green (1997)** [secondary report, via Adank & Janse 2009 and Banai et al. 2022]. Listeners adapted to sentences compressed to 38% of original duration within about 10-20 sentences; changing the compression rate briefly lowered performance; adaptation is not tied to one talker. Primary not opened.

**Pallier, Sebastián-Gallés, Dupoux, Christophe & Mehler (1998)** [secondary report, from general literature; the HAL copy was blocked]. Adaptation to compressed speech transferred between languages with similar phonology and rhythm but not between dissimilar ones; listeners also adapted to an unknown language. Treat details as unverified.

**Adank & Janse (2009)** [full text, MPG repository]. Dutch, one male talker, true/false sentence verification with response time (60 sentences per condition). Natural fast speech was recorded at about 10.2 syllables per second (on average 46% of normal duration, range 33-89%); time-compressed versions (PSOLA) were matched item by item. Response times to compressed speech dropped mainly over the first 12-18 sentences; accuracy for natural fast speech improved over about 30 sentences. Exposure to compressed speech first improved later natural-fast accuracy, but not the reverse. Natural fast speech stayed harder than compressed speech at matched duration (it is also reduced, not just faster).

**Banai, Karawani, Lavie & Lavner (2022)** [full text, Scientific Reports, open access]. Hebrew, simple sentences (half plausible, half implausible).
- Stimuli: 30% of original duration with WSOLA; natural fast speech at about 214-220 words per minute; speech in 4-talker babble at -6 dB SNR.
- Exp 1 (n = 160): 10 compressed sentences per session, sessions 5-9 days apart; a training group also did 180 sentences (one 60-sentence block at 30%, then two adaptive blocks starting at 50% compression with a 2-down/1-up staircase). Within-session gain in session 1 about 14-15 points (d about 1.0); accuracy 0.20 to 0.33 between sessions with rapid exposure only, 0.26 to 0.47 with training. Individual between-session learning predicted recognition of natural fast speech and of speech in babble.
- Exp 2 (n = 254), 20 exposure sentences, no feedback: 20 different sentences from one talker; the same 20 sentences from five talkers; four sentences repeated five times; or one sentence repeated 20 times. Effects were small and specific: none of the exposure types changed performance with a new talker, natural fast speech or speech in noise. Rapid learning is long-lasting but tied to the acoustics of the exposure set.

**Banai & Lavner (2014, 2019); Tarabeih-Ghanayim, Lavner & Banai (2020); Manheim, Lavie & Banai (2018)** [secondary report, via Banai et al. 2022]. Multi-session training on compressed speech was specific to trained stimuli and did not transfer to new talkers; talker variability during training slowed learning without improving transfer; one study found no transfer to natural fast speech. Primaries not opened (PMC and Europe PMC rate-limited or blocked on this run).

### 1.3 Foreign-accented (second-language) speech

Speed of adaptation:
- **Clarke & Garrett (2004)** [secondary report, via Hosier & Bicknell, Northwestern working paper]: the processing slow-down for Spanish- and Chinese-accented English shrinks within about one minute of exposure.
- **Xie, Weatherholtz, Bainton, Rowe, Burchill, Liu & Jaeger (2018)** [full text, PMC]. Mandarin-accented English (one female talker, moderately strong accent), 18 exposure sentences in three blocks of six, whole session under 5 minutes, web-based with headphones. Task: hear a sentence, then decide if a printed word matches its last word (speeded). The 177 ms slow-down versus native-talker controls in block 1 was gone by block 2 (within about 12 sentences). A control group hearing native speech in noise at +2 dB SNR (matched for initial difficulty) did not get the benefit, so the gain is accent-specific, not general "hard listening" practice. Exposure to a different Mandarin-accented talker transferred to the test talker for speed (about 92 ms faster) but not accuracy. Listeners did not reach native-talker performance after 18 sentences.
- **Witteman, Weber & McQueen (2013)** [full text, CORE]. German-accented Dutch; cross-modal priming. Weak and medium accent features needed no exposure. Strongly accented vowels produced no word priming in listeners with little experience of the accent, but did in listeners who heard the accent several times a week. A 4-minute story from the same talker containing 12 strongly accented words removed the deficit immediately; the same story from a different talker with the same accent helped only later in the test and less. Adaptation generalized to new words containing the same vowel substitution.
- **Witteman, Bardhan, Weber & McQueen (2014)** [full text, MPG repository]. Hebrew-accented Dutch (shortened /i:/). A 3.5-minute exposure of 70 isolated words while listeners monitored for an unrelated sound (/k/) produced adaptation without attention to the accent, and it was the same 24 hours and 1 week later (priming about 39-40 ms vs about 15 ms at baseline). One talker only.

Generalization across talkers and accents:
- **Bradlow & Bent (2008)** [secondary report, via a 2009 ASA lay-language summary and Bradlow et al. 2023]. Two one-hour sessions on two days of sentence dictation; Mandarin-accented talkers; about 10 listeners per group. Training on the test talker helped most; training on five Mandarin-accented talkers helped a new Mandarin-accented talker; training on one non-test talker did not; no Mandarin training helped a Slovak-accented talker. Exact sentence numbers and SNR not verified.
- **Baese-Berk, Bradlow & Wright (2013)** [secondary report, via Bradlow et al. 2023, the 2009 ASA lay summary and Hosier & Bicknell; the PMC copy was behind a browser check]. Training on five talkers with five different first languages (none Slovak) improved recognition of a new Slovak-accented talker; five Mandarin talkers did not. Caveat raised by Bradlow et al. 2023: only one test talker per accent was used.
- The same lay summary reports that all three kinds of adaptation (talker-specific, talker-independent, accent-independent) also occurred when listeners did a puzzle while accented speech played in the background, i.e. with incidental exposure.
- **Sidaras, Alexander & Nygaard (2009)** [secondary report, via Hosier & Bicknell]: multi-talker Spanish-accented training generalized to new Spanish-accented talkers.
- **Alexander & Nygaard (2019)** [secondary report, via Bradlow et al. 2023]: word training on several Spanish-accented or several Korean-accented talkers did not help the other accent; a mixed-accent group showed only a hint of accent-general gain.
- **Bradlow, Bassard & Paller (2023)** [full text, NSF Public Access Repository]. 195 trained listeners plus 27 untrained; four second-language talkers (Brazilian Portuguese, Farsi, Spanish, Turkish first languages); 60 training sentences, one talker (four single-talker conditions) or three talkers (four multi-talker conditions, one talker held out), round-robin so every talker served as a test talker; speech-shaped noise at 0 dB SNR; typed responses; no feedback; test about 11 hours after training (mean 10 h 53 min); scoring with Autoscore.
  - Results: some single-talker trainings generalized (Farsi training: +10.2 points on the Brazilian Portuguese talker, +5.6 Spanish, +5.4 Turkish); some multi-talker sets did and one did not (excluding Spanish: no significant gains). Generalization was asymmetric.
  - Global acoustic similarity between training and test talkers did not predict transfer; change in F0 variation did (r = 0.67).
  - The least intelligible training talker (Turkish; about 42-50% correct during training, versus 66-86% for the others) gave poor learning on its own; the authors suggest low intelligibility during training starves lexically guided learning.
  - Conclusion: variability is neither necessary nor sufficient; a mix of variability, similarity and training intelligibility matters.
- **Xie, Liu & Jaeger (2021)** [could not open; described via Bradlow et al. 2023]. Large web replication of Bradlow & Bent with round-robin talker rotation and 8 participants per training-test talker pair; single-talker training produced cross-talker generalization, varying by talker pair, sometimes as large as multi-talker training; acoustic similarity did not straightforwardly explain the pattern.
- **Tzeng, Alexander, Sidaras & Nygaard (2016)** [full text, PMC]. See Section 3: interleaving talkers beat blocking for generalization to new accented talkers.

Trainer relevance: accent adaptation is fast (12 sentences to minutes) and partly talker-specific. Generalization to new talkers is real but uneven and depends on which talkers are trained. Keeping training items intelligible enough (roughly two-thirds of words or more) seems to matter. Since a free web tool cannot record dozens of accented talkers, the realistic analogue is variation of synthetic "accent-like" transformations or recorded volunteer voices; there is no evidence yet that synthetic accent transformations transfer to real accents (gap).

### 1.4 Regional accents

- **Smith, Holmes-Elliott, Pettinato & Knight (2013/2014)** [abstract only: SPIN 2014 conference abstract; the City University full text was blocked by a bot-protection page]. Glasgow vs Southern British English talkers and listeners, in cafeteria noise (+2 to +3 dB SNR in related experiments). Long-term familiarity with an accent improved its intelligibility in noise; a 40-minute familiarization in quiet with a meaning-based task produced gains of about 12-21 points on post-tests, and all groups showed a talker-familiarity benefit.
- **Maye, Aslin & Tanenhaus (2008)** [not opened; known from general literature]: about 20 minutes of a story read in an artificial accent (front vowels lowered) shifted lexical decisions so that accented forms were accepted as words, generalizing to new words with the same vowel shift. Treat as unverified.

### 1.5 Dysarthric (disordered) speech

- **Borrie, McAuliffe, Liss, O'Beirne & Anderson (2012)** [full text, NZBRI repository copy]. Three men with moderate hypokinetic dysarthria (Parkinson's disease; 65-75% sentence intelligibility). Familiarization = three readings of a standard reading passage. Test = 36 semantically anomalous six-syllable phrases with alternating stress, 12 s per typed response.
  - 60 listeners in three groups: control talker passage; dysarthric passage audio only (passive); dysarthric passage with the written transcript on screen while listening (explicit).
  - Immediate test: explicit > passive > control. Controls recognized about 25% of words; passive listening added about 13 points.
  - At 7 days, passive gains were gone; explicit gains remained above both groups. Passive exposure improved segment-level accuracy (kept at 7 days) but did not teach listeners to use stress to find word boundaries; reading along did.
  - Trainer relevance: text shown at the same time as the degraded speech gives larger and more durable learning than audio alone.
- **Borrie, Lansford & Barrett (2017), "Generalized adaptation to dysarthric speech"** [abstract only, Utah State repository page]. 160 listeners: pretest on a talker with ataxic dysarthria, familiarization with one of seven talkers with dysarthria differing in similarity (same, similar, dissimilar) and intelligibility (low, mid, high), or a control talker, then posttest. All dysarthric familiarization helped; most when the training talker sounded similar to the test talker; less when the training talker had low intelligibility. Same lesson as Bradlow et al. 2023 for accents.

### 1.6 Reverberant speech (rooms, distance)

- **Brandewie & Zahorik (2010)** [full text, PMC]. CRM sentences (8 talkers), simulated room 5.7 x 4.3 x 2.6 m with binaural room impulse responses, talker 1.4 m in front, Gaussian noise from 90 degrees; nine SNRs from -28 to +4 dB.
  - Hearing a full carrier sentence in the same room before the target improved the speech reception threshold by 2.7 dB (about 18 points at mid SNRs; every listener at least 1.4 dB), in a moderately reverberant room (T60 0.42 s, C50 13.4 dB).
  - There was no benefit in an anechoic space and almost none with one ear only, so the effect is mainly binaural. It acts within seconds and did not grow across a block.
- **Brandewie & Zahorik (2013); Srinivasan & Zahorik (2013, 2014); Zahorik & Brandewie (2016); Watkins (2005)** [secondary report, via Vlahou et al. 2021].
  - The exposure needed for the benefit to level off rose with SNR, from about 0.85 s at low SNR to about 2.7 s at high SNR.
  - A consistent room also helped open-set sentences (TIMIT), with no further gain across several sentences.
  - The effect weakens in very reverberant rooms.
  - With "sir"-"stir" continua, the reverberation of the preceding carrier phrase shifts what listeners hear (monaural compensation).
- **Vlahou, Ueno, Shinn-Cunningham & Kopčo (2021)** [full text, CMU lab PDF]. Final consonants in /a/-consonant syllables, 3 talkers, strong reverberation (concert hall 33 m from stage, T60 about 2.5 s; church 12 m, T60 about 3 s), no noise, 720 trials each for 9 listeners. A same-room carrier (2 or 4 syllables, 0.8 s apart) beat a different-room or dry carrier by 1-7 points. The benefit was in manner (stops) and voicing, not place. Mismatched carriers hurt about as much as matched ones helped.
- Trainer relevance:
  - Room adaptation is fast and short-lived: seconds, not sessions. A trainer can exploit it by keeping the room constant within a trial (lead-in in the same room) and by teaching it as a listening tactic ("listen for a few seconds before the important part").
  - Mixing rooms trial by trial lowers scores, which matters for any "variability" mode.
  - No study found multi-session training gains specific to reverberation; this is a gap.
  - The binaural nature means headphones are needed for the effect.

### 1.7 Synthetic (text-to-speech) speech

- **Reis, Heald, Uddin, Fenn & Nusbaum (2023)** [full text, Frontiers in Sleep, open access]. Formant-synthesized monosyllabic words (rsynth), 700 words: 300 for training and four 100-word tests, no word repeated anywhere, so only generalized (not rote) learning counts.
  - Training: 6 blocks of 50 words, about 45 minutes including tests. Each block first plays every word while its spelling is on screen (1 s between words), then replays the words for typed identification (4 s limit). Tests: typed identification, no feedback, scored by phonetic transcription.
  - Results: pretest 0.33 to 0.50 correct after one session. Wake controls lost part of the gain over the day (0.51 to 0.44 by evening). A 90-minute afternoon nap protected it (0.49 to 0.47 by evening).
- **Fenn, Nusbaum & Margoliash (2003); Fenn, Margoliash & Nusbaum (2013)** [secondary report, via Reis et al. 2023 and Xie, Earle & Myers 2018]. Same paradigm. Generalized learning of synthetic speech decays over a waking day and is restored by sleep; a night of sleep then protects against later decay. Rote (repeated-item) learning does not show the same sleep dependence.
- **Schwab, Nusbaum & Pisoni (1985)** [secondary report, via Reis et al. 2023]. Training on novel words gives about 20 points from pretest to posttest, and the learning was still present 6 months later without further exposure.
- **Greenspan, Nusbaum & Pisoni (1988)** [secondary report, via Reis et al. 2023]. Origin of the rote vs generalized distinction: training on varied novel items yields learning that transfers to new words.
- Trainer relevance: the "hear it with the text, then identify it" block structure is a cheap, proven protocol. Never repeating items forces generalized learning. Modern neural TTS is far more intelligible than 1980s formant synthesis, so this literature mainly supplies a protocol template rather than a target condition.

### 1.8 Sine-wave speech

- **Cooke et al. (2022)** [full text; see 1.0]. Sine-wave speech (sinusoids following F1 and F2) started at 6% keywords and gained 44 points within 30 sentences without feedback. Half the gain took about 10 sentences, and scores were still rising at block end. It was the only distortion that benefited from earlier exposure to other distortions.
- Most other sine-wave work concerns "pop-out": once the listener knows the sentence or is told it is speech, it becomes intelligible. No multi-session sine-wave training study was found on this run (search budget exhausted). Gap.

### 1.9 Interrupted / glimpsed speech (relevant to fluctuating noise)

- **Cooke et al. (2022)**: "glimpsed" speech (only cells with local SNR above 3 dB kept, 0 dB global SNR) improved least of 8 distortions: +12 points, with no clear fast phase. Learning to use glimpses seems slower or more limited than learning a consistent spectral transformation.
- **Benard & Başkent (2013, 2014)** on interrupted speech with or without noise filling [not opened; could not reach after search budget ran out]. Treat as a gap.

### 1.10 Whispered, casual/reduced, mumbled and emotional speech

- The web-search budget for this run ran out before these could be searched. Nothing here comes from sources read on this run.
- Known leads to verify (from general literature, not opened):
  - Poellmann, Bosker, McQueen & Mitterer (2014), Journal of Phonetics: lexically guided adaptation to segmental and syllabic reductions in casual Dutch.
  - Brouwer, Mitterer & Huettig (2012): reduced forms change lexical competition.
  - Adank & Janse (2009, above): natural fast speech includes reduction and stays harder than compressed speech at matched duration, which suggests reduction needs its own training.
  - Dupuis & Pichora-Fuller (2014): intelligibility of emotional speech in noise in younger and older adults.
- No perceptual-learning study of whispered speech was located. Treat whispered, mumbled and emotional speech as untested conditions for training (gap and opportunity).

## 2. Variability

## 3. Structure, feedback, schedule, sleep

## 4. Lexically guided retuning; talker-specific vs talker-independent adaptation

## 5. Links to speech-in-noise and everyday listening

## 6. Recent and under-tested ideas a trainer could exploit

## 7. Could not open in full

## 8. References
