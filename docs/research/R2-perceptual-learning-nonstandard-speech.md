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

**Pallier, Sebastián-Gallés, Dupoux & Mehler (1998)** [abstract only, Cogprints archive record; the HAL full text was blocked by a bot-protection page]. Adaptation to compressed speech builds over about 10-15 sentences.
- Exposure in Catalan transferred to Spanish and vice versa, even for monolingual Spanish listeners who do not understand Catalan.
- English-French bilinguals showed no transfer between those languages.
- Monolingual English listeners adapted from English, partly from Dutch, and not from French.
- So adaptation to fast speech sits at a sublexical, language-sound-system level and does not need comprehension. Compression rate and sentence counts not verified.

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

### 1.11 More accent studies with noise (added)

- **Bieber & Gordon-Salant (2022)** [full text, PMC]. 365 young adults online (Prolific), 9 between-subject conditions of about 40.
  - Talkers: 24 male talkers, native English, Spanish-accented, or mixed first languages (French, Hindi, Japanese, Korean, Mandarin, Portuguese, Spanish); moderate accents (5.4 of 9).
  - Material: six-talker babble at 0 dB SNR. 30 adaptation sentences from one talker (or three), each typed, then replayed with the text on screen; then 10 sentences from a new talker with the same first language.
  - Semantically anomalous sentences slowed the rate of adaptation (shallower curve) but listeners still learned and generalized. Normal sentences rose steeply and then plateaued. Topic-grouped sentences added nothing.
  - Accented talkers produced larger relative gains than the native talker. Single vs multiple talkers made no difference here (moderate accents). Stroop scores did not predict adaptation.
- **Stringer & Iverson (2019)** [full text, UCL repository author manuscript].
  - Talkers: Southern British, Glaswegian and Spanish-accented English, 4 talkers each. Listeners: English or Spanish. Speech-shaped noise at +3, 0, -3 dB SNR.
  - In quiet, most talker-listener pairings were equally intelligible. Accent differences opened up as SNR fell: English listeners in noise scored about 80% (own accent), 58% (Glaswegian) and 46% (Spanish-accented).
  - Accent costs are mostly invisible in quiet and appear in noise, so accent training and testing should happen in noise.
- **Van Engen & Peelle (2014)** [full text, PMC; perspective article]. Noise and reverberation reduce the intelligibility of foreign-accented speech more than native speech (citing Van Wijngaarden et al. 2002; Rogers et al. 2006). Accent adaptation may lower listening effort; the authors flag this as untested.
- **Atagi & Bent (2015)** [full text, PMC]. 50 listeners; 24 talkers from six first languages. Listeners who were better at naming a talker's accent (6-way choice, sentences in quiet) were better at transcribing accented sentences in speech-shaped noise at -2 dB SNR (r = 0.34, independent of language-learning history). Correlational.
- **McLaughlin, Baese-Berk & Van Engen (2024)** [full text, NSF Public Access Repository; Frontiers in Language Sciences]. 160 young adults over five days.
  - Days 2-4: 39 transcription trials per day (13 per talker) with three Mandarin-accented talkers of about 52-56% intelligibility, in quiet, either with no feedback or with the correct sentence shown after each response; controls trained on native talkers.
  - Days 1 and 5: dual-task test (repeat sentences aloud while sorting numbers).
  - No reliable advantage of accent training over control training on accuracy or response time, and no benefit of feedback. The feedback group reported higher motivation.
  - Lesson: about 120 trials of a hard accent spread over three days was too little to show transfer on a different task. Match the training and test tasks, and give more trials.

### 1.12 Dysarthric speech, extra studies (added)

- **Borrie, McAuliffe, Liss, O'Beirne & Anderson (2012), JASA Express Letters** [full text, PMC]. Familiarizing with 36 stress-alternating phrases instead of a passage made even passive listeners use stress for segmentation. Reading along still beat audio only for word accuracy. The passage familiarization gave larger gains than the phrase familiarization.
- **Lansford, Luhrsen, Ingvalson & Borrie (2018)** [full text, PMC]. One talker with moderate ataxic dysarthria.
  - Procedure: pretest of 20 anomalous phrases; familiarization = a 35-phrase reading passage heard while following the transcript; posttest of 60 new phrases.
  - Older adults (60-95, with or without hearing loss) gained about 20.6 points, the same as younger adults (19.6), even though they started lower (39% vs 49%; 33% with hearing loss).
- **Borrie, Lansford & Barrett (2021)** [abstract only, Utah State repository page]. 47 speech-language pathologists gained about 19 points from the same pretest-familiarization-posttest protocol with a new dysarthric talker, slightly less than naive listeners. Their dysarthria caseload predicted their starting intelligibility, not their gain. Long-term group-level experience and short-term talker-specific learning are separate contributions.

## 2. Variability

### 2.1 The classic claim and the replication

- **Logan, Lively & Pisoni (1991); Lively, Logan & Pisoni (1993); Lively et al. (1994); Bradlow et al. (1997, 1999)** [secondary report, via Brekelmans et al. 2022, Tzeng et al. 2016 and Fuhrmeister & Myers 2020].
  - Japanese listeners trained on English /r/-/l/ identification with minimal pairs, multiple talkers and trial-by-trial feedback: 15 sessions in the original studies, about 45 sessions over 3-4 weeks in Bradlow et al. 1997, with six participants per experiment in the originals.
  - Lively et al. (1993) reported that only listeners trained on the high-variability set generalized to a new talker. Gains were retained long term (Lively et al. 1994) and carried over to production (Bradlow et al. 1997, 1999).
- **Brekelmans, Lavan, Saito, Clayards & Wonnacott (2022)** [full text, Oxford Research Archive]. Pre-registered online replication with 166 native Japanese adults.
  - Training: English /r/-/l/ in five word positions. 15 sessions on separate days, each 272 two-choice identification trials with trial-by-trial feedback (about 20 min). Five talkers (high variability) or one talker (low variability). 68 minimal pairs (136 words) in both conditions.
  - Tests: 60 trials, no feedback, novel words, with novel talkers or a trained talker.
  - Accuracy: pretest about 61-62%. Session 1: 70% (HV) and 68% (LV). Session 15: 81% and 81.5%. Novel-talker posttest: 70.4% (HV) and 68.1% (LV), i.e. gains of 8.5 and 7.6 points.
  - Bayesian analysis: substantial evidence for no difference during training; the key HV-vs-LV generalization test was ambiguous (BF 0.6). Any HV benefit is much smaller than originally claimed.
  - Exploratory aptitude split (pretest above or below 60%): no sign that HV helps strong perceivers and hurts weak ones. Weak perceivers gained numerically more with HV (10.1 vs 7.5 points), which was inconclusive.
  - The authors suggest a single talker with many words may already carry enough variability.
- **Zhang, Cheng & Zhang (2021), meta-analysis of talker variability in nonnative phonetic learning** [secondary report, via Brekelmans et al. 2022]. Reported a large HV effect. Brekelmans et al. attribute the gap partly to which studies were included. Not opened; see Section 7.

### 2.2 Who benefits: aptitude

- **Perrachione, Lee, Ha & Wong (2011)** [secondary report, via Fuhrmeister & Myers 2020 and Brekelmans et al. 2022]. Pitch-contour (tone) word learning. Only high-aptitude learners (pretraining pitch-contour perception) benefited from HV training; trial-by-trial talker variability hurt low-aptitude learners. Blocked-HV and interleaved-HV groups did not differ in generalization.
- **Sadakata & McQueen (2014)** [secondary report, via Fuhrmeister & Myers 2020]. For Mandarin tones, higher-aptitude learners did better with HV training; this did not hold for an easier contrast (Japanese geminates).
- **Antoniou & Wong (2015)** [secondary report, via Fuhrmeister & Myers 2020]. Poor perceivers are more affected by the extra cognitive load of resolving talker variability.
- **Fuhrmeister & Myers (2020)** [full text, NSF Public Access Repository]. See 3.1. Higher-aptitude learners coped better with interleaved training and improved more overnight.
- **Brekelmans et al. (2022)**: the aptitude-by-variability interaction did not appear in a sample about ten times larger than the originals.
- Net reading: the aptitude-by-variability interaction is plausible for hard contrasts but not robust. A trainer should not hard-code "low scorers get low variability" as settled science. It may offer it as a mode, or adapt variability to in-app performance rather than to a one-off aptitude test.

### 2.3 Variability in accent and degraded-speech adaptation

- Accent studies (Section 1.3) give a mixed picture.
  - Multi-talker training generalized to new talkers of the same accent in Bradlow & Bent 2008, Sidaras et al. 2009 and Tzeng et al. 2016.
  - Bradlow et al. (2023) and Xie et al. (2021) found single-talker training can generalize as well, depending on the talker pair. Training-test similarity, not talker count, did much of the work in Xie & Myers (2017) [secondary report, via Aoki & Zellou 2025].
  - Multi-accent training gave accent-general benefits in Baese-Berk et al. 2013, but only weak, inconsistent ones in Alexander & Nygaard 2019 [full text, PMC]. In that study, one 35-40 minute session alternated accentedness ratings with transcription blocks (feedback: correct spelling plus replay), using six talkers and 144 words. Korean-accent training raised new-talker Korean-accent word scores from 0.68 to 0.73, whether or not the talkers were familiar, but did not help Spanish-accented speech.
- **Aoki & Zellou (2025)** [full text, eScholarship; Glossa Psycholinguistics]. About 770 online listeners; synthetic TTS voices (Amazon Polly, 3 female and 3 male); 48 exposure sentences with 16 shifted tokens of an artificial gender-linked /p/ to [b] shift.
  - One shifted talker gave no generalization to a new talker; two shifted talkers did, partly and briefly.
  - The authors argue that several talkers are needed for a completely unfamiliar pattern but perhaps not for familiar variation such as second-language accents.
  - Relevance: the shift was made with synthetic voices, which a browser trainer could also use.
- Degraded speech:
  - **Stacey & Summerfield (2007)** [abstract only, Nottingham Trent repository]: with a 3 mm simulated shift, multi-talker training generalized better to new talkers than single-talker training. Gains were 7-12 points after one 1-2 hour session and 13-18 points after three more sessions.
  - **Huyck et al. (2017)** [full text]: vocoded-speech learning transferred completely across two female talkers with different accents.
  - **Tarabeih-Ghanayim et al. (2020)** [secondary report, via Banai et al. 2022]: talker variability slowed learning of compressed speech without improving transfer. **Banai et al. (2022)** Exp 2: five-talker exposure did not help a new talker.
- Practical synthesis:
  - For accents, enough training-talker variety to span what the test talker does matters more than a fixed number of talkers.
  - For a consistent signal transformation (vocoding, shift), learning already generalizes across talkers, so talker variability buys little.
  - Low intelligibility during training is a recurring brake: Bradlow et al. 2023 (Turkish talker at about 42-50%), Borrie et al. 2017 (low-intelligibility familiarization talker), Guediche et al. 2016 (about 18% training accuracy).

## 3. Structure, feedback, schedule, sleep

### 3.1 Blocked vs interleaved presentation

- **Tzeng, Alexander, Sidaras & Nygaard (2016)** [full text, PMC]. Spanish-accented English.
  - Training: 8 talkers recorded, 4 per training set; 36 Harvard sentences each heard from all 4 talkers (144 trials). Listeners typed, then saw the sentence and heard it again.
  - Test: 20 new sentences from 4 new accented talkers in white noise at +10 dB SNR; 145 listeners in Exp 1.
  - Talker and sentence randomized on every trial beat blocking by talker or by sentence. Only the interleaved group was reliably above untrained controls. Interleaved native-talker training gave at most a marginal benefit, so the effect is accent learning, not task practice.
  - Exp 2 (123 listeners): ordering talkers from more to less intelligible (or the reverse) did not help.
  - Training accuracy was already high (about 90% to 98%), so interleaving was introduced at high intelligibility.
- **Luthra, Mechtenberg & Myers (2021)** [full text, NSF Public Access Repository manuscript]. Lexically guided retuning with two voices (one female, one derived male), one with an /s/-like and one with an /sh/-like ambiguous fricative; 32 listeners per experiment, online.
  - Exposure task: judge talker sex. 32 words per talker (16 with the ambiguous sound), blocked by talker, gave talker-specific boundary shifts.
  - Interleaving the two talkers needed double the exposure (64 words per talker) to show the shift. Feedback on the talker task made no difference.
  - Interpretation offered by the authors: updating two talker models at once costs extra exposure (contextual interference).
- **Fuhrmeister & Myers (2020)** [full text, NSF Public Access Repository]. 136 English speakers learning the Hindi dental-retroflex stop contrast, one talker, 600 trials with feedback in one evening, retest next morning (about 14 h).
  - Blocking by vowel context beat interleaving for identification, immediately and next day (blocked about 0.77-0.81 vs interleaved 0.67-0.76). This contradicts the usual contextual-interference prediction.
  - Higher pretraining discrimination predicted all outcomes and coped better with interleaving. The authors call interleaving an "undesirable difficulty" for very hard contrasts. Caveat: interleaving also meant 4 rather than 2 response options.
- **Perrachione et al. (2011)** [secondary report, via Fuhrmeister & Myers 2020]: blocked and mixed high-variability tone training gave equal generalization.
- **Vlahou et al. (2021)** and **Brandewie & Zahorik (2010)** [full text]: switching rooms from trial to trial costs performance; a consistent room helps within seconds.
- Synthesis for a trainer:
  - Block when the listener must build a new, specific mapping (a new talker's idiosyncrasy, a new room, a hard new contrast, a new distortion), or while accuracy is low.
  - Interleave talkers and items once accuracy is high and the goal is generalization to new talkers of a type (accents).
  - A blocked-then-interleaved ramp fits all four studies but has not itself been tested head-to-head on speech generalization (gap).

### 3.2 Easy-to-hard ordering vs fixed difficulty

- **Guediche, Fiez & Holt (2016)** [full text, Holt lab PDF]. Spectrally shifted noise-vocoded single words: 20 bands, 116-7871 Hz, envelope 160 Hz, simulated insertion depth from 9.25 mm (mild; 56% correct) to 15.25 mm (severe; 11% correct). One female talker; every word unique per listener. 50-word pretest, 250 training trials, 50-word posttest at the severe level; 66 listeners per experiment.
  - Fixed severe training: text feedback after each response (printed word plus a repeat of the distorted word) doubled the gain, +16.6 vs +8.3 points.
  - Incremental training (start at 9.25 mm, add 0.25 mm every 10 trials, end at 15.25 mm): gains were about the same with or without feedback (+15.4 vs +14.1). Feedback-free incremental training matched feedback-supported severe training.
  - Training accuracy was about 18% (severe) vs 59% (incremental). Individual gains correlated with training accuracy (r = 0.34-0.60).
  - Reading: an easy-to-hard ramp lets the listener's own predictions act as the teacher, making explicit feedback unnecessary. Either source is enough; they are not additive.
- **Fu, Nogaki & Galvin (2005)** and **Nogaki, Fu & Galvin (2007)** [full text, Springer PDF and PMC]. Adaptive vowel-contrast training: response sets of 2, 4 or 6 choices, and acoustic contrasts made smaller as accuracy passed 80%.
  - 8-channel sine-vocoder CI simulation with an upward shift (carriers 999-10,290 Hz), more than 1,000 words from 4 talkers not used in testing.
  - Feedback: correct/incorrect, then the chosen and the correct word played one after the other.
  - Five 1-hour sessions: shifted vowels 14% to 29%, untrained consonants 44% to 65%, untrained sentences 30% to 55%. No transfer to unshifted speech (already near ceiling).
- **Banai et al. (2022)** [full text]: adaptive compression staircase (2-down/1-up, starting at 50% duration) plus a fixed 30% block improved between-session learning more than brief exposure. The extra training did not add to speech-in-noise scores.
- **Tzeng et al. (2016)**: ordering accented talkers by intelligibility did not matter (all items were fairly intelligible).
- **Gabay, Karni & Banai (2017)**, on easy vs hard vs mixed compressed-speech training [could not open; PMC behind a browser check].

### 3.3 Feedback types

| Feedback after or around the degraded item | Evidence | Outcome |
|---|---|---|
| None | Davis 2005 Exp 1; Cooke 2022; Bradlow 2023; Bieber 2022 controls | Learning happens, mostly in the first 3-15 sentences, slower and smaller |
| Correct/incorrect only | Stacey & Summerfield 2008 (word task, wrong trials repeated); Fu 2005 | Works when combined with re-hearing |
| Hear the clear version between two degraded plays (DCD) | Davis 2005 | Better than no feedback; equal to text |
| Text shown between two degraded plays (DWD) | Davis 2005 (text 1.5 s); Loebach 2010; Guediche 2016; Reis 2023 | As good as or better than clear speech |
| Clear (undegraded) auditory feedback | Loebach 2010 | Worse than degraded speech plus text (gain 0.16 vs 0.21) |
| Text on screen while the degraded speech plays | Borrie 2012; Lansford 2018 | Largest gains; only condition still above control after 7 days |
| Text shown before the degraded item | Sohoglu 2014; Sohoglu & Davis 2016; Tamati 2022 | Strongest immediate clarity boost ("pop-out"); learning link correlational |
| Correct sentence shown after typed response | McLaughlin 2024; Tzeng 2016 | No measurable extra benefit in McLaughlin 2024; motivation higher |

Details:
- **Loebach, Pisoni & Svirsky (2010)** [full text, PMC].
  - Setup: 8-band noise vocoder, 854-11,000 Hz, 150 Hz envelope; one female talker. Familiarization: 6 vocoded nursery rhymes read along with text. 20-sentence pretest, 130 training sentences with typed responses, posttest on the same 20, then 50 new meaningful and 20 new anomalous sentences.
  - Feedback "degraded replay plus written text" gave training accuracy .60 vs .50 for clear-auditory or no feedback, and a pre-post gain of .21 vs .16 vs .16 (exposure-free control .11). It was the only condition reliably better than no exposure on new meaningful sentences (.57 vs .44).
  - Training on semantically anomalous sentences was as good as meaningful ones for meaningful tests and better for anomalous tests (.45 vs .40). Exposure without feedback did not beat practice effects in this paradigm.
- **Sohoglu, Peelle, Carlyon & Davis (2014)** [full text, UCL Discovery].
  - Setup: monosyllabic words, 1-16 vocoder channels; text shown for 200 ms at onset asynchronies from 1600 ms before to 1600 ms after the word; clarity rated 1-8.
  - Matching text raised clarity, mismatching text lowered it. Text arriving any time before the word worked equally well. The benefit fell off when text came later than about 120 ms after word onset, and earlier still with more channels.
  - Text differing by one phonetic feature still partly helped, so the match is phonological, not lexical.
- **Sohoglu & Davis (2016)** [full text, MRC CBU author PDF].
  - Setup: 936 monosyllables, each heard once. Training: 468 trials, each a 200 ms written word followed about 1 s later by a vocoded word (3, 6 or 12 channels), half matching; clarity ratings only. Pre/post tests of 234 trials at 1, 6 and 24 channels.
  - 6-channel word report rose about 10 points (range -5 to +22). Neural prior-knowledge effects correlated with learning across people (r about -0.4 to -0.5).
- **Tamati, Sevich, Clausing & Moberly (2022)** [full text, PMC]. Online study with a headphone screener: 30 younger (19-39) and 30 older (50-71) listeners; 8-channel vocoded sentences with three filter slopes simulating current spread. Matching text shown 2.5 s before each sentence raised clarity by about 1 point on a 7-point scale at every degradation level, equally for both ages.
- **Guediche et al. (2016)**: text feedback matters most when the signal is too degraded for the listener's own predictions (see 3.2).
- **Mattern (2025)** [full text, Reed College BA thesis; n = 17, low weight]. Sine-wave words played distorted, then the original, then distorted again.
  - Accuracy on new words jumped from 0.35 to 0.69 after hearing the original once. Across blocks, sine-wave accuracy on never-disambiguated new words rose from 0.16 to 0.45.
  - Pseudowords and spectrally flipped controls did not generalize, so lexical knowledge drives the learning.

### 3.4 Passive exposure, attention and incidental learning

- **Davis et al. (2005)**: passive DCD presentation (no report) trained listeners about as well as active report.
- **Bradlow lab** [secondary report, via CIMSA slides and a 2009 ASA lay summary]. Accent adaptation occurred when listeners solved a puzzle while accented speech played in the background. Training that mixed active transcription with passive listening gave as much learning as all-active training (no numbers shown).
- **Witteman et al. (2014)**: 3.5 minutes of attending to an unrelated sound in accented words still produced adaptation that lasted 1 week.
- **Borrie et al. (2012)**: passive listening to dysarthric speech improved segment-level decoding, but its word-level gain vanished within 7 days. Text-supported listening lasted.
- **Fu et al. (2005)**: passively previewing 48 vowel tokens for at least 5 minutes before tests improved shifted vowels (+16.5 points) as much as active training. Repeated testing alone did not.
- **Loebach et al. (2010)**: degraded exposure without feedback did not beat the no-exposure practice control. **Banai et al. (2022)** Exp 2: 20 exposure sentences without feedback had small, acoustically specific effects.
- **Huyck & Johnsrude (2012)**, which reports that vocoded-speech learning requires attention, and **Wright et al. (2010; 2015)**, on task practice plus extra stimulus exposure, are cited in the sources above but could not be opened on this run. Section 7 lists them.
- Synthesis:
  - Passive exposure helps when the listener can resolve the content (text available, or speech intelligible enough) and when it is interleaved with active practice.
  - Passive exposure alone to unintelligible material does little.

### 3.5 Amount per day, session length, spacing

- **Nogaki, Fu & Galvin (2007)** [full text, PMC]. 18 listeners, five 1-hour sessions of adaptive vowel training delivered at 1, 3 or 5 sessions per week. The groups did not differ (vowels about 14% to 28-31%; consonants +20 points; sentences +24 points). Power was very low.
- **Banai & Lavner (2019)** [abstract only, University of Haifa research portal]. 69 young adults, 9-11 per protocol, plus controls.
  - More total trials gave more item-specific learning and more transfer to a new talker.
  - A smaller training set (more repetitions of each token) also improved transfer to a new talker.
  - Spreading the same trials over more sessions improved transfer to new sentences.
- **Stacey & Summerfield (2008)**: nine 20-minute sessions on separate days (3 hours) gave 12-16 point sentence gains.
- **Brekelmans et al. (2022)**: 15 sessions of about 20 minutes. **Oba et al. (2011)**: about 30 minutes a day, 5 days a week, 4 weeks (mean 10.75 h). **Fu & Galvin (2007, 2008 reviews)** [full text, PMC]: CI home training of 30-60 minutes a day, 5 days a week, for 1 month or more.
- **McLaughlin et al. (2024)**: three days of 39 trials was not enough to show transfer.
- **Banai et al. (2022)**: rapid learning from just 10 compressed sentences was still measurable 5-9 days later.
- Synthesis:
  - Gains in degraded-speech studies come in two layers: a fast layer (first 3-20 sentences, partly retained for days) and a slow layer (hours of practice over days).
  - Within the range tested, total practice matters more than how it is spread over the week.
  - Spreading helps transfer to new content.
  - About 20-30 minutes a day is the common protocol in successful studies.

### 3.6 Sleep and consolidation

- **Fenn et al. (2003, 2013)**; **Reis et al. (2023)** [see 1.7]. Synthetic-speech learning decays over waking hours and sleep or a nap restores or protects it.
- **Earle & Myers (2015a, b)** [secondary report, via Xie, Earle & Myers 2018 and Qin & Zhang 2019]. After nonnative-contrast training with one talker, listeners were at chance with an untrained talker right after training but improved after a night's sleep. Evening-trained learners improved over 24 h; morning-trained learners declined.
- **Xie, Earle & Myers (2018)** [full text, Myers lab PDF]. Mandarin-accented English; exposure = 180 lexical-decision trials (30 /d/-final words, about 9 minutes, no feedback); test = /d/-/t/ final-consonant identification (120 trials) for the trained talker and a new talker with a different /d/.
  - Talker-specific learning held for 12 h with or without sleep.
  - Generalization to the new talker appeared only in the group whose 12 h included overnight sleep (trained 8-9 pm, tested 8-9 am).
- **Qin & Zhang (2019)** [full text, PolyU repository; PLOS ONE]. 32 Mandarin speakers learning three Cantonese level tones, one talker, 300 identification trials with immediate written feedback (22-25 min). Morning trainees declined at 12 and 24 h; evening trainees held or slightly improved. Earlier sleep onset predicted gains.
- **Qin, Wu & Zhang (2025)** [full text, PolyU repository; Brain and Language]. 240 trials per contrast, about 45 minutes, one talker. A 90-minute nap (EEG-verified) improved later perception of the same tones from a new talker for contour tones only; spindle and slow-oscillation density predicted it.
- **Drouin, Zysk, Myers & Theodore (2023)** [abstract only, PubMed record and lab announcement]. Noise-vocoded sentences, transcription training with feedback. Evening trainees kept their gains at 12 h; morning trainees declined. The groups were equal 1 week later on trained and new sentences.
- **Systematic review of sleep in speech perceptual learning (JSLHR, September 2026)** [abstract only; authors not shown on the page]. 30 studies, 1,646 participants, mostly young adults.
  - Sleep reliably protects fragile speech-sound learning from waking decay. Enhancement beyond the post-training level appeared in about half the studies and depended on aptitude.
  - Generalization after sleep was most consistent when training variability was enough to support abstraction. Null results were associated with degraded signals or heavy processing demands.
- Synthesis: the strongest practical rule is "train later in the day, test or reuse the next day". Sleep seems to help generalization to new talkers especially. This also argues for showing the next-day probe before a new session, so the trainer measures consolidated rather than momentary performance.

### 3.7 Training task and material

- **Stacey & Summerfield (2008)**: tasks that map sound to words (word choice, sentence key words) transferred to sentences; an unlabeled phoneme-discrimination task did not.
- **Davis et al. (2005)**: real-word content is needed in sentences. **Hervais-Adelman et al. (2008)** [secondary report, via McGettigan et al. 2014]: nonword training gave equivalent improvement with single words.
- **Loebach & Pisoni (2008)** [full text, PMC]. 8-channel sine vocoder (200-7000 Hz, 400 Hz envelope); 150 listeners; about 50 training items per condition with feedback (the vocoded item replayed with its text).
  - Easy materials (phonetically balanced words, meaningful sentences): all training types transferred equally.
  - Hard materials (rhyme-test words, anomalous sentences, environmental sounds): learning was specific to the trained type.
  - Environmental-sound training transferred to speech; speech training did not transfer to environmental sounds.
  - The authors recommend varied materials.
- **Loebach et al. (2010)**: anomalous-sentence training works and pushes listeners to bottom-up listening. **Bieber & Gordon-Salant (2022)**: anomalous sentences slow the rate of accent adaptation.
- **Fu et al. (2005)**: sentence training lifted word-in-sentence scores from 25-50% to about 80% within a day yet did not improve isolated vowels; context lets listeners skip the hard cue. A trainer should mix context-rich and context-poor items.
- **McGettigan, Rosen & Scott (2014)** [full text, Frontiers in Systems Neuroscience]. 28 listeners, vocoded speech with 1-32 bands, no explicit training. Session 1 to session 2 improvement, retained over 7-15 days, was similar across tasks.

### 3.8 Calibration numbers for degradations (useful to set starting difficulty)

- Monosyllabic words, noise-vocoded, one male talker: word report about 3% (2 channels), 17% (4 channels), 68% (8 channels), bands log-spaced 70-5000 Hz. Source: **Sohoglu, Peelle, Carlyon & Davis (2012)** pilot data [full text, UCL Discovery].
- Sentences, 6-band noise vocoder (50-8000 Hz): about 30% words on first exposure, rising above 75% within 30 sentences with DCD feedback (Davis et al. 2005). The first sentence is below 10%.
- 6-band vocoded Spanish sentences: 41% keywords at first, +42 points over 30 sentences without feedback. Tone-vocoded: 2% at first, +59 points (Cooke et al. 2022).
- Upward-shifted 8-channel sine vocoder: vowels about 9-14%, consonants 36-44%, sentences about 30% at baseline (Fu et al. 2005; Nogaki et al. 2007).
- 30% compressed Hebrew sentences: about 20-26% correct at first exposure (Banai et al. 2022). 38% compressed sentences: adaptation within 10-20 sentences (Dupoux & Green 1997, secondary).
- Training accuracy that supports learning: learning was weak when training accuracy was about 18% (Guediche et al. 2016) or about 42-50% for an accented talker (Bradlow et al. 2023). Learning was robust at about 59% (Guediche, incremental) and 66-86% (Bradlow, other talkers). A working target for a staircase is therefore well above 50% words correct, perhaps 60-80%. This is an inference from these studies, not a tested value.

## 4. Lexically guided retuning; talker-specific vs talker-independent adaptation

### 4.1 The basic effect

- **Norris, McQueen & Cutler (2003)** [secondary report, via Luthra et al. 2021, Aoki & Zellou 2025 and Witteman et al. 2014]. When an ambiguous sound (e.g., halfway between /f/ and /s/, or /s/ and /sh/) appears in words where only one reading makes a word, listeners shift their category boundary for that talker. The shift then applies to new words and to a nonword continuum.
- Typical modern dose (Luthra et al. 2021): 32 exposure words per talker, 16 with the ambiguous sound, during an unrelated task (talker-sex judgment). Test: a 7-step continuum, 10 repetitions per step per talker.
- Mechanism in current accounts (Kleinschmidt & Jaeger 2015, as summarized by Luthra et al.): lexical context explains the ambiguous sound, and the unexplained acoustic deviation becomes the learning signal for that talker's model. This is the same top-down "teaching signal" logic as the DCD and DWD findings for degraded speech (Davis et al. 2005).

### 4.2 Talker-specific vs general

- **Eisner & McQueen (2005)** [secondary report, via Luthra et al. 2021]: fricative retuning did not transfer to a different talker.
- **Kraljic & Samuel (2005)** [secondary report, via Luthra et al. 2021]: transfer was asymmetric (female to male but not the reverse), tracking acoustic similarity of the fricatives.
- **Kraljic & Samuel (2007)** [secondary report, via Luthra et al. 2021]: two talkers with opposite fricative biases, presented in blocks, kept separate mappings.
- **Kraljic & Samuel (2006)**: stop consonants retune in a talker-general way, unlike fricatives (from general literature; not verified on this run).
- **Luthra, Mechtenberg & Myers (2021)** [full text]: separate talker models need twice the exposure when talkers are interleaved.
- Attribution:
  - **Kraljic, Samuel & Brennan (2008)** and **Kraljic & Samuel (2011)** [secondary report, via Witteman et al. 2014]: listeners do not retune to a native talker's incidental mispronunciations. The 2008 paper is summarized as showing that adapting to a stable trait (a lisp) is useful, while adapting to a transient state (drunken speech) is not.
  - The well-known detail that seeing the talker with a pen in the mouth blocks retuning could not be verified on this run.
- Accent retuning:
  - **Witteman et al. (2013)**: retuning to strongly accented vowels generalized to new words and was partly talker-specific (smaller and later for a new talker with the same accent).
  - **Witteman et al. (2014)**: it lasted 1 week after 3.5 minutes of exposure, with no attention to the accent required.
  - **Witteman, Weber & McQueen (2014), "Tolerance for inconsistency"** [full text, MPG repository]: with accented forms on only about 8% of trials, adaptation still appeared, just later (priming about 3 ms in the first half, 77 ms in the second half vs 49 ms immediately with 75% accented trials).
- Accent generalization:
  - **Xie & Myers (2017)** [secondary report, via Aoki & Zellou 2025]: retuning transferred to a new talker after multi-talker exposure, or after one acoustically similar talker, but not after one dissimilar talker. Acoustic similarity mattered more than talker count.
  - **Xie, Earle & Myers (2018)**: the cross-talker part needs sleep.
- **Hosier & Bicknell** [full text, Northwestern linguistics working paper; year not stated, cites work to 2016]. A hierarchical Bayesian model (talker within accent within all accents), fitted to segment errors from the Bradlow & Bent and Baese-Berk data, reproduced talker-specific, talker-general and accent-general benefits.
- **Aoki & Zellou (2025)**: for a completely new pattern, one shifted talker produced no generalization; two talkers did.

### 4.3 What this means for a trainer

- **Talker-specific learning is fast and reliable:** 18-32 informative words. Talker-general learning is slower; it needs similar talkers or several talkers, and sleep.
- **Present a new talker in a short block first,** with lexically clear items in which the odd sound has only one lexical reading.
- **Interleave talkers only after that.** Expect the interleaved phase to need about double the exposure.
- **The "teaching signal" has to be resolvable.** Retuning needs the word to be recognizable; unintelligible items teach little. This links Sections 2.3 and 3.2.
- **Speech-in-noise links are untested.** No study found on this run links lexically guided retuning ability or training to speech-in-noise outcomes (gap).

## 5. Links to speech-in-noise and everyday listening

### 5.1 Individual differences: does being a fast learner go with hearing better in noise?

- **Banai, Karawani, Lavie & Lavner (2022)** [full text]. 159 analyzed adults, Hebrew.
  - Between-session learning on 10 compressed sentences (sessions 5-9 days apart) predicted recognition of natural fast speech (odds ratio 1.52) and of sentences in 4-talker babble at -6 dB SNR (odds ratio 1.36), beyond baseline performance.
  - Prior within-session studies by the same group gave odds ratios of 1.44-1.68 (fast speech) and 1.49 (speech in noise). The authors argue rapid learning is a listener trait that matters for everyday listening.
  - Exp 2 shows that this learning is specific to the exposure acoustics. Extra training raised learning without raising speech-in-noise scores.
- **Atagi & Bent (2015)** [full text]: accent-naming accuracy correlated with recognition of accented speech in noise (r = 0.34).
- **Bent, Baese-Berk, Borrie & McKee (2016); McLaughlin, Baese-Berk, Bent, Borrie & Van Engen (2018); Borrie, Baese-Berk, Van Engen & Bent (2017); Carbonell (2017); Neger, Rietveld & Janse (2014)**: correlations among regional, nonnative, dysarthric and noisy speech recognition, and links to statistical learning. These are named in the literature but could not be opened or searched on this run (Section 7).

### 5.2 Transfer of training to speech in noise

- **Oba, Fu & Galvin (2011)** [full text, PMC]. The clearest training-to-noise transfer found on this run, but in cochlear-implant users with no control group.
  - Participants: 10 adult CI users (mean age 66).
  - Training: closed-set identification of 3-digit strings in multi-talker babble, adaptive 1-up/1-down with 2 dB steps, 25 strings per exercise. Visual feedback; after errors, audio and visual feedback with a replay of the correct answer. About 30 min a day, 5 days a week, 4 weeks (mean 10.75 h), at home.
  - Results: digit threshold in babble improved from +2.7 to -1.3 dB. Untrained HINT sentences in babble improved from 11.2 to 8.3 dB. IEEE sentences improved +9.2 points in babble and +7.5 to +8.7 points in steady noise. Gains were retained 4 weeks after training stopped.
  - Trainer relevance: digits are trivially synthesizable and scoreable on a phone; babble is easy to generate. This is a good candidate core "noise" exercise and near-transfer probe.
- **Xie et al. (2018)** [full text]: practising native speech in noise (+2 dB SNR, matched difficulty) did not produce the benefit that accented-speech exposure did for accented speech. The reverse question (does accent training help noise?) was not tested.
- **Banai et al. (2022)**: compressed-speech exposure or training did not change speech-in-noise scores.
- **McLaughlin et al. (2024)** [full text]: the authors caution that accent and noise may load different resources.
- **Brandewie & Zahorik (2010)** [full text]: in a reverberant room with noise, 1-3 seconds of same-room listening lowered the speech threshold by 2.7 dB. This is momentary adaptation, not training.
- **Stacey & Summerfield (2008)**: half of apparent gains on repeated tests can be test practice. Any in-app speech-in-noise probe needs alternate forms and a practice-effect control.
- Not opened on this run: Henshaw & Ferguson (2013) systematic review of computer-based auditory training for adults with hearing loss; Whitton et al. (2017), an audiomotor game that improved speech in noise in older hearing-aid users; Lelo de Larrea-Mancera et al. (2022), an app game transferring to speech in competition; Van Engen (2012), babble-specific speech-in-speech training; and the voice-familiarity studies (Nygaard, Sommers & Pisoni 1994; Johnsrude et al. 2013; Holmes et al. 2018, 2021). These are the most important unread sources for the noise goal (Section 7).

### 5.3 Accents and noise interact

- **Stringer & Iverson (2019)** [full text]: accent costs are small in quiet and grow as SNR falls (to -3 dB).
- **Van Engen & Peelle (2014)** [full text]: noise and reverberation hurt accented speech more than native speech.
- **Smith et al. (2014)** [abstract only]: long-term familiarity with a regional accent improves its intelligibility in cafeteria noise.
- Trainer implication: "unusual talker" exercises should be run in babble at realistic SNRs (about +5 to -3 dB). Many accent studies used noise only to avoid ceiling: +5 dB white noise (Bradlow & Bent 2008; Baese-Berk et al. 2013, via slides), +10 dB white noise (Tzeng 2016), 0 dB speech-shaped noise (Bradlow 2023), 0 dB six-talker babble (Bieber & Gordon-Salant 2022).

### 5.4 Everyday listening

- Long-term experience matters:
  - Listeners who hear an accent weekly need no exposure to cope with its strong features (Witteman et al. 2013).
  - Clinicians who work with dysarthria understand a new dysarthric talker better from the start, although they still gain about 19 points from brief familiarization (Borrie et al. 2021).
  - Older adults with hearing loss gain as much from familiarization as young adults (Lansford et al. 2018).
- No study found on this run measured real-world listening (questionnaires, conversation in actual noisy places) after accent or degraded-speech training. This is a major gap and an opportunity for the trainer's self-report probe.

## 6. Recent and under-tested ideas a trainer could exploit

Each item says what is known, what is untested, and how a browser trainer could run it.

1. **Text-first "pop-out" loops with tight timing.**
   - Known: text before (or within about 120 ms of) word onset maximizes perceived clarity (Sohoglu et al. 2014), and works equally in older listeners (Tamati et al. 2022). DCD and DWD replays speed learning (Davis 2005; Loebach 2010). Text shown during listening gives the most durable learning (Borrie 2012).
   - Untested: whether text-before training beats text-after training for long-term learning. Sohoglu & Davis 2016 is only correlational.
   - Implementation: alternate "predict" trials (text first, then degraded audio, rate clarity or confirm) with "test" trials (audio only, type or choose). This is cheap and fits phones.
2. **Easy-to-hard degradation ramps that remove the need for feedback.**
   - Known: an incremental ramp of 0.25 mm every 10 trials matched feedback-supported training (Guediche et al. 2016).
   - Untested: whether an adaptive ramp driven by per-user accuracy (rather than fixed steps) does better, and whether ramps work for accents, noise, compression and reverberation.
   - Implementation: continuous parameters exist for all of these (channels, filter slope, shift, compression ratio, SNR, T60).
3. **"Rapid learning" as a measurable trait and an untrained probe.**
   - Known: adaptation to a new distortion is fast and log-shaped (half the gain in about 3-15 sentences; Cooke et al. 2022). Individual rapid learning predicts speech-in-noise and fast-speech recognition (Banai et al. 2022).
   - Untested: whether broad training on many distortions speeds adaptation to a new one ("learning to learn"). Cooke found little carry-over between distortions within one session, except to sine-wave speech.
   - Implementation: hold out one or two distortions as far probes. Measure the first-10-sentence slope and the half-gain point before and after weeks of training.
4. **Sleep-aware scheduling.**
   - Known: evening training plus sleep protects gains and supports cross-talker generalization (Fenn 2003/2013; Earle & Myers 2015; Xie et al. 2018; Qin & Zhang 2019; Drouin et al. 2023; 2026 systematic review). A nap also helped (Reis 2023; Qin et al. 2025).
   - Untested in consumer apps.
   - Implementation: suggest late-day sessions (without punishing other times), and open each session with a short next-day probe of yesterday's new talker or condition.
5. **Synthetic voices as unlimited talkers, with controlled "accent" shifts.**
   - Known: online studies retune to systematic segment shifts in TTS voices (Aoki & Zellou 2025, Amazon Polly).
   - Untested: whether training on synthetic accent-like shifts transfers to real accented talkers.
   - Implementation: Web Speech API voices vary by device. Pre-rendered open-licence TTS voices with scripted vowel or consonant substitutions could supply many talkers. The licence of the voice model must be checked.
6. **Accent categorization as a training task.** Known: accent-naming ability correlates with accented speech-in-noise recognition (Atagi & Bent 2015). Untested causally. Implementation: a quick "which voice family is this?" game interleaved with transcription.
7. **Room "lock-on" lead-ins.**
   - Known: 1-3 s of same-room listening helps by about 2.7 dB in noise, binaurally (Brandewie & Zahorik 2010, 2013). Mismatched rooms hurt (Vlahou et al. 2021).
   - Untested: whether repeated room-switch practice makes listeners re-adapt faster (a trainable "re-lock" speed).
   - Implementation: convolution with synthetic binaural room impulse responses in Web Audio. Headphones are required.
8. **Glimpsing training.** Known: glimpsed speech (time-frequency cells above a local SNR) adapts least of 8 distortions (Cooke et al. 2022), so it is an open target with direct relevance to loud places. Untested as multi-session training.
9. **Varied materials, including environmental sounds.** Known: environmental-sound training transferred to vocoded speech, not the reverse; hard materials give specific learning (Loebach & Pisoni 2008). Untested in noise.
10. **Distributed sessions for transfer to new content, small item sets for transfer to new voices.** Known: Banai & Lavner (2019), abstract-level evidence. Untested at app scale.
11. **Passive listening blocks between active blocks.**
    - Known: passive DCD trained as well as active report (Davis 2005). Active-plus-passive accent training equalled all-active (Bradlow lab, slides). Incidental exposure during a puzzle still adapted listeners (ASA lay summary). Attention to the accent was not needed (Witteman 2014).
    - Untested on phones and at scale. Wright et al. (2010, 2015), the key primaries, were not opened.
12. **Keep training intelligibility high enough.** Known: learning stalls when training accuracy is low (Guediche 2016; Bradlow 2023; Borrie 2017). Untested: an explicit floor rule (for example, never let rolling word accuracy drop below about 60%).
13. **Imitation and production.** Vocal imitation of an accent has been reported to improve its comprehension (Adank, Hagoort & Bekkering 2010), and imitation helped with dysarthric speech (Borrie & Schäfer 2015). Neither was opened on this run (Section 7), so treat as a lead. A phone microphone makes a "say it like them" step possible, but recording raises privacy design questions.

## 7. Could not open in full

## 8. References
